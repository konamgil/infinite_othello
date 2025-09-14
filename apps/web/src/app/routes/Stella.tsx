import React, { useState } from 'react';
import { Layout } from '../../ui/common/Layout';
import { useGameStore } from '../../store/gameStore';
import { BookOpen, Target, RotateCcw, TrendingUp, Star, Award, Calendar, ChevronRight, Brain, CheckCircle } from 'lucide-react';

const DAILY_MISSIONS = [
  {
    id: 1,
    title: '첫 수를 모서리로 시작하기',
    description: '게임을 모서리 위치에서 시작하세요',
    reward: '50 RP',
    progress: 0,
    maxProgress: 1,
    completed: false
  },
  {
    id: 2,
    title: '코너 장악하기',
    description: '게임에서 코너를 2개 이상 차지하세요',
    reward: '100 RP',
    progress: 1,
    maxProgress: 2,
    completed: false
  },
  {
    id: 3,
    title: '완벽한 승리',
    description: '상대방이 한 수도 두지 못하게 만드세요',
    reward: '200 RP + 테마',
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

  const tips = [
    "코너를 차지하는 것은 중요하지만, 그 과정에서 상대에게 너무 많은 모빌리티를 주지 않도록 주의하세요.",
    "게임 초반에는 중앙을 피하고, 상대방이 선택할 수 있는 수를 제한하는 것이 좋습니다.",
    "엣지(모서리)는 양날의 검입니다. 잘못 사용하면 상대에게 코너를 내어줄 수 있어요.",
    "게임 후반에는 모든 수를 정확히 계산해야 합니다. 한 수의 실수가 승부를 좌우할 수 있어요."
  ];

  const [currentTip] = useState(tips[Math.floor(Math.random() * tips.length)]);

  return (
    <Layout title="오델로 스텔라" showSettings>
      <div className="h-full w-full overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain">
        <div className="content-padding section-spacing pb-32">
        {!activeTab ? (
          <div>
            {/* 스텔라 인사말 */}
            <div className="card glow-effect mb-6 bg-gradient-to-br from-tower-deep-100 to-purple-900/20">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-tower-gold-300 to-purple-400 rounded-full flex items-center justify-center mr-4 animate-pulse-slow">
                  <Star size={28} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-tower-gold-300">오델로 스텔라</h3>
                  <p className="text-sm text-tower-silver-400">당신의 AI 멘토</p>
                </div>
              </div>
              <p className="text-tower-silver-300">
                안녕하세요, {player.name}님! 오델로의 세계로 안내해드릴 스텔라입니다.
                함께 전략을 배우고 실력을 향상시켜 나가요! ⭐
              </p>
            </div>

            {/* 학습 진행도 요약 */}
            <div className="card mb-6">
              <h3 className="font-bold text-tower-silver-200 mb-4">학습 진행도</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">2/4</div>
                  <div className="text-xs text-tower-silver-400">전략 강의</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">1/3</div>
                  <div className="text-xs text-tower-silver-400">데일리 미션</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">3</div>
                  <div className="text-xs text-tower-silver-400">연습 시나리오</div>
                </div>
              </div>
            </div>

            {/* 메뉴 섹션들 */}
            <div className="space-y-4">
              {/* 데일리 미션 */}
              <div
                className="card-hover"
                onClick={() => setActiveTab('missions')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-green-500 p-3 rounded-lg mr-4">
                      <Target size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-tower-silver-200">데일리 미션</h3>
                      <p className="text-sm text-tower-silver-400">
                        매일 새로운 도전 과제를 클리어하세요
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      1/3
                    </span>
                    <ChevronRight size={16} className="text-tower-silver-400" />
                  </div>
                </div>
              </div>

              {/* 전략 학습 */}
              <div
                className="card-hover"
                onClick={() => setActiveTab('strategy')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-purple-500 p-3 rounded-lg mr-4">
                      <Brain size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-tower-silver-200">전략 학습</h3>
                      <p className="text-sm text-tower-silver-400">
                        오델로 전략과 전술을 체계적으로 학습
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                      2/4
                    </span>
                    <ChevronRight size={16} className="text-tower-silver-400" />
                  </div>
                </div>
              </div>

              {/* 연습 시나리오 */}
              <div
                className="card-hover"
                onClick={() => setActiveTab('practice')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-orange-500 p-3 rounded-lg mr-4">
                      <RotateCcw size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-tower-silver-200">연습 시나리오</h3>
                      <p className="text-sm text-tower-silver-400">
                        특정 상황부터 게임을 시작해보세요
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-tower-silver-400" />
                </div>
              </div>

              {/* 기보 분석 */}
              <div className="card-hover">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-blue-500 p-3 rounded-lg mr-4">
                      <BookOpen size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-tower-silver-200">기보 분석</h3>
                      <p className="text-sm text-tower-silver-400">
                        게임을 분석하고 개선점을 찾아보세요
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-tower-silver-400" />
                </div>
              </div>
            </div>

            {/* 스텔라의 조언 */}
            <div className="card bg-gradient-to-r from-tower-deep-100 to-purple-900/20 mt-6">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-gradient-to-r from-tower-gold-400 to-purple-400 rounded-full flex items-center justify-center mr-3">
                  <span className="text-xl">💡</span>
                </div>
                <div>
                  <h4 className="font-semibold text-tower-gold-300 mb-2">
                    스텔라의 오늘의 조언
                  </h4>
                  <p className="text-sm text-tower-silver-300">
                    "{currentTip}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'missions' ? (
          <div>
            {/* 데일리 미션 화면 */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-tower-gold-300">데일리 미션</h2>
              <button
                onClick={() => setActiveTab(null)}
                className="btn-secondary px-4 py-2"
              >
                돌아가기
              </button>
            </div>

            <div className="space-y-4">
              {DAILY_MISSIONS.map((mission) => (
                <div key={mission.id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-1 ${
                        mission.completed ? 'bg-green-500' : 'bg-tower-deep-200'
                      }`}>
                        {mission.completed ? (
                          <CheckCircle size={16} className="text-white" />
                        ) : (
                          <span className="text-xs font-bold text-tower-silver-400">{mission.id}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-tower-silver-200">{mission.title}</h3>
                        <p className="text-sm text-tower-silver-400 mt-1">{mission.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-tower-gold-400 font-semibold">{mission.reward}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <div className="bg-tower-deep-200 rounded-full h-2">
                        <div
                          className="bg-tower-gold-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(mission.progress / mission.maxProgress) * 100}%` }}
                        />
                      </div>
                      <div className="text-xs text-tower-silver-400 mt-1">
                        {mission.progress} / {mission.maxProgress}
                      </div>
                    </div>
                    {mission.completed ? (
                      <span className="text-green-400 text-sm font-semibold">완료!</span>
                    ) : (
                      <button className="btn-primary px-4 py-1 text-sm">시작하기</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'strategy' ? (
          <div>
            {/* 전략 학습 화면 */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-tower-gold-300">전략 학습</h2>
              <button
                onClick={() => setActiveTab(null)}
                className="btn-secondary px-4 py-2"
              >
                돌아가기
              </button>
            </div>

            <div className="space-y-4">
              {STRATEGY_LESSONS.map((lesson) => (
                <div key={lesson.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${
                        lesson.completed ? 'bg-green-500' :
                        lesson.difficulty === '초급' ? 'bg-green-600' :
                        lesson.difficulty === '중급' ? 'bg-blue-600' :
                        lesson.difficulty === '고급' ? 'bg-purple-600' : 'bg-red-600'
                      }`}>
                        {lesson.completed ? (
                          <CheckCircle size={20} className="text-white" />
                        ) : (
                          <Brain size={20} className="text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-tower-silver-200">{lesson.title}</h3>
                        <p className="text-sm text-tower-silver-400 mt-1">{lesson.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className={`px-2 py-1 rounded ${
                            lesson.difficulty === '초급' ? 'bg-green-500/20 text-green-400' :
                            lesson.difficulty === '중급' ? 'bg-blue-500/20 text-blue-400' :
                            lesson.difficulty === '고급' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {lesson.difficulty}
                          </span>
                          <span className="text-tower-silver-400">{lesson.duration}</span>
                        </div>
                      </div>
                    </div>
                    <button className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                      lesson.completed ? 'bg-tower-silver-500 text-tower-silver-100' : 'btn-primary'
                    }`}>
                      {lesson.completed ? '복습하기' : '학습하기'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {/* 연습 시나리오 화면 */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-tower-gold-300">연습 시나리오</h2>
              <button
                onClick={() => setActiveTab(null)}
                className="btn-secondary px-4 py-2"
              >
                돌아가기
              </button>
            </div>

            <div className="space-y-4">
              {PRACTICE_SCENARIOS.map((scenario) => (
                <div key={scenario.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-orange-500 p-3 rounded-lg mr-4">
                        <RotateCcw size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-tower-silver-200">{scenario.title}</h3>
                        <p className="text-sm text-tower-silver-400 mt-1">{scenario.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className={`px-2 py-1 rounded ${
                            scenario.difficulty === '초급' ? 'bg-green-500/20 text-green-400' :
                            scenario.difficulty === '중급' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-purple-500/20 text-purple-400'
                          }`}>
                            {scenario.difficulty}
                          </span>
                          <span className="text-tower-silver-400">{scenario.plays.toLocaleString()} 플레이</span>
                        </div>
                      </div>
                    </div>
                    <button className="btn-primary px-4 py-2">
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
    </Layout>
  );
}