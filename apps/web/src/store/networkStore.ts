import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// 네트워크 및 멀티플레이어 상태 타입 정의
export interface NetworkState {
  // 연결 상태
  connection: {
    status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
    socketId: string | null;
    serverUrl: string;
    lastPing: number;
    reconnectAttempts: number;
  };

  // 방 정보
  room: {
    id: string | null;
    name: string | null;
    playerCount: number;
    maxPlayers: number;
    isPrivate: boolean;
    code: string | null; // 방 입장 코드
  };

  // 플레이어 정보
  players: Array<{
    id: string;
    name: string;
    avatar: string | null;
    isHost: boolean;
    isReady: boolean;
    rating: number;
    status: 'waiting' | 'playing' | 'disconnected';
  }>;

  // 현재 사용자 정보
  currentUser: {
    id: string | null;
    name: string;
    avatar: string | null;
    isHost: boolean;
  };

  // 게임 세션 정보
  gameSession: {
    id: string | null;
    status: 'waiting' | 'starting' | 'playing' | 'paused' | 'finished';
    playerRole: 'black' | 'white' | 'spectator' | null;
    timeControl: {
      timeLimit: number; // 초
      increment: number; // 증가 시간
      remainingTime: { black: number; white: number };
    };
  };

  // 채팅 시스템
  chat: {
    messages: Array<{
      id: string;
      playerId: string;
      playerName: string;
      message: string;
      timestamp: number;
      type: 'message' | 'system' | 'game';
    }>;
    unreadCount: number;
  };

  // 네트워크 설정
  settings: {
    autoReconnect: boolean;
    reconnectInterval: number;
    maxReconnectAttempts: number;
    enableChat: boolean;
    enableNotifications: boolean;
  };
}

// 액션 타입 정의
export interface NetworkActions {
  // 연결 관리
  connect: (serverUrl: string) => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
  updateConnectionStatus: (status: NetworkState['connection']['status']) => void;

  // 방 관리
  createRoom: (roomName: string, isPrivate?: boolean) => Promise<string>;
  joinRoom: (roomId: string, code?: string) => Promise<boolean>;
  leaveRoom: () => void;
  updateRoomInfo: (room: Partial<NetworkState['room']>) => void;

  // 플레이어 관리
  updatePlayers: (players: NetworkState['players']) => void;
  addPlayer: (player: NetworkState['players'][0]) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<NetworkState['players'][0]>) => void;
  setPlayerReady: (playerId: string, ready: boolean) => void;

  // 사용자 정보
  updateCurrentUser: (user: Partial<NetworkState['currentUser']>) => void;

  // 게임 세션
  startGameSession: (sessionInfo: Partial<NetworkState['gameSession']>) => void;
  updateGameSession: (updates: Partial<NetworkState['gameSession']>) => void;
  endGameSession: () => void;

  // 채팅
  addChatMessage: (message: Omit<NetworkState['chat']['messages'][0], 'id' | 'timestamp'>) => void;
  clearChat: () => void;
  markChatRead: () => void;

  // 설정
  updateNetworkSettings: (settings: Partial<NetworkState['settings']>) => void;

  // 네트워크 이벤트 처리
  handleSocketEvent: (event: string, data: any) => void;
}

export type NetworkStore = NetworkState & NetworkActions;

// 초기 상태
const initialState: NetworkState = {
  connection: {
    status: 'disconnected',
    socketId: null,
    serverUrl: process.env.VITE_SERVER_URL || 'ws://localhost:3001',
    lastPing: 0,
    reconnectAttempts: 0,
  },
  room: {
    id: null,
    name: null,
    playerCount: 0,
    maxPlayers: 2,
    isPrivate: false,
    code: null,
  },
  players: [],
  currentUser: {
    id: null,
    name: '',
    avatar: null,
    isHost: false,
  },
  gameSession: {
    id: null,
    status: 'waiting',
    playerRole: null,
    timeControl: {
      timeLimit: 900, // 15분
      increment: 10, // 10초 증가
      remainingTime: { black: 900, white: 900 },
    },
  },
  chat: {
    messages: [],
    unreadCount: 0,
  },
  settings: {
    autoReconnect: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
    enableChat: true,
    enableNotifications: true,
  },
};

// Zustand 스토어 생성
export const useNetworkStore = create<NetworkStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // 연결 관리
      connect: async (serverUrl) => {
        set(
          (state) => ({
            connection: {
              ...state.connection,
              status: 'connecting',
              serverUrl,
              reconnectAttempts: 0,
            },
          }),
          false,
          'connect'
        );

        try {
          // 실제 소켓 연결 로직은 여기에 구현
          // 예시: WebSocket 연결
          await new Promise((resolve) => setTimeout(resolve, 1000));

          set(
            (state) => ({
              connection: {
                ...state.connection,
                status: 'connected',
                socketId: `socket_${Date.now()}`,
                lastPing: Date.now(),
              },
            }),
            false,
            'connect_success'
          );
        } catch (error) {
          set(
            (state) => ({
              connection: {
                ...state.connection,
                status: 'error',
              },
            }),
            false,
            'connect_error'
          );
        }
      },

      disconnect: () => {
        set(
          (state) => ({
            connection: {
              ...state.connection,
              status: 'disconnected',
              socketId: null,
            },
            room: initialState.room,
            players: [],
            gameSession: initialState.gameSession,
          }),
          false,
          'disconnect'
        );
      },

      reconnect: async () => {
        const state = get();
        if (state.connection.reconnectAttempts >= state.settings.maxReconnectAttempts) {
          return;
        }

        set(
          (state) => ({
            connection: {
              ...state.connection,
              status: 'reconnecting',
              reconnectAttempts: state.connection.reconnectAttempts + 1,
            },
          }),
          false,
          'reconnect_attempt'
        );

        await get().connect(state.connection.serverUrl);
      },

      updateConnectionStatus: (status) =>
        set(
          (state) => ({
            connection: { ...state.connection, status },
          }),
          false,
          'updateConnectionStatus'
        ),

      // 방 관리
      createRoom: async (roomName, isPrivate = false) => {
        // 실제 방 생성 API 호출
        const roomId = `room_${Date.now()}`;
        const code = isPrivate ? Math.random().toString(36).substr(2, 6).toUpperCase() : null;

        set(
          {
            room: {
              id: roomId,
              name: roomName,
              playerCount: 1,
              maxPlayers: 2,
              isPrivate,
              code,
            },
          },
          false,
          'createRoom'
        );

        return roomId;
      },

      joinRoom: async (roomId, code) => {
        // 실제 방 참가 API 호출
        await new Promise((resolve) => setTimeout(resolve, 500));

        set(
          (state) => ({
            room: {
              ...state.room,
              id: roomId,
              playerCount: state.room.playerCount + 1,
            },
          }),
          false,
          'joinRoom'
        );

        return true;
      },

      leaveRoom: () => {
        set(
          {
            room: initialState.room,
            players: [],
            gameSession: initialState.gameSession,
          },
          false,
          'leaveRoom'
        );
      },

      updateRoomInfo: (roomUpdate) =>
        set(
          (state) => ({
            room: { ...state.room, ...roomUpdate },
          }),
          false,
          'updateRoomInfo'
        ),

      // 플레이어 관리
      updatePlayers: (players) =>
        set({ players }, false, 'updatePlayers'),

      addPlayer: (player) =>
        set(
          (state) => ({
            players: [...state.players, player],
          }),
          false,
          'addPlayer'
        ),

      removePlayer: (playerId) =>
        set(
          (state) => ({
            players: state.players.filter((p) => p.id !== playerId),
          }),
          false,
          'removePlayer'
        ),

      updatePlayer: (playerId, updates) =>
        set(
          (state) => ({
            players: state.players.map((p) =>
              p.id === playerId ? { ...p, ...updates } : p
            ),
          }),
          false,
          'updatePlayer'
        ),

      setPlayerReady: (playerId, ready) =>
        get().updatePlayer(playerId, { isReady: ready }),

      // 사용자 정보
      updateCurrentUser: (userUpdate) =>
        set(
          (state) => ({
            currentUser: { ...state.currentUser, ...userUpdate },
          }),
          false,
          'updateCurrentUser'
        ),

      // 게임 세션
      startGameSession: (sessionInfo) =>
        set(
          (state) => ({
            gameSession: { ...state.gameSession, ...sessionInfo },
          }),
          false,
          'startGameSession'
        ),

      updateGameSession: (updates) =>
        set(
          (state) => ({
            gameSession: { ...state.gameSession, ...updates },
          }),
          false,
          'updateGameSession'
        ),

      endGameSession: () =>
        set(
          { gameSession: initialState.gameSession },
          false,
          'endGameSession'
        ),

      // 채팅
      addChatMessage: (message) => {
        const id = Date.now().toString();
        set(
          (state) => ({
            chat: {
              messages: [
                ...state.chat.messages,
                { ...message, id, timestamp: Date.now() },
              ],
              unreadCount: state.chat.unreadCount + 1,
            },
          }),
          false,
          'addChatMessage'
        );
      },

      clearChat: () =>
        set(
          { chat: { messages: [], unreadCount: 0 } },
          false,
          'clearChat'
        ),

      markChatRead: () =>
        set(
          (state) => ({
            chat: { ...state.chat, unreadCount: 0 },
          }),
          false,
          'markChatRead'
        ),

      // 설정
      updateNetworkSettings: (settingsUpdate) =>
        set(
          (state) => ({
            settings: { ...state.settings, ...settingsUpdate },
          }),
          false,
          'updateNetworkSettings'
        ),

      // 네트워크 이벤트 처리
      handleSocketEvent: (event, data) => {
        // 실제 소켓 이벤트 처리 로직
        console.log(`Socket event: ${event}`, data);
      },
    }),
    {
      name: 'infinity-othello-network-store',
    }
  )
);

// 편의 훅들
export const useConnection = () => useNetworkStore((state) => state.connection);
export const useRoom = () => useNetworkStore((state) => state.room);
export const usePlayers = () => useNetworkStore((state) => state.players);
export const useCurrentUser = () => useNetworkStore((state) => state.currentUser);
export const useGameSession = () => useNetworkStore((state) => state.gameSession);
export const useChat = () => useNetworkStore((state) => state.chat);
export const useNetworkSettings = () => useNetworkStore((state) => state.settings);

// 액션 훅들
export const useNetworkActions = () => useNetworkStore((state) => ({
  connect: state.connect,
  disconnect: state.disconnect,
  reconnect: state.reconnect,
  updateConnectionStatus: state.updateConnectionStatus,
  createRoom: state.createRoom,
  joinRoom: state.joinRoom,
  leaveRoom: state.leaveRoom,
  updateRoomInfo: state.updateRoomInfo,
  updatePlayers: state.updatePlayers,
  addPlayer: state.addPlayer,
  removePlayer: state.removePlayer,
  updatePlayer: state.updatePlayer,
  setPlayerReady: state.setPlayerReady,
  updateCurrentUser: state.updateCurrentUser,
  startGameSession: state.startGameSession,
  updateGameSession: state.updateGameSession,
  endGameSession: state.endGameSession,
  addChatMessage: state.addChatMessage,
  clearChat: state.clearChat,
  markChatRead: state.markChatRead,
  updateNetworkSettings: state.updateNetworkSettings,
  handleSocketEvent: state.handleSocketEvent,
}));