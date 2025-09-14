import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../ui/common/Layout';
import { useGameStore } from '../../store/gameStore';
import { ParticleSystem } from '../../ui/effects/ParticleSystem';
import { useFXLayer, useFXAnimation, useFXEffects, useFXButton } from '../../ui/fx/FXHooks';
import { haptic } from '../../ui/feedback/HapticFeedback';
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
    <Layout hideHeader>
      <div className="h-full w-full overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain">
        {/* 히어로 섹션 - 게임처럼 멋진 우주 배경 */}
        <div className="relative min-h-96 overflow-hidden">
          {/* 파티클 배경 - 미묘하게 */}
          <div className="absolute inset-0">
            <ParticleSystem
              type="floating"
              intensity={20}
              colors={['rgba(255,255,255,0.3)', 'rgba(251,191,36,0.4)', 'rgba(96,165,250,0.3)']}
              className="w-full h-full"
            />
          </div>

          {/* 메인 콘텐츠 */}
          <div className="relative z-10 px-6 py-12 text-center">
            {/* 게임 로고/타이틀 */}
            <div className="mb-8">
              <div className="relative inline-block">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-white to-blue-400 bg-clip-text text-transparent mb-3">
                  오델로 나이트
                </h1>
                <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400/20 to-blue-400/20 rounded-lg blur-lg"></div>
              </div>
              <p className="text-lg text-white/80 font-medium">무한의 우주탑을 정복하라</p>
            </div>

            {/* 플레이어 스테이터스 - 게임UI 스타일 */}
            <div className="flex justify-center items-center gap-6 mb-8">
              {/* 현재 층수 */}
              <div className="relative">
                <div className="bg-black/40 backdrop-blur-md border border-yellow-400/30 rounded-2xl px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                      <Crown size={24} className="text-black" />
                    </div>
                    <div>
                      <div className="text-xs text-yellow-400/80 font-semibold">FLOOR</div>
                      <div className="text-xl font-bold text-white">{player.towerProgress}</div>
                    </div>
                  </div>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-2xl blur"></div>
              </div>

              {/* 온라인 플레이어 */}
              <div className="bg-black/40 backdrop-blur-md border border-green-400/30 rounded-2xl px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <div>
                    <div className="text-xs text-green-400/80 font-semibold">ONLINE</div>
                    <div className="text-lg font-bold text-white">2,847</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 CTA 버튼 - 게임 스타일 */}
        <div className="px-6 mb-8">
          <div className="relative">
            {/* 버튼 글로우 효과 */}
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur opacity-30"></div>

            <button
              onClick={handleTowerChallenge}
              className="relative w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black
                       py-5 rounded-2xl font-bold text-xl
                       active:scale-95 transition-all duration-200
                       flex items-center justify-center gap-4
                       shadow-2xl border-2 border-yellow-300/50
                       hover:shadow-yellow-400/40 hover:shadow-2xl"
            >
              <div className="flex items-center justify-center gap-4">
                <div className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center">
                  <Zap size={20} className="text-white" />
                </div>
                <span className="tracking-wide">우주탑 정복 시작!</span>
                <ArrowRight size={22} />
              </div>

              {/* 버튼 하이라이트 */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-transparent rounded-2xl pointer-events-none"></div>
            </button>
          </div>
        </div>

        {/* 플레이어 상태 대시보드 */}
        <div className="content-padding mt-6">
          <div className="grid grid-cols-2 gap-4">
            {/* 레이팅 배지 */}
            <div
              id="rating-badge"
              className="card"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-tower-gold-400 rounded-full
                              flex items-center justify-center shadow-sm">
                  <Crown size={18} className="text-tower-deep-500" />
                </div>
                <div>
                  <div className="text-sm text-tower-silver-400">랭크</div>
                  <div className="font-bold text-tower-gold-400">{player.rank}</div>
                  <div className="text-xs text-tower-silver-500">{player.rp} RP</div>
                </div>
              </div>
            </div>

            {/* 승률 */}
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-full
                              flex items-center justify-center shadow-sm">
                  <TrendingUp size={18} className="text-white" />
                </div>
                <div>
                  <div className="text-sm text-tower-silver-400">승률</div>
                  <div className="font-bold text-green-400">
                    {Math.round((player.wins / (player.wins + player.losses)) * 100) || 0}%
                  </div>
                  <div className="text-xs text-tower-silver-500">
                    {player.wins}승 {player.losses}패
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 빠른 액션 버튼들 */}
        <div className="content-padding mt-6" ref={gameLayerRef}>
          <h3 className="text-lg font-bold text-tower-silver-200 mb-4 flex items-center gap-2">
            <Play size={20} className="text-tower-gold-400" />
            빠른 시작
          </h3>

          <div className="space-y-3">
            {/* 랭크 대전 */}
            <button
              onClick={handleQuickBattle}
              className="w-full card active:bg-tower-deep-50 transition-colors duration-150
                       flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500 rounded-lg shadow-sm
                              flex items-center justify-center">
                  <Swords size={22} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-tower-silver-200">랭크 대전</div>
                  <div className="text-sm text-tower-silver-400">실력을 겨뤄보세요</div>
                </div>
              </div>
              <div className="text-green-400 font-bold">+25 RP</div>
            </button>

            {/* 스텔라 학습 */}
            <button
              onClick={() => navigate('/stella')}
              className="w-full card active:bg-tower-deep-50 transition-colors duration-150
                       flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-400 rounded-lg shadow-sm
                              flex items-center justify-center">
                  <Star size={22} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-tower-silver-200">스텔라와 학습</div>
                  <div className="text-sm text-tower-silver-400">AI 멘토의 가이드</div>
                </div>
              </div>
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">3</span>
              </div>
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
    </Layout>
  );
}