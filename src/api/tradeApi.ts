import type { ApiResponse, PageResponse, TradingSession } from '../types';
import { apiClient } from './apiClient';

/** 실행 ON/OFF 상태 조회 - POST /api/trade/getExecuteOnOFF */
export const getExecuteOnOff = () =>
  apiClient.post<ApiResponse<{ isEnabled: number }>>('/trade/getExecuteOnOFF');

/** 실행 ON/OFF 상태 변경 - PUT /api/trade/set/executeOnOff */
export const setExecuteOnOff = (isEnabled: number) =>
  apiClient.put<ApiResponse<{ isEnabled: number }>>('/trade/set/executeOnOff', { isEnabled });

/** 세션 목록 조회 - POST /api/trade/getTradingSessionList */
export const getTradingSessionList = (params: Partial<{ userUid: string | null; userName: string; email: string; permission: number; status: number }>) =>
  apiClient.post<ApiResponse<TradingSession[]>>('/trade/getTradingSessionList', params);

/** 세션 생성 - POST /api/trade/insertTradingSession */
export const insertTradingSession = (params: {
  userUid:           string;
  strategyConfigId?: number | null;
  symbol:            string;
  mode:              'LIVE' | 'PAPER';
  cooldownBarsLeft:  number;
  consecSlCount:     number;
  currentEquity:     number;
  peakEquity:        number;
}) =>
  apiClient.post<ApiResponse<TradingSession>>('/trade/insertTradingSession', params);

/** 세션 상태 변경 (중지/재실행) - PUT /api/trade/updateTradingSession */
export const updateTradingSession = (params: { id: string; active: number }) =>
  apiClient.put<ApiResponse<TradingSession>>('/trade/updateTradingSession', params);

/** 세션 삭제 - DELETE /api/trade/deleteTradingSession */
export const deleteTradingSession = (id: string) =>
  apiClient.delete<ApiResponse<TradingSession>>('/trade/deleteTradingSession', { id });

/** 세션 초기화 - PUT /api/trade/resetTradingSession */
export const resetTradingSession = (id: string) =>
  apiClient.put<ApiResponse<TradingSession>>('/trade/resetTradingSession', { id });

/** 세션 전략 변경 - PUT /api/trade/updateStrategyConfigId */
export const updateSessionStrategyConfigId = (params: { id: string; strategyConfigId: number }) =>
  apiClient.put<ApiResponse<TradingSession>>('/trade/updateStrategyConfigId', params);

/** 전략 자동 업데이트 토글 - PUT /api/trade/toggleStrategyUpdate */
export const toggleStrategyUpdate = (id: string) =>
  apiClient.put<ApiResponse<null>>('/trade/toggleStrategyUpdate', { id });

/** 거래 이력 조회 - POST /api/tradeHistory/getTradeHistoryList */
export const getTradeHistoryList = (params: {
  userUid?: string | null;
  mode?: string;
  action?: string;
  orderStatus?: string;
  symbol?: string;      // 종목코드 완전일치
  symbolName?: string;  // 종목코드/종목명 LIKE
  dateFrom?: string;    // yyyy-MM-dd
  dateTo?: string;      // yyyy-MM-dd
  page?: number;
  size?: number;
}) =>
  apiClient.post<ApiResponse<PageResponse<import('../types').TradeHistory>>>('/tradeHistory/getTradeHistoryList', params);

/** 자본금 조회 - POST /api/finpilot/balance */
export const getBalance = (userUid: string, mode: 'LIVE' | 'PAPER', accountNo?: string) =>
  apiClient.post<ApiResponse<{ totalBalance: number; holdingBalance: number; orderableCash: number }>>('/finpilot/balance', { userUid, mode, ...(accountNo ? { accountNo } : {}) });

export interface AssetSummary {
  totalAsset: number;
  stockEvalAmount: number;
  availableBuyAmount: number;
}
