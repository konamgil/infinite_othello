import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../../../store/gameStore';
import { ParticleSystem } from '../../../../ui/effects/ParticleSystem';
import { OthelloStarCanvas } from '../../../../ui/game/OthelloStarCanvas';
import { useFXLayer, useFXAnimation, useFXEffects, useFXButton } from '../../../../ui/fx/FXHooks';
import { haptic } from '../../../../ui/feedback/HapticFeedback';
import { DAILY_MISSIONS } from '../../../stella/constants';
import { StatsDisplay, type StatItem } from '../../../../ui/stats';
import {
  Zap,
  Crown,
  Swords,
  Star,
  Trophy,
  Target,
  TrendingUp,
  ArrowRight,
  Play,
  Users,
  CheckCircle
} from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const { player, updatePlayer } = useGameStore();
  const effects = useFXEffects();

  // 반응형 캔버스 크기
  const [canvasSize, setCanvasSize] = useState(400);

  // 화면 크기 변경 시 캔버스 크기 조정
  useEffect(() => {
    const updateCanvasSize = () => {
      setCanvasSize(window.innerWidth);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // FX 레이어 설정
  const heroLayerRef = useFXLayer('home-hero', 390, 300, true);
  const gameLayerRef = useFXLayer('home-game', 390, 200, true);

  // FX 애니메이션 시작
  useFXAnimation();

  // 히어로 CTA 버튼 FX
  const { buttonProps: heroButtonProps } = useFXButton();
  const { buttonProps: battleButtonProps } = useFXButton();
  const { buttonProps: towerButtonProps } = useFXButton();

  // 컴포넌트 마운트 시 미니멀 효과만
  useEffect(() => {
    setTimeout(() => {
      effects.starfield('home-hero', 28); // 60 -> 28개로 대폭 감소
    }, 100);
  }, [effects]);

  const handleTowerChallenge = () => {
    // 햅틱 피드백만 유지 - 고요한 기본 원칙
    haptic.buttonTap();

    // 즉시 전환 - 불필요한 지연 제거
    navigate('/tower');
  };

  const handleQuickBattle = () => {
    // 햅틱 피드백만 유지 - 고요한 기본 원칙
    haptic.buttonTap();

    // 즉시 전환 - 불필요한 지연 제거
    navigate('/battle');
  };

  const handleRatingChange = (newRating: number) => {
    updatePlayer({ rp: newRating });
    // 시각 효과 제거 - 데이터 업데이트만 수행
  };

  // 상단 통계 데이터 구성
  const statsData: StatItem[] = [
    {
      key: 'tower',
      label: '탑',
      value: `${player.towerProgress}층`,
      icon: Crown,
      color: 'blue'
    },
    {
      key: 'online',
      label: '온라인',
      value: '2,847',
      icon: Users,
      color: 'green'
    },
    {
      key: 'rp',
      label: 'RP',
      value: player.rp,
      icon: Star,
      color: 'yellow'
    }
  ];

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain">
        {/* 히어로 섹션 - 신비로운 별빛 오델로 */}
        <div className="relative min-h-96 overflow-hidden">
          {/* 별빛 오델로 캔버스 - 상단/좌우 붙임 + 자연스러운 경계 */}
          <div className="absolute top-0 left-0 right-0 overflow-hidden">
            <div className="relative w-full">
              <OthelloStarCanvas
                width={canvasSize}
                height={400}
                boardScale={1}
                perspectiveSkew={2}
                safeBottom={72}
                fpsCap={45}
              />

              {/* 자연스러운 경계 오버레이 - 하단으로 페이드 */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(to bottom, transparent 0%, transparent 60%, rgba(0, 0, 0, 0.3) 80%, rgba(0, 0, 0, 0.8) 90%, black 100%)`
                }}
              />
            </div>
          </div>

          {/* Stats Display - 우측 상단 */}
          <StatsDisplay stats={statsData} />

          {/* 메인 콘텐츠 */}
          <div className="relative z-10 px-4 pt-32 pb-12 text-center">
            {/* 게임 로고/타이틀 - RP와 거리 확보 */}
            <div className="mb-8">
              <div className="relative inline-block">
                <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-yellow-400 via-white to-blue-400 bg-clip-text text-transparent mb-3 tracking-wider">
                  OTHELLO
                </h1>
                <h2 className="text-3xl font-display font-bold bg-gradient-to-r from-yellow-400 via-white to-blue-400 bg-clip-text text-transparent tracking-wider">
                  KNIGHT
                </h2>
                <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400/20 to-blue-400/20 rounded-lg blur-lg"></div>
              </div>
            </div>

          </div>
        </div>

        {/* 신비로운 입장 버튼 - 별빛에 조화 */}
        <div className="px-4 mb-8">
          <button
            onClick={handleTowerChallenge}
            className="group relative w-full py-4 px-8 rounded-full
                     bg-white/10 backdrop-blur-md border border-white/20
                     active:scale-95 transition-all duration-300
                     flex items-center justify-center gap-3
                     hover:bg-white/15 hover:border-white/30"
          >
            {/* 버튼 내부 별빛 효과 */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

            <div className="relative flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400/80 to-blue-400/80 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
              <span className="font-display text-white/90 tracking-wider text-lg">탑 입장하기</span>
            </div>

            {/* 호버 시 글로우 */}
            <div className="absolute -inset-1 bg-white/10 rounded-full blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
          </button>
        </div>

        {/* 신비로운 상태 정보 - 별빛 스타일 */}
        <div className="px-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 랭크 */}
            <div className="relative group">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400/20 to-orange-500/20 flex items-center justify-center">
                  <Crown size={16} className="text-yellow-400/80" />
                </div>
                <div>
                  <div className="text-xs text-white/60 font-display tracking-wide">RANK</div>
                  <div className="text-sm font-display text-yellow-400/90 tracking-wider">{player.rank}</div>
                </div>
              </div>
              <div className="absolute -inset-1 bg-yellow-400/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            </div>

            {/* 승률 */}
            <div className="relative group">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400/20 to-emerald-500/20 flex items-center justify-center">
                  <TrendingUp size={16} className="text-green-400/80" />
                </div>
                <div>
                  <div className="text-xs text-white/60 font-display tracking-wide">WIN RATE</div>
                  <div className="text-sm font-display text-green-400/90 tracking-wider">
                    {Math.round((player.wins / (player.wins + player.losses)) * 100) || 0}%
                  </div>
                </div>
              </div>
              <div className="absolute -inset-1 bg-green-400/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            </div>
          </div>
        </div>

        {/* 신비로운 액션 메뉴 */}
        <div className="px-4 mt-6" ref={gameLayerRef}>
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse"></div>
              <span className="text-sm font-display text-white/60 tracking-wider">QUICK START</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* 랭크 대전 - 별빛 스타일 */}
            <button
              onClick={handleQuickBattle}
              className="group w-full flex items-center justify-between p-5 rounded-2xl
                       bg-white/5 backdrop-blur-sm border border-white/10
                       hover:bg-white/10 hover:border-white/20
                       active:scale-95 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20
                              flex items-center justify-center">
                  <Swords size={20} className="text-red-400/80" />
                </div>
                <div className="text-left">
                  <div className="font-display text-white/90 tracking-wide">RANKED</div>
                  <div className="text-xs text-white/50 font-display tracking-wider">BATTLE</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-green-400/80 font-display text-sm tracking-wider">+25 RP</div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div className="absolute -inset-1 bg-red-400/5 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            </button>

            {/* 스텔라 학습 - 별빛 스타일 */}
            <button
              onClick={() => navigate('/stella')}
              className="group w-full flex items-center justify-between p-5 rounded-2xl
                       bg-white/5 backdrop-blur-sm border border-white/10
                       hover:bg-white/10 hover:border-white/20
                       active:scale-95 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20
                              flex items-center justify-center">
                  <Star size={20} className="text-purple-400/80" />
                </div>
                <div className="text-left">
                  <div className="font-display text-white/90 tracking-wide">STELLA</div>
                  <div className="text-xs text-white/50 font-display tracking-wider">AI MENTOR</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-400/20 flex items-center justify-center">
                  <span className="text-green-400 text-xs font-display">3</span>
                </div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              </div>
              <div className="absolute -inset-1 bg-purple-400/5 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            </button>
          </div>
        </div>

        {/* 오늘의 미션 */}
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white/90 flex items-center gap-2">
              <Target size={20} className="text-green-400" />
              오늘의 미션
            </h3>
            <button
              onClick={() => navigate('/stella')}
              className="text-xs text-white/60 hover:text-white/80 transition-colors"
            >
              더보기
            </button>
          </div>

          {DAILY_MISSIONS.every(mission => mission.completed) ? (
            /* 모든 미션 완료 UI */
            <div className="p-6 rounded-2xl bg-gradient-to-br from-green-400/20 to-emerald-500/20
                          backdrop-blur-sm border border-green-400/30 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400/30 to-emerald-500/30
                            rounded-full flex items-center justify-center mx-auto mb-4 border border-green-400/40">
                <Trophy size={24} className="text-green-400" />
              </div>
              <h4 className="font-bold text-white/90 mb-2">🎉 오늘의 미션 완료!</h4>
              <p className="text-sm text-white/70 mb-4">모든 미션을 완료했습니다. 내일 새로운 도전이 기다려요!</p>
              <button
                onClick={() => navigate('/stella')}
                className="px-4 py-2 bg-green-400/20 text-green-400 rounded-lg text-sm
                         hover:bg-green-400/30 transition-colors border border-green-400/30"
              >
                스텔라에게 보고하기
              </button>
            </div>
          ) : (
            /* 진행중인 미션 표시 (첫 번째 미완료 미션) */
            (() => {
              const currentMission = DAILY_MISSIONS.find(mission => !mission.completed);
              return currentMission ? (
                <div className="p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        currentMission.progress > 0
                          ? 'bg-yellow-400/20 border border-yellow-400/60'
                          : 'bg-white/10 border border-white/20'
                      }`}>
                        {currentMission.progress > 0 ? (
                          <div className="w-1 h-1 bg-yellow-400 rounded-full" />
                        ) : (
                          <div className="w-1 h-1 bg-white/40 rounded-full" />
                        )}
                      </div>
                      <h4 className="font-semibold text-white/90 text-sm">{currentMission.title}</h4>
                      <div className="text-green-400/80 font-display text-xs font-medium">
                        {currentMission.rewards[0]?.value}
                      </div>
                    </div>
                    <button
                      className="px-3 py-1.5 text-xs bg-green-400/20 text-green-400 rounded-lg
                               hover:bg-green-400/30 transition-colors border border-green-400/30 ml-3"
                      onClick={() => navigate('/stella')}
                    >
                      도전
                    </button>
                  </div>
                </div>
              ) : null;
            })()
          )}
        </div>

        {/* 최근 대국 */}
        <div className="px-4 mt-6 pb-20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white/90 flex items-center gap-2">
              <Users size={20} className="text-blue-400" />
              최근 대국
            </h3>
            <button
              onClick={() => navigate('/more/replay')}
              className="text-xs text-white/60 hover:text-white/80 transition-colors"
            >
              더보기
            </button>
          </div>

          <div className="space-y-2">
            {[
              { opponent: '드래곤슬레이어', result: '승리', score: '34-30', time: '2시간 전', type: 'win' },
              { opponent: '마법사의검', result: '패배', score: '28-36', time: '1일 전', type: 'lose' },
              { opponent: '어둠의기사', result: '승리', score: '42-22', time: '2일 전', type: 'win' }
            ].map((game, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                <div className={`w-2 h-2 rounded-full ${
                  game.type === 'win' ? 'bg-green-400' : 'bg-red-400'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white/90 font-medium text-sm">vs {game.opponent}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      game.type === 'win'
                        ? 'bg-green-400/20 text-green-400 border border-green-400/30'
                        : 'bg-red-400/20 text-red-400 border border-red-400/30'
                    }`}>
                      {game.result}
                    </span>
                  </div>
                  <div className="text-xs text-white/60 mt-1">{game.score}</div>
                </div>
                <div className="text-xs text-white/50">{game.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
  );
}
