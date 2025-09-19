---
title: Supabase 설정 및 통합 가이드
owner: ai-team
status: approved
last_update: 2025-09-19
tags: [supabase, database, oauth, authentication, session-management, development, guide]
related: [architecture/architecture-docs.md, dev/state-management-docs.md]
---

# 🚀 Supabase 설정 및 통합 가이드

**문서 레벨**: Guide / Reference

이 문서는 Infinity Othello 프로젝트의 Supabase 데이터베이스 설정, OAuth 통합, 세션 관리까지 모든 과정을 포함하는 **완전한 가이드**입니다. 프로젝트에 처음 참여하는 개발자는 이 문서만으로 백엔드 설정을 완료할 수 있습니다.

## 1. 환경 변수 설정

먼저, 로컬 개발 환경을 위해 Supabase 프로젝트의 API 키가 필요합니다.

**1. Supabase 대시보드 접속**: [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 선택 → Settings → API
**2. `.env.local` 파일 생성**: `apps/web/` 디렉토리 내에 `.env.local` 파일을 생성하고 아래 내용을 복사하여 붙여넣습니다.
**3. 값 교체**: 대시보드에서 복사한 `URL`과 `anon key`로 아래 값을 교체합니다.

```env
# /apps/web/.env.local

# Supabase 설정
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# 개발 서버 URL
VITE_SERVER_URL=ws://localhost:3001

# 게스트 모드 및 세션 설정
VITE_ENABLE_GUEST_MODE=true
VITE_SESSION_TIMEOUT=7200000 # 2시간
VITE_GUEST_EXPIRY_DAYS=30

# 앱 정보
VITE_APP_ENV=development
VITE_APP_VERSION=0.1.0
```
> **⚠️ 중요**: `.env.local` 파일은 민감한 정보를 포함하므로 Git에 커밋해서는 안 됩니다.

## 2. 데이터베이스 스키마 및 정책

아래 SQL 스크립트를 Supabase 대시보드의 **SQL Editor**에서 실행하여 모든 테이블, 함수, 정책을 한 번에 설정합니다.

> **실행 순서**: SQL Editor → New Query → 아래 스크립트 전체 복사/붙여넣기 → RUN

```sql
-- 1. 필수 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 사용자 프로필 테이블 (OAuth, 게스트, 세션 관리 통합)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  rating INTEGER DEFAULT 1500 NOT NULL,
  rank TEXT DEFAULT 'Bronze' NOT NULL,
  total_games INTEGER DEFAULT 0 NOT NULL,
  wins INTEGER DEFAULT 0 NOT NULL,
  losses INTEGER DEFAULT 0 NOT NULL,
  draws INTEGER DEFAULT 0 NOT NULL,

  -- 계정 타입: 'linked' (OAuth 연동), 'guest' (게스트)
  account_type TEXT DEFAULT 'linked' NOT NULL CHECK (account_type IN ('guest', 'linked')),
  guest_code TEXT UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE, -- 게스트 계정 만료일

  -- OAuth 제공자 정보
  google_id TEXT UNIQUE,
  apple_id TEXT UNIQUE,
  facebook_id TEXT UNIQUE,
  linked_at TIMESTAMP WITH TIME ZONE,

  -- 동시접속 방지를 위한 세션 정보
  current_session_id TEXT,
  current_device_info TEXT,
  session_started_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (id)
);
COMMENT ON TABLE public.profiles IS '사용자 프로필, 랭킹, 계정 타입, 세션 정보를 관리합니다.';

-- 3. 게임 관련 테이블들
CREATE TABLE IF NOT EXISTS games (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  status TEXT DEFAULT 'playing' NOT NULL CHECK (status IN ('waiting', 'playing', 'finished', 'abandoned')),
  mode TEXT DEFAULT 'online' NOT NULL CHECK (mode IN ('single', 'local', 'online', 'ai')),
  black_player_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  white_player_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  board_state JSONB,
  move_history JSONB,
  winner TEXT CHECK (winner IN ('black', 'white', 'draw')),
  black_score INTEGER,
  white_score INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.games IS '실제 게임의 상태와 기록을 저장합니다.';

-- 기타 테이블 (rooms, chat_messages 등)은 필요 시 추가...

-- 4. 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. 트리거 설정
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_games_updated_at ON games;
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 6. 인덱스 설정 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON profiles(rating DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_guest_code ON profiles(guest_code) WHERE guest_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_session_id ON profiles(current_session_id) WHERE current_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_games_players ON games(black_player_id, white_player_id);

-- 7. RLS (Row Level Security) 활성화 및 정책 설정
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Profiles 정책
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Games 정책
DROP POLICY IF EXISTS "Game participants can view games" ON games;
CREATE POLICY "Game participants can view games" ON games FOR SELECT USING (auth.uid() = black_player_id OR auth.uid() = white_player_id);

DROP POLICY IF EXISTS "Users can create games" ON games;
CREATE POLICY "Users can create games" ON games FOR INSERT WITH CHECK (auth.uid() = black_player_id OR auth.uid() = white_player_id);

DROP POLICY IF EXISTS "Game participants can update games" ON games;
CREATE POLICY "Game participants can update games" ON games FOR UPDATE USING (auth.uid() = black_player_id OR auth.uid() = white_player_id);

-- 8. 세션 관리 및 게스트 계정 정리 함수
CREATE OR REPLACE FUNCTION cleanup_expired_guests()
RETURNS void AS $$
BEGIN
  -- 만료된 게스트 계정 삭제
  DELETE FROM profiles
  WHERE account_type = 'guest'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();

  -- 2시간 이상 비활성 세션 정리
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

-- 9. 정리 함수 스케줄링 (매 시간 실행)
-- Supabase Dashboard > Database > Cron Jobs 에서 설정
-- Name: 'cleanup-job', Schedule: '0 * * * *', Function: 'cleanup_expired_guests'

-- 10. 실시간 구독 설정
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
```

## 3. OAuth 제공자 설정

외부 소셜 로그인을 사용하기 위해 Supabase 대시보드에서 각 제공자를 설정해야 합니다.

**경로**: Supabase Dashboard → Authentication → Providers

### 3.1. Google
-   **활성화**: `Enabled` 토글 ON
-   **Client ID / Client Secret**: Google Cloud Console에서 발급받아 입력
-   **Redirect URL**: Supabase에 표시된 콜백 URL (`.../auth/v1/callback`)을 Google Cloud Console에 등록
-   **Scopes**: `openid`, `profile`, `email`

### 3.2. Apple
-   **활성화**: `Enabled` 토글 ON
-   **Client ID**: Apple Developer Console의 Services ID
-   **Client Secret**: Apple Private Key로 생성한 JWT
-   **Redirect URL**: Supabase에 표시된 콜백 URL 등록

### 3.3. Facebook
-   **활성화**: `Enabled` 토글 ON
-   **App ID / App Secret**: Facebook for Developers에서 발급받아 입력
-   **Redirect URL**: Supabase에 표시된 콜백 URL 등록
-   **Permissions**: `email`, `public_profile`

## 4. 프론트엔드 연동

프론트엔드에서는 `apps/web/src/lib/supabase.ts`에 생성된 클라이언트를 사용하여 Supabase와 상호작용합니다. 상태 관리는 `authStore`, `gameStore` 등과 통합되어 있습니다.

### 로그인 예시 (`authStore.ts` 내부 로직)
```typescript
// /apps/web/src/store/authStore.ts (일부)

async function signInWithOAuth(provider: 'google' | 'apple' | 'facebook') {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin, // 로그인 후 리디렉션될 URL
    },
  });
  if (error) {
    console.error(`Error signing in with ${provider}:`, error);
  }
}
```

### 실시간 구독 예시
```typescript
// 게임 상태 실시간 구독
const channel = supabase.channel(`game:${gameId}`);

channel
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'games',
    filter: `id=eq.${gameId}`,
  }, (payload) => {
    // 게임 상태 업데이트 로직
    updateGameState(payload.new);
  })
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Successfully subscribed to game channel.');
    }
  });

// 컴포넌트 언마운트 시 구독 해제 필수
return () => {
  supabase.removeChannel(channel);
};
```

## 5. 핵심 기능 요약

-   **통합 스키마**: 이 문서의 SQL은 게스트 계정, OAuth, 세션 관리를 모두 지원하는 최신 스키마입니다.
-   **동시접속 방지**: `current_session_id`를 통해 한 계정은 한 기기에서만 활성화되도록 `authStore`에서 관리합니다.
-   **게스트 계정**: 임시 계정으로 플레이하다가 OAuth 계정에 연동하여 데이터를 이전할 수 있습니다.
-   **보안**: 모든 테이블은 RLS 정책으로 보호되며, 기본적으로 아무것도 허용하지 않습니다.

이 가이드를 통해 프로젝트의 Supabase 설정이 완료되었습니다. 🎉