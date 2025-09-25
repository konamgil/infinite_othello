import React from 'react';
import { RotateCcw, Pause, Play, Undo2 } from 'lucide-react';

interface GameControlsProps {
  canUndo: boolean;
  canPause: boolean;
  canResume: boolean;
  onNewGame: () => void;
  onUndo: () => void;
  onPause: () => void;
  onResume: () => void;
  disabled?: boolean;
}

export function GameControls({
  canUndo,
  canPause,
  canResume,
  onNewGame,
  onUndo,
  onPause,
  onResume,
  disabled
}: GameControlsProps) {
  const pauseDisabled = disabled || !canPause;
  const resumeDisabled = disabled || !canResume;
  const undoDisabled = disabled || !canUndo;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onNewGame}
          disabled={disabled}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw size={16} />
          새 게임
        </button>

        <button
          type="button"
          onClick={onUndo}
          disabled={undoDisabled}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Undo2 size={16} />
          되돌리기
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onPause}
          disabled={pauseDisabled}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Pause size={16} />
          일시정지
        </button>

        <button
          type="button"
          onClick={onResume}
          disabled={resumeDisabled}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Play size={16} />
          재개하기
        </button>
      </div>
    </div>
  );
}
