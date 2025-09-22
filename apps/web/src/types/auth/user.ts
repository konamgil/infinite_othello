/**
 * Auth User Domain - 사용자 프로필과 계정 관련 타입
 * 사용자 정보, 프로필, 통계 등
 */

import type { GameStats } from '../game';

// === 계정 타입 ===
export type AccountType = 'guest' | 'linked';

// === 사용자 프로필 (Core Profile) ===
export interface UserProfile {
  id: string; // UUID
  email: string | null; // 게스트는 null
  username: string | null; // 게스트는 null
  displayName: string | null;
  avatarUrl: string | null;

  // 게임 관련 정보
  rating: number;
  rank: string;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;

  // 계정 타입
  accountType: AccountType;

  // 타임스탬프
  createdAt: string;
  updatedAt: string;
  lastSeen: string | null;
}

// === 게스트 사용자 관련 ===
export interface GuestProfile extends Omit<UserProfile, 'email' | 'username'> {
  guestCode: string; // 게스트 고유 코드
  expiresAt: string; // 만료 시간
  deviceInfo?: string; // 디바이스 정보
  tempUsername?: string; // 임시 사용자명
}

export interface GuestAuthState {
  isGuest: boolean;
  guestCode: string | null;
  expiresAt: Date | null;
  canUpgrade: boolean; // 계정 연동 가능 여부
  limitations: GuestLimitations;
}

export interface GuestLimitations {
  maxGamesPerDay: number;
  canAccessRanked: boolean;
  canAccessTournament: boolean;
  dataRetentionDays: number;
  features: {
    replayAnalysis: boolean;
    customThemes: boolean;
    friendsList: boolean;
    cloudSave: boolean;
  };
}

// === OAuth 관련 ===
export type SupportedProvider = 'google' | 'apple' | 'facebook';

export interface OAuthProvider {
  id: SupportedProvider;
  name: string;
  iconUrl?: string;
  isEnabled: boolean;
  config?: Record<string, any>;
}

export interface LinkedAccount {
  provider: SupportedProvider;
  providerId: string;
  email?: string;
  linkedAt: string;
}

// === 사용자 설정 ===
export interface UserSettings {
  // 게임 설정
  preferredColor: 'black' | 'white' | 'random';
  defaultDifficulty: 'easy' | 'medium' | 'hard' | 'expert';
  showCoordinates: boolean;
  showMoveHints: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';

  // UI 설정
  theme: 'light' | 'dark' | 'system';
  language: 'ko' | 'en';

  // 알림 설정
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;

  // 개인정보 설정
  profileVisibility: 'public' | 'friends' | 'private';
  showOnlineStatus: boolean;
  allowFriendRequests: boolean;

  // 기타
  autoSave: boolean;
  dataUsageWarning: boolean;
}

// === 사용자 통계 (확장된 게임 통계) ===
export interface UserGameStats extends GameStats {
  // 추가 통계
  longestWinStreak: number;
  currentWinStreak: number;
  longestLossStreak: number;
  currentLossStreak: number;

  // 시간 관련
  totalPlayTimeHours: number;
  averageSessionTime: number;
  lastPlayedAt: string | null;

  // 모드별 통계
  modeStats: {
    [mode: string]: {
      games: number;
      wins: number;
      losses: number;
      draws: number;
      winRate: number;
      rating?: number;
    };
  };

  // 월별/주별 활동
  recentActivity: {
    thisWeek: { games: number; wins: number };
    thisMonth: { games: number; wins: number };
    last30Days: { games: number; wins: number };
  };
}

// === 사용자 업적 ===
export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string | null;
  category: 'games' | 'wins' | 'streak' | 'skill' | 'time' | 'special';
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum';
  condition: AchievementCondition;
  reward?: AchievementReward;
  createdAt: string;
}

export interface AchievementCondition {
  type: 'games_played' | 'games_won' | 'win_streak' | 'rating_reached' | 'time_played' | 'custom';
  target: number;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  additionalParams?: Record<string, any>;
}

export interface AchievementReward {
  type: 'badge' | 'title' | 'theme' | 'avatar' | 'rating_boost';
  value: string | number;
  description?: string;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
  progress: number; // 0-100
  isCompleted: boolean;
  notificationShown?: boolean;
}

// === 친구 시스템 ===
export type FriendshipStatus = 'pending' | 'accepted' | 'blocked' | 'declined';

export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  status: FriendshipStatus;
  createdAt: string;
  updatedAt: string;
  requestedBy: string; // userId who sent the request
}

export interface Friend {
  profile: UserProfile;
  friendship: Friendship;
  isOnline: boolean;
  lastSeen?: string;
  currentGame?: {
    id: string;
    mode: string;
    status: string;
  };
}

// === 사용자 랭킹 ===
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  rating: number;
  rankTitle: string;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  isCurrentUser?: boolean;
}

// === 타입 가드 함수들 ===
export const isGuestUser = (profile: UserProfile | GuestProfile): profile is GuestProfile => {
  return profile.accountType === 'guest';
};

export const isLinkedUser = (profile: UserProfile): boolean => {
  return profile.accountType === 'linked' && !!profile.email;
};

export const isValidProvider = (provider: string): provider is SupportedProvider => {
  return ['google', 'apple', 'facebook'].includes(provider as SupportedProvider);
};

export const hasAchievement = (userAchievements: UserAchievement[], achievementId: string): boolean => {
  return userAchievements.some(ua => ua.achievementId === achievementId && ua.isCompleted);
};

// === 유틸리티 타입들 ===
export type ProfileUpdate = Partial<Pick<UserProfile, 'displayName' | 'avatarUrl'>>;
export type SettingsUpdate = Partial<UserSettings>;
export type StatsUpdate = Partial<UserGameStats>;