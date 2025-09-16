import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Settings,
  Eye,
  EyeOff,
  Target,
  Zap
} from 'lucide-react';
import { ReplayPlayerControls } from '../../types/replay';

interface ReplayControlsProps {
  currentMoveIndex: number;
  totalMoves: number;
  isPlaying: boolean;
  playbackSpeed: ReplayPlayerControls['playbackSpeed'];
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onSeek: (index: number) => void;
  onSpeedChange: (speed: ReplayPlayerControls['playbackSpeed']) => void;
  onToggleSettings: () => void;
  showSettings: boolean;
  onToggleCoordinates: () => void;
  onToggleHighlight: () => void;
  showCoordinates: boolean;
  highlightLastMove: boolean;
}

export function ReplayControls({
  currentMoveIndex,
  totalMoves,
  isPlaying,
  playbackSpeed,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  onSeek,
  onSpeedChange,
  onToggleSettings,
  showSettings,
  onToggleCoordinates,
  onToggleHighlight,
  showCoordinates,
  highlightLastMove
}: ReplayControlsProps) {

  const speedOptions: ReplayPlayerControls['playbackSpeed'][] = [0.5, 1, 1.5, 2, 3];

  const handleSeekBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    onSeek(value);
  };

  const formatMoveDisplay = () => {
    return `${currentMoveIndex} / ${totalMoves}`;
  };

  const getSpeedDisplay = (speed: number) => {
    return speed === 1 ? '1×' : `${speed}×`;
  };

  return (
    <div className="p-4">
      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-4 p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10">
          <h4 className="text-sm font-semibold text-white/90 mb-3 font-smooth">재생 설정</h4>

          <div className="grid grid-cols-2 gap-4">
            {/* Display Options */}
            <div>
              <h5 className="text-xs font-medium text-white/70 mb-2 font-smooth">표시 옵션</h5>
              <div className="space-y-2">
                <button
                  onClick={onToggleCoordinates}
                  className={`w-full p-2 rounded-lg border transition-all duration-200 ${
                    showCoordinates
                      ? 'bg-blue-500/20 border-blue-400/30 text-blue-300'
                      : 'bg-black/20 border-white/10 text-white/60 hover:bg-black/30'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <Eye size={12} />
                    <span className="font-smooth">좌표 표시</span>
                  </div>
                </button>

                <button
                  onClick={onToggleHighlight}
                  className={`w-full p-2 rounded-lg border transition-all duration-200 ${
                    highlightLastMove
                      ? 'bg-yellow-500/20 border-yellow-400/30 text-yellow-300'
                      : 'bg-black/20 border-white/10 text-white/60 hover:bg-black/30'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <Target size={12} />
                    <span className="font-smooth">마지막 수 강조</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Speed Settings */}
            <div>
              <h5 className="text-xs font-medium text-white/70 mb-2 font-smooth">재생 속도</h5>
              <div className="grid grid-cols-3 gap-1">
                {speedOptions.map(speed => (
                  <button
                    key={speed}
                    onClick={() => onSpeedChange(speed)}
                    className={`p-2 rounded-lg border transition-all duration-200 ${
                      playbackSpeed === speed
                        ? 'bg-purple-500/20 border-purple-400/30 text-purple-300'
                        : 'bg-black/20 border-white/10 text-white/60 hover:bg-black/30'
                    }`}
                  >
                    <div className="text-xs font-smooth">{getSpeedDisplay(speed)}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Controls */}
      <div className="flex items-center gap-4">
        {/* Step Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={onStepBackward}
            disabled={currentMoveIndex <= 0}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors
                     disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} className="text-white/80" />
          </button>

          <button
            onClick={() => onSeek(0)}
            disabled={currentMoveIndex <= 0}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors
                     disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <SkipBack size={18} className="text-white/80" />
          </button>
        </div>

        {/* Play/Pause */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={currentMoveIndex >= totalMoves}
          className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500
                   hover:from-purple-600 hover:to-blue-600 active:scale-95
                   transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                   shadow-lg shadow-purple-500/25"
        >
          {isPlaying ? (
            <Pause size={20} className="text-white" />
          ) : (
            <Play size={20} className="text-white ml-1" />
          )}
        </button>

        {/* Step Forward Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSeek(totalMoves)}
            disabled={currentMoveIndex >= totalMoves}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors
                     disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <SkipForward size={18} className="text-white/80" />
          </button>

          <button
            onClick={onStepForward}
            disabled={currentMoveIndex >= totalMoves}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors
                     disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} className="text-white/80" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex-1 mx-4">
          <div className="relative">
            <input
              type="range"
              min={0}
              max={totalMoves}
              value={currentMoveIndex}
              onChange={handleSeekBarChange}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-gradient-to-r
                       [&::-webkit-slider-thumb]:from-purple-400 [&::-webkit-slider-thumb]:to-blue-400
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg
                       [&::-webkit-slider-thumb]:shadow-purple-500/25 hover:[&::-webkit-slider-thumb]:scale-110
                       [&::-webkit-slider-thumb]:transition-transform"
            />

            {/* Progress fill */}
            <div
              className="absolute top-0 left-0 h-2 bg-gradient-to-r from-purple-400 to-blue-400
                       rounded-lg transition-all duration-200 pointer-events-none"
              style={{ width: `${(currentMoveIndex / totalMoves) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-white/60 font-smooth">
              {formatMoveDisplay()}
            </span>
            <span className="text-xs text-white/60 font-smooth">
              {getSpeedDisplay(playbackSpeed)}
            </span>
          </div>
        </div>

        {/* Settings Toggle */}
        <button
          onClick={onToggleSettings}
          className={`p-2 rounded-lg transition-colors ${
            showSettings
              ? 'bg-white/20 text-white/90'
              : 'hover:bg-white/10 text-white/60'
          }`}
        >
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
}