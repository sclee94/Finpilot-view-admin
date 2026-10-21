import type { ApiResponse, DashboardPeriod, DashboardSeries, DashboardSummary } from '../types';
import { apiClient } from './apiClient';

/** 관리자 대시보드 카드/최근 활동/최근 거래 - GET /api/dashboard/summary (관리자 토큰 아니면 403) */
export const getDashboardSummary = () =>
  apiClient.get<ApiResponse<DashboardSummary>>('/dashboard/summary');

/** 관리자 대시보드 차트 시계열 - GET /api/dashboard/series?period=... */
export const getDashboardSeries = (period: DashboardPeriod) =>
  apiClient.get<ApiResponse<DashboardSeries>>(`/dashboard/series?period=${period}`);
