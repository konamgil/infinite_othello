import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Cpu, Sparkles } from 'lucide-react';

import { StellaLayout } from '../../layouts/StellaLayout';
import { GameController } from '../../../../components/game/GameController';
import { SearchWorkerManager } from '../../../../engine/core';
import { engineRegistry } from '../../../../engine/EngineRegistry';

export default function StellaPracticeGame() {
  const navigate = useNavigate();
  const [workerManager, setWorkerManager] = useState<SearchWorkerManager | null>(null);
  const [workerReady, setWorkerReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function initializeWorkerManager() {
      if (active) {
        setLoadError(null);
      }

      try {
        // Neo 엔진을 Engine Registry에 등록
        if (!engineRegistry.has('engine-neo')) {
          const neoModule = await import('../../../../engine/neo/index');
          const neoInstance = neoModule.default || neoModule.engineNeo;
          
          if (neoInstance) {
            engineRegistry.register(neoInstance, {
              id: 'engine-neo',
              name: 'Engine-Neo',
              version: '1.0.0',
              author: 'Stella Lab',
              description: 'Stella 멘토 전용 고급 AI 엔진',
              difficulty: 'expert',
              tier: 'S',
              performance: {
                avgResponseTime: 450,
                maxDepth: 12,
                nodesPerSecond: 480000,
                memoryUsage: 128,
                rating: 2400
              },
              features: ['opening_book', 'endgame_db', 'time_management', 'skill_levels', 'analysis_mode', 'multi_threading']
            });
          }
        }

        // 워커 매니저 초기화 (엔진 모듈/심볼 지정)
        const manager = new SearchWorkerManager({
          maxWorkers: Math.min(4, Math.max(1, Math.floor(navigator.hardwareConcurrency / 2))),
          workerTimeout: 30000,
          enableDistributedSearch: true,
          fallbackToSingleWorker: true,
          // 빌드 산출물 기준 경로 (public/dist 또는 public)
          // Vite dev에서는 '/search-worker.js'가 dev server에서 제공됨
          // 엔진: Zenith 번들 사용(alphaBetaSearch export)
          // 주: 경로는 배포 구조에 맞게 조정 가능
          workerURL: '/search-worker.js',
          engineModuleURL: '/engine-zenith.js',
          engineExportName: 'alphaBetaSearch'
        });

        if (active) {
          setWorkerManager(manager);
          setWorkerReady(true);
          setLoadError(null);
        }
      } catch (error) {
        console.error('[StellaPracticeGame] Failed to initialize Worker Manager', error);
        if (active) {
          setLoadError(error instanceof Error ? error.message : '워커 매니저를 초기화하지 못했습니다.');
        }
      }
    }

    initializeWorkerManager();

    return () => {
      active = false;
      if (workerManager) {
        // 워커 매니저 정리
        workerManager.terminate();
      }
    };
  }, []);

  const config = useMemo(() => ({
    mode: 'ai' as const,
    ai: {
      difficulty: 'expert' as const,
      engine: 'engine-neo', // Core Worker 시스템에서 사용하는 엔진 ID
      color: 'white' as const
    },
    special: {
      allowUndo: true,
      showValidMoves: true
    },
    // Worker 기반 설정 추가
    worker: {
      enabled: true,
      distributedSearch: true,
      maxWorkers: 4
    }
  }), []);

  return (
    <StellaLayout detail>
      <div className="flex flex-col gap-4 pb-8 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400/20 to-blue-500/20 flex items-center justify-center border border-purple-400/30">
              <Cpu size={18} className="text-purple-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white/90">Neo 엔진 연습전</h2>
              <p className="text-xs text-white/60">Stella의 추천 엔진과 즉시 실전 감각을 키워보세요.</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/stella/practice')}
            className="px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-sm hover:bg-white/15 hover:text-white/85 active:scale-95 transition-all duration-300"
          >
            <span className="inline-flex items-center gap-1">
              <ArrowLeft size={16} />
              돌아가기
            </span>
          </button>
        </div>

        <div className="rounded-2xl bg-black/25 border border-white/10 p-4 space-y-2">
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <Sparkles size={16} className="text-emerald-300" />
            <span>Neo 엔진은 스텔라의 최고 난이도 전략을 기반으로 합니다.</span>
          </div>
          <div className="text-xs text-white/50">
            Stella의 고급 AI 엔진으로 실전 감각을 키우세요. AI 분석에는 최대 5초가 소요될 수 있습니다.
          </div>
        </div>

        {!workerReady && !loadError && (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
            <div className="text-center space-y-2 py-10 px-6">
              <div className="text-sm text-white/70">Neo 엔진을 초기화하는 중...</div>
              <div className="text-xs text-white/40">고급 AI 분석 시스템을 준비하고 있습니다.</div>
            </div>
          </div>
        )}

        {loadError && (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            {loadError}
          </div>
        )}

        {workerReady && !loadError && workerManager && (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 shadow-lg">
            <GameController
              config={config}
              ui={{ className: 'stella-practice-game' }}
            />
          </div>
        )}
      </div>
    </StellaLayout>
  );
}
