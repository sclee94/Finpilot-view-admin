import type { User } from '../types';

export const MOCK_USERS: User[] = [
  { id: 1, name: '김민준', email: 'minjun.kim@example.com', role: 'admin', status: 'active', lastLogin: '2025-01-10', joinDate: '2023-03-15' },
  { id: 2, name: '이서연', email: 'seoyeon.lee@example.com', role: 'user', status: 'active', lastLogin: '2025-01-09', joinDate: '2023-05-22' },
  { id: 3, name: '박지호', email: 'jiho.park@example.com', role: 'user', status: 'inactive', lastLogin: '2024-12-20', joinDate: '2023-07-01' },
  { id: 4, name: '최수아', email: 'sua.choi@example.com', role: 'user', status: 'active', lastLogin: '2025-01-08', joinDate: '2023-08-14' },
  { id: 5, name: '정도윤', email: 'doyun.jung@example.com', role: 'admin', status: 'active', lastLogin: '2025-01-10', joinDate: '2022-11-30' },
  { id: 6, name: '강하은', email: 'haeun.kang@example.com', role: 'user', status: 'active', lastLogin: '2025-01-07', joinDate: '2024-01-05' },
  { id: 7, name: '윤시우', email: 'siwoo.yoon@example.com', role: 'user', status: 'inactive', lastLogin: '2024-11-15', joinDate: '2024-02-18' },
  { id: 8, name: '임나연', email: 'nayeon.lim@example.com', role: 'user', status: 'active', lastLogin: '2025-01-06', joinDate: '2024-03-22' },
  { id: 9, name: '한준서', email: 'junseo.han@example.com', role: 'user', status: 'active', lastLogin: '2025-01-05', joinDate: '2024-04-10' },
  { id: 10, name: '오채원', email: 'chaewon.oh@example.com', role: 'user', status: 'inactive', lastLogin: '2024-10-30', joinDate: '2024-05-03' },
  { id: 11, name: '신예준', email: 'yejun.shin@example.com', role: 'user', status: 'active', lastLogin: '2025-01-04', joinDate: '2024-06-17' },
  { id: 12, name: '배소율', email: 'soyul.bae@example.com', role: 'admin', status: 'active', lastLogin: '2025-01-10', joinDate: '2022-09-08' },
];