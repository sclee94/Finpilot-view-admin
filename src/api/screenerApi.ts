import { apiClient } from './apiClient';
import type { ApiResponse } from '../types/index';
import type { ScreenerResult } from '../pages/live/screenerTypes';

/** 온디맨드 종목 추천(스크리너) - POST /api/screener/recommend
 * 자동매매와 분리된 읽기전용 기능(trading_session 미생성). 종목별로 KIS를 순차 조회하므로
 * limit이 크면 수십 초~수 분 걸릴 수 있어 타임아웃을 넉넉히 잡는다. */
export const recommendScreener = (params: {
  userUid: string;
  category: 'KOSPI200';
  strategyConfigId: number | null;
  isLive: boolean;
  limit?: number;
}) =>
  apiClient.post<ApiResponse<ScreenerResult>>('/screener/recommend', params, 180000);
