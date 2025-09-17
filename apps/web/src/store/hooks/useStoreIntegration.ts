import { useEffect } from 'react';
import { useGameStore } from '../gameStore';
import { useOthelloStore } from '../othelloStore';
import { useNetworkStore } from '../networkStore';
import { useAppStore } from '../appStore';

// 스토어 간 동기화 훅
export const useStoreIntegration = () => {
  const { activeTab, setActiveTab } = useGameStore();
  const { gameStatus, currentPlayer } = useOthelloStore();
  const { connection, gameSession } = useNetworkStore();
  const { setLoading, setError, addNotification } = useAppStore();

  // 게임 상태와 네트워크 상태 동기화
  useEffect(() => {
    if (connection.status === 'connected' && gameStatus === 'playing') {
      // 온라인 게임 중인 경우 게임 세션 정보 업데이트
      if (!gameSession.id) {
        useNetworkStore.getState().startGameSession({
          id: `session_${Date.now()}`,
          status: 'playing',
          playerRole: 'black', // 실제로는 서버에서 결정
        });
      }
    }
  }, [connection.status, gameStatus, gameSession.id]);

  // 네트워크 오류를 앱 에러로 동기화
  useEffect(() => {
    if (connection.status === 'error') {
      setError('network', new Error('네트워크 연결에 실패했습니다'));
      addNotification({
        type: 'error',
        title: '연결 오류',
        message: '서버와의 연결이 끊어졌습니다. 재연결을 시도합니다.',
      });
    } else if (connection.status === 'connected') {
      setError('network', null);
      if (connection.reconnectAttempts > 0) {
        addNotification({
          type: 'success',
          title: '연결 복구',
          message: '서버와의 연결이 복구되었습니다.',
        });
      }
    }
  }, [connection.status, connection.reconnectAttempts, setError, addNotification]);

  // 게임 상태 변화 알림
  useEffect(() => {
    if (gameStatus === 'finished') {
      const { getWinner } = useOthelloStore.getState();
      const winner = getWinner();

      let message = '';
      if (winner === 'tie') {
        message = '무승부입니다!';
      } else {
        message = `${winner === 'black' ? '흑' : '백'}이 승리했습니다!`;
      }

      addNotification({
        type: 'info',
        title: '게임 종료',
        message,
      });
    }
  }, [gameStatus, addNotification]);

  // 로딩 상태 동기화
  useEffect(() => {
    const isNetworkLoading = connection.status === 'connecting' || connection.status === 'reconnecting';
    setLoading('global', isNetworkLoading);
  }, [connection.status, setLoading]);

  return {
    isConnected: connection.status === 'connected',
    isGameActive: gameStatus === 'playing',
    canMakeMove: gameStatus === 'playing' && !useNetworkStore.getState().aiThinking,
  };
};

// 게임 진행을 위한 통합 훅
export const useGameFlow = () => {
  const { makeMove, gameStatus, currentPlayer } = useOthelloStore();
  const { connection, gameSession } = useNetworkStore();
  const { setLoading } = useAppStore();

  const handleMove = async (row: number, col: number) => {
    if (gameStatus !== 'playing') return false;

    // 로딩 시작
    setLoading('operation', '이동 중...');

    try {
      // 로컬 게임인 경우
      if (gameSession.playerRole === null || connection.status !== 'connected') {
        const success = makeMove(row, col);
        return success;
      }

      // 온라인 게임인 경우
      if (gameSession.playerRole === currentPlayer) {
        // 서버에 이동 전송 (실제 구현 시)
        // await sendMoveToServer(row, col);

        const success = makeMove(row, col);
        return success;
      }

      return false;
    } finally {
      setLoading('operation', false);
    }
  };

  const startNewGame = (mode: 'single' | 'local' | 'online' = 'single') => {
    const { initializeGame, updateGameSettings } = useOthelloStore.getState();

    updateGameSettings({ gameMode: mode });
    initializeGame();

    if (mode === 'online' && connection.status === 'connected') {
      // 온라인 게임 시작 로직
      useNetworkStore.getState().startGameSession({
        id: `game_${Date.now()}`,
        status: 'starting',
        playerRole: 'black', // 실제로는 서버에서 할당
      });
    }
  };

  return {
    handleMove,
    startNewGame,
    canPlay: gameStatus === 'playing',
    isMyTurn: gameSession.playerRole === currentPlayer || gameSession.playerRole === null,
  };
};

// 테마와 UI 설정을 위한 훅
export const useThemeIntegration = () => {
  const { theme, setTheme } = useGameStore();
  const { ui, updateUISettings } = useGameStore();
  const { settings } = useAppStore();

  useEffect(() => {
    // 성능 모드에 따른 UI 설정 자동 조정
    if (settings.performanceMode && ui.animations) {
      updateUISettings({ animations: false });
    }
  }, [settings.performanceMode, ui.animations, updateUISettings]);

  const applyTheme = (boardTheme: typeof theme.board, stoneTheme: typeof theme.stone) => {
    setTheme({ board: boardTheme, stone: stoneTheme });
  };

  const toggleAnimations = () => {
    updateUISettings({ animations: !ui.animations });
  };

  const toggleSound = () => {
    updateUISettings({ soundEnabled: !ui.soundEnabled });
  };

  return {
    theme,
    ui,
    applyTheme,
    toggleAnimations,
    toggleSound,
  };
};

// 전체 상태 리셋을 위한 훅
export const useStoreReset = () => {
  const resetGame = useOthelloStore((state) => state.resetGame);
  const disconnect = useNetworkStore((state) => state.disconnect);
  const clearErrors = useAppStore((state) => state.clearErrors);
  const clearNotifications = useAppStore((state) => state.clearNotifications);

  const resetAllStores = () => {
    resetGame();
    disconnect();
    clearErrors();
    clearNotifications();
  };

  const resetGameOnly = () => {
    resetGame();
    clearErrors();
  };

  return {
    resetAllStores,
    resetGameOnly,
  };
};