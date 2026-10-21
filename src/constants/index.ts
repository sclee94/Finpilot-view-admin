export const MENU_ITEMS = [
  { path: '/dashboard', icon: 'ri-dashboard-line',    label: '대시보드',  adminOnly: true  },
  { path: '/users',     icon: 'ri-user-line',         label: '사용자',    adminOnly: true  },
  { path: '/reports',   icon: 'ri-exchange-line',     label: '매매현황',  adminOnly: false },
  { path: '/strategy',      icon: 'ri-settings-3-line', label: '전략 설정',   adminOnly: false },
  { path: '/strategy-menu', icon: 'ri-list-check-2',    label: '전략 메뉴판', adminOnly: false },
  { path: '/testlog',   icon: 'ri-test-tube-line',    label: '백테스트',  adminOnly: false },
  { path: '/live',      icon: 'ri-line-chart-line',    label: '실전투자',  adminOnly: false },
  { path: '/briefing',  icon: 'ri-newspaper-line',     label: '브리핑',    adminOnly: false },
  { path: '/logs',      icon: 'ri-file-list-line',     label: '로그',      adminOnly: true  },
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

export const NOTIFICATION_SETTINGS = [
  { id: 'email', label: '이메일 알림', checked: true },
  { id: 'push', label: '푸시 알림', checked: false },
  { id: 'sms', label: 'SMS 알림', checked: true },
];

export const SECURITY_SETTINGS = [
  { id: 'twoFactor', label: '2단계 인증', checked: true },
  { id: 'loginAlert', label: '로그인 알림', checked: true },
];