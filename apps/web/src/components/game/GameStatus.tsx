import React, { useMemo } from 'react';
import type { Player } from 'shared-types';

interface GameStatusProps {
  score: { black: number; white: number };
  currentPlayer: Player;
  gameStatus: 'waiting' | 'playing' | 'paused' | 'finished';
  winner: Player | 'draw' | null;
  isAIThinking: boolean;
  elapsedTime: number;
}

const PLAYER_LABEL: Record<Player, string> = {
  black: '흑돌',
  white: '백돌'
};

const STATUS_LABEL: Record<GameStatusProps['gameStatus'], string> = {
  waiting: '대기 중',
  playing: '게임 진행 중',
  paused: '일시정지됨',
  finished: '게임 종료'
};

function formatElapsed(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function GameStatus({
  score,
  currentPlayer,
  gameStatus,
  winner,
  isAIThinking,
  elapsedTime
}: GameStatusProps) {
  const statusMessage = useMemo(() => {
    if (gameStatus === 'finished') {
      if (winner === 'draw' || winner === null) return '무승부';
      return `${PLAYER_LABEL[winner]} 승리`;
    }
    if (gameStatus === 'paused') return '일시정지';
    if (isAIThinking) return 'AI가 생각하는 중';
    return `${PLAYER_LABEL[currentPlayer]} 차례`;
  }, [currentPlayer, gameStatus, isAIThinking, winner]);

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-white">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white/70">게임 상태</h2>
        <span className="text-xs text-white/50">{STATUS_LABEL[gameStatus]}</span>
      </header>

      <div className="grid grid-cols-2 gap-3 text-center text-sm">
        <div className={`rounded-xl border px-3 py-2 ${currentPlayer === 'black' ? 'border-emerald-400/50 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}>
          <div className="text-xs uppercase tracking-wide text-white/60">흑돌</div>
          <div className="text-xl font-bold text-white">{score.black}</div>
        </div>
        <div className={`rounded-xl border px-3 py-2 ${currentPlayer === 'white' ? 'border-sky-400/50 bg-sky-500/10' : 'border-white/10 bg-white/5'}`}>
          <div className="text-xs uppercase tracking-wide text-white/60">백돌</div>
          <div className="text-xl font-bold text-white">{score.white}</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-white/60">
        <span>{statusMessage}</span>
        <span className="font-mono text-white/70">{formatElapsed(elapsedTime)}</span>
      </div>
    </section>
  );
}
