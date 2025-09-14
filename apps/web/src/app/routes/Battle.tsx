import React, { useState } from 'react';
import { Layout } from '../../ui/common/Layout';
import { useGameStore } from '../../store/gameStore';
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
    <Layout title="배틀" showSettings>
      <div className="h-full w-full overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain">
        <div className="content-padding section-spacing pb-32">
        {!selectedMode ? (
          <div>
            {/* 플레이어 배틀 통계 */}
            <div className="card mb-6 bg-gradient-to-br from-tower-deep-100 to-tower-deep-200">
              <div className="text-center">
                <h3 className="text-lg font-bold text-tower-silver-200 mb-4">
                  {player.name}의 배틀 기록
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-green-400">{player.wins}</div>
                    <div className="text-xs text-tower-silver-400">승리</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-400">{player.losses}</div>
                    <div className="text-xs text-tower-silver-400">패배</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-tower-gold-400">{player.winStreak}</div>
                    <div className="text-xs text-tower-silver-400">연승</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Crown size={16} className="text-tower-gold-400" />
                  <span className="text-sm text-tower-silver-300">
                    {player.rank} • {player.rp} RP
                  </span>
                </div>
              </div>
            </div>

            {/* 배틀 모드 선택 */}
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-bold text-tower-silver-200">배틀 모드</h3>

              {/* 빠른 매치 */}
              <div
                className="card-hover"
                onClick={() => setSelectedMode('quick')}
              >
                <div className="flex items-center">
                  <div className="bg-blue-500 p-3 rounded-lg mr-4">
                    <Swords size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-tower-silver-200">빠른 매치</h4>
                    <p className="text-sm text-tower-silver-400">
                      비슷한 실력의 상대와 즉시 대전
                    </p>
                  </div>
                  <div className="text-xs text-tower-silver-500">
                    ~30초
                  </div>
                </div>
              </div>

              {/* 랭크 게임 */}
              <div
                className="card-hover"
                onClick={() => setSelectedMode('ranked')}
              >
                <div className="flex items-center">
                  <div className="bg-purple-500 p-3 rounded-lg mr-4">
                    <Crown size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-tower-silver-200">랭크 게임</h4>
                    <p className="text-sm text-tower-silver-400">
                      랭킹 포인트를 걸고 진행하는 공식 대전
                    </p>
                  </div>
                  <div className="text-xs text-green-400 font-semibold">
                    +25 RP
                  </div>
                </div>
              </div>

              {/* 토너먼트 */}
              <div
                className="card-hover"
                onClick={() => setSelectedMode('tournament')}
              >
                <div className="flex items-center">
                  <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-3 rounded-lg mr-4">
                    <Trophy size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-tower-silver-200">토너먼트</h4>
                    <p className="text-sm text-tower-silver-400">
                      대규모 토너먼트에 참가하여 특별한 보상 획득
                    </p>
                  </div>
                  <div className="text-xs text-orange-400 font-semibold">
                    특별 보상
                  </div>
                </div>
              </div>
            </div>

            {/* 최근 전적 */}
            <div className="card">
              <h4 className="font-semibold text-tower-silver-200 mb-4">최근 전적</h4>
              <div className="space-y-3">
                {RECENT_BATTLES.map((battle, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        battle.result === 'victory' ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <div>
                        <div className="text-sm font-medium text-tower-silver-200">
                          vs {battle.opponent}
                        </div>
                        <div className="text-xs text-tower-silver-400">
                          {battle.rank} • {battle.timeAgo}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${
                        battle.result === 'victory' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {battle.result === 'victory' ? '승리' : '패배'}
                      </div>
                      <div className="text-xs text-tower-silver-400">
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
            {/* 토너먼트 상세 */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-tower-gold-300">토너먼트</h2>
              <button
                onClick={() => setSelectedMode(null)}
                className="btn-secondary px-4 py-2"
              >
                돌아가기
              </button>
            </div>

            <div className="space-y-4">
              {TOURNAMENTS.map((tournament) => (
                <div key={tournament.id} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="text-3xl mr-3">{tournament.icon}</div>
                      <div>
                        <h3 className="font-bold text-tower-silver-200">
                          {tournament.name}
                        </h3>
                        <p className="text-sm text-tower-silver-400">
                          참가 조건: {tournament.rank}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-tower-gold-400 font-semibold">
                        {tournament.reward}
                      </div>
                      <div className="text-xs text-tower-silver-400">
                        {tournament.timeLeft} 남음
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-tower-silver-400">
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {tournament.participants}명
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {tournament.timeLeft}
                      </span>
                    </div>
                    <button className="btn-primary px-6 py-2">
                      참가하기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {/* 매칭 중 화면 */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-tower-silver-200">
                {selectedMode === 'quick' ? '빠른 매치' : '랭크 게임'}
              </h2>
              <button
                onClick={() => setSelectedMode(null)}
                className="btn-secondary px-4 py-2"
              >
                취소
              </button>
            </div>

            <div className="card text-center">
              <div className="mb-6">
                <div className="w-16 h-16 border-4 border-tower-gold-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-bold text-tower-silver-200 mb-2">
                  상대를 찾는 중...
                </h3>
                <p className="text-tower-silver-400">
                  비슷한 실력의 상대와 매칭 중입니다
                </p>
              </div>

              <div className="bg-tower-deep-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-tower-silver-400">내 랭크</div>
                    <div className="font-semibold text-tower-silver-200">{player.rank}</div>
                  </div>
                  <div>
                    <div className="text-tower-silver-400">예상 대기시간</div>
                    <div className="font-semibold text-tower-gold-400">~30초</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </Layout>
  );
}