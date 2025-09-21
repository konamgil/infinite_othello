import React from 'react';
import { AlertTriangle, Smartphone, Monitor, Tablet } from 'lucide-react';
import { useAuth, useAuthActions } from '../../store/authStore';

/**
 * Returns a device-specific icon based on the device information string.
 *
 * It checks for keywords like 'mobile' or 'tablet' in the provided string
 * to determine the appropriate icon from the `lucide-react` library.
 *
 * @param {string} deviceInfo - A string containing information about the device.
 * @returns {LucideIcon} The corresponding icon component (e.g., `Smartphone`, `Tablet`, `Monitor`).
 */
const getDeviceIcon = (deviceInfo: string) => {
  const device = deviceInfo.toLowerCase();
  if (device.includes('mobile')) return Smartphone;
  if (device.includes('tablet')) return Tablet;
  return Monitor;
};

/**
 * Translates a device information string into a user-friendly, localized device name.
 *
 * It parses the device info string (e.g., "mobile-ios") and maps the type
 * to a Korean name (e.g., "모바일").
 *
 * @param {string} deviceInfo - The device information string.
 * @returns {string} The localized, human-readable name of the device.
 */
const getDeviceName = (deviceInfo: string): string => {
  const parts = deviceInfo.split('-');
  const deviceType = parts[0];

  const typeNames = {
    mobile: '모바일',
    tablet: '태블릿',
    desktop: '데스크톱',
  };

  return typeNames[deviceType as keyof typeof typeNames] || '알 수 없는 기기';
};

/**
 * A modal component that alerts the user about a session conflict.
 *
 * This modal is displayed when the application detects that the same user account
 * has been logged in on another device. It provides details about the conflicting
 * session and offers the user two choices:
 * 1. Force logout the other device.
 * 2. Cancel the current login attempt.
 *
 * The component uses the `useAuth` and `useAuthActions` hooks to interact with the
 * authentication state.
 *
 * @returns {React.ReactElement | null} The rendered modal, or `null` if there is no session conflict.
 */
export const SessionConflictModal: React.FC = () => {
  const { sessionConflict, showSessionConflict } = useAuth();
  const { resolveSessionConflict } = useAuthActions();

  if (!showSessionConflict || !sessionConflict) {
    return null;
  }

  const DeviceIcon = getDeviceIcon(sessionConflict.deviceInfo);
  const deviceName = getDeviceName(sessionConflict.deviceInfo);
  const startedAt = new Date(sessionConflict.startedAt).toLocaleString('ko-KR');
  const lastSeen = new Date(sessionConflict.lastSeen).toLocaleString('ko-KR');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900/95 backdrop-blur-md border border-red-500/20 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        {/* 경고 헤더 */}
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mr-4">
            <AlertTriangle size={24} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-1">동시 접속 감지</h2>
            <p className="text-red-300 text-sm">다른 기기에서 로그인되어 있습니다</p>
          </div>
        </div>

        {/* 기존 세션 정보 */}
        <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-3">
            <DeviceIcon size={20} className="text-slate-300 mr-2" />
            <span className="font-semibold text-white">{deviceName}</span>
          </div>

          <div className="space-y-2 text-sm text-slate-300">
            <div>
              <span className="text-slate-400">로그인 시간:</span>
              <span className="ml-2">{startedAt}</span>
            </div>
            <div>
              <span className="text-slate-400">마지막 활동:</span>
              <span className="ml-2">{lastSeen}</span>
            </div>
          </div>
        </div>

        {/* 설명 텍스트 */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-6">
          <p className="text-yellow-200 text-sm">
            보안을 위해 한 번에 하나의 기기에서만 로그인할 수 있습니다.
            계속하려면 다른 기기의 세션을 종료하거나 현재 로그인을 취소하세요.
          </p>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex space-x-3">
          <button
            onClick={() => resolveSessionConflict('force')}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl
                     transition-all duration-200 active:scale-98"
          >
            다른 기기 로그아웃
          </button>

          <button
            onClick={() => resolveSessionConflict('cancel')}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-3 px-4 rounded-xl
                     transition-all duration-200 active:scale-98 border border-slate-600"
          >
            취소
          </button>
        </div>

        {/* 추가 안내 */}
        <p className="text-xs text-slate-400 text-center mt-4">
          문제가 지속되면 모든 기기에서 로그아웃 후 다시 시도해주세요
        </p>
      </div>
    </div>
  );
};

/**
 * A banner component to notify the user of a session conflict.
 *
 * This banner is a less intrusive way to inform the user about a session conflict
 * compared to the modal. It appears at the top of the screen and provides a button
 * to resolve the conflict.
 *
 * @returns {React.ReactElement | null} The rendered banner, or `null` if there is no conflict.
 */
export const SessionConflictBanner: React.FC = () => {
  const { sessionConflict, showSessionConflict } = useAuth();
  const { resolveSessionConflict } = useAuthActions();

  if (!sessionConflict || showSessionConflict) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-40">
      <div className="bg-red-900/90 backdrop-blur-md border border-red-500/30 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle size={20} className="text-red-400 mr-3" />
            <div>
              <p className="text-white font-medium">세션 충돌 감지됨</p>
              <p className="text-red-200 text-sm">다른 기기에서 로그인되었습니다</p>
            </div>
          </div>

          <button
            onClick={() => resolveSessionConflict('force')}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-2 rounded-lg
                     transition-colors"
          >
            해결하기
          </button>
        </div>
      </div>
    </div>
  );
};