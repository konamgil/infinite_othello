import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { ParticleSystem } from '../../ui/effects/ParticleSystem';
import { OthelloStarCanvas } from '../../ui/game/OthelloStarCanvas';
import { useFXLayer, useFXAnimation, useFXEffects, useFXButton } from '../../ui/fx/FXHooks';
import { haptic } from '../../ui/feedback/HapticFeedback';
import { testSupabaseConnection } from '../../services/supabase';
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
  Users
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { player, updatePlayer } = useGameStore();
  const effects = useFXEffects();

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

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain">
        {/* 히어로 섹션 - 신비로운 별빛 오델로 */}
        <div className="relative min-h-96 overflow-hidden">
          {/* 별빛 오델로 캔버스 */}
          <div className="absolute inset-0">
            <OthelloStarCanvas
             width={400}
        height={400}
        boardScale={1.0}
        perspectiveSkew={2}
        safeBottom={72}      // 하단 탭이 있으면 지정
        fpsCap={45}          // 성능 세이브
        // 필요시 토글:
        enableExtrusion
        enableCornerFlares
        enableRayImpacts
        enableDiscGlints
        enableSweep
            />
          </div>

          {/* 메인 콘텐츠 */}
          <div className="relative z-10 px-6 py-12 text-center">
            {/* 게임 로고/타이틀 */}
            <div className="mb-8">
              <div className="relative inline-block">
                <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-yellow-400 via-white to-blue-400 bg-clip-text text-transparent mb-3 tracking-wider">
                  OTHELLO KNIGHT
                </h1>
                <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400/20 to-blue-400/20 rounded-lg blur-lg"></div>
              </div>
            </div>

            {/* 신비로운 상태 표시 - 미니멀하고 우아하게 */}
            <div className="flex justify-center items-center gap-8 mb-12">
              {/* 현재 층수 - 별빛 스타일 */}
              <div className="relative group">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-display text-yellow-400/90 tracking-wider">{player.towerProgress}</span>
                </div>
                <div className="absolute -inset-1 bg-yellow-400/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              </div>

              {/* 온라인 상태 - 별빛 스타일 */}
              <div className="relative group">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-display text-green-400/90 tracking-wider">2,847</span>
                </div>
                <div className="absolute -inset-1 bg-green-400/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              </div>
            </div>
          </div>
        </div>

        {/* 신비로운 입장 버튼 - 별빛에 조화 */}
        <div className="px-8 mb-12">
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
              <span className="font-display text-white/90 tracking-wider text-lg">ENTER</span>
            </div>

            {/* 호버 시 글로우 */}
            <div className="absolute -inset-1 bg-white/10 rounded-full blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
          </button>
        </div>

        {/* 신비로운 상태 정보 - 별빛 스타일 */}
        <div className="px-8 mt-6">
          <div className="grid grid-cols-2 gap-6">
            {/* 랭크 */}
            <div className="relative group">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400/20 to-orange-500/20 flex items-center justify-center">
                  <Crown size={16} className="text-yellow-400/80" />
                </div>
                <div>
                  <div className="text-xs text-white/60 font-display tracking-wide">{player.rank}</div>
                  <div className="text-sm font-display text-yellow-400/90 tracking-wider">{player.rp} RP</div>
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
        <div className="px-8 mt-8" ref={gameLayerRef}>
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

        {/* 오늘의 퀘스트 */}
        <div className="content-padding mt-6">
          <h3 className="text-lg font-bold text-tower-silver-200 mb-4 flex items-center gap-2">
            <Target size={20} className="text-tower-gold-400" />
            오늘의 도전
          </h3>

          <div className="card bg-gradient-to-br from-tower-deep-100 to-blue-900/20">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-tower-silver-200">첫 수를 모서리로</h4>
                <p className="text-sm text-tower-silver-400">게임을 모서리 위치에서 시작하세요</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-tower-gold-400 font-semibold">50 RP</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <div className="bg-tower-deep-200 rounded-full h-2">
                  <div className="bg-tower-gold-400 h-2 rounded-full w-0 transition-all duration-500" />
                </div>
                <div className="text-xs text-tower-silver-400 mt-1">0 / 1</div>
              </div>
              <button
                className="btn-primary px-4 py-2 text-sm"
                onClick={() => navigate('/game')}
              >
                시작하기
              </button>
            </div>
          </div>
        </div>

        {/* 실시간 활동 피드 */}
        <div className="content-padding mt-6 pb-24">
          <h3 className="text-lg font-bold text-tower-silver-200 mb-4 flex items-center gap-2">
            <Users size={20} className="text-tower-gold-400" />
            실시간 활동
          </h3>

          <div className="space-y-2">
            {[
              { name: '드래곤슬레이어', action: '100층 돌파!', time: '방금 전', type: 'tower' },
              { name: '마법사의검', action: '골드 승격', time: '2분 전', type: 'rank' },
              { name: '어둠의기사', action: '완벽한 승리', time: '5분 전', type: 'battle' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-tower-deep-200/50 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'tower' ? 'bg-tower-gold-400' :
                  activity.type === 'rank' ? 'bg-purple-400' : 'bg-green-400'
                } animate-pulse`} />
                <div className="flex-1">
                  <span className="text-tower-silver-200 font-medium">{activity.name}</span>
                  <span className="text-tower-silver-400 ml-2">{activity.action}</span>
                </div>
                <div className="text-xs text-tower-silver-500">{activity.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
  );
}