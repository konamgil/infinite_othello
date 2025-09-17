# 🚀 Supabase 설정 가이드

Infinite Othello 프로젝트에 Supabase를 연동하기 위한 완전한 설정 가이드입니다.

## 📋 필요한 정보

### 1. Supabase 프로젝트에서 가져와야 할 정보

**Supabase Dashboard (https://supabase.com/dashboard) → 프로젝트 선택 → Settings → API**

```bash
# 이 값들을 복사해서 .env.local 파일에 입력하세요

VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 2. 환경 변수 파일 설정

**📁 `apps/web/.env.local` 파일을 생성하고 다음 내용을 입력:**

```env
# Supabase 설정 - 실제 값으로 교체하세요
VITE_SUPABASE_URL=https://xyzabcdefghijk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 서버 설정
VITE_SERVER_URL=ws://localhost:3001

# 앱 설정
VITE_APP_ENV=development
VITE_APP_VERSION=0.1.0
```

## 🗃️ 데이터베이스 스키마 생성

### 1. SQL 스크립트 실행

**Supabase Dashboard → SQL Editor → New Query에서 다음 스크립트 실행:**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- 1. 사용자 프로필 테이블
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  rating INTEGER DEFAULT 1500,
  rank TEXT DEFAULT 'Bronze',
  total_games INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (id)
);

-- 2. 게임 방 테이블
CREATE TABLE rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  max_players INTEGER DEFAULT 2,
  current_players INTEGER DEFAULT 0,
  is_private BOOLEAN DEFAULT FALSE,
  join_code TEXT,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'starting', 'playing', 'finished')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. 방 참가자 테이블
CREATE TABLE room_players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_ready BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  role TEXT DEFAULT 'player' CHECK (role IN ('host', 'player', 'spectator')),
  UNIQUE(room_id, player_id)
);

-- 4. 게임 테이블
CREATE TABLE games (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished', 'abandoned')),
  mode TEXT DEFAULT 'online' CHECK (mode IN ('single', 'local', 'online', 'ai')),
  board_size INTEGER DEFAULT 8,
  black_player_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  white_player_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  current_player TEXT DEFAULT 'black' CHECK (current_player IN ('black', 'white')),
  board_state JSONB DEFAULT '[]',
  move_history JSONB DEFAULT '[]',
  winner TEXT CHECK (winner IN ('black', 'white', 'draw')),
  black_score INTEGER DEFAULT 2,
  white_score INTEGER DEFAULT 2,
  time_control INTEGER,
  time_remaining JSONB,
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL
);

-- 5. 채팅 메시지 테이블
CREATE TABLE chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'message' CHECK (type IN ('message', 'system', 'game')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. 친구 관계 테이블
CREATE TABLE friendships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- 7. 업적 테이블
CREATE TABLE achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  condition JSONB NOT NULL,
  reward JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. 사용자 업적 테이블
CREATE TABLE user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  progress INTEGER DEFAULT 100 CHECK (progress >= 0 AND progress <= 100),
  UNIQUE(user_id, achievement_id)
);

-- 인덱스 생성
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_rating ON profiles(rating DESC);
CREATE INDEX idx_games_players ON games(black_player_id, white_player_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_chat_messages_room ON chat_messages(room_id, created_at DESC);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
```

### 2. RLS (Row Level Security) 정책 설정

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Profiles 정책
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Rooms 정책
CREATE POLICY "Anyone can view public rooms" ON rooms FOR SELECT USING (NOT is_private OR auth.uid() = host_id);
CREATE POLICY "Users can create rooms" ON rooms FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Room hosts can update their rooms" ON rooms FOR UPDATE USING (auth.uid() = host_id);

-- Room Players 정책
CREATE POLICY "Room participants can view room players" ON room_players FOR SELECT USING (
  EXISTS (SELECT 1 FROM room_players rp WHERE rp.room_id = room_players.room_id AND rp.player_id = auth.uid())
);
CREATE POLICY "Users can join rooms" ON room_players FOR INSERT WITH CHECK (auth.uid() = player_id);
CREATE POLICY "Users can update their room status" ON room_players FOR UPDATE USING (auth.uid() = player_id);

-- Games 정책
CREATE POLICY "Game participants can view games" ON games FOR SELECT USING (
  auth.uid() = black_player_id OR auth.uid() = white_player_id OR
  EXISTS (SELECT 1 FROM room_players rp WHERE rp.room_id = games.room_id AND rp.player_id = auth.uid())
);
CREATE POLICY "System can insert games" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "Game participants can update games" ON games FOR UPDATE USING (
  auth.uid() = black_player_id OR auth.uid() = white_player_id
);

-- Chat Messages 정책
CREATE POLICY "Room participants can view chat" ON chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM room_players rp WHERE rp.room_id = chat_messages.room_id AND rp.player_id = auth.uid())
);
CREATE POLICY "Room participants can send messages" ON chat_messages FOR INSERT WITH CHECK (
  auth.uid() = player_id AND
  EXISTS (SELECT 1 FROM room_players rp WHERE rp.room_id = chat_messages.room_id AND rp.player_id = auth.uid())
);

-- Friendships 정책
CREATE POLICY "Users can view their friendships" ON friendships FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);
CREATE POLICY "Users can create friendships" ON friendships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their friendships" ON friendships FOR UPDATE USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);

-- User Achievements 정책
CREATE POLICY "Users can view their achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert achievements" ON user_achievements FOR INSERT WITH CHECK (true);
```

### 3. 뷰와 함수 생성

```sql
-- 리더보드 뷰
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  p.id as user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  p.rating,
  p.rank,
  p.total_games,
  p.wins,
  p.losses,
  p.draws,
  CASE
    WHEN p.total_games = 0 THEN 0
    ELSE ROUND((p.wins::DECIMAL / p.total_games) * 100, 2)
  END as win_rate,
  ROW_NUMBER() OVER (ORDER BY p.rating DESC) as rank_position
FROM profiles p
WHERE p.total_games > 0
ORDER BY p.rating DESC;

-- 게임 통계 뷰
CREATE OR REPLACE VIEW game_stats AS
SELECT
  p.id as user_id,
  p.total_games,
  p.wins,
  p.losses,
  p.draws,
  CASE
    WHEN p.total_games = 0 THEN 0
    ELSE ROUND((p.wins::DECIMAL / p.total_games) * 100, 2)
  END as win_rate,
  COALESCE(avg_duration.avg_game_duration, 0) as avg_game_duration,
  COALESCE(board_pref.favorite_board_size, 8) as favorite_board_size,
  COALESCE(mode_pref.most_played_mode, 'online') as most_played_mode,
  0 as current_streak, -- TODO: 구현 필요
  0 as best_streak      -- TODO: 구현 필요
FROM profiles p
LEFT JOIN (
  SELECT
    COALESCE(black_player_id, white_player_id) as player_id,
    AVG(EXTRACT(EPOCH FROM (finished_at - started_at))) as avg_game_duration
  FROM games
  WHERE finished_at IS NOT NULL AND started_at IS NOT NULL
  GROUP BY COALESCE(black_player_id, white_player_id)
) avg_duration ON avg_duration.player_id = p.id
LEFT JOIN (
  SELECT
    player_id,
    board_size as favorite_board_size
  FROM (
    SELECT
      COALESCE(black_player_id, white_player_id) as player_id,
      board_size,
      COUNT(*) as game_count,
      ROW_NUMBER() OVER (PARTITION BY COALESCE(black_player_id, white_player_id) ORDER BY COUNT(*) DESC) as rn
    FROM games
    WHERE COALESCE(black_player_id, white_player_id) IS NOT NULL
    GROUP BY COALESCE(black_player_id, white_player_id), board_size
  ) ranked
  WHERE rn = 1
) board_pref ON board_pref.player_id = p.id
LEFT JOIN (
  SELECT
    player_id,
    mode as most_played_mode
  FROM (
    SELECT
      COALESCE(black_player_id, white_player_id) as player_id,
      mode,
      COUNT(*) as game_count,
      ROW_NUMBER() OVER (PARTITION BY COALESCE(black_player_id, white_player_id) ORDER BY COUNT(*) DESC) as rn
    FROM games
    WHERE COALESCE(black_player_id, white_player_id) IS NOT NULL
    GROUP BY COALESCE(black_player_id, white_player_id), mode
  ) ranked
  WHERE rn = 1
) mode_pref ON mode_pref.player_id = p.id;

-- 레이팅 업데이트 함수 (ELO 시스템)
CREATE OR REPLACE FUNCTION update_rating(
  user_id UUID,
  opponent_rating INTEGER,
  result TEXT
) RETURNS JSON AS $$
DECLARE
  current_rating INTEGER;
  k_factor INTEGER := 32;
  expected_score DECIMAL;
  actual_score DECIMAL;
  rating_change INTEGER;
  new_rating INTEGER;
BEGIN
  -- 현재 레이팅 가져오기
  SELECT rating INTO current_rating FROM profiles WHERE id = user_id;

  -- Expected score 계산 (ELO 공식)
  expected_score := 1.0 / (1.0 + POWER(10, (opponent_rating - current_rating) / 400.0));

  -- Actual score 설정
  CASE result
    WHEN 'win' THEN actual_score := 1.0;
    WHEN 'loss' THEN actual_score := 0.0;
    WHEN 'draw' THEN actual_score := 0.5;
    ELSE actual_score := 0.5;
  END CASE;

  -- 레이팅 변화 계산
  rating_change := ROUND(k_factor * (actual_score - expected_score));
  new_rating := current_rating + rating_change;

  -- 최소 레이팅 보장
  IF new_rating < 800 THEN
    new_rating := 800;
  END IF;

  -- 레이팅 업데이트
  UPDATE profiles
  SET rating = new_rating,
      rank = CASE
        WHEN new_rating >= 2400 THEN 'Master'
        WHEN new_rating >= 2200 THEN 'Diamond'
        WHEN new_rating >= 2000 THEN 'Platinum'
        WHEN new_rating >= 1800 THEN 'Gold'
        WHEN new_rating >= 1600 THEN 'Silver'
        ELSE 'Bronze'
      END
  WHERE id = user_id;

  RETURN json_build_object(
    'new_rating', new_rating,
    'rating_change', rating_change
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. 실시간 구독 설정

```sql
-- 실시간 구독을 위한 발행 설정
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
```

## 🎯 사용 방법

### 1. 앱에서 인증 사용

```typescript
import { useAuth, useAuthActions } from './store';

function LoginForm() {
  const { user, isLoading, error } = useAuth();
  const { signIn, signUp } = useAuthActions();

  const handleLogin = async (email: string, password: string) => {
    const result = await signIn(email, password);
    if (result.success) {
      console.log('로그인 성공');
    }
  };

  return (
    // 로그인 폼 UI
  );
}
```

### 2. 실시간 기능 사용

```typescript
import { supabase } from './lib/supabase';

// 방의 실시간 업데이트 구독
const subscription = supabase
  .channel('room-changes')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'rooms',
    filter: `id=eq.${roomId}`
  }, (payload) => {
    console.log('방 정보 업데이트:', payload);
  })
  .subscribe();
```

### 3. 데이터 CRUD 작업

```typescript
import { supabase } from './lib/supabase';

// 게임 생성
const { data: game, error } = await supabase
  .from('games')
  .insert({
    black_player_id: userId,
    room_id: roomId,
    board_size: 8,
  })
  .select()
  .single();

// 프로필 업데이트
const { error } = await supabase
  .from('profiles')
  .update({ display_name: 'New Name' })
  .eq('id', userId);
```

## ⚠️ 중요 사항

1. **환경 변수 보안**: `.env.local` 파일은 git에 커밋하지 마세요
2. **RLS 정책**: 모든 테이블에 적절한 보안 정책이 설정되어 있습니다
3. **실시간 기능**: 구독은 사용 후 반드시 해제하세요
4. **타입 안전성**: 제공된 TypeScript 타입들을 활용하세요

## 🆘 문제 해결

- **연결 오류**: URL과 키가 정확한지 확인
- **권한 오류**: RLS 정책이 올바른지 확인
- **타입 오류**: `supabase.ts` 타입 정의 확인

이제 Supabase가 완전히 설정되었습니다! 🎉