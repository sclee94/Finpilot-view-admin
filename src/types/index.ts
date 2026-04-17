// Spring Boot ApiResponse<T> 공통 응답 래퍼 (ResponseCode 기반)
export interface ApiResponse<T> {
  status: number;    // ResponseCode.status (200/201=성공, 4xx/5xx=실패)
  message: string;   // ResponseCode.message
  data: T;
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
}

/**
 * trading_session 테이블 매핑
 * currentPosition: 백엔드에서 'NONE' | 'LONG' | 'SHORT' 문자열로 반환
 * active: 1=실행 중, 0=중지
 */
export interface TradingSession {
  id:               string;
  userUid:          string;
  strategyConfigId: number;
  mode:             'LIVE' | 'PAPER';
  symbol:           string;
  active:           number;
  currentPosition:  'NONE' | 'LONG' | 'SHORT';
  barsHeld:         number;
  sharesHeld:       number | null;
  stopPrice:        number | null;
  tpPrice:          number | null;
  cooldownBarsLeft: number;
  consecSlCount:    number;
  currentEquity:    number | null;
  peakEquity:       number;
  createdAt:        string;
  lastUpdatedAt:    string;
  // 백엔드 조인 필드
  strategyConfig?:  { id: number; title: string } | null;
  userDTO?:         { userName?: string } | null;
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
  action:            'BUY' | 'SELL_SHORT' | 'CLOSE_LONG' | 'CLOSE_SHORT';
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
  createdAt:         string;
  // 백엔드 조인 필드 (관리자용)
  userName?:         string | null;
}