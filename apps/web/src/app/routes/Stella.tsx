import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { StellaCanvas } from '../../ui/stella/StellaCanvas';
import { TypewriterText } from '../../ui/stella/TypewriterText';
import { BookOpen, Target, RotateCcw, TrendingUp, Star, Award, Calendar, ChevronRight, Brain, CheckCircle } from 'lucide-react';

const DAILY_MISSIONS = [
  {
    id: 1,
    title: '첫 수를 모서리로 시작하기',
    description: '게임을 모서리 위치에서 시작하세요',
    rewards: [{ type: 'rp', value: '50 RP' }],
    progress: 0,
    maxProgress: 1,
    completed: false
  },
  {
    id: 2,
    title: '코너 장악하기',
    description: '게임에서 코너를 2개 이상 차지하세요',
    rewards: [{ type: 'rp', value: '100 RP' }],
    progress: 1,
    maxProgress: 2,
    completed: false
  },
  {
    id: 3,
    title: '완벽한 승리',
    description: '상대방이 한 수도 두지 못하게 만드세요',
    rewards: [
      { type: 'rp', value: '200 RP' },
      { type: 'theme', value: '테마' }
    ],
    progress: 0,
    maxProgress: 1,
    completed: false
  }
];

const STRATEGY_LESSONS = [
  {
    id: 1,
    title: '기초: 오델로 룰 이해하기',
    description: '게임의 기본 규칙과 돌 뒤집기 원리',
    difficulty: '초급',
    duration: '5분',
    completed: true
  },
  {
    id: 2,
    title: '전략: 모빌리티와 스태빌리티',
    description: '움직임의 자유도와 안정성의 균형',
    difficulty: '중급',
    duration: '10분',
    completed: true
  },
  {
    id: 3,
    title: '고급: 엔드게임 계산',
    description: '게임 종반의 정확한 계산법',
    difficulty: '고급',
    duration: '15분',
    completed: false
  },
  {
    id: 4,
    title: '마스터: 개방도와 평가함수',
    description: '고급 평가 기법과 포지션 분석',
    difficulty: '마스터',
    duration: '20분',
    completed: false
  }
];

const PRACTICE_SCENARIOS = [
  {
    id: 1,
    title: '코너 공략 연습',
    description: '코너를 안전하게 차지하는 방법 연습',
    difficulty: '초급',
    plays: 1247
  },
  {
    id: 2,
    title: '엣지 전투',
    description: '모서리 라인에서의 전략적 플레이',
    difficulty: '중급',
    plays: 892
  },
  {
    id: 3,
    title: '미드게임 패턴',
    description: '중반 게임에서의 다양한 패턴 학습',
    difficulty: '고급',
    plays: 543
  }
];

export default function Stella() {
  const { player } = useGameStore();
  const [activeTab, setActiveTab] = useState<'missions' | 'strategy' | 'practice' | null>(null);

  const stellaWisdoms = [
    "안녕하세요! 오늘도 오델로의 우주적 지혜를 나누어 드릴게요.",
    "코너를 차지하는 것은 중요하지만, 과정에서 상대에게 너무 많은 선택권을 주지 않도록 주의하세요.",
    "게임 초반에는 중앙을 피하고, 상대의 움직임을 제한하는 전략이 효과적입니다.",
    "엣지는 양날의 검이에요. 잘못 사용하면 상대에게 코너를 내어줄 수 있답니다.",
    "게임 후반에는 모든 수를 정확히 계산해야 해요. 한 수의 실수가 승부를 좌우하거든요.",
    "모빌리티와 스태빌리티의 균형을 찾는 것이 오델로 마스터의 핵심입니다.",
    "때로는 적은 돌로도 큰 영향력을 발휘할 수 있어요. 품질이 양보다 중요해요.",
    "상대의 패턴을 읽고 미래의 수를 예측하는 것이 진정한 실력이랍니다."
  ];

  return (
    <div className="h-full w-full overflow-hidden relative">
      {/* 스텔라 AI 캔버스 배경 */}
      <div className="absolute inset-0">
        <StellaCanvas className="w-full h-full" />
      </div>

      {/* 오버레이 콘텐츠 */}
      <div className="relative z-10 h-full overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain">
        <div className="content-padding section-spacing pb-32">
        {!activeTab ? (
          <div>
            {/* 스텔라의 우주적 지혜 - 맨 위로 이동 */}
            <div className="mb-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20
                              flex items-center justify-center backdrop-blur-sm shrink-0 animate-pulse">
                  <span className="text-2xl">🌟</span>
                </div>
                <div className="flex-1 min-h-[3rem]">
                  <h4 className="font-smooth font-medium text-blue-300 mb-3 text-sm">
                    스텔라의 우주적 지혜
                  </h4>
                  <div className="text-white/85 font-smooth text-base leading-relaxed">
                    <TypewriterText
                      messages={stellaWisdoms}
                      typingSpeed={60}
                      pauseDuration={5000}
                      className="text-white/85"
                    />
                  </div>
                </div>
              </div>
            </div>


            {/* 학습 진행도 - 글래스모피즘 */}
            <div className="mb-6 p-6 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
              <h3 className="font-smooth font-semibold text-white/90 mb-4 text-center">학습 진행도</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm">
                  <div className="text-2xl font-smooth font-bold text-green-400">2/4</div>
                  <div className="text-xs text-white/70 font-smooth mt-1">전략 강의</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm">
                  <div className="text-2xl font-smooth font-bold text-blue-400">1/3</div>
                  <div className="text-xs text-white/70 font-smooth mt-1">데일리 미션</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm">
                  <div className="text-2xl font-smooth font-bold text-purple-400">3</div>
                  <div className="text-xs text-white/70 font-smooth mt-1">연습 시나리오</div>
                </div>
              </div>
            </div>


            {/* 스텔라의 학습 메뉴들 */}
            <div className="space-y-4">
              {/* 데일리 미션 */}
              <div
                className="group p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10
                         hover:bg-black/30 hover:border-white/20 active:scale-[0.98]
                         transition-all duration-300 cursor-pointer"
                onClick={() => setActiveTab('missions')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400/30 to-green-600/30
                                  flex items-center justify-center mr-4 backdrop-blur-sm border border-green-400/20">
                      <Target size={20} className="text-green-300" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-white/90 tracking-wider">데일리 미션</h3>
                      <p className="text-sm text-white/60 font-display tracking-wide">
                        매일 새로운 도전으로 성장하세요
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-green-400/20 text-green-300 text-xs font-display font-semibold tracking-wider">
                      1/3
                    </span>
                    <ChevronRight size={16} className="text-white/40 group-hover:text-white/60 transition-colors" />
                  </div>
                </div>
              </div>

              {/* 전략 학습 */}
              <div
                className="group p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10
                         hover:bg-black/30 hover:border-white/20 active:scale-[0.98]
                         transition-all duration-300 cursor-pointer"
                onClick={() => setActiveTab('strategy')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400/30 to-purple-600/30
                                  flex items-center justify-center mr-4 backdrop-blur-sm border border-purple-400/20">
                      <Brain size={20} className="text-purple-300" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-white/90 tracking-wider">전략 학습</h3>
                      <p className="text-sm text-white/60 font-display tracking-wide">
                        우주의 지혜와 고급 전술을 배우세요
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-purple-400/20 text-purple-300 text-xs font-display font-semibold tracking-wider">
                      2/4
                    </span>
                    <ChevronRight size={16} className="text-white/40 group-hover:text-white/60 transition-colors" />
                  </div>
                </div>
              </div>

              {/* 연습 시나리오 */}
              <div
                className="group p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10
                         hover:bg-black/30 hover:border-white/20 active:scale-[0.98]
                         transition-all duration-300 cursor-pointer"
                onClick={() => setActiveTab('practice')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400/30 to-orange-600/30
                                  flex items-center justify-center mr-4 backdrop-blur-sm border border-orange-400/20">
                      <RotateCcw size={20} className="text-orange-300" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-white/90 tracking-wider">연습 시나리오</h3>
                      <p className="text-sm text-white/60 font-display tracking-wide">
                        실전 같은 특별한 상황을 연습하세요
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-white/40 group-hover:text-white/60 transition-colors" />
                </div>
              </div>

              {/* 기보 분석 */}
              <div className="group p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10
                           hover:bg-black/30 hover:border-white/20 active:scale-[0.98]
                           transition-all duration-300 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400/30 to-blue-600/30
                                  flex items-center justify-center mr-4 backdrop-blur-sm border border-blue-400/20">
                      <BookOpen size={20} className="text-blue-300" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-white/90 tracking-wider">기보 분석</h3>
                      <p className="text-sm text-white/60 font-display tracking-wide">
                        AI와 함께 게임을 돌아보고 성장하세요
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-white/40 group-hover:text-white/60 transition-colors" />
                </div>
              </div>
            </div>

          </div>
        ) : activeTab === 'missions' ? (
          <div>
            {/* 데일리 미션 화면 - 신비로운 헤더 */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400/30 to-green-600/30
                              flex items-center justify-center backdrop-blur-sm border border-green-400/20">
                  <Target size={18} className="text-green-300" />
                </div>
                <h2 className="text-2xl font-display font-bold text-white tracking-wider">데일리 미션</h2>
              </div>
              <button
                onClick={() => setActiveTab(null)}
                className="px-4 py-2 rounded-xl bg-black/20 backdrop-blur-md border border-white/10
                         text-white/80 font-display tracking-wider
                         hover:bg-black/30 hover:border-white/20 hover:text-white
                         active:scale-95 transition-all duration-300"
              >
                돌아가기
              </button>
            </div>

            <div className="space-y-4">
              {DAILY_MISSIONS.map((mission) => (
                <div key={mission.id} className="p-6 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10
                                                hover:bg-black/25 hover:border-white/15 transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 backdrop-blur-sm ${
                        mission.completed
                          ? 'bg-green-400/20 border border-green-400/30'
                          : 'bg-white/10 border border-white/20'
                      }`}>
                        {mission.completed ? (
                          <CheckCircle size={18} className="text-green-300" />
                        ) : (
                          <span className="text-sm font-display font-bold text-white/70">{mission.id}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display font-semibold text-white/90 tracking-wider mb-1">{mission.title}</h3>
                        <p className="text-sm text-white/60 font-display tracking-wide leading-relaxed">{mission.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {mission.rewards.map((reward, index) => (
                        <div key={index} className={`px-3 py-1 rounded-full text-xs font-display font-semibold tracking-wider whitespace-nowrap ${
                          reward.type === 'rp'
                            ? 'bg-green-400/20 text-green-300'
                            : 'bg-purple-400/20 text-purple-300 border border-purple-400/30'
                        }`}>
                          {reward.value}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-6">
                      <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(mission.progress / mission.maxProgress) * 100}%` }}
                        />
                      </div>
                      <div className="text-xs text-white/50 font-display tracking-wider mt-2">
                        {mission.progress} / {mission.maxProgress} 완료
                      </div>
                    </div>
                    {mission.completed ? (
                      <span className="text-green-300 text-sm font-display font-semibold tracking-wider">✓ 완료!</span>
                    ) : (
                      <button className="px-6 py-2 rounded-xl bg-green-400/20 text-green-300
                                       font-display font-semibold tracking-wider
                                       hover:bg-green-400/30 hover:text-green-200
                                       active:scale-95 transition-all duration-300">
                        시작하기
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'strategy' ? (
          <div>
            {/* 전략 학습 화면 - 신비로운 헤더 */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400/30 to-purple-600/30
                              flex items-center justify-center backdrop-blur-sm border border-purple-400/20">
                  <Brain size={18} className="text-purple-300" />
                </div>
                <h2 className="text-2xl font-display font-bold text-white tracking-wider">전략 학습</h2>
              </div>
              <button
                onClick={() => setActiveTab(null)}
                className="px-4 py-2 rounded-xl bg-black/20 backdrop-blur-md border border-white/10
                         text-white/80 font-display tracking-wider
                         hover:bg-black/30 hover:border-white/20 hover:text-white
                         active:scale-95 transition-all duration-300"
              >
                돌아가기
              </button>
            </div>

            <div className="space-y-4">
              {STRATEGY_LESSONS.map((lesson) => {
                const getDifficultyColor = () => {
                  switch (lesson.difficulty) {
                    case '초급': return 'from-green-400/30 to-green-600/30 border-green-400/20 text-green-300';
                    case '중급': return 'from-blue-400/30 to-blue-600/30 border-blue-400/20 text-blue-300';
                    case '고급': return 'from-purple-400/30 to-purple-600/30 border-purple-400/20 text-purple-300';
                    default: return 'from-red-400/30 to-red-600/30 border-red-400/20 text-red-300';
                  }
                };

                return (
                  <div key={lesson.id} className="p-6 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10
                                                  hover:bg-black/25 hover:border-white/15 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mr-4 backdrop-blur-sm
                                       ${lesson.completed
                                         ? 'bg-green-400/20 border border-green-400/30'
                                         : `bg-gradient-to-br ${getDifficultyColor().split(' ')[0]} ${getDifficultyColor().split(' ')[1]} border ${getDifficultyColor().split(' ')[2]}`
                                       }`}>
                          {lesson.completed ? (
                            <CheckCircle size={20} className="text-green-300" />
                          ) : (
                            <Brain size={20} className={getDifficultyColor().split(' ')[3] + ' ' + getDifficultyColor().split(' ')[4]} />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-display font-semibold text-white/90 tracking-wider mb-1">{lesson.title}</h3>
                          <p className="text-sm text-white/60 font-display tracking-wide leading-relaxed mb-3">{lesson.description}</p>
                          <div className="flex items-center gap-4 text-xs">
                            <span className={`px-3 py-1 rounded-full font-display font-semibold tracking-wider
                                           ${lesson.difficulty === '초급' ? 'bg-green-400/20 text-green-300' :
                                             lesson.difficulty === '중급' ? 'bg-blue-400/20 text-blue-300' :
                                             lesson.difficulty === '고급' ? 'bg-purple-400/20 text-purple-300' :
                                             'bg-red-400/20 text-red-300'
                                           }`}>
                              {lesson.difficulty}
                            </span>
                            <span className="text-white/50 font-display tracking-wider">{lesson.duration}</span>
                          </div>
                        </div>
                      </div>
                      <button className={`px-6 py-2 rounded-xl font-display font-semibold tracking-wider
                                         active:scale-95 transition-all duration-300 ${
                        lesson.completed
                          ? 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white/80'
                          : 'bg-purple-400/20 text-purple-300 hover:bg-purple-400/30 hover:text-purple-200'
                      }`}>
                        {lesson.completed ? '복습하기' : '학습하기'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            {/* 연습 시나리오 화면 - 신비로운 헤더 */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400/30 to-orange-600/30
                              flex items-center justify-center backdrop-blur-sm border border-orange-400/20">
                  <RotateCcw size={18} className="text-orange-300" />
                </div>
                <h2 className="text-2xl font-display font-bold text-white tracking-wider">연습 시나리오</h2>
              </div>
              <button
                onClick={() => setActiveTab(null)}
                className="px-4 py-2 rounded-xl bg-black/20 backdrop-blur-md border border-white/10
                         text-white/80 font-display tracking-wider
                         hover:bg-black/30 hover:border-white/20 hover:text-white
                         active:scale-95 transition-all duration-300"
              >
                돌아가기
              </button>
            </div>

            <div className="space-y-4">
              {PRACTICE_SCENARIOS.map((scenario) => (
                <div key={scenario.id} className="p-6 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10
                                                hover:bg-black/25 hover:border-white/15 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-400/30 to-orange-600/30
                                    flex items-center justify-center mr-4 backdrop-blur-sm border border-orange-400/20">
                        <RotateCcw size={20} className="text-orange-300" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display font-semibold text-white/90 tracking-wider mb-1">{scenario.title}</h3>
                        <p className="text-sm text-white/60 font-display tracking-wide leading-relaxed mb-3">{scenario.description}</p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className={`px-3 py-1 rounded-full font-display font-semibold tracking-wider ${
                            scenario.difficulty === '초급' ? 'bg-green-400/20 text-green-300' :
                            scenario.difficulty === '중급' ? 'bg-blue-400/20 text-blue-300' :
                            'bg-purple-400/20 text-purple-300'
                          }`}>
                            {scenario.difficulty}
                          </span>
                          <span className="text-white/50 font-display tracking-wider">
                            {scenario.plays.toLocaleString()}명이 연습했어요
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="px-6 py-2 rounded-xl bg-orange-400/20 text-orange-300
                                     font-display font-semibold tracking-wider
                                     hover:bg-orange-400/30 hover:text-orange-200
                                     active:scale-95 transition-all duration-300">
                      연습하기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}