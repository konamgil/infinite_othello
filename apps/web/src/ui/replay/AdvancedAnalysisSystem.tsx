import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Brain, TrendingUp, Target, Zap, Eye, BarChart3,
  Layers, Move, ChevronUp, ChevronDown, Maximize2,
  Minimize2, Settings, Filter, Pin, PinOff,
  RotateCcw, Play, Pause, ChevronLeft, ChevronRight,
  Info, HelpCircle, Lightbulb, AlertTriangle, CheckCircle
} from 'lucide-react';

/* ──────────────────────────────────────────────────────────────────
   Types & Interfaces
   ────────────────────────────────────────────────────────────────── */

export interface AnalysisData {
  moveNumber: number;
  evaluation: number;
  mobility: {
    current: number;
    potential: number;
    restricted: number;
  };
  frontier: {
    edgeCount: number;
    stability: number;
    weakSpots: Array<{ x: number; y: number; risk: number }>;
  };
  parity: {
    currentParity: 'even' | 'odd';
    parityAdvantage: number;
    tempoControl: number;
  };
  legalMoves: Array<{
    x: number;
    y: number;
    score: number;
    category: 'best' | 'good' | 'neutral' | 'bad' | 'terrible';
    reasoning: string;
  }>;
  whatIf?: {
    alternativeMove: { x: number; y: number };
    projectedOutcome: number;
    explanation: string;
  };
}

export interface AnalysisUIState {
  activePanel: 'mobility' | 'frontier' | 'parity' | 'moves' | 'simulation' | null;
  panelHeight: 'minimal' | 'compact' | 'expanded' | 'full';
  isPinned: boolean;
  showOverlays: boolean;
  overlayMode: 'scores' | 'heatmap' | 'mobility' | 'frontier' | null;
  simulationActive: boolean;
}

interface AdvancedAnalysisSystemProps {
  analysisData: AnalysisData | null;
  currentMoveIndex: number;
  totalMoves: number;
  boardSize: { width: number; height: number };
  onMoveSelect: (moveIndex: number) => void;
  onBoardOverlay: (mode: string | null) => void;
  onSimulationToggle: (active: boolean) => void;
  className?: string;
}

/* ──────────────────────────────────────────────────────────────────
   Advanced Analysis System Component
   ────────────────────────────────────────────────────────────────── */

export function AdvancedAnalysisSystem({
  analysisData,
  currentMoveIndex,
  totalMoves,
  boardSize,
  onMoveSelect,
  onBoardOverlay,
  onSimulationToggle,
  className = ''
}: AdvancedAnalysisSystemProps) {
  // UI State Management
  const [uiState, setUIState] = useState<AnalysisUIState>({
    activePanel: null,
    panelHeight: 'minimal',
    isPinned: false,
    showOverlays: false,
    overlayMode: null,
    simulationActive: false
  });

  // Panel height presets for different screen sizes
  const heightPresets = {
    minimal: 'h-16 sm:h-20',        // Just the tabs bar
    compact: 'h-32 sm:h-40',        // Key metrics visible
    expanded: 'h-48 sm:h-56 lg:h-64', // Full content visible
    full: 'h-[60vh] sm:h-[50vh]'     // Maximum analysis space
  };

  // Dynamic height calculation based on content and screen size
  const panelHeight = useMemo(() => {
    if (!uiState.activePanel) return heightPresets.minimal;

    // Mobile: More conservative heights to preserve board space
    if (window.innerWidth < 1024) {
      return uiState.panelHeight === 'full' ? 'h-[50vh]' : heightPresets[uiState.panelHeight];
    }

    // Desktop: Can use more space
    return heightPresets[uiState.panelHeight];
  }, [uiState.activePanel, uiState.panelHeight]);

  // Panel state handlers
  const togglePanel = (panel: AnalysisUIState['activePanel']) => {
    if (uiState.activePanel === panel) {
      // Close panel if clicking active tab
      setUIState(prev => ({ ...prev, activePanel: null, panelHeight: 'minimal' }));
    } else {
      // Open new panel with appropriate height
      const newHeight = panel === 'simulation' ? 'expanded' : 'compact';
      setUIState(prev => ({
        ...prev,
        activePanel: panel,
        panelHeight: newHeight,
        simulationActive: panel === 'simulation' ? true : prev.simulationActive
      }));
    }
  };

  const adjustHeight = (direction: 'up' | 'down') => {
    const heights: Array<AnalysisUIState['panelHeight']> = ['minimal', 'compact', 'expanded', 'full'];
    const currentIndex = heights.indexOf(uiState.panelHeight);

    let newIndex;
    if (direction === 'up' && currentIndex < heights.length - 1) {
      newIndex = currentIndex + 1;
    } else if (direction === 'down' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else {
      return;
    }

    const newHeight = heights[newIndex];
    setUIState(prev => ({ ...prev, panelHeight: newHeight }));
  };

  const toggleOverlay = (mode: AnalysisUIState['overlayMode']) => {
    const newMode = uiState.overlayMode === mode ? null : mode;
    setUIState(prev => ({ ...prev, overlayMode: newMode, showOverlays: !!newMode }));
    onBoardOverlay(newMode);
  };

  // Get analysis category info
  const getAnalysisCategory = (evaluation: number) => {
    if (evaluation >= 50) return { color: 'text-green-400', bg: 'bg-green-400/20', icon: CheckCircle, label: 'Excellent' };
    if (evaluation >= 20) return { color: 'text-blue-400', bg: 'bg-blue-400/20', icon: TrendingUp, label: 'Good' };
    if (evaluation >= -10) return { color: 'text-yellow-400', bg: 'bg-yellow-400/20', icon: Eye, label: 'Inaccuracy' };
    if (evaluation >= -30) return { color: 'text-orange-400', bg: 'bg-orange-400/20', icon: AlertTriangle, label: 'Mistake' };
    return { color: 'text-red-400', bg: 'bg-red-400/20', icon: AlertTriangle, label: 'Blunder' };
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ${className}`}>
      {/* Sliding Analysis Panel */}
      <div
        className={`bg-black/40 backdrop-blur-md border-t border-white/20 transition-all duration-300 ${panelHeight} overflow-hidden`}
        style={{
          borderTopLeftRadius: '1.5rem',
          borderTopRightRadius: '1.5rem'
        }}
      >
        {/* Panel Header with Tabs */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/10">
          {/* Analysis Tabs */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => togglePanel('mobility')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                uiState.activePanel === 'mobility'
                  ? 'bg-purple-400/30 text-purple-200 border border-purple-400/50'
                  : 'bg-white/10 text-white/70 hover:bg-white/15'
              }`}
            >
              <Move size={16} />
              <span className="hidden sm:inline font-display text-sm">이동성</span>
            </button>

            <button
              onClick={() => togglePanel('frontier')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                uiState.activePanel === 'frontier'
                  ? 'bg-blue-400/30 text-blue-200 border border-blue-400/50'
                  : 'bg-white/10 text-white/70 hover:bg-white/15'
              }`}
            >
              <Layers size={16} />
              <span className="hidden sm:inline font-display text-sm">경계</span>
            </button>

            <button
              onClick={() => togglePanel('parity')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                uiState.activePanel === 'parity'
                  ? 'bg-green-400/30 text-green-200 border border-green-400/50'
                  : 'bg-white/10 text-white/70 hover:bg-white/15'
              }`}
            >
              <Target size={16} />
              <span className="hidden sm:inline font-display text-sm">패리티</span>
            </button>

            <button
              onClick={() => togglePanel('moves')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                uiState.activePanel === 'moves'
                  ? 'bg-yellow-400/30 text-yellow-200 border border-yellow-400/50'
                  : 'bg-white/10 text-white/70 hover:bg-white/15'
              }`}
            >
              <BarChart3 size={16} />
              <span className="hidden sm:inline font-display text-sm">수 평가</span>
            </button>

            <button
              onClick={() => togglePanel('simulation')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                uiState.activePanel === 'simulation'
                  ? 'bg-cyan-400/30 text-cyan-200 border border-cyan-400/50'
                  : 'bg-white/10 text-white/70 hover:bg-white/15'
              }`}
            >
              <Brain size={16} />
              <span className="hidden sm:inline font-display text-sm">시뮬레이션</span>
            </button>
          </div>

          {/* Panel Controls */}
          <div className="flex items-center gap-2">
            {/* Height Adjustment */}
            {uiState.activePanel && (
              <div className="flex flex-col">
                <button
                  onClick={() => adjustHeight('up')}
                  className="w-6 h-3 bg-white/10 hover:bg-white/20 rounded-t border border-white/20 border-b-0
                           flex items-center justify-center transition-all"
                  disabled={uiState.panelHeight === 'full'}
                >
                  <ChevronUp size={12} className="text-white/60" />
                </button>
                <button
                  onClick={() => adjustHeight('down')}
                  className="w-6 h-3 bg-white/10 hover:bg-white/20 rounded-b border border-white/20 border-t-0
                           flex items-center justify-center transition-all"
                  disabled={uiState.panelHeight === 'minimal'}
                >
                  <ChevronDown size={12} className="text-white/60" />
                </button>
              </div>
            )}

            {/* Pin/Unpin Panel */}
            <button
              onClick={() => setUIState(prev => ({ ...prev, isPinned: !prev.isPinned }))}
              className={`w-8 h-8 rounded-lg transition-all ${
                uiState.isPinned
                  ? 'bg-purple-400/30 text-purple-200 border border-purple-400/50'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {uiState.isPinned ? <Pin size={14} /> : <PinOff size={14} />}
            </button>
          </div>
        </div>

        {/* Panel Content */}
        {uiState.activePanel && analysisData && (
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
            {/* Mobility Analysis */}
            {uiState.activePanel === 'mobility' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold text-white flex items-center gap-2">
                    <Move size={18} className="text-purple-400" />
                    이동성 분석
                  </h3>
                  <button
                    onClick={() => toggleOverlay('mobility')}
                    className={`px-3 py-1 rounded-lg text-xs font-display transition-all ${
                      uiState.overlayMode === 'mobility'
                        ? 'bg-purple-400/30 text-purple-200 border border-purple-400/50'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    오버레이
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-black/20 rounded-xl border border-white/10">
                    <div className="text-lg font-display font-bold text-purple-400">
                      {analysisData.mobility.current}
                    </div>
                    <div className="text-xs text-white/60 font-display">현재 이동성</div>
                  </div>
                  <div className="p-3 bg-black/20 rounded-xl border border-white/10">
                    <div className="text-lg font-display font-bold text-blue-400">
                      {analysisData.mobility.potential}
                    </div>
                    <div className="text-xs text-white/60 font-display">잠재 이동성</div>
                  </div>
                  <div className="p-3 bg-black/20 rounded-xl border border-white/10">
                    <div className="text-lg font-display font-bold text-orange-400">
                      {analysisData.mobility.restricted}
                    </div>
                    <div className="text-xs text-white/60 font-display">제한된 수</div>
                  </div>
                </div>
              </div>
            )}

            {/* Frontier Analysis */}
            {uiState.activePanel === 'frontier' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold text-white flex items-center gap-2">
                    <Layers size={18} className="text-blue-400" />
                    경계 분석
                  </h3>
                  <button
                    onClick={() => toggleOverlay('frontier')}
                    className={`px-3 py-1 rounded-lg text-xs font-display transition-all ${
                      uiState.overlayMode === 'frontier'
                        ? 'bg-blue-400/30 text-blue-200 border border-blue-400/50'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    오버레이
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-black/20 rounded-xl border border-white/10">
                    <div className="text-lg font-display font-bold text-blue-400">
                      {analysisData.frontier.edgeCount}
                    </div>
                    <div className="text-xs text-white/60 font-display">경계 디스크</div>
                  </div>
                  <div className="p-3 bg-black/20 rounded-xl border border-white/10">
                    <div className="text-lg font-display font-bold text-green-400">
                      {analysisData.frontier.stability}%
                    </div>
                    <div className="text-xs text-white/60 font-display">안정성</div>
                  </div>
                </div>

                {analysisData.frontier.weakSpots.length > 0 && (
                  <div className="p-3 bg-red-400/10 rounded-xl border border-red-400/30">
                    <h4 className="font-display font-semibold text-red-300 mb-2 flex items-center gap-2">
                      <AlertTriangle size={14} />
                      취약점
                    </h4>
                    <div className="space-y-1">
                      {analysisData.frontier.weakSpots.slice(0, 3).map((spot, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-white/80 font-display">
                            {String.fromCharCode(65 + spot.x)}{spot.y + 1}
                          </span>
                          <span className="text-red-300 font-display">위험도 {spot.risk}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Parity Analysis */}
            {uiState.activePanel === 'parity' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold text-white flex items-center gap-2">
                    <Target size={18} className="text-green-400" />
                    패리티 분석
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-black/20 rounded-xl border border-white/10">
                    <div className="text-lg font-display font-bold text-green-400">
                      {analysisData.parity.currentParity === 'even' ? '짝수' : '홀수'}
                    </div>
                    <div className="text-xs text-white/60 font-display">현재 패리티</div>
                  </div>
                  <div className="p-3 bg-black/20 rounded-xl border border-white/10">
                    <div className="text-lg font-display font-bold text-cyan-400">
                      {analysisData.parity.parityAdvantage > 0 ? '+' : ''}{analysisData.parity.parityAdvantage}
                    </div>
                    <div className="text-xs text-white/60 font-display">패리티 우위</div>
                  </div>
                </div>

                <div className="p-3 bg-black/20 rounded-xl border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-display text-white/80">템포 제어</span>
                    <span className="text-sm font-display font-semibold text-purple-400">
                      {analysisData.parity.tempoControl}%
                    </span>
                  </div>
                  <div className="bg-white/10 rounded-full h-2">
                    <div
                      className="bg-purple-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(0, analysisData.parity.tempoControl)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Move Evaluation */}
            {uiState.activePanel === 'moves' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold text-white flex items-center gap-2">
                    <BarChart3 size={18} className="text-yellow-400" />
                    착수 평가
                  </h3>
                  <button
                    onClick={() => toggleOverlay('scores')}
                    className={`px-3 py-1 rounded-lg text-xs font-display transition-all ${
                      uiState.overlayMode === 'scores'
                        ? 'bg-yellow-400/30 text-yellow-200 border border-yellow-400/50'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    스코어 표시
                  </button>
                </div>

                {/* Current Move Quality */}
                {(() => {
                  const category = getAnalysisCategory(analysisData.evaluation);
                  const Icon = category.icon;
                  return (
                    <div className={`p-3 ${category.bg} rounded-xl border border-white/10`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black/20 rounded-xl flex items-center justify-center">
                          <Icon size={18} className={category.color} />
                        </div>
                        <div>
                          <div className={`font-display font-bold ${category.color}`}>
                            {category.label}
                          </div>
                          <div className="text-xs text-white/60 font-display">
                            평가: {analysisData.evaluation > 0 ? '+' : ''}{analysisData.evaluation}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Legal Moves List */}
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {analysisData.legalMoves.slice(0, 5).map((move, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-black/20 rounded-lg border border-white/10">
                      <span className="text-sm text-white/80 font-display">
                        {String.fromCharCode(65 + move.x)}{move.y + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-display font-semibold ${
                          move.category === 'best' ? 'text-green-400' :
                          move.category === 'good' ? 'text-blue-400' :
                          move.category === 'neutral' ? 'text-yellow-400' :
                          move.category === 'bad' ? 'text-orange-400' : 'text-red-400'
                        }`}>
                          {move.score > 0 ? '+' : ''}{move.score}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${
                          move.category === 'best' ? 'bg-green-400' :
                          move.category === 'good' ? 'bg-blue-400' :
                          move.category === 'neutral' ? 'bg-yellow-400' :
                          move.category === 'bad' ? 'bg-orange-400' : 'bg-red-400'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Simulation Panel */}
            {uiState.activePanel === 'simulation' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold text-white flex items-center gap-2">
                    <Brain size={18} className="text-cyan-400" />
                    What-If 시뮬레이션
                  </h3>
                  <button
                    onClick={() => {
                      const newActive = !uiState.simulationActive;
                      setUIState(prev => ({ ...prev, simulationActive: newActive }));
                      onSimulationToggle(newActive);
                    }}
                    className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-display transition-all ${
                      uiState.simulationActive
                        ? 'bg-cyan-400/30 text-cyan-200 border border-cyan-400/50'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {uiState.simulationActive ? <Pause size={12} /> : <Play size={12} />}
                    {uiState.simulationActive ? '비활성화' : '활성화'}
                  </button>
                </div>

                {uiState.simulationActive ? (
                  <div className="p-3 bg-cyan-400/10 rounded-xl border border-cyan-400/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb size={16} className="text-cyan-400" />
                      <span className="font-display font-semibold text-cyan-300">시뮬레이션 모드 활성</span>
                    </div>
                    <p className="text-sm text-white/80 font-display leading-relaxed">
                      보드의 빈 칸을 클릭하여 "만약 여기에 두었다면?" 시나리오를 확인하세요.
                      AI가 해당 수의 예상 결과를 실시간으로 분석합니다.
                    </p>

                    {analysisData.whatIf && (
                      <div className="mt-3 p-3 bg-black/20 rounded-lg border border-white/10">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-display text-white/80">
                            만약 {String.fromCharCode(65 + analysisData.whatIf.alternativeMove.x)}{analysisData.whatIf.alternativeMove.y + 1}에 두었다면
                          </span>
                          <span className={`text-sm font-display font-semibold ${
                            analysisData.whatIf.projectedOutcome > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {analysisData.whatIf.projectedOutcome > 0 ? '+' : ''}{analysisData.whatIf.projectedOutcome}
                          </span>
                        </div>
                        <p className="text-xs text-white/70 font-display">
                          {analysisData.whatIf.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-black/20 rounded-xl border border-white/10 text-center">
                    <Brain size={24} className="text-white/40 mx-auto mb-2" />
                    <p className="text-sm text-white/60 font-display">
                      시뮬레이션을 활성화하여 대안적인 수를 탐색해보세요
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Board Overlay Indicator */}
      {uiState.showOverlays && uiState.overlayMode && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/20 rounded-full">
            <span className="text-sm font-display text-white/90">
              {uiState.overlayMode === 'scores' && '📊 착수 점수 표시'}
              {uiState.overlayMode === 'mobility' && '🏃 이동성 표시'}
              {uiState.overlayMode === 'frontier' && '🛡️ 경계 분석 표시'}
              {uiState.overlayMode === 'heatmap' && '🔥 히트맵 표시'}
            </span>
          </div>
        </div>
      )}

      {/* Drag Handle for Manual Resize */}
      {uiState.activePanel && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1">
          <div className="w-12 h-1 bg-white/30 rounded-full" />
        </div>
      )}
    </div>
  );
}

export default AdvancedAnalysisSystem;