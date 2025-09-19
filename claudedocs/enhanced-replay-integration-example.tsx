// Example of how to integrate the enhanced replay system into the existing replay page
// This shows the minimal changes needed to use the new enhanced features

// File: apps/web/src/features/more/pages/replay/page.tsx (modified sections)

import { EnhancedReplayViewer } from '../../../../ui/replay/EnhancedReplayViewer';

// ... existing imports and code ...

export default function ReplayPage() {
  // ... existing state and logic ...

  // Add enhanced replay toggle
  const [useEnhancedReplay, setUseEnhancedReplay] = useState(true);

  return (
    <div className="h-full w-full overflow-hidden relative">
      {/* ... existing content ... */}

      {/* Enhanced toggle in header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* ... existing header content ... */}
        </div>

        {/* Add enhanced replay toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setUseEnhancedReplay(!useEnhancedReplay)}
            className={`px-3 py-2 rounded-lg text-xs transition-all ${
              useEnhancedReplay
                ? 'bg-purple-500/20 border border-purple-400/30 text-purple-300'
                : 'bg-white/10 border border-white/20 text-white/60'
            }`}
          >
            🚀 고급 분석
          </button>
        </div>
      </div>

      {/* ... existing content ... */}

      {/* Modified replay viewer modal */}
      {uiState.selectedReplay && (
        <>
          {useEnhancedReplay ? (
            <EnhancedReplayViewer
              gameReplay={uiState.selectedReplay}
              onClose={() => setSelectedReplay(null)}
            />
          ) : (
            <ReplayViewer
              gameReplay={uiState.selectedReplay}
              onClose={() => setSelectedReplay(null)}
            />
          )}
        </>
      )}

      {/* ... rest of existing content ... */}
    </div>
  );
}

// ---

// Example of standalone enhanced replay controls usage
// File: apps/web/src/ui/replay/StandaloneEnhancedControls.tsx

import React, { useState, useEffect } from 'react';
import { ReplayControls } from './ReplayControls';
import { useReplaySounds } from '../../hooks/useReplaySounds';
import { generateEvaluationGraph } from '../../utils/moveAnalysis';
import { GameReplay } from '../../types/replay';

interface StandaloneEnhancedControlsProps {
  gameReplay: GameReplay;
  onMoveChange?: (moveIndex: number) => void;
}

export function StandaloneEnhancedControls({
  gameReplay,
  onMoveChange
}: StandaloneEnhancedControlsProps) {
  // Basic state
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  // Enhanced features
  const [autoPlay, setAutoPlay] = useState(false);
  const [showMoveAnnotations, setShowMoveAnnotations] = useState(true);
  const [criticalMoveDetection, setCriticalMoveDetection] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [highlightLastMove, setHighlightLastMove] = useState(true);

  // Sound system
  const { sounds } = useReplaySounds({
    enabled: soundEnabled,
    volume: 0.3
  });

  // Evaluation data
  const evaluationData = generateEvaluationGraph(gameReplay.moves);

  // Notify parent of move changes
  useEffect(() => {
    onMoveChange?.(currentMoveIndex);
  }, [currentMoveIndex, onMoveChange]);

  // Auto-play logic
  useEffect(() => {
    if (!isPlaying || gameReplay.moves.length === 0) return;
    if (currentMoveIndex >= gameReplay.moves.length - 1) {
      setIsPlaying(false);
      return;
    }

    const interval = setInterval(() => {
      setCurrentMoveIndex(prev => {
        const next = prev + 1;
        if (next >= gameReplay.moves.length) {
          setIsPlaying(false);
          return prev;
        }
        if (soundEnabled) sounds.playMove();
        return next;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, currentMoveIndex, gameReplay.moves.length, playbackSpeed, soundEnabled, sounds]);

  // Handlers
  const handlePlay = () => {
    setIsPlaying(true);
    if (soundEnabled) sounds.playStart();
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (soundEnabled) sounds.playPause();
  };

  const handleStepForward = () => {
    if (currentMoveIndex < gameReplay.moves.length - 1) {
      setCurrentMoveIndex(prev => prev + 1);
      setIsPlaying(false);
      if (soundEnabled) sounds.stepForward();
    }
  };

  const handleStepBackward = () => {
    if (currentMoveIndex > 0) {
      setCurrentMoveIndex(prev => prev - 1);
      setIsPlaying(false);
      if (soundEnabled) sounds.stepBackward();
    }
  };

  const handleSeek = (index: number) => {
    setCurrentMoveIndex(Math.max(0, Math.min(index, gameReplay.moves.length)));
    setIsPlaying(false);
  };

  const handleJumpToMove = (moveIndex: number) => {
    setCurrentMoveIndex(moveIndex);
    setIsPlaying(false);
    if (soundEnabled) sounds.jumpToMove();
  };

  return (
    <ReplayControls
      currentMoveIndex={currentMoveIndex}
      totalMoves={gameReplay.moves.length}
      isPlaying={isPlaying}
      playbackSpeed={playbackSpeed}
      onPlay={handlePlay}
      onPause={handlePause}
      onStepForward={handleStepForward}
      onStepBackward={handleStepBackward}
      onSeek={handleSeek}
      onSpeedChange={setPlaybackSpeed}
      onToggleSettings={() => setShowSettings(!showSettings)}
      showSettings={showSettings}
      onToggleCoordinates={() => setShowCoordinates(!showCoordinates)}
      onToggleHighlight={() => setHighlightLastMove(!highlightLastMove)}
      showCoordinates={showCoordinates}
      highlightLastMove={highlightLastMove}
      // Enhanced features
      moves={gameReplay.moves}
      autoPlay={autoPlay}
      onToggleAutoPlay={() => setAutoPlay(!autoPlay)}
      onJumpToMove={handleJumpToMove}
      showMoveAnnotations={showMoveAnnotations}
      onToggleMoveAnnotations={() => setShowMoveAnnotations(!showMoveAnnotations)}
      criticalMoveDetection={criticalMoveDetection}
      onToggleCriticalMoves={() => setCriticalMoveDetection(!criticalMoveDetection)}
      soundEnabled={soundEnabled}
      onToggleSound={() => setSoundEnabled(!soundEnabled)}
      evaluationData={evaluationData}
    />
  );
}