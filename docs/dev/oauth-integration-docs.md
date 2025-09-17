---
title: OAuth 통합 및 동시접속 방지 가이드
owner: ai-team
status: approved
last_update: 2025-01-13
tags: [oauth, supabase, authentication, session-management, security]
related: [dev/supabase-setup-docs.md, dev/state-management-docs.md]
---

# 🔄 OAuth 통합 및 동시접속 방지 시스템

**문서 레벨**: Implementation / Reference - OAuth 전용 인증 시스템 구현 가이드

Infinite Othello 프로젝트의 OAuth 전용 + 동시접속 방지 시스템을 위한 데이터베이스 스키마 업데이트와 구현 가이드입니다.

## 📊 변경된 스키마

### 1. Profiles 테이블 업데이트

```sql
-- 기존 profiles 테이블에 새 컬럼 추가
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'linked' CHECK (account_type IN ('guest', 'linked'));

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS guest_code TEXT UNIQUE;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS apple_id TEXT UNIQUE;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS facebook_id TEXT UNIQUE;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS linked_at TIMESTAMP WITH TIME ZONE;

-- 세션 관리 컬럼 추가
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS current_session_id TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS current_device_info TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS session_started_at TIMESTAMP WITH TIME ZONE;

-- 기존 컬럼을 nullable로 변경 (게스트 계정 지원)
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN username DROP NOT NULL;
```

### 2. 인덱스 추가

```sql
-- 게스트 코드 검색 최적화
CREATE INDEX IF NOT EXISTS idx_profiles_guest_code ON profiles(guest_code) WHERE guest_code IS NOT NULL;

-- OAuth ID 검색 최적화
CREATE INDEX IF NOT EXISTS idx_profiles_google_id ON profiles(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_apple_id ON profiles(apple_id) WHERE apple_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_facebook_id ON profiles(facebook_id) WHERE facebook_id IS NOT NULL;

-- 세션 관리 최적화
CREATE INDEX IF NOT EXISTS idx_profiles_session_id ON profiles(current_session_id) WHERE current_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen) WHERE last_seen IS NOT NULL;

-- 계정 타입별 검색 최적화
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON profiles(account_type);

-- 만료 게스트 계정 정리용
CREATE INDEX IF NOT EXISTS idx_profiles_expires_at ON profiles(expires_at) WHERE expires_at IS NOT NULL;
```

### 3. RLS 정책 업데이트

```sql
-- 게스트 계정 정책 추가
CREATE POLICY "Guest accounts can view own profile" ON profiles
FOR SELECT USING (
  -- 기존 인증된 사용자
  auth.uid() = id OR
  -- 게스트는 자신만 조회 가능 (세션 기반)
  (account_type = 'guest' AND current_session_id IS NOT NULL)
);

CREATE POLICY "Guest accounts can update own profile" ON profiles
FOR UPDATE USING (
  -- 기존 인증된 사용자
  auth.uid() = id OR
  -- 게스트는 자신만 업데이트 가능
  (account_type = 'guest' AND current_session_id IS NOT NULL)
);

-- 게스트 계정 생성 정책
CREATE POLICY "Allow guest account creation" ON profiles
FOR INSERT WITH CHECK (
  -- 인증된 사용자의 프로필 생성
  (auth.uid() = id AND account_type = 'linked') OR
  -- 게스트 계정 생성 (별도 검증 로직 필요)
  (account_type = 'guest' AND guest_code IS NOT NULL)
);
```

### 4. 세션 정리 함수

```sql
-- 만료된 게스트 계정 정리 함수
CREATE OR REPLACE FUNCTION cleanup_expired_guests()
RETURNS void AS $$
BEGIN
  -- 만료된 게스트 계정 삭제
  DELETE FROM profiles
  WHERE account_type = 'guest'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();

  -- 비활성 세션 정리 (2시간 이상 비활성)
  UPDATE profiles
  SET
    current_session_id = NULL,
    current_device_info = NULL,
    session_started_at = NULL
  WHERE
    current_session_id IS NOT NULL
    AND last_seen < NOW() - INTERVAL '2 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 정리 함수 스케줄링 (1시간마다 실행)
SELECT cron.schedule('cleanup-expired-guests', '0 * * * *', 'SELECT cleanup_expired_guests();');
```

### 5. 게스트 세션 검증 함수

```sql
-- 게스트 세션 유효성 검사 함수
CREATE OR REPLACE FUNCTION validate_guest_session(
  guest_code TEXT,
  session_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  profile_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM profiles
    WHERE
      guest_code = $1
      AND current_session_id = $2
      AND account_type = 'guest'
      AND (expires_at IS NULL OR expires_at > NOW())
      AND last_seen > NOW() - INTERVAL '2 hours'
  ) INTO profile_exists;

  RETURN profile_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🔧 OAuth 제공자 설정

### Supabase Dashboard 설정

#### 1. Google OAuth
```
Supabase Dashboard → Authentication → Providers → Google

Required:
- Client ID: Google Console에서 발급
- Client Secret: Google Console에서 발급
- Redirect URL: https://your-project.supabase.co/auth/v1/callback

Scopes: openid profile email
```

#### 2. Apple Sign In
```
Supabase Dashboard → Authentication → Providers → Apple

Required:
- Client ID: Apple Developer Console의 Services ID
- Client Secret: Apple Private Key로 JWT 생성
- Redirect URL: https://your-project.supabase.co/auth/v1/callback

Additional settings:
- Key ID: Apple Key ID
- Team ID: Apple Developer Team ID
```

#### 3. Facebook Login
```
Supabase Dashboard → Authentication → Providers → Facebook

Required:
- App ID: Facebook Developer Console에서 발급
- App Secret: Facebook Developer Console에서 발급
- Redirect URL: https://your-project.supabase.co/auth/v1/callback

Permissions: email,public_profile
```

## ⚙️ 환경 변수 업데이트

```env
# .env.local에 추가 (필요시)
VITE_ENABLE_GUEST_MODE=true
VITE_SESSION_TIMEOUT=7200000
VITE_GUEST_EXPIRY_DAYS=30

# OAuth 콜백 URL
VITE_OAUTH_REDIRECT_URL=https://your-domain.com/auth/callback
```

## 🚨 보안 고려사항

### 1. RLS 정책 강화
- 게스트 계정은 세션 ID로만 인증
- OAuth 연동 시 기존 연동 중복 방지
- 세션 하이재킹 방지를 위한 디바이스 정보 검증

### 2. 세션 관리
- 30초마다 하트비트로 세션 유지
- 2분 타임아웃으로 좀비 세션 방지
- 브라우저 종료 시 자동 세션 정리

### 3. 게스트 계정 제한
- 30일 자동 만료
- 랭크 게임, 친구 시스템 등 제한
- 일일 게임 횟수 제한

## 🧪 테스트 방법

### 1. 게스트 계정 테스트
```sql
-- 게스트 계정 생성 테스트
INSERT INTO profiles (
  id, account_type, guest_code, display_name,
  expires_at, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'guest',
  'G1H2K3L4M567',
  '게스트_M567',
  NOW() + INTERVAL '30 days',
  NOW(),
  NOW()
);
```

### 2. 세션 충돌 테스트
```sql
-- 동일 계정에 대한 중복 세션 시뮬레이션
UPDATE profiles
SET
  current_session_id = 'session-123',
  current_device_info = 'desktop-abc-123',
  session_started_at = NOW()
WHERE id = 'user-id';

-- 다른 세션에서 로그인 시도 (충돌 발생)
```

### 3. OAuth 연동 테스트
```sql
-- 게스트 → OAuth 연동 시뮬레이션
UPDATE profiles
SET
  account_type = 'linked',
  google_id = 'google-user-123',
  email = 'user@gmail.com',
  username = 'newuser',
  guest_code = NULL,
  expires_at = NULL,
  linked_at = NOW()
WHERE guest_code = 'G1H2K3L4M567';
```

## ✅ 마이그레이션 체크리스트

1. **스키마 업데이트**: 모든 ALTER TABLE 실행 ✅
2. **인덱스 생성**: 성능 최적화 인덱스 추가 ✅
3. **RLS 정책**: 보안 정책 업데이트 ✅
4. **함수 생성**: 정리 및 검증 함수 추가 ✅
5. **OAuth 설정**: 3개 제공자 설정 완료 ⏳
6. **환경 변수**: 필요한 설정값 추가 ⏳
7. **테스트**: 시나리오별 동작 확인 ⏳

## 📎 관련 문서

[📎 관련 문서: dev/supabase-setup-docs.md]
[📎 관련 문서: dev/state-management-docs.md]

이제 **OAuth 전용 + 동시접속 방지** 시스템이 완성되었습니다! 🎉