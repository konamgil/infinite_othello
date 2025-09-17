import React from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { GameController } from '../../../../../ui/game/GameController';

const GAME_MODES = ['quick', 'tower', 'battle', 'practice'] as const;
type GameMode = (typeof GAME_MODES)[number];

const DIFFICULTIES = ['easy', 'medium', 'hard', 'nightmare'] as const;
type Difficulty = (typeof DIFFICULTIES)[number];

type Opponent = 'ai' | 'human' | 'stella';
type BattleVariantKey = 'quick' | 'ranked' | 'tournament';

interface GameRouteState {
  mode?: GameMode;
  difficulty?: Difficulty;
  opponent?: Opponent;
  title?: string;
  towerFloor?: number;
  battleVariant?: BattleVariantKey;
}

const MODE_DEFAULTS: Record<GameMode, { title: string; difficulty: Difficulty; opponent: Opponent }> = {
  quick: { title: 'Quick Match', difficulty: 'medium', opponent: 'ai' },
  tower: { title: 'Tower Challenge', difficulty: 'medium', opponent: 'ai' },
  battle: { title: 'Battle Match', difficulty: 'hard', opponent: 'human' },
  practice: { title: 'Practice Session', difficulty: 'easy', opponent: 'stella' },
};

const BATTLE_VARIANTS: Record<BattleVariantKey, { title: string; difficulty?: Difficulty }> = {
  quick: { title: 'Quick Battle', difficulty: 'medium' },
  ranked: { title: 'Ranked Battle', difficulty: 'hard' },
  tournament: { title: 'Tournament Battle', difficulty: 'hard' },
};

const isGameMode = (value: string | null | undefined): value is GameMode =>
  !!value && (GAME_MODES as readonly string[]).includes(value);

const isDifficulty = (value: string | null | undefined): value is Difficulty =>
  !!value && (DIFFICULTIES as readonly string[]).includes(value);

const toNumber = (value: string | null | undefined): number | undefined => {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const isBattleVariant = (value: string | null | undefined): value is BattleVariantKey =>
  !!value && Object.prototype.hasOwnProperty.call(BATTLE_VARIANTS, value);

export function GameScreen() {
  const location = useLocation();
  const params = useParams<{ mode?: string; detail?: string }>();
  const [searchParams] = useSearchParams();
  const routeState = (location.state ?? {}) as GameRouteState;

  const queryMode = searchParams.get('mode');
  const resolvedMode: GameMode = routeState.mode
    ?? (isGameMode(params.mode) ? params.mode : undefined)
    ?? (isGameMode(queryMode) ? queryMode : undefined)
    ?? 'quick';

  const detailParam = params.detail;
  const queryDifficulty = searchParams.get('difficulty');
  const queryFloor = searchParams.get('floor');
  const queryVariant = searchParams.get('variant');

  const detailDifficulty = isDifficulty(detailParam) ? detailParam : undefined;
  const detailFloor = resolvedMode === 'tower' ? toNumber(detailParam) : undefined;
  const searchDifficulty = isDifficulty(queryDifficulty) ? queryDifficulty : undefined;
  const searchFloor = resolvedMode === 'tower' ? toNumber(queryFloor) : undefined;

  const towerFloor = routeState.towerFloor ?? detailFloor ?? searchFloor;

  const stateBattleVariant = routeState.battleVariant;
  const detailVariant = resolvedMode === 'battle' && isBattleVariant(detailParam) ? detailParam : undefined;
  const searchVariant = resolvedMode === 'battle' && isBattleVariant(queryVariant) ? queryVariant : undefined;
  const resolvedBattleVariant = resolvedMode === 'battle'
    ? stateBattleVariant ?? detailVariant ?? searchVariant
    : undefined;
  const battleVariant = resolvedBattleVariant ? BATTLE_VARIANTS[resolvedBattleVariant] : undefined;

  const difficulty: Difficulty = routeState.difficulty
    ?? battleVariant?.difficulty
    ?? detailDifficulty
    ?? searchDifficulty
    ?? MODE_DEFAULTS[resolvedMode].difficulty;

  const opponent: Opponent = routeState.opponent ?? MODE_DEFAULTS[resolvedMode].opponent;

  const title = routeState.title
    ?? (resolvedMode === 'tower' && towerFloor
      ? `Tower Floor ${towerFloor}`
      : battleVariant?.title ?? MODE_DEFAULTS[resolvedMode].title);

  return (
    <GameController
      key={`${resolvedMode}-${resolvedBattleVariant ?? 'default'}-${difficulty}-${towerFloor ?? 'na'}`}
      title={title}
      opponent={opponent}
      difficulty={difficulty}
    />
  );
}
