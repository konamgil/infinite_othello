import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../ui/common/Layout';
import { TowerMap } from '../../ui/tower/TowerMap';
import { TowerCanvas } from '../../ui/tower/TowerCanvas';
import { ParticleSystem } from '../../ui/effects/ParticleSystem';
import { useGameStore } from '../../store/gameStore';
import { useFXLayer, useFXAnimation, useFXEffects } from '../../ui/fx/FXHooks';
import { haptic } from '../../ui/feedback/HapticFeedback';
import {
  Zap,
  Crown,
  Trophy,
  Star,
  ArrowLeft,
  Target,
  Award,
  TrendingUp,
  MapPin,
  List
} from 'lucide-react';

export default function Tower() {
  const navigate = useNavigate();
  const { player } = useGameStore();
  const effects = useFXEffects();

  const [viewMode, setViewMode] = useState<'overview' | 'map'>('overview');
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);

  // FX 레이어와 애니메이션
  const towerLayerRef = useFXLayer('tower-ui', 390, 800, true);
  useFXAnimation();

  const handleFloorSelect = (floor: number) => {
    setSelectedFloor(floor);
    // 즉시 게임 시작 - 불필요한 지연 제거
    navigate('/game', { state: { towerFloor: floor } });
  };

  const handleChallengeStart = () => {
    // 탑 완주 상태 확인
    if (player.towerProgress > 300) {
      haptic.gameWin();
      alert('🎉 축하합니다! 무한 탑을 완전히 정복하셨습니다!\n\n특별 보상이 지급되었습니다.');
      return;
    }

    const targetFloor = Math.min(300, player.towerProgress);

    // 햅틱 피드백만 유지
    haptic.bossEncounter();

    // 즉시 게임 시작
    navigate('/game', { state: { towerFloor: targetFloor } });
  };

  return (
    <Layout title="인피니트 탑" showSettings>
      <div className="h-full w-full overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain">
        {/* FX 레이어 */}
        <div ref={towerLayerRef} className="absolute inset-0 pointer-events-none z-20" />

        {viewMode === 'overview' ? (
          // 탑 개요 화면
          <div className="h-full flex flex-col">
            {/* 2D Canvas 히어로 섹션 - 우주 밤하늘의 무한 탑 */}
            <div className="relative h-80">
              <TowerCanvas
                currentFloor={player.towerProgress}
                maxFloor={300}
                className="rounded-t-2xl"
              />

              {/* 파티클 오버레이 */}
              <div className="absolute inset-0">
                <ParticleSystem
                  type="energy"
                  intensity={15}
                  colors={['rgba(255,215,0,0.6)', 'rgba(255,255,255,0.3)', 'rgba(139,92,246,0.4)']}
                  className="w-full h-full"
                />
              </div>

              {/* 탑 정보 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

              <div className="absolute bottom-6 left-0 right-0 text-center text-white z-10">
                <div className="relative">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-white to-blue-400 bg-clip-text text-transparent mb-3">
                    무한의 탑
                  </h1>
                  <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400/20 to-blue-400/20 rounded-lg blur-lg"></div>
                </div>
                <p className="text-lg text-white/90 font-medium mb-6">
                  별빛이 이끄는 신비로운 도전
                </p>

                {/* 현재 진행도 - 게임 스타일 */}
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400/30 to-orange-500/30 rounded-2xl blur"></div>
                  <div className="relative bg-black/50 backdrop-blur-md border border-yellow-400/40 rounded-2xl px-8 py-4">
                    <div className="flex items-center justify-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                        <Crown size={24} className="text-black" />
                      </div>
                      <div>
                        <div className="text-xs text-yellow-400/80 font-semibold">CURRENT FLOOR</div>
                        <div className="text-2xl font-bold text-white">{player.towerProgress} / 300</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 통계 섹션 */}
            <div className="bg-tower-deep-100 p-4">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Trophy size={20} className="text-white" />
                  </div>
                  <div className="text-lg font-bold text-green-400">
                    {Math.max(0, player.towerProgress - 1)}
                  </div>
                  <div className="text-xs text-tower-silver-400">클리어</div>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Crown size={20} className="text-white" />
                  </div>
                  <div className="text-lg font-bold text-red-400">
                    {Math.floor((player.towerProgress - 1) / 50)}
                  </div>
                  <div className="text-xs text-tower-silver-400">보스 처치</div>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Star size={20} className="text-white" />
                  </div>
                  <div className="text-lg font-bold text-purple-400">
                    {Math.round((player.towerProgress / 300) * 100)}%
                  </div>
                  <div className="text-xs text-tower-silver-400">달성률</div>
                </div>
              </div>

              {/* 다음 목표 */}
              <div className="card bg-gradient-to-br from-tower-deep-100 to-blue-900/20 mb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-tower-silver-200 mb-1">다음 목표</h3>
                    <p className="text-sm text-tower-silver-400">
                      {player.towerProgress <= 300 ? (
                        <>
                          <strong className="text-tower-gold-400">{player.towerProgress}층</strong>
                          {player.towerProgress % 50 === 0 ? ' BOSS' :
                           player.towerProgress % 10 === 0 ? ' 미니보스' : ''}
                          {' '}도전하기
                        </>
                      ) : (
                        '모든 층 정복 완료! 🎉'
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-tower-gold-400 font-semibold">
                      {player.towerProgress % 50 === 0 ? '+200 RP' :
                       player.towerProgress % 10 === 0 ? '+100 RP' : '+50 RP'}
                    </div>
                    {player.towerProgress % 50 === 0 && (
                      <div className="text-xs text-purple-400">+ 테마 해금</div>
                    )}
                  </div>
                </div>

                {/* 다음 보스까지의 진행도 */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-tower-silver-400 mb-2">
                    <span>다음 보스까지</span>
                    <span>{player.towerProgress % 50} / 50층</span>
                  </div>
                  <div className="bg-tower-deep-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-tower-gold-400 to-red-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(player.towerProgress % 50) * 2}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="flex-1 bg-tower-deep-100 px-4 pb-4">
              <div className="space-y-3">
                {/* 메인 도전 버튼 - 고요한 기본 + press 피크 */}
                <button
                  id="challenge-start-btn"
                  className="w-full bg-gradient-to-r from-tower-gold-400 to-orange-500 text-tower-deep-500
                           py-4 rounded-xl font-bold text-lg shadow-lg
                           active:scale-95 transition-all duration-150
                           flex items-center justify-center gap-3"
                  onClick={handleChallengeStart}
                >
                  <Zap size={24} />
                  {player.towerProgress <= 300 ? `${player.towerProgress}층 도전!` : '탑 완주 완료!'}
                </button>

                {/* 맵 보기 */}
                <button
                  className="w-full bg-tower-silver-600 text-tower-silver-100 py-3 rounded-xl font-semibold
                           active:bg-tower-silver-500 active:scale-95 transition-all duration-150
                           flex items-center justify-center gap-2"
                  onClick={() => setViewMode('map')}
                >
                  <MapPin size={20} />
                  전체 맵 보기
                </button>

                {/* 층별 기록 */}
                <button className="w-full bg-tower-deep-200 text-tower-silver-300 py-3 rounded-xl font-medium
                                active:bg-tower-deep-50 active:scale-95 transition-all duration-150
                                flex items-center justify-center gap-2">
                  <List size={20} />
                  클리어 기록
                </button>
              </div>

              {/* 하단 팁 */}
              <div className="mt-6 mb-20 p-3 bg-tower-deep-200/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Star size={16} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-tower-silver-200 text-sm mb-1">
                      탑 도전 팁
                    </h4>
                    <p className="text-xs text-tower-silver-400">
                      {player.towerProgress <= 50 ?
                        "초반 층수에서는 기본기를 다지세요. 코너를 우선적으로 차지하는 것이 중요합니다." :
                        player.towerProgress <= 150 ?
                        "중반부터는 상대의 움직임을 예측하는 능력이 중요해집니다." :
                        player.towerProgress <= 250 ?
                        "고층에서는 한 수 한 수가 승부를 좌우합니다. 신중하게 두세요." :
                        "마지막 단계입니다! 완벽한 계산과 집중력이 필요합니다."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // 탑 맵 화면
          <div className="h-full flex flex-col">
            {/* 맵 헤더 - 보더 제거, 그림자로 분리 */}
            <div className="bg-tower-deep-100 p-4 shadow-md">
              <div className="flex items-center justify-between">
                <button
                  className="flex items-center gap-2 text-tower-silver-300 active:text-tower-silver-100
                           active:scale-95 transition-all duration-150"
                  onClick={() => setViewMode('overview')}
                >
                  <ArrowLeft size={20} />
                  개요로 돌아가기
                </button>

                <h2 className="text-lg font-bold text-tower-gold-300">타워 맵</h2>

                <div className="text-sm text-tower-silver-400">
                  {player.towerProgress}/300층
                </div>
              </div>
            </div>

            {/* 타워 맵 */}
            <div className="flex-1 relative">
              <TowerMap
                onFloorSelect={handleFloorSelect}
                showDetails={true}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}