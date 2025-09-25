// Admin Routes - 관리자 라우팅 설정
// /admin 경로로 접속하는 관리자 전용 라우트

import { RouteObject } from 'react-router-dom';
import AdminPage from '../features/admin/pages/AdminPage';

export const adminRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: <AdminPage />,
    loader: async () => {
      // 관리자 페이지 접속 시 추가 로직
      console.log('관리자 페이지 접속');
      return null;
    }
  }
];
