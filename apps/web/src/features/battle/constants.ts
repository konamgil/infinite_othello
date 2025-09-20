/**
 * A list of available tournaments.
 *
 * This constant provides static data for different tournaments that users can join.
 * Each tournament object includes details like its ID, name, rank requirements, rewards, etc.
 * This data is likely used to display a list of tournaments in the UI.
 */
export const TOURNAMENTS = [
  {
    id: 'rookie',
    name: '루키 토너먼트',
    rank: 'Bronze ~ Silver',
    reward: '500 RP + 루마 1개',
    participants: 128,
    timeLeft: '2시간 30분',
    icon: '🌟'
  },
  {
    id: 'champion',
    name: '챔피언십',
    rank: 'Gold 이상',
    reward: '2000 RP + 전설 루마',
    participants: 64,
    timeLeft: '12시간',
    icon: '👑'
  }
];

/**
 * A list of recent battles for display.
 *
 * This constant holds mock or sample data for a user's recent battle history.
 * Each object represents a single battle and contains information about the opponent,
 * result, score, and when the battle took place.
 * This is likely used for UI mockups or as placeholder data.
 */
export const RECENT_BATTLES = [
  {
    opponent: '드래곤슬레이어',
    rank: 'Silver II',
    result: 'victory',
    score: '32-32',
    timeAgo: '5분 전'
  },
  {
    opponent: '마법사의검',
    rank: 'Bronze I',
    result: 'defeat',
    score: '28-36',
    timeAgo: '1시간 전'
  },
  {
    opponent: '어둠의기사',
    rank: 'Silver III',
    result: 'victory',
    score: '45-19',
    timeAgo: '3시간 전'
  }
];
