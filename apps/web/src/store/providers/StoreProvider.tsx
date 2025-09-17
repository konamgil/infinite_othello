import React, { createContext, useContext, useEffect } from 'react';
import { useAppStore } from '../appStore';
import { useNetworkStore } from '../networkStore';

// 스토어 초기화 컨텍스트
interface StoreContextValue {
  initialized: boolean;
}

const StoreContext = createContext<StoreContextValue>({ initialized: false });

export const useStoreContext = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStoreContext must be used within StoreProvider');
  }
  return context;
};

// 디바이스 정보 감지 함수
const detectDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent);
  const isDesktop = !isMobile && !isTablet;

  return {
    isMobile,
    isTablet,
    isDesktop,
    orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape' as const,
    online: navigator.onLine,
  };
};

interface StoreProviderProps {
  children: React.ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const { updateDevice } = useAppStore();
  const { updateNetworkSettings } = useNetworkStore();

  useEffect(() => {
    // 초기 디바이스 정보 설정
    const deviceInfo = detectDeviceInfo();
    updateDevice(deviceInfo);

    // 디바이스 방향 변경 감지
    const handleOrientationChange = () => {
      updateDevice({
        orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
      });
    };

    // 온라인/오프라인 상태 변경 감지
    const handleOnlineStatusChange = () => {
      updateDevice({ online: navigator.onLine });
    };

    // 리사이즈 감지 (방향 변경 포함)
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    // 네트워크 설정 초기화
    const networkSettings = {
      autoReconnect: true,
      reconnectInterval: deviceInfo.isMobile ? 5000 : 3000, // 모바일에서는 더 긴 간격
      maxReconnectAttempts: deviceInfo.isMobile ? 3 : 5,
      enableNotifications: true,
    };
    updateNetworkSettings(networkSettings);

    // 정리 함수
    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, [updateDevice, updateNetworkSettings]);

  // 성능 모드 감지 (저사양 기기)
  useEffect(() => {
    const detectPerformanceMode = () => {
      // 간단한 성능 감지 로직
      const isLowEndDevice =
        navigator.hardwareConcurrency <= 2 || // CPU 코어 수
        (navigator as any).deviceMemory <= 2; // RAM (실험적 API)

      if (isLowEndDevice) {
        useAppStore.getState().updateSettings({ performanceMode: true });
      }
    };

    detectPerformanceMode();
  }, []);

  return (
    <StoreContext.Provider value={{ initialized: true }}>
      {children}
    </StoreContext.Provider>
  );
};