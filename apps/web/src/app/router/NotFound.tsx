import React from 'react';

/**
 * A component to be displayed when a route is not found (404 error).
 *
 * This component renders a simple "Page Not Found" message with an icon.
 * It's designed to guide users back to the main application if they land on a non-existent page.
 *
 * @returns {React.ReactElement} The rendered "Not Found" screen.
 */
export function NotFoundScreen() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="text-4xl">🚫</div>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-white">페이지를 찾을 수 없습니다.</h1>
        <p className="text-sm text-white/60">주소를 확인하시거나 메인 화면으로 돌아가 주세요.</p>
      </div>
    </div>
  );
}
