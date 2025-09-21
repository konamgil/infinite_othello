import { StateCreator } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';

// 커스텀 persist 설정 유형
export interface CustomPersistOptions<T> extends Partial<PersistOptions<T>> {
  // 추가 설정 옵션들
  version?: number;
  migrate?: (persistedState: any, version: number) => T;
  serialize?: {
    stringify: (state: T) => string;
    parse: (str: string) => T;
  };
  storage?: {
    getItem: (name: string) => Promise<string | null>;
    setItem: (name: string, value: string) => Promise<void>;
    removeItem: (name: string) => Promise<void>;
  };
}

/**
 * Creates a serializer that sanitizes the state before stringifying it.
 * This is used to prevent sensitive information from being written to storage.
 */
const createCompressedStorage = () => ({
  stringify: (state: any) => {
    try {
      // 민감한 정보 제거
      const sanitized = sanitizeState(state);
      return JSON.stringify(sanitized);
    } catch (error) {
      console.warn('Failed to serialize state:', error);
      return '{}';
    }
  },
  parse: (str: string) => {
    try {
      return JSON.parse(str);
    } catch (error) {
      console.warn('Failed to parse stored state:', error);
      return {};
    }
  },
});

/**
 * Recursively removes sensitive and temporary fields from a state object.
 * @param state The state object to sanitize.
 * @returns A new state object with sensitive data removed.
 */
const sanitizeState = (state: any) => {
  if (!state || typeof state !== 'object') return state;

  const sanitized = { ...state };

  // 민감한 필드들 제거
  const sensitiveFields = [
    'socketId',
    'password',
    'token',
    'privateKey',
    'sessionId',
  ];

  const removeSensitiveData = (obj: any, path: string[] = []): any => {
    if (typeof obj !== 'object' || obj === null) return obj;

    if (Array.isArray(obj)) {
      return obj.map((item, index) => removeSensitiveData(item, [...path, index.toString()]));
    }

    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...path, key];

      // 민감한 필드 체크
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        continue; // 민감한 필드 제거
      }

      // 임시 데이터 제거 (error, loading 상태 등)
      if (key === 'error' || key === 'loading' || key.startsWith('temp_')) {
        continue;
      }

      cleaned[key] = removeSensitiveData(value, currentPath);
    }

    return cleaned;
  };

  return removeSensitiveData(sanitized);
};

/**
 * Creates a storage object that uses IndexedDB.
 * This is suitable for storing larger amounts of data that might exceed localStorage limits.
 * @param {string} dbName - The name of the IndexedDB database.
 * @param {string} [storeName='state'] - The name of the object store within the database.
 * @returns A storage object with `getItem`, `setItem`, and `removeItem` methods.
 */
const createIndexedDBStorage = (dbName: string, storeName: string = 'state') => {
  let db: IDBDatabase | null = null;

  const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      if (db) {
        resolve(db);
        return;
      }

      const request = indexedDB.open(dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        db = request.result;
        resolve(db);
      };

      request.onupgradeneeded = () => {
        db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };
    });
  };

  return {
    getItem: async (name: string): Promise<string | null> => {
      try {
        const database = await initDB();
        const transaction = database.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);

        return new Promise((resolve, reject) => {
          const request = store.get(name);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result || null);
        });
      } catch (error) {
        console.warn('IndexedDB getItem failed:', error);
        return null;
      }
    },

    setItem: async (name: string, value: string): Promise<void> => {
      try {
        const database = await initDB();
        const transaction = database.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        return new Promise((resolve, reject) => {
          const request = store.put(value, name);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve();
        });
      } catch (error) {
        console.warn('IndexedDB setItem failed:', error);
      }
    },

    removeItem: async (name: string): Promise<void> => {
      try {
        const database = await initDB();
        const transaction = database.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        return new Promise((resolve, reject) => {
          const request = store.delete(name);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve();
        });
      } catch (error) {
        console.warn('IndexedDB removeItem failed:', error);
      }
    },
  };
};

/**
 * Creates a migration function that can be passed to Zustand's persist middleware.
 * It sequentially applies migration functions to update the state from an older version to the current version.
 * @template T - The type of the state.
 * @param {Record<number, (state: any) => T>} migrations - An object where keys are version numbers and values are migration functions.
 * @returns A migration function compatible with the `persist` middleware.
 */
export const createStateMigration = <T>(migrations: Record<number, (state: any) => T>) => {
  return (persistedState: any, version: number): T => {
    let state = persistedState;

    // 현재 버전까지 순차적으로 마이그레이션 실행
    const sortedVersions = Object.keys(migrations)
      .map(Number)
      .sort((a, b) => a - b)
      .filter(v => v > version);

    for (const migrationVersion of sortedVersions) {
      try {
        state = migrations[migrationVersion](state);
        console.log(`State migrated to version ${migrationVersion}`);
      } catch (error) {
        console.error(`Migration to version ${migrationVersion} failed:`, error);
        break;
      }
    }

    return state;
  };
};

/**
 * A high-level wrapper around Zustand's `persist` middleware.
 *
 * This function enhances the default `persist` middleware by automatically selecting
 * the best available storage (custom, IndexedDB, or localStorage) and applying a
 * default serialization method that sanitizes the data.
 *
 * @template T - The type of the state.
 * @param {CustomPersistOptions<T>} options - The custom persistence options.
 * @returns A configured Zustand middleware function.
 */
export const createCustomPersist = <T>(
  options: CustomPersistOptions<T>
) => {
  const {
    storage: customStorage,
    serialize = createCompressedStorage(),
    version = 1,
    migrate,
    ...persistOptions
  } = options;

  // 스토리지 선택 (우선순위: 커스텀 > IndexedDB > localStorage)
  let storage = customStorage;

  if (!storage) {
    try {
      // IndexedDB를 사용할 수 있는지 확인
      if (typeof indexedDB !== 'undefined' && options.name) {
        storage = createIndexedDBStorage(`${options.name}-db`);
      }
    } catch (error) {
      console.warn('IndexedDB not available, falling back to localStorage');
    }
  }

  return persist<T>(
    (config: StateCreator<T>) => config,
    {
      ...persistOptions,
      version,
      migrate,
      serialize,
      storage,
    }
  );
};

/**
 * A collection of pre-defined configurations for the `createCustomPersist` middleware.
 * These presets provide sensible defaults for different types of data (e.g., game data, user settings).
 */
export const persistPresets = {
  /** Preset for important game data, which partially persists and saves a limited history. */
  gameData: <T>(name: string): CustomPersistOptions<T> => ({
    name,
    version: 1,
    serialize: createCompressedStorage(),
    partialize: (state: any) => {
      // 게임 진행 상태와 설정만 저장
      const { history, currentGame, ...others } = state;
      return {
        ...others,
        // 최근 10게임만 저장
        history: history?.slice(-10) || [],
      };
    },
  }),

  /** Preset for user settings that should be saved permanently. */
  userSettings: <T>(name: string): CustomPersistOptions<T> => ({
    name,
    version: 1,
    serialize: createCompressedStorage(),
  }),

  /** Preset for temporary session data, which excludes volatile state like `loading` and `error`. */
  sessionData: <T>(name: string): CustomPersistOptions<T> => ({
    name,
    version: 1,
    serialize: createCompressedStorage(),
    partialize: (state: any) => {
      // 임시 상태들은 저장하지 않음
      const { loading, error, temporary, ...persistData } = state;
      return persistData;
    },
  }),

  /** Preset for very large datasets, forcing the use of IndexedDB. */
  largeData: <T>(name: string): CustomPersistOptions<T> => ({
    name,
    version: 1,
    serialize: createCompressedStorage(),
    storage: createIndexedDBStorage(`${name}-large-data`),
  }),
};

/**
 * An initialization utility that can be used to perform tasks like cleaning up
 * old or stale data from localStorage.
 */
export const initializeStores = async () => {
  // 필요시 오래된 데이터 정리
  const cleanup = () => {
    const keys = Object.keys(localStorage);
    const storeKeys = keys.filter(key =>
      key.startsWith('infinity-othello-') &&
      key.includes('store')
    );

    // 7일 이상 된 데이터 정리 등의 로직
    storeKeys.forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        const timestamp = data.timestamp || 0;
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

        if (timestamp < weekAgo) {
          localStorage.removeItem(key);
          console.log(`Cleaned up old store data: ${key}`);
        }
      } catch (error) {
        // 파싱 에러가 있는 데이터 정리
        localStorage.removeItem(key);
      }
    });
  };

  cleanup();
};