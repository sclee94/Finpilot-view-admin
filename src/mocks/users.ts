import type { User } from '../types';

// permission: 1=일반유저, 99=관리자, 100=최고관리자
// status:     1=활성, 0=비활성, -1=블랙
export const MOCK_USERS: User[] = [
  { userUid: 'u001', userName: '김민준', email: 'minjun.kim@example.com', permission: 99, status: 1, loginDate: '2025-01-10', createdAt: '2023-03-15' },
  { userUid: 'u002', userName: '이서연', email: 'seoyeon.lee@example.com', permission: 1, status: 1, loginDate: '2025-01-09', createdAt: '2023-05-22' },
  { userUid: 'u003', userName: '박지호', email: 'jiho.park@example.com', permission: 1, status: 0, loginDate: '2024-12-20', createdAt: '2023-07-01' },
  { userUid: 'u004', userName: '최수아', email: 'sua.choi@example.com', permission: 1, status: 1, loginDate: '2025-01-08', createdAt: '2023-08-14' },
  { userUid: 'u005', userName: '정도윤', email: 'doyun.jung@example.com', permission: 99, status: 1, loginDate: '2025-01-10', createdAt: '2022-11-30' },
  { userUid: 'u006', userName: '강하은', email: 'haeun.kang@example.com', permission: 1, status: 1, loginDate: '2025-01-07', createdAt: '2024-01-05' },
  { userUid: 'u007', userName: '윤시우', email: 'siwoo.yoon@example.com', permission: 1, status: 0, loginDate: '2024-11-15', createdAt: '2024-02-18' },
  { userUid: 'u008', userName: '임나연', email: 'nayeon.lim@example.com', permission: 1, status: 1, loginDate: '2025-01-06', createdAt: '2024-03-22' },
  { userUid: 'u009', userName: '한준서', email: 'junseo.han@example.com', permission: 1, status: 1, loginDate: '2025-01-05', createdAt: '2024-04-10' },
  { userUid: 'u010', userName: '오채원', email: 'chaewon.oh@example.com', permission: 1, status: -1, loginDate: '2024-10-30', createdAt: '2024-05-03' },
  { userUid: 'u011', userName: '신예준', email: 'yejun.shin@example.com', permission: 1, status: 1, loginDate: '2025-01-04', createdAt: '2024-06-17' },
  { userUid: 'u012', userName: '배소율', email: 'soyul.bae@example.com', permission: 100, status: 1, loginDate: '2025-01-10', createdAt: '2022-09-08' },
];
