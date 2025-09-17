import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../../../../store/gameStore';
import { ProfileStarCanvas } from '../../../../../ui/profile/ProfileStarCanvas';
import {
  ArrowLeft, Trophy, Crown, Target, Zap, Star, Award,
  TrendingUp, Calendar, Clock, Flame, Shield, Sword,
  User, ChevronRight, RotateCcw, CheckCircle, Lock,
  Medal, Gift, Sparkles
} from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'gameplay' | 'skill' | 'dedication' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress: number;
  maxProgress: number;
  completed: boolean;
  completedDate?: Date;
  reward: {
    type: 'rp' | 'theme' | 'title';
    value: string;
  };
}

interface PlayerStats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  currentStreak: number;
  longestStreak: number;
  totalPlayTime: number;
  averageGameTime: number;
  perfectGames: number;
  comebackWins: number;
  towerHighest: number;
  rankingPeak: string;
  favoriteOpenings: string[];
}

const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-win',
    title: '泥??밸━',
    description: '泥?踰덉㎏ 寃뚯엫?먯꽌 ?밸━?섏꽭??,
    icon: <Trophy size={24} className="text-yellow-400" />,
    category: 'gameplay',
    rarity: 'common',
    progress: 1,
    maxProgress: 1,
    completed: true,
    completedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    reward: { type: 'rp', value: '100 RP' }
  },
  {
    id: 'tower-climber',
    title: '???깅컲媛',
    description: '臾댄븳????10痢??뚰뙆',
    icon: <Crown size={24} className="text-purple-400" />,
    category: 'gameplay',
    rarity: 'rare',
    progress: 15,
    maxProgress: 10,
    completed: true,
    completedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    reward: { type: 'theme', value: '?⑷툑 蹂대뱶 ?뚮쭏' }
  },
  {
    id: 'perfect-game',
    title: '?꾨꼍???밸━',
    description: '?곷?諛⑹씠 ???섎룄 ?먯? 紐삵븯寃??섏꽭??,
    icon: <Sparkles size={24} className="text-cyan-400" />,
    category: 'skill',
    rarity: 'epic',
    progress: 2,
    maxProgress: 1,
    completed: true,
    completedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    reward: { type: 'title', value: '?꾨꼍二쇱쓽?? }
  },
  {
    id: 'dedication',
    title: '?뚯떊?곸씤 ?뚮젅?댁뼱',
    description: '?곗냽 7???묒냽?섏꽭??,
    icon: <Calendar size={24} className="text-green-400" />,
    category: 'dedication',
    rarity: 'common',
    progress: 5,
    maxProgress: 7,
    completed: false,
    reward: { type: 'rp', value: '500 RP' }
  },
  {
    id: 'win-streak',
    title: '?곗듅 ?됱쭊',
    description: '10?곗듅???ъ꽦?섏꽭??,
    icon: <Flame size={24} className="text-red-400" />,
    category: 'skill',
    rarity: 'rare',
    progress: 7,
    maxProgress: 10,
    completed: false,
    reward: { type: 'theme', value: '遺덇퐙 ?댄럺?? }
  },
  {
    id: 'legendary-player',
    title: '?꾩꽕???뚮젅?댁뼱',
    description: 'Diamond ?곗뼱 ?ъ꽦',
    icon: <Medal size={24} className="text-blue-400" />,
    category: 'skill',
    rarity: 'legendary',
    progress: 0,
    maxProgress: 1,
    completed: false,
    reward: { type: 'title', value: '?꾩꽕' }
  }
];

const MOCK_STATS: PlayerStats = {
  totalGames: 127,
  wins: 78,
  losses: 45,
  draws: 4,
  winRate: 61.4,
  currentStreak: 3,
  longestStreak: 12,
  totalPlayTime: 185400, // 51?쒓컙 30遺?
  averageGameTime: 1460, // 24遺?20珥?
  perfectGames: 2,
  comebackWins: 15,
  towerHighest: 15,
  rankingPeak: 'Silver I',
  favoriteOpenings: ['?媛곸꽑 媛쒕갑', '肄붾꼫 ?μ븙', '以묒븰 吏묒쨷']
};

export function ProfileScreen() {
  const navigate = useNavigate();
  const { player } = useGameStore();
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements'>('stats');

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'from-gray-400/20 to-gray-600/20 border-gray-400/30';
      case 'rare': return 'from-blue-400/20 to-blue-600/20 border-blue-400/30';
      case 'epic': return 'from-purple-400/20 to-purple-600/20 border-purple-400/30';
      case 'legendary': return 'from-yellow-400/20 to-orange-500/20 border-yellow-400/30';
    }
  };

  const getRarityTextColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'text-gray-400';
      case 'rare': return 'text-blue-400';
      case 'epic': return 'text-purple-400';
      case 'legendary': return 'text-yellow-400';
    }
  };

  const formatPlayTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}?쒓컙 ${minutes}遺?;
  };

  const completedAchievements = MOCK_ACHIEVEMENTS.filter(a => a.completed);
  const inProgressAchievements = MOCK_ACHIEVEMENTS.filter(a => !a.completed);

  return (
    <div className="h-full w-full overflow-hidden relative">
      {/* ?꾨줈???곗＜ 諛곌꼍 */}
      <div className="absolute inset-0">
        <ProfileStarCanvas className="w-full h-full" />
      </div>

      {/* ?ㅻ쾭?덉씠 肄섑뀗痢?*/}
      <div className="relative z-10 h-full overflow-y-auto overflow-x-hidden">
        <div className="px-6 py-4 pb-32">
          {/* ?ㅻ뜑 */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate('/more')}
              className="w-10 h-10 bg-black/20 backdrop-blur-md border border-white/10 rounded-xl
                       flex items-center justify-center hover:bg-black/30 active:scale-95 transition-all"
            >
              <ArrowLeft size={20} className="text-white/90" />
            </button>
            <div>
              <h1 className="text-2xl font-display font-bold text-white tracking-wider">?룇 ?꾩궗 湲곕줉</h1>
              <p className="text-sm text-white/60 font-display tracking-wide">?뱀떊???ㅻ뜽濡??ъ젙怨??낆쟻</p>
            </div>
          </div>

          {/* ?뚮젅?댁뼱 ?꾨줈??移대뱶 */}
          <div className="mb-6 p-6 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400/30 to-orange-500/30 rounded-full
                            flex items-center justify-center backdrop-blur-sm border border-yellow-400/20">
                <User size={32} className="text-yellow-300" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-display font-bold text-white tracking-wider">{player.name}</h2>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-2">
                    <Crown size={16} className="text-orange-400" />
                    <span className="text-white/80 font-display">{player.rank}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star size={16} className="text-yellow-400" />
                    <span className="text-white/80 font-display">{player.rp} RP</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 鍮좊Ⅸ ?듦퀎 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-xl bg-white/5">
                <div className="text-lg font-display font-bold text-green-400">{MOCK_STATS.wins}</div>
                <div className="text-xs text-white/60 font-display">?밸━</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/5">
                <div className="text-lg font-display font-bold text-red-400">{MOCK_STATS.losses}</div>
                <div className="text-xs text-white/60 font-display">?⑤같</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/5">
                <div className="text-lg font-display font-bold text-yellow-400">{MOCK_STATS.winRate}%</div>
                <div className="text-xs text-white/60 font-display">?밸쪧</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/5">
                <div className="text-lg font-display font-bold text-purple-400">{player.towerProgress}痢?/div>
                <div className="text-xs text-white/60 font-display">理쒓퀬 ??/div>
              </div>
            </div>
          </div>

          {/* ???ㅻ퉬寃뚯씠??*/}
          <div className="flex mb-6 p-1 bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl">
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 py-3 px-4 rounded-xl font-display font-semibold tracking-wider transition-all ${
                activeTab === 'stats'
                  ? 'bg-white/20 text-white border border-white/20'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              ?뱤 ?곸꽭 ?듦퀎
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`flex-1 py-3 px-4 rounded-xl font-display font-semibold tracking-wider transition-all ${
                activeTab === 'achievements'
                  ? 'bg-white/20 text-white border border-white/20'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              ?룇 ?낆쟻 ({completedAchievements.length}/{MOCK_ACHIEVEMENTS.length})
            </button>
          </div>

          {/* ?곸꽭 ?듦퀎 ??*/}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* 寃뚯엫 ?듦퀎 */}
              <div className="p-6 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
                <h3 className="text-lg font-display font-bold text-white tracking-wider mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-green-400" />
                  寃뚯엫 ?듦퀎
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-white/60 font-display">珥?寃뚯엫 ??/span>
                    <span className="text-white font-display font-semibold">{MOCK_STATS.totalGames}寃뚯엫</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60 font-display">?꾩옱 ?곗듅</span>
                    <span className="text-white font-display font-semibold">{MOCK_STATS.currentStreak}?곗듅</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60 font-display">理쒓퀬 ?곗듅</span>
                    <span className="text-white font-display font-semibold">{MOCK_STATS.longestStreak}?곗듅</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60 font-display">?꾨꼍??寃뚯엫</span>
                    <span className="text-white font-display font-semibold">{MOCK_STATS.perfectGames}??/span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60 font-display">??쟾??/span>
                    <span className="text-white font-display font-semibold">{MOCK_STATS.comebackWins}??/span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60 font-display">理쒓퀬 ??궧</span>
                    <span className="text-white font-display font-semibold">{MOCK_STATS.rankingPeak}</span>
                  </div>
                </div>
              </div>

              {/* ?뚮젅???쒓컙 ?듦퀎 */}
              <div className="p-6 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
                <h3 className="text-lg font-display font-bold text-white tracking-wider mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-blue-400" />
                  ?뚮젅???쒓컙
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/60 font-display">珥??뚮젅???쒓컙</span>
                    <span className="text-white font-display font-semibold">{formatPlayTime(MOCK_STATS.totalPlayTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60 font-display">?됯퇏 寃뚯엫 ?쒓컙</span>
                    <span className="text-white font-display font-semibold">
                      {Math.floor(MOCK_STATS.averageGameTime / 60)}遺?{MOCK_STATS.averageGameTime % 60}珥?
                    </span>
                  </div>
                </div>
              </div>

              {/* ?좏샇?섎뒗 ?꾨왂 */}
              <div className="p-6 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
                <h3 className="text-lg font-display font-bold text-white tracking-wider mb-4 flex items-center gap-2">
                  <Target size={20} className="text-purple-400" />
                  ?좏샇?섎뒗 ?꾨왂
                </h3>
                <div className="flex flex-wrap gap-2">
                  {MOCK_STATS.favoriteOpenings.map((strategy, index) => (
                    <div
                      key={index}
                      className="px-3 py-1.5 rounded-full bg-purple-400/20 text-purple-300 text-sm font-display border border-purple-400/30"
                    >
                      {strategy}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ?낆쟻 ??*/}
          {activeTab === 'achievements' && (
            <div className="space-y-6">
              {/* ?꾨즺???낆쟻 */}
              {completedAchievements.length > 0 && (
                <div>
                  <h3 className="text-lg font-display font-bold text-white tracking-wider mb-4 flex items-center gap-2">
                    <CheckCircle size={20} className="text-green-400" />
                    ?꾨즺???낆쟻 ({completedAchievements.length})
                  </h3>
                  <div className="space-y-3">
                    {completedAchievements.map(achievement => (
                      <div
                        key={achievement.id}
                        className={`p-4 rounded-2xl bg-gradient-to-br ${getRarityColor(achievement.rarity)}
                                 backdrop-blur-sm border relative overflow-hidden`}
                      >
                        {/* ?꾨즺 ?쒖떆 */}
                        <div className="absolute top-2 right-2">
                          <CheckCircle size={16} className="text-green-400" />
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center">
                            {achievement.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-display font-bold text-white">{achievement.title}</h4>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getRarityTextColor(achievement.rarity)} bg-black/20`}>
                                {achievement.rarity.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-white/70 font-display mb-2">{achievement.description}</p>
                            <div className="flex items-center gap-4 text-xs">
                              <span className="text-green-400 font-display">
                                ??{achievement.completedDate?.toLocaleDateString('ko-KR')}
                              </span>
                              <span className="text-yellow-400 font-display">
                                ?럞 {achievement.reward.value}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 吏꾪뻾 以묒씤 ?낆쟻 */}
              {inProgressAchievements.length > 0 && (
                <div>
                  <h3 className="text-lg font-display font-bold text-white tracking-wider mb-4 flex items-center gap-2">
                    <RotateCcw size={20} className="text-yellow-400" />
                    吏꾪뻾 以묒씤 ?낆쟻 ({inProgressAchievements.length})
                  </h3>
                  <div className="space-y-3">
                    {inProgressAchievements.map(achievement => (
                      <div
                        key={achievement.id}
                        className={`p-4 rounded-2xl bg-gradient-to-br ${getRarityColor(achievement.rarity)}
                                 backdrop-blur-sm border relative overflow-hidden`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center relative">
                            {achievement.icon}
                            <Lock size={14} className="absolute -bottom-1 -right-1 text-white/60" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-display font-bold text-white/80">{achievement.title}</h4>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getRarityTextColor(achievement.rarity)} bg-black/20`}>
                                {achievement.rarity.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-white/60 font-display mb-3">{achievement.description}</p>

                            {/* 吏꾪뻾??諛?*/}
                            <div className="mb-2">
                              <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                                <div
                                  className="h-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
                                  style={{
                                    width: `${Math.min((achievement.progress / achievement.maxProgress) * 100, 100)}%`
                                  }}
                                />
                              </div>
                              <div className="flex justify-between mt-1 text-xs">
                                <span className="text-white/60 font-display">
                                  {achievement.progress} / {achievement.maxProgress}
                                </span>
                                <span className="text-yellow-400 font-display">
                                  ?럞 {achievement.reward.value}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
