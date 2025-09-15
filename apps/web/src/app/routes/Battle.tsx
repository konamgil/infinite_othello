import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { BattleStarCanvas } from '../../ui/battle/BattleStarCanvas';
import { Swords, Trophy, Users, Clock, Star, Crown, Zap } from 'lucide-react';

const TOURNAMENTS = [
  {
    id: 'rookie',
    name: '루키 토너먼트',
    rank: 'Bronze ~ Silver',
    reward: '500 RP + 테마 1개',
    participants: 128,
    timeLeft: '2시간 30분',
    icon: '🥉'
  },
  {
    id: 'champion',
    name: '챔피언십',
    rank: 'Gold 이상',
    reward: '2000 RP + 레어 테마',
    participants: 64,
    timeLeft: '12시간',
    icon: '🏆'
  }
];

const RECENT_BATTLES = [
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

export default function Battle() {
  const { player } = useGameStore();
  const [selectedMode, setSelectedMode] = useState<'quick' | 'ranked' | 'tournament' | null>(null);

  return (
    <div className="h-full w-full overflow-hidden relative">
      {/* 전투 별빛 캔버스 배경 */}
      <div className="absolute inset-0">
        <BattleStarCanvas className="w-full h-full" />
      </div>

      {/* 오버레이 콘텐츠 */}
      <div className="relative z-10 h-full overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain">
        <div className="content-padding section-spacing pb-32">
        {!selectedMode ? (
          <div>
            {/* 플레이어 배틀 통계 - 신비로운 디자인 */}
            <div className="mb-6 p-6 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
              <div className="text-center">
                <h3 className="text-lg font-smooth font-semibold text-white/90 mb-4">
                  {player.name}의 전투 기록
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 rounded-xl bg-white/5 backdrop-blur-sm">
                    <div className="text-2xl font-smooth font-bold text-green-400">{player.wins}</div>
                    <div className="text-xs text-white/70 font-smooth">승리</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 backdrop-blur-sm">
                    <div className="text-2xl font-smooth font-bold text-red-400">{player.losses}</div>
                    <div className="text-xs text-white/70 font-smooth">패배</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 backdrop-blur-sm">
                    <div className="text-2xl font-smooth font-bold text-orange-400">{player.winStreak}</div>
                    <div className="text-xs text-white/70 font-smooth">연승</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
                  <Crown size={16} className="text-orange-400" />
                  <span className="text-sm text-white/90 font-smooth">
                    {player.rank} • {player.rp} RP
                  </span>
                </div>
              </div>
            </div>

            {/* 전투 모드 선택 - 신비로운 디자인 */}
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-smooth font-semibold text-white/90 mb-6">전투 모드</h3>

              {/* 빠른 매치 */}
              <div
                className="group p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10
                         hover:bg-black/30 hover:border-white/20 active:scale-[0.98]
                         transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedMode('quick')}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400/30 to-blue-600/30
                                flex items-center justify-center mr-4 backdrop-blur-sm border border-blue-400/20">
                    <Swords size={20} className="text-blue-300" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-smooth font-semibold text-white/90">빠른 매치</h4>
                    <p className="text-sm text-white/70 font-smooth">
                      비슷한 실력의 상대와 즉시 대전
                    </p>
                  </div>
                  <div className="text-xs text-white/50 font-smooth">
                    ~30초
                  </div>
                </div>
              </div>

              {/* 랭크 게임 */}
              <div
                className="group p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10
                         hover:bg-black/30 hover:border-white/20 active:scale-[0.98]
                         transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedMode('ranked')}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400/30 to-purple-600/30
                                flex items-center justify-center mr-4 backdrop-blur-sm border border-purple-400/20">
                    <Crown size={20} className="text-purple-300" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-smooth font-semibold text-white/90">랭크 게임</h4>
                    <p className="text-sm text-white/70 font-smooth">
                      랭킹 포인트를 걸고 진행하는 공식 대전
                    </p>
                  </div>
                  <div className="text-xs text-green-400 font-smooth font-medium">
                    +25 RP
                  </div>
                </div>
              </div>

              {/* 토너먼트 */}
              <div
                className="group p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10
                         hover:bg-black/30 hover:border-white/20 active:scale-[0.98]
                         transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedMode('tournament')}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400/30 to-orange-600/30
                                flex items-center justify-center mr-4 backdrop-blur-sm border border-orange-400/20">
                    <Trophy size={20} className="text-orange-300" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-smooth font-semibold text-white/90">토너먼트</h4>
                    <p className="text-sm text-white/70 font-smooth">
                      대규모 토너먼트에 참가하여 특별한 보상 획득
                    </p>
                  </div>
                  <div className="text-xs text-orange-400 font-smooth font-medium">
                    특별 보상
                  </div>
                </div>
              </div>
            </div>

            {/* 최근 전적 */}
            <div className="p-6 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
              <h4 className="font-smooth font-semibold text-white/90 mb-4">최근 전적</h4>
              <div className="space-y-3">
                {RECENT_BATTLES.map((battle, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-white/5 backdrop-blur-sm">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        battle.result === 'victory' ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <div>
                        <div className="text-sm font-smooth font-medium text-white/90">
                          vs {battle.opponent}
                        </div>
                        <div className="text-xs text-white/60 font-smooth">
                          {battle.rank} • {battle.timeAgo}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-smooth font-semibold ${
                        battle.result === 'victory' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {battle.result === 'victory' ? '승리' : '패배'}
                      </div>
                      <div className="text-xs text-white/60 font-smooth">
                        {battle.score}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : selectedMode === 'tournament' ? (
          <div>
            {/* 토너먼트 상세 - 신비로운 헤더 */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400/30 to-orange-600/30
                              flex items-center justify-center backdrop-blur-sm border border-orange-400/20">
                  <Trophy size={18} className="text-orange-300" />
                </div>
                <h2 className="text-2xl font-smooth font-bold text-white">토너먼트</h2>
              </div>
              <button
                onClick={() => setSelectedMode(null)}
                className="px-4 py-2 rounded-xl bg-black/20 backdrop-blur-md border border-white/10
                         text-white/80 font-smooth hover:bg-black/30 hover:border-white/20 hover:text-white
                         active:scale-95 transition-all duration-300"
              >
                돌아가기
              </button>
            </div>

            <div className="space-y-4">
              {TOURNAMENTS.map((tournament) => (
                <div key={tournament.id} className="p-6 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="text-3xl mr-3">{tournament.icon}</div>
                      <div>
                        <h3 className="font-smooth font-bold text-white/90">
                          {tournament.name}
                        </h3>
                        <p className="text-sm text-white/70 font-smooth">
                          참가 조건: {tournament.rank}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-orange-400 font-smooth font-semibold">
                        {tournament.reward}
                      </div>
                      <div className="text-xs text-white/60 font-smooth">
                        {tournament.timeLeft} 남음
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-white/60 font-smooth">
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {tournament.participants}명
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {tournament.timeLeft}
                      </span>
                    </div>
                    <button className="px-6 py-2 rounded-xl bg-orange-400/20 text-orange-300
                                     font-smooth font-semibold hover:bg-orange-400/30 hover:text-orange-200
                                     active:scale-95 transition-all duration-300">
                      참가하기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {/* 매칭 중 화면 - 신비로운 헤더 */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-sm border ${
                  selectedMode === 'quick'
                    ? 'bg-gradient-to-br from-blue-400/30 to-blue-600/30 border-blue-400/20'
                    : 'bg-gradient-to-br from-purple-400/30 to-purple-600/30 border-purple-400/20'
                }`}>
                  {selectedMode === 'quick'
                    ? <Swords size={18} className="text-blue-300" />
                    : <Crown size={18} className="text-purple-300" />
                  }
                </div>
                <h2 className="text-2xl font-smooth font-bold text-white">
                  {selectedMode === 'quick' ? '빠른 매치' : '랭크 게임'}
                </h2>
              </div>
              <button
                onClick={() => setSelectedMode(null)}
                className="px-4 py-2 rounded-xl bg-black/20 backdrop-blur-md border border-white/10
                         text-white/80 font-smooth hover:bg-black/30 hover:border-white/20 hover:text-white
                         active:scale-95 transition-all duration-300"
              >
                취소
              </button>
            </div>

            <div className="p-8 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 text-center">
              <div className="mb-8">
                <div className="w-16 h-16 border-4 border-orange-400/60 border-t-orange-400 rounded-full animate-spin mx-auto mb-6" />
                <h3 className="text-lg font-smooth font-bold text-white/90 mb-3">
                  우주에서 상대를 찾는 중...
                </h3>
                <p className="text-white/70 font-smooth">
                  비슷한 실력의 전사와 매칭 중입니다
                </p>
              </div>

              <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-white/60 font-smooth">내 랭크</div>
                    <div className="font-smooth font-semibold text-white/90">{player.rank}</div>
                  </div>
                  <div>
                    <div className="text-white/60 font-smooth">예상 대기시간</div>
                    <div className="font-smooth font-semibold text-orange-400">~30초</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}