import React, { useState } from 'react';
import { AdvancedReplayViewer } from './AdvancedReplayViewer';
import { GameReplay } from '../../types/replay';

/* ──────────────────────────────────────────────────────────────────
   Integration Example Component
   ────────────────────────────────────────────────────────────────── */

/**
 * Example showing how to integrate the Advanced Analysis System
 * into your existing replay functionality.
 *
 * This replaces the current ReplayViewer component usage.
 */

interface ReplayIntegrationExampleProps {
  // Your existing props
  selectedReplay: GameReplay | null;
  onCloseReplay: () => void;

  // Optional: Enhanced features
  enableAdvancedAnalysis?: boolean;
  analysisServiceEndpoint?: string;
}

export function ReplayIntegrationExample({
  selectedReplay,
  onCloseReplay,
  enableAdvancedAnalysis = true,
  analysisServiceEndpoint
}: ReplayIntegrationExampleProps) {
  const [isAdvancedMode, setIsAdvancedMode] = useState(enableAdvancedAnalysis);

  // If no replay selected, don't render anything
  if (!selectedReplay) {
    return null;
  }

  // Choose which viewer to render based on mode
  if (isAdvancedMode) {
    return (
      <AdvancedReplayViewer
        gameReplay={selectedReplay}
        onClose={onCloseReplay}
      />
    );
  }

  // Fallback to your existing ReplayViewer if needed
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-white rounded-lg p-4 max-w-md">
        <h3 className="text-lg font-bold mb-4">Basic Replay Mode</h3>
        <p className="mb-4">Advanced analysis features are disabled.</p>
        <button
          onClick={() => setIsAdvancedMode(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
        >
          Enable Advanced Analysis
        </button>
        <button
          onClick={onCloseReplay}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   How to Replace Your Existing ReplayViewer Usage
   ────────────────────────────────────────────────────────────────── */

/**
 * BEFORE (in your replay page):
 *
 * {uiState.selectedReplay && (
 *   <ReplayViewer
 *     gameReplay={uiState.selectedReplay}
 *     onClose={() => setSelectedReplay(null)}
 *   />
 * )}
 *
 * AFTER (updated usage):
 *
 * {uiState.selectedReplay && (
 *   <AdvancedReplayViewer
 *     gameReplay={uiState.selectedReplay}
 *     onClose={() => setSelectedReplay(null)}
 *   />
 * )}
 *
 * That's it! The new system is fully backward compatible
 * and provides all the advanced analysis features.
 */

/* ──────────────────────────────────────────────────────────────────
   Progressive Enhancement Example
   ────────────────────────────────────────────────────────────────── */

/**
 * You can also use feature detection to progressively enhance
 * the replay experience based on device capabilities:
 */

export function ProgressiveReplayViewer({
  gameReplay,
  onClose
}: {
  gameReplay: GameReplay;
  onClose: () => void;
}) {
  // Detect device capabilities
  const hasAdvancedFeatures = useMemo(() => {
    // Check for touch support
    const hasTouch = 'ontouchstart' in window;

    // Check for performance capabilities
    const hasGoodPerformance = navigator.hardwareConcurrency > 2;

    // Check screen size
    const hasLargeScreen = window.innerWidth >= 768;

    // Enable advanced features for capable devices
    return hasGoodPerformance && (hasLargeScreen || hasTouch);
  }, []);

  if (hasAdvancedFeatures) {
    return (
      <AdvancedReplayViewer
        gameReplay={gameReplay}
        onClose={onClose}
      />
    );
  }

  // Fallback to simpler version for low-end devices
  return (
    <SimpleReplayViewer
      gameReplay={gameReplay}
      onClose={onClose}
    />
  );
}

// Simple viewer for low-end devices (you can keep your existing ReplayViewer)
function SimpleReplayViewer({
  gameReplay,
  onClose
}: {
  gameReplay: GameReplay;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="bg-black/40 backdrop-blur-sm border border-white/20 rounded-2xl p-6 max-w-md">
        <h3 className="text-lg font-display font-bold text-white mb-4">
          📱 간소화된 리플레이
        </h3>
        <p className="text-sm text-white/70 mb-4">
          현재 기기에서는 기본 리플레이 기능을 제공합니다.
        </p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-purple-400/20 text-purple-300 rounded-lg hover:bg-purple-400/30 transition-all"
        >
          닫기
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Custom Hook for Analysis Data
   ────────────────────────────────────────────────────────────────── */

/**
 * If you want to provide real analysis data instead of mock data,
 * you can create a custom hook like this:
 */

export function useAnalysisData(gameReplay: GameReplay, moveIndex: number) {
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Only fetch if we don't have data for this move
    if (!analysisData || analysisData.moveNumber !== moveIndex + 1) {
      setIsLoading(true);

      // Replace with your actual analysis service
      fetchAnalysisForMove(gameReplay.id, moveIndex)
        .then(data => {
          setAnalysisData(data);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Failed to fetch analysis:', error);
          setIsLoading(false);
        });
    }
  }, [gameReplay.id, moveIndex]);

  return { analysisData, isLoading };
}

// Mock analysis service - replace with your actual API
async function fetchAnalysisForMove(gameId: string, moveIndex: number) {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));

  // Return mock data - replace with actual analysis
  return {
    moveNumber: moveIndex + 1,
    evaluation: Math.random() * 100 - 50,
    mobility: {
      current: Math.floor(Math.random() * 15) + 5,
      potential: Math.floor(Math.random() * 20) + 10,
      restricted: Math.floor(Math.random() * 8) + 2
    },
    // ... other analysis data
  };
}

/* ──────────────────────────────────────────────────────────────────
   Migration Guide
   ────────────────────────────────────────────────────────────────── */

/**
 * STEP-BY-STEP MIGRATION:
 *
 * 1. Import the new component:
 *    import { AdvancedReplayViewer } from './ui/replay/AdvancedReplayViewer';
 *
 * 2. Replace your existing ReplayViewer usage:
 *    - Change component name from ReplayViewer to AdvancedReplayViewer
 *    - Keep all existing props (gameReplay, onClose)
 *    - No breaking changes!
 *
 * 3. Test the new features:
 *    - Mobile board visibility
 *    - Analysis panels
 *    - Board overlays
 *    - Simulation mode
 *
 * 4. Optional enhancements:
 *    - Connect real analysis data via useAnalysisData hook
 *    - Add custom analysis service endpoint
 *    - Implement progressive enhancement based on device capabilities
 *
 * 5. Remove old components (when confident):
 *    - Keep ReplayViewer.tsx as fallback if needed
 *    - Update imports throughout your codebase
 *    - Test thoroughly on mobile devices
 */

export default ReplayIntegrationExample;