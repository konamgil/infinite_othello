import React, { useState } from 'react';
import { engineNeo } from 'engine-neo';

interface TestResult {
  success: boolean;
  bestMove?: { row: number; col: number };
  evaluation: number;
  depth: number;
  nodes: number;
  timeUsed: number;
  error?: string;
}

export const NeoEngineTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  // 기본 오델로 시작 보드 생성
  const createInitialBoard = () => {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    board[3][3] = 'white';
    board[3][4] = 'black';
    board[4][3] = 'black';
    board[4][4] = 'white';
    return board;
  };

  const runBasicTest = async () => {
    setIsRunning(true);
    const newResults: TestResult[] = [];

    try {
      console.log('🧪 Neo Engine 기본 테스트 시작...');

      const gameCore = {
        id: 'neo-test',
        board: createInitialBoard(),
        currentPlayer: 'black' as const,
        validMoves: [],
        score: { black: 2, white: 2 },
        status: 'playing' as const,
        moveHistory: [],
        canUndo: false,
        canRedo: false
      };

      // 테스트 1: 기본 분석
      try {
        const result = await engineNeo.analyze({
          gameCore,
          timeLimit: 1000,
          skill: 50
        });

        newResults.push({
          success: true,
          bestMove: result.bestMove,
          evaluation: result.evaluation,
          depth: result.depth,
          nodes: result.nodes,
          timeUsed: result.timeUsed
        });

        console.log('✅ 기본 분석 성공:', result);
      } catch (error) {
        newResults.push({
          success: false,
          evaluation: 0,
          depth: 0,
          nodes: 0,
          timeUsed: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        console.error('❌ 기본 분석 실패:', error);
      }

      // 테스트 2: 고난이도 분석
      try {
        const result = await engineNeo.analyze({
          gameCore,
          timeLimit: 2000,
          skill: 90
        });

        newResults.push({
          success: true,
          bestMove: result.bestMove,
          evaluation: result.evaluation,
          depth: result.depth,
          nodes: result.nodes,
          timeUsed: result.timeUsed
        });

        console.log('✅ 고난이도 분석 성공:', result);
      } catch (error) {
        newResults.push({
          success: false,
          evaluation: 0,
          depth: 0,
          nodes: 0,
          timeUsed: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        console.error('❌ 고난이도 분석 실패:', error);
      }

    } finally {
      setResults(newResults);
      setIsRunning(false);
    }
  };

  const formatMove = (move?: { row: number; col: number }) => {
    if (!move) return 'None';
    return `(${move.row}, ${move.col})`;
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🤖 Neo AI Engine Test</h1>

        <div className="mb-6">
          <p className="text-gray-300 mb-4">
            기존 시스템을 건드리지 않고 웹 환경에서 Neo 엔진 테스트
          </p>

          <button
            onClick={runBasicTest}
            disabled={isRunning}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600
                       rounded-lg font-semibold transition-colors"
          >
            {isRunning ? '🔄 테스트 실행 중...' : '🧪 Neo 엔진 테스트 시작'}
          </button>
        </div>

        {/* 엔진 정보 */}
        <div className="mb-8 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">📋 Engine Info</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Name:</span>
              <span className="ml-2 font-mono">{engineNeo.name}</span>
            </div>
            <div>
              <span className="text-gray-400">Version:</span>
              <span className="ml-2 font-mono">{engineNeo.version}</span>
            </div>
            <div>
              <span className="text-gray-400">Author:</span>
              <span className="ml-2 font-mono">{engineNeo.author}</span>
            </div>
          </div>
        </div>

        {/* 테스트 결과 */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">📊 Test Results</h2>

            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  result.success
                    ? 'bg-green-900/20 border-green-500'
                    : 'bg-red-900/20 border-red-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">
                    Test {index + 1}: {index === 0 ? '기본 분석' : '고난이도 분석'}
                  </h3>
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    result.success ? 'bg-green-600' : 'bg-red-600'
                  }`}>
                    {result.success ? '✅ PASS' : '❌ FAIL'}
                  </span>
                </div>

                {result.success ? (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">Best Move:</span>
                      <div className="font-mono text-blue-400">
                        {formatMove(result.bestMove)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Evaluation:</span>
                      <div className="font-mono text-green-400">
                        {result.evaluation}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Depth:</span>
                      <div className="font-mono text-purple-400">
                        {result.depth}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Nodes:</span>
                      <div className="font-mono text-yellow-400">
                        {result.nodes.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Time:</span>
                      <div className="font-mono text-orange-400">
                        {result.timeUsed}ms
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-400">
                    <span className="text-gray-400">Error:</span>
                    <div className="font-mono mt-1">{result.error}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 성능 요약 */}
        {results.filter(r => r.success).length > 0 && (
          <div className="mt-8 p-4 bg-gray-800 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">⚡ Performance Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Success Rate:</span>
                <div className="text-green-400 font-semibold">
                  {Math.round((results.filter(r => r.success).length / results.length) * 100)}%
                </div>
              </div>
              <div>
                <span className="text-gray-400">Avg Depth:</span>
                <div className="text-purple-400 font-semibold">
                  {(results.filter(r => r.success).reduce((sum, r) => sum + r.depth, 0) /
                    results.filter(r => r.success).length).toFixed(1)}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Avg Nodes:</span>
                <div className="text-yellow-400 font-semibold">
                  {Math.round(results.filter(r => r.success).reduce((sum, r) => sum + r.nodes, 0) /
                    results.filter(r => r.success).length).toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Avg Time:</span>
                <div className="text-orange-400 font-semibold">
                  {Math.round(results.filter(r => r.success).reduce((sum, r) => sum + r.timeUsed, 0) /
                    results.filter(r => r.success).length)}ms
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};