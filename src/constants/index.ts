export const MENU_ITEMS = [
  { path: '/dashboard', icon: 'ri-dashboard-line',    label: '대시보드',  adminOnly: true  },
  { path: '/users',     icon: 'ri-user-line',         label: '사용자',    adminOnly: true  },
  { path: '/reports',   icon: 'ri-exchange-line',     label: '거래현황',  adminOnly: false },
  { path: '/strategy',  icon: 'ri-settings-3-line',   label: '전략 설정', adminOnly: false },
  { path: '/logs',      icon: 'ri-file-list-line',    label: '로그',      adminOnly: true  },
];

export const LOG_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
} as const;

export const REPORT_TYPES = {
  TRANSACTION: '거래',
  ANALYSIS: '분석',
  SYSTEM: '시스템',
  MARKET: '시장',
  SECURITY: '보안',
  FINANCE: '재무',
} as const;

export const REPORT_STATUSES = {
  COMPLETED: '완료',
  IN_PROGRESS: '진행중',
  UNDER_REVIEW: '검토중',
} as const;

// Spring Boot UserDTO permission 값과 동일
export const PERMISSIONS = {
  USER: 1,
  ADMIN: 99,
  SUPER_ADMIN: 100,
} as const;

// Spring Boot UserDTO status 값과 동일
export const STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
  BLOCKED: -1,
} as const;

const now = new Date();
const thisMonth = `${now.getMonth() + 1}월`;

export const STATS_DATA = [
  {
    title: '총 사용자',
    value: '1,234',
    icon: 'ri-user-line',
    trend: '+12.5%',
    trendUp: true,
    dateLabel: thisMonth,
  },
  {
    title: '활성 거래',
    value: '856',
    icon: 'ri-stock-line',
    trend: '+8.2%',
    trendUp: true,
    dateLabel: thisMonth,
  },
  {
    title: '총 거래량',
    value: '2,400개',
    icon: 'ri-line-chart-line',
    trend: '-3.1%',
    trendUp: false,
    dateLabel: thisMonth,
    subValues: [
      { label: '월간', value: '₩284,000,000' },
      { label: '달러', value: '$2,400,000' },
    ],
  },
  {
    title: '시스템 상태',
    value: '정상',
    icon: 'ri-shield-check-line',
    trend: '100%',
    trendUp: true,
  },
];

export const RECENT_ACTIVITIES = [
  {
    id: 1,
    user: '김철수',
    action: '새로운 거래 생성',
    time: '5분 전',
    type: 'success' as const,
  },
  {
    id: 2,
    user: '이영희',
    action: '프로필 업데이트',
    time: '15분 전',
    type: 'info' as const,
  },
  {
    id: 3,
    user: '박민수',
    action: '거래 취소',
    time: '30분 전',
    type: 'warning' as const,
  },
  {
    id: 4,
    user: '정수진',
    action: '새로운 거래 생성',
    time: '1시간 전',
    type: 'success' as const,
  },
  {
    id: 5,
    user: '최동욱',
    action: '계정 설정 변경',
    time: '2시간 전',
    type: 'info' as const,
  },
];

export const NOTIFICATION_SETTINGS = [
  { id: 'email', label: '이메일 알림', checked: true },
  { id: 'push', label: '푸시 알림', checked: false },
  { id: 'sms', label: 'SMS 알림', checked: true },
];

export const SECURITY_SETTINGS = [
  { id: 'twoFactor', label: '2단계 인증', checked: true },
  { id: 'loginAlert', label: '로그인 알림', checked: true },
];