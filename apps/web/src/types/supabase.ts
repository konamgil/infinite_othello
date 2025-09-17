// Supabase 데이터베이스 타입 정의
// 실제 데이터베이스 스키마에 맞게 수정하세요

export interface Database {
  public: {
    Tables: {
      // 사용자 프로필
      profiles: {
        Row: {
          id: string; // UUID, auth.users.id와 연결 (게스트인 경우 자체 생성)
          email: string | null; // 게스트는 null
          username: string | null; // 게스트는 null
          display_name: string | null;
          avatar_url: string | null;
          rating: number;
          rank: string;
          total_games: number;
          wins: number;
          losses: number;
          draws: number;
          // 게스트 계정 관련
          account_type: 'guest' | 'linked'; // 계정 유형
          guest_code: string | null; // 게스트 고유 코드
          expires_at: string | null; // 게스트 만료 시간
          // OAuth 연동 정보
          google_id: string | null;
          apple_id: string | null;
          facebook_id: string | null;
          linked_at: string | null; // 계정 연동 시간
          // 세션 관리
          current_session_id: string | null;
          current_device_info: string | null;
          session_started_at: string | null;
          // 기존 필드
          created_at: string;
          updated_at: string;
          last_seen: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          rating?: number;
          rank?: string;
          total_games?: number;
          wins?: number;
          losses?: number;
          draws?: number;
          // 게스트 계정 관련
          account_type?: 'guest' | 'linked';
          guest_code?: string | null;
          expires_at?: string | null;
          // OAuth 연동 정보
          google_id?: string | null;
          apple_id?: string | null;
          facebook_id?: string | null;
          linked_at?: string | null;
          // 세션 관리
          current_session_id?: string | null;
          current_device_info?: string | null;
          session_started_at?: string | null;
          // 기존 필드
          created_at?: string;
          updated_at?: string;
          last_seen?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          rating?: number;
          rank?: string;
          total_games?: number;
          wins?: number;
          losses?: number;
          draws?: number;
          // 게스트 계정 관련
          account_type?: 'guest' | 'linked';
          guest_code?: string | null;
          expires_at?: string | null;
          // OAuth 연동 정보
          google_id?: string | null;
          apple_id?: string | null;
          facebook_id?: string | null;
          linked_at?: string | null;
          // 세션 관리
          current_session_id?: string | null;
          current_device_info?: string | null;
          session_started_at?: string | null;
          // 기존 필드
          created_at?: string;
          updated_at?: string;
          last_seen?: string | null;
        };
      };

      // 게임 기록
      games: {
        Row: {
          id: string; // UUID
          status: 'waiting' | 'playing' | 'finished' | 'abandoned';
          mode: 'single' | 'local' | 'online' | 'ai';
          board_size: number;
          black_player_id: string | null; // profiles.id
          white_player_id: string | null; // profiles.id
          current_player: 'black' | 'white';
          board_state: string; // JSON으로 저장된 보드 상태
          move_history: string; // JSON으로 저장된 이동 기록
          winner: 'black' | 'white' | 'draw' | null;
          black_score: number;
          white_score: number;
          time_control: number | null; // 초 단위
          time_remaining: string | null; // JSON: {black: number, white: number}
          started_at: string | null;
          finished_at: string | null;
          created_at: string;
          updated_at: string;
          room_id: string | null; // rooms.id
        };
        Insert: {
          id?: string;
          status?: 'waiting' | 'playing' | 'finished' | 'abandoned';
          mode?: 'single' | 'local' | 'online' | 'ai';
          board_size?: number;
          black_player_id?: string | null;
          white_player_id?: string | null;
          current_player?: 'black' | 'white';
          board_state?: string;
          move_history?: string;
          winner?: 'black' | 'white' | 'draw' | null;
          black_score?: number;
          white_score?: number;
          time_control?: number | null;
          time_remaining?: string | null;
          started_at?: string | null;
          finished_at?: string | null;
          created_at?: string;
          updated_at?: string;
          room_id?: string | null;
        };
        Update: {
          id?: string;
          status?: 'waiting' | 'playing' | 'finished' | 'abandoned';
          mode?: 'single' | 'local' | 'online' | 'ai';
          board_size?: number;
          black_player_id?: string | null;
          white_player_id?: string | null;
          current_player?: 'black' | 'white';
          board_state?: string;
          move_history?: string;
          winner?: 'black' | 'white' | 'draw' | null;
          black_score?: number;
          white_score?: number;
          time_control?: number | null;
          time_remaining?: string | null;
          started_at?: string | null;
          finished_at?: string | null;
          created_at?: string;
          updated_at?: string;
          room_id?: string | null;
        };
      };

      // 게임 방
      rooms: {
        Row: {
          id: string; // UUID
          name: string;
          description: string | null;
          host_id: string; // profiles.id
          max_players: number;
          current_players: number;
          is_private: boolean;
          join_code: string | null;
          status: 'waiting' | 'starting' | 'playing' | 'finished';
          settings: string; // JSON: 게임 설정들
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          host_id: string;
          max_players?: number;
          current_players?: number;
          is_private?: boolean;
          join_code?: string | null;
          status?: 'waiting' | 'starting' | 'playing' | 'finished';
          settings?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          host_id?: string;
          max_players?: number;
          current_players?: number;
          is_private?: boolean;
          join_code?: string | null;
          status?: 'waiting' | 'starting' | 'playing' | 'finished';
          settings?: string;
          created_at?: string;
          updated_at?: string;
        };
      };

      // 방 참가자
      room_players: {
        Row: {
          id: string; // UUID
          room_id: string; // rooms.id
          player_id: string; // profiles.id
          is_ready: boolean;
          joined_at: string;
          role: 'host' | 'player' | 'spectator';
        };
        Insert: {
          id?: string;
          room_id: string;
          player_id: string;
          is_ready?: boolean;
          joined_at?: string;
          role?: 'host' | 'player' | 'spectator';
        };
        Update: {
          id?: string;
          room_id?: string;
          player_id?: string;
          is_ready?: boolean;
          joined_at?: string;
          role?: 'host' | 'player' | 'spectator';
        };
      };

      // 채팅 메시지
      chat_messages: {
        Row: {
          id: string; // UUID
          room_id: string; // rooms.id
          player_id: string; // profiles.id
          message: string;
          type: 'message' | 'system' | 'game';
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          player_id: string;
          message: string;
          type?: 'message' | 'system' | 'game';
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          player_id?: string;
          message?: string;
          type?: 'message' | 'system' | 'game';
          created_at?: string;
        };
      };

      // 친구 관계
      friendships: {
        Row: {
          id: string; // UUID
          user_id: string; // profiles.id
          friend_id: string; // profiles.id
          status: 'pending' | 'accepted' | 'blocked';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_id: string;
          status?: 'pending' | 'accepted' | 'blocked';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          friend_id?: string;
          status?: 'pending' | 'accepted' | 'blocked';
          created_at?: string;
          updated_at?: string;
        };
      };

      // 업적
      achievements: {
        Row: {
          id: string; // UUID
          name: string;
          description: string;
          icon: string | null;
          condition: string; // JSON: 달성 조건
          reward: string | null; // JSON: 보상 정보
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          icon?: string | null;
          condition: string;
          reward?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          icon?: string | null;
          condition?: string;
          reward?: string | null;
          created_at?: string;
        };
      };

      // 사용자 업적
      user_achievements: {
        Row: {
          id: string; // UUID
          user_id: string; // profiles.id
          achievement_id: string; // achievements.id
          unlocked_at: string;
          progress: number; // 0-100
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
          progress?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_id?: string;
          unlocked_at?: string;
          progress?: number;
        };
      };
    };
    Views: {
      // 리더보드 뷰
      leaderboard: {
        Row: {
          user_id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          rating: number;
          rank: string;
          total_games: number;
          wins: number;
          losses: number;
          draws: number;
          win_rate: number;
          rank_position: number;
        };
      };

      // 게임 통계 뷰
      game_stats: {
        Row: {
          user_id: string;
          total_games: number;
          wins: number;
          losses: number;
          draws: number;
          win_rate: number;
          avg_game_duration: number;
          favorite_board_size: number;
          most_played_mode: string;
          current_streak: number;
          best_streak: number;
        };
      };
    };
    Functions: {
      // 레이팅 업데이트 함수
      update_rating: {
        Args: {
          user_id: string;
          opponent_rating: number;
          result: 'win' | 'loss' | 'draw';
        };
        Returns: {
          new_rating: number;
          rating_change: number;
        };
      };

      // 방 참가 함수
      join_room: {
        Args: {
          room_id: string;
          user_id: string;
          join_code?: string;
        };
        Returns: {
          success: boolean;
          message: string;
        };
      };

      // 게임 시작 함수
      start_game: {
        Args: {
          room_id: string;
        };
        Returns: {
          game_id: string;
          success: boolean;
        };
      };
    };
    Enums: {
      game_status: 'waiting' | 'playing' | 'finished' | 'abandoned';
      game_mode: 'single' | 'local' | 'online' | 'ai';
      player_color: 'black' | 'white';
      room_status: 'waiting' | 'starting' | 'playing' | 'finished';
      player_role: 'host' | 'player' | 'spectator';
      message_type: 'message' | 'system' | 'game';
      friendship_status: 'pending' | 'accepted' | 'blocked';
    };
  };
}

// 편의 타입들
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Game = Database['public']['Tables']['games']['Row'];
export type Room = Database['public']['Tables']['rooms']['Row'];
export type RoomPlayer = Database['public']['Tables']['room_players']['Row'];
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
export type Friendship = Database['public']['Tables']['friendships']['Row'];
export type Achievement = Database['public']['Tables']['achievements']['Row'];
export type UserAchievement = Database['public']['Tables']['user_achievements']['Row'];

// 뷰 타입들
export type LeaderboardEntry = Database['public']['Views']['leaderboard']['Row'];
export type GameStats = Database['public']['Views']['game_stats']['Row'];

// Enum 타입들
export type GameStatus = Database['public']['Enums']['game_status'];
export type GameMode = Database['public']['Enums']['game_mode'];
export type PlayerColor = Database['public']['Enums']['player_color'];
export type RoomStatus = Database['public']['Enums']['room_status'];
export type PlayerRole = Database['public']['Enums']['player_role'];
export type MessageType = Database['public']['Enums']['message_type'];
export type FriendshipStatus = Database['public']['Enums']['friendship_status'];

// 관계가 포함된 타입들
export type GameWithPlayers = Game & {
  black_player: Profile | null;
  white_player: Profile | null;
  room: Room | null;
};

export type RoomWithPlayers = Room & {
  host: Profile;
  players: (RoomPlayer & { profile: Profile })[];
  current_game: Game | null;
};

export type ChatMessageWithProfile = ChatMessage & {
  profile: Profile;
};

// 실시간 이벤트 타입들
export type RealtimeGameEvent = {
  type: 'move' | 'join' | 'leave' | 'chat' | 'game_start' | 'game_end';
  payload: {
    game_id?: string;
    room_id?: string;
    player_id?: string;
    move?: { row: number; col: number };
    message?: string;
    [key: string]: any;
  };
};