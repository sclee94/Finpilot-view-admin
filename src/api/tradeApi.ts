import type { ApiResponse, TradingSession } from '../types';
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
  userUid:          string;
  strategyConfigId: number;
  symbol:           string;
  mode:             'LIVE' | 'PAPER';
  cooldownBarsLeft: number;
  consecSlCount:    number;
  currentEquity:    number;
  peakEquity:       number;
}) =>
  apiClient.post<ApiResponse<TradingSession>>('/trade/insertTradingSession', params);

/** 세션 상태 변경 (중지/재실행) - PUT /api/trade/updateTradingSession */
export const updateTradingSession = (params: { id: string; active: number }) =>
  apiClient.put<ApiResponse<TradingSession>>('/trade/updateTradingSession', params);

/** 세션 삭제 - DELETE /api/trade/deleteTradingSession */
export const deleteTradingSession = (id: string) =>
  apiClient.delete<ApiResponse<TradingSession>>('/trade/deleteTradingSession', { id });

/** 거래 이력 조회 - POST /api/tradeHistory/getTradeHistoryList */
export const getTradeHistoryList = (params: {
  userUid?: string | null;
}) =>
  apiClient.post<ApiResponse<import('../types').TradeHistory[]>>('/tradeHistory/getTradeHistoryList', params);

/** 자본금 조회 - POST /api/finpilot/balance */
export const getBalance = (userUid: string, mode: 'LIVE' | 'PAPER', accountNo?: string) =>
  apiClient.post<ApiResponse<{ balance: number }>>('/finpilot/balance', { userUid, mode, ...(accountNo ? { accountNo } : {}) });
