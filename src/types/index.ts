// Spring Boot ApiResponse<T> 공통 응답 래퍼 (ResponseCode 기반)
export interface ApiResponse<T> {
  status: number;    // ResponseCode.status (200/201=성공, 4xx/5xx=실패)
  message: string;   // ResponseCode.message
  data: T;
}

// Spring Boot PageResponse<T> 페이징 응답 래퍼
export interface PageResponse<T> {
  content: T[];
  totalCount: number;
  currentPage: number;
  totalPage: number;
  hasNext: boolean;
  size: number;
}

/**
 * Spring Boot UserDTO 매핑
 * permission: 1=일반유저, 99=관리자, 100=최고관리자
 * status:     1=활성, 0=비활성, -1=블랙
 */
export interface User {
  userUid: string;
  userName: string;
  email: string;
  userPhone?: string;
  password?: string;
  permission: number;
  status: number;
  loginToken?: string;
  loginDate?: string;
  createdAt?: string;
  kisAppKey?: string;
  kisAppSecret?: string;
  kisAccountNo?: string;
  kisAccountProduct?: string;
  kisAccessToken?: string;
  kisTokenExpiredAt?: string;
  kisPaperAppKey?: string;
  kisPaperAppSecret?: string;
  kisPaperAccountNo?: string;
  kisPaperAccountProduct?: string;
  kisPaperAccessToken?: string;
  kisPaperTokenExpiredAt?: string;
  tradingIntervalMinutes?: number; // 자동매매 판단 주기(분) — 5/10/15/30 중 선택, 기본 15
  tradingStartHour?: number | null; // 자동매매 신규진입 시작 시각(시) — 9/10/11/12 중 선택, null=10:10
  enableRecommendedSessionsLive?: number;  // 추천세션(외부 뉴스브리핑 연동) 실전 ON/OFF
  enableRecommendedSessionsPaper?: number; // 추천세션 모의 ON/OFF
  recommendedStrategyConfigId?: number;    // 추천세션에 쓸 전략 — 기존 공용 전략 중 지정
}

/** symbol_universe 테이블 매핑 — 실전투자 탭 종목 선택 리스트(코스피200/코스닥/나스닥100).
 * lastPrice/marketCap은 매일 01:00 배치(yfinance)로 갱신 — 갱신 전이면 null.
 * 정렬 기준은 marketCap 내림차순 */
export interface SymbolUniverse {
  symbol:         string;
  symbolName:     string;
  category:       'KOSPI200' | 'KOSDAQ150' | 'NASDAQ100';
  lastPrice:      number | null;
  marketCap:      number | null;
  priceUpdatedAt: string | null;
}

/** 외부 뉴스브리핑이 보낸 오늘의 추천 종목 (recommend_symbol) — 추천세션 토글과 무관하게 조회 가능 */
export interface RecommendSymbol {
  symbol:        string;
  symbolName:    string | null;  // symbol_universe 미등록 종목이면 null
  category:      string | null;
  direction:     'UP' | 'DOWN';  // UP=상승 예상(추천세션 생성) / DOWN=하락 예상(그날 모든 세션 신규매수·추가매수 차단, 매도는 기존 규칙)
  strength?:     'WEAK' | 'MEDIUM' | 'STRONG' | 'VERY_STRONG' | null;  // 예상 강도(약/중/강/매우강) — 상승이면 추천세션 매수조건 0/25/50/75% 완화, null=약
  score?:        number | null;  // 브리핑 점수(상승: 약·중=4, 강·매우강=5) — 기록용
  recommendDate: string;
  createdAt:     string | null;
}
/**
 * trading_session 테이블 매핑 (KOSPI 거래량+모멘텀 전략)
 * currentPosition: 백엔드에서 'NONE' | 'LONG' 문자열로 반환 (공매도 없음)
 * active: 1=실행 중, 0=중지
 * currentEquity: 현재잔고 / initialBalance 비율
 * initialBalance: 수익률 계산 기준점 — 세션 생성/초기화 시점의 실제 KIS 잔고 (자동 캡처)
 */
export interface TradingSession {
  id:               string;
  userUid:          string;
  strategyConfigId: number | null;
  mode:             'LIVE' | 'PAPER';
  symbol:           string;
  symbolName:       string | null;
  category?:        string | null; // "KOSPI200" | "KOSDAQ150" | "NASDAQ100" 등 — 직접입력 세션은 null
  isRecommended?:   number | null; // 1=뉴스브리핑 추천으로 자동 생성된 세션(15:40 미보유 시 자동 삭제)
  active:           number;
  currentPosition:  'NONE' | 'LONG';
  pendingOrderNo?:    string | null; // 지정가 진입 체결 대기 중인 KIS 주문번호(있으면 대기 중, 포지션은 아직 NONE)
  pendingOrderPrice?: number | null; // 대기 중인 지정가
  pendingOrderQty?:   number | null; // 대기 중인 주문 수량
  sharesHeld:       number | null;
  avgEntryPrice:    number | null;
  currentEquity:    number | null;
  initialBalance:   number | null;
  isStrategyUpdate: number;
  isForceCloseEnabled: number;
  createdAt:        string;
  lastUpdatedAt:    string;
  // 백엔드 조인 필드
  strategyConfig?: {
    id:                   number;
    name?:                string | null;
    takeProfitPct?:       number;
    stopLossPct?:         number;
    pullbackMinPct?:      number;
    pullbackMaxPct?:      number;
    buyingVolumeRatio?:   number;
    stopLossVolumeRatio?: number;
    pullbackVolumeRatio?: number;
  } | null;
  userDTO?: { userName?: string } | null;
}

export interface Stock {
  id: string;
  name: string;
  symbol: string;
  code: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
}

export interface Log {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  user?: string;
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  time: string;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  icon: string;
  date: string;
  type: string;
  status: string;
}

export interface Trade {
  id: string;
  no: number;
  title: string;
  author: string;
  stockName: string;
  stockCode: string;
  market: '코스피' | '코스닥' | '나스닥';
  tradeType: '매수' | '매도';
  price: number;
  quantity: number;
  totalAmount: number;
  status: '체결' | '대기' | '취소';
  date: string;
  applyDate: string;
  confirmDate: string | null;
  views: number;
  comments: number;
}

/** trade_history 테이블 매핑 */
export interface TradeHistory {
  id:                string;
  tradingSessionId:  string;
  userUid:           string;
  strategyConfigId:  number | null;
  mode:              'LIVE' | 'PAPER';
  symbol:            string;
  symbolName:        string | null;
  category?:         string | null; // "KOSPI200" | "KOSDAQ150" | "NASDAQ100" 등 — 세션에서 복사(비정규화)
  action:            'BUY' | 'SELL' | 'ADD_LONG' | 'SELL_SHORT' | 'CLOSE_LONG' | 'CLOSE_SHORT';
  shares:            number;
  orderStatus:       'SUCCESS' | 'FAILED';
  entryPrice:        number | null;
  entryAt:           string | null;
  exitPrice:         number | null;
  exitAt:            string | null;
  realizedPnl:       number | null;
  stopPrice:         number | null;
  tpPrice:           number | null;
  barsHeld:          number | null;
  currentEquity:     number | null;
  peakEquity:        number | null;
  errorMessage:      string | null;
  menuGrade:         number | null;
  createdAt:         string;
  // 백엔드 조인 필드 (관리자용)
  userName?:         string | null;
}
// ─── 관리자 대시보드 (GET /api/dashboard/*) ───────────────────────────────

/** 기간별 거래 집계 — 금액은 체결 수량 × 체결가, NASDAQ100만 달러 */
export interface DashboardTradeStats {
  successCount:   number;
  liveCount:      number;
  paperCount:     number;
  failedCount:    number;
  krwAmount:      number;
  liveKrwAmount:  number;
  paperKrwAmount: number;
  usdAmount:      number;
  realizedPnl:    number;
}

export interface DashboardActivity {
  type:         'SIGNUP' | 'TRADE' | 'TRADE_FAILED';
  userName:     string | null;
  symbol:       string | null;
  symbolName:   string | null;
  action:       TradeHistory['action'] | null;
  shares:       number | null;
  mode:         'LIVE' | 'PAPER' | null;
  errorMessage: string | null;
  occurredAt:   string; // yyyy-MM-dd HH:mm:ss (KST)
}

export interface DashboardSummary {
  totalUsers:        number;
  newUsersThisMonth: number;
  activeUsers:       number;
  adminUsers:        number;
  activeSessions:    number;
  liveSessions:      number;
  paperSessions:     number;
  holdingSessions:   number;
  tradesThisMonth:   DashboardTradeStats;
  tradesPrevMonth:   DashboardTradeStats; // 지난달 1일 ~ 지금과 같은 일시
  tradesToday:       DashboardTradeStats;
  tradingEnabled:    boolean;
  lastTradeAt:       string | null;
  recentActivities:  DashboardActivity[];
  recentTrades:      TradeHistory[];
}

export type DashboardPeriod = '1W' | '1M' | '3M' | '1Y' | 'ALL';

export interface DashboardSeriesPoint {
  bucket:     string; // yyyy-MM-dd(일) 또는 yyyy-MM(월)
  newUsers:   number;
  totalUsers: number;
  tradeCount: number;
  krwAmount:  number;
}

export interface DashboardSeries {
  period: DashboardPeriod;
  unit:   'DAY' | 'MONTH';
  points: DashboardSeriesPoint[];
}
