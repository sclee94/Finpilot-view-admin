import { useState, useEffect, useCallback } from 'react';
import PageLayout from '../../components/PageLayout';
import { apiClient } from '../../api/apiClient';
import { authStorage } from '../../utils/auth';
import type { ApiResponse } from '../../types/index';
import type { StrategyConfigDTO, BoardItem } from '../strategy/strategyTypes';
import { dtoToBoardItem } from '../strategy/strategyTypes';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LiveStatus {
  id:               number;
  strategyConfigId: number;
  currentPosition:  'NONE' | 'LONG' | 'SHORT';
  barsHeld:         number;
  stopPrice:        number | null;
  tpPrice:          number | null;
  cooldownBarsLeft: number;
  consecSlCount:    number;
  currentEquity:    number;
  peakEquity:       number;
  createdAt:        string;
  lastUpdatedAt:    string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PARAM_LABELS: { key: keyof BoardItem['params']; label: string; format?: (v: unknown) => string }[] = [
  { key: 'symbol',                label: '종목 코드' },
  { key: 'initial_capital',       label: '초기 자본',       format: v => Number(v).toLocaleString() + ' 원' },
  { key: 'risk_per_trade',        label: '위험 비율',        format: v => (Number(v) * 100).toFixed(1) + '%' },
  { key: 'adx_threshold',         label: 'ADX 임계값' },
  { key: 'adx_persist',           label: 'ADX 지속 기간' },
  { key: 'rsi_long_entry',        label: 'RSI 롱 진입' },
  { key: 'rsi_short_entry',       label: 'RSI 숏 진입' },
  { key: 'atr_sl_mult',           label: 'ATR 손절 배수' },
  { key: 'atr_tp_mult',           label: 'ATR 익절 배수' },
  { key: 'min_hold_bars',         label: '최소 보유 봉' },
  { key: 'sl_cooldown_bars',      label: '손절 쿨다운' },
  { key: 'consec_sl_limit',       label: '연속 손절 한도' },
  { key: 'max_dd_stop',           label: '최대 낙폭 정지',   format: v => Number(v) === 0 ? '비활성' : String(v) },
  { key: 'commission',            label: '수수료',           format: v => (Number(v) * 100).toFixed(3) + '%' },
  { key: 'slippage',              label: '슬리피지',         format: v => (Number(v) * 100).toFixed(3) + '%' },
  { key: 'use_prev_bar_signal',   label: '이전 봉 신호',     format: v => v ? 'ON' : 'OFF' },
  { key: 'indicator_window',      label: '지표 룩백 기간' },
  { key: 'trading_days_per_year', label: '연간 거래일 수' },
];

const LIVE_PARAM_LABELS: { key: keyof BoardItem['params']; label: string; format?: (v: unknown) => string }[] = [
  { key: 'cooldown_bars_left', label: '쿨다운 잔여 봉' },
  { key: 'consec_sl_count',   label: '연속 손절 횟수' },
  { key: 'current_equity',    label: '현재 자산',   format: v => Number(v).toFixed(6) },
  { key: 'peak_equity',       label: '최고 자산',   format: v => Number(v).toFixed(6) },
];

function positionBadge(pos: LiveStatus['currentPosition']) {
  if (pos === 'LONG')  return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300">LONG</span>;
  if (pos === 'SHORT') return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-300">SHORT</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-zinc-700 text-zinc-400">NONE</span>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Live() {
  const [appliedItem, setAppliedItem] = useState<BoardItem | null>(null);
  const [investing, setInvesting]     = useState(false);
  const [liveStatus, setLiveStatus]   = useState<LiveStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [errorMessage, setErrorMessage]   = useState('');

  // Applied strategy — API 조회
  const fetchApplied = useCallback(async () => {
    const userUid = authStorage.get()?.userUid;
    if (!userUid) return;
    try {
      const res = await apiClient.post<ApiResponse<StrategyConfigDTO[]>>(
        '/strategy/getStrategyConfigList',
        { userUid },
      );
      const applied = (res.data ?? []).find(d => d.isUse === 1) ?? null;
      setAppliedItem(applied ? dtoToBoardItem(applied) : null);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchApplied();
    const handleCustom = () => fetchApplied();
    window.addEventListener('strategyAppliedChanged', handleCustom);
    return () => window.removeEventListener('strategyAppliedChanged', handleCustom);
  }, [fetchApplied]);

  // 현재 섹션 상태 조회
  const fetchLiveStatus = useCallback(async (strategyConfigId: number) => {
    setStatusLoading(true);
    try {
      const res = await apiClient.post<ApiResponse<LiveStatus>>(
        '/live/getStatus',
        { strategyConfigId },
      );
      setLiveStatus(res.data ?? null);
    } catch { /* silent */ } finally {
      setStatusLoading(false);
    }
  }, []);

  // 투자하기
  const handleInvest = async () => {
    if (!appliedItem || investing) return;
    const userUid = authStorage.get()?.userUid;
    if (!userUid) return;

    setInvesting(true);
    setErrorMessage('');
    try {
      const p = appliedItem.params;
      const res = await apiClient.post<ApiResponse<LiveStatus>>(
        '/trade/execute',
        {
          userUid,
          id:                 appliedItem.id,
          title:              appliedItem.title,
          symbol:             p.symbol,
          adxThreshold:       p.adx_threshold,
          adxPersist:         p.adx_persist,
          rsiLongEntry:       p.rsi_long_entry,
          rsiShortEntry:      p.rsi_short_entry,
          atrSlMult:          p.atr_sl_mult,
          atrTpMult:          p.atr_tp_mult,
          minHoldBars:        p.min_hold_bars,
          slCooldownBars:     p.sl_cooldown_bars,
          consecSlLimit:      p.consec_sl_limit,
          maxDdStop:          p.max_dd_stop,
          commission:         p.commission,
          slippage:           p.slippage,
          riskPerTrade:       p.risk_per_trade,
          usePrevBarSignal:   p.use_prev_bar_signal,
          initialCapital:     p.initial_capital,
          indicatorWindow:    p.indicator_window,
          tradingDaysPerYear: p.trading_days_per_year,
          cooldownBarsLeft:   p.cooldown_bars_left,
          consecSlCount:      p.consec_sl_count,
          currentEquity:      p.current_equity,
          peakEquity:         p.peak_equity,
        },
      );
      if (res.data) {
        setLiveStatus(res.data);
      } else {
        setErrorMessage(res.message || '투자 시작에 실패했습니다.');
      }
    } catch {
      setErrorMessage('서버 연결에 실패했습니다.');
    } finally {
      setInvesting(false);
    }
  };

  // 적용된 전략이 바뀌면 상태 새로 조회
  useEffect(() => {
    if (appliedItem) {
      fetchLiveStatus(appliedItem.id);
    } else {
      setLiveStatus(null);
    }
  }, [appliedItem, fetchLiveStatus]);

  return (
    <PageLayout>
      {/* 오류 팝업 */}
      {errorMessage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/50"
          onKeyDown={e => { if (e.key === 'Enter') setErrorMessage(''); }}
          tabIndex={-1}
          ref={el => el?.focus()}
        >
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-xs p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <i className="ri-error-warning-line text-red-400 text-2xl"></i>
            </div>
            <p className="text-sm text-zinc-200">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage('')}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              확인
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-zinc-100">실전투자</h1>

        {/* 적용된 전략 카드 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-zinc-200 mb-4">적용된 전략 설정</h2>

          {appliedItem ? (
            <>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="text-xl font-bold text-teal-300">{appliedItem.title}</span>
                <span className="text-sm text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full">{appliedItem.symbol}</span>
                <span className="text-sm text-zinc-500">{appliedItem.date}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                {PARAM_LABELS.map(({ key, label, format }) => {
                  const val = appliedItem.params[key];
                  return (
                    <div key={key} className="bg-zinc-800 rounded-xl px-4 py-3">
                      <p className="text-xs text-zinc-500 mb-1">{label}</p>
                      <p className="text-sm font-semibold text-zinc-200">{format ? format(val) : String(val)}</p>
                    </div>
                  );
                })}
              </div>
              {/* 실전투자 전용 */}
              <div className="border border-amber-500/30 rounded-xl bg-amber-500/5 p-4 mb-6">
                <div className="flex items-center gap-1.5 mb-3">
                  <i className="ri-live-line text-amber-400 text-sm"></i>
                  <span className="text-sm font-semibold text-amber-400">실전투자 전용</span>
                  <span className="text-xs text-amber-500/60 ml-1">백테스트에는 사용되지 않습니다</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {LIVE_PARAM_LABELS.map(({ key, label, format }) => {
                    const val = appliedItem.params[key];
                    return (
                      <div key={key} className="bg-amber-500/10 rounded-xl px-4 py-3">
                        <p className="text-xs text-amber-500/70 mb-1">{label}</p>
                        <p className="text-sm font-semibold text-amber-200">{format ? format(val) : String(val)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-zinc-500">
              <i className="ri-settings-3-line text-4xl mb-2"></i>
              <p className="text-base">전략 설정에서 적용할 설정을 선택해 주세요.</p>
            </div>
          )}

          <button
            onClick={handleInvest}
            disabled={!appliedItem || investing}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold transition-colors ${
              !appliedItem || investing
                ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-400 text-white cursor-pointer'
            }`}
          >
            {investing
              ? <><i className="ri-loader-4-line animate-spin text-lg"></i>처리 중...</>
              : <><i className="ri-live-line text-lg"></i>투자하기</>
            }
          </button>
        </div>

        {/* 현재 섹션 */}
        {(liveStatus || statusLoading) && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-zinc-200">현재 섹션</h2>
                {liveStatus && (
                  <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <i className="ri-time-line"></i>
                    15분마다 업데이트
                  </span>
                )}
              </div>
              {liveStatus && (
                <button
                  onClick={() => appliedItem && fetchLiveStatus(appliedItem.id)}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  title="새로고침"
                >
                  <i className={`ri-refresh-line ${statusLoading ? 'animate-spin' : ''}`}></i>
                </button>
              )}
            </div>

            {statusLoading && !liveStatus ? (
              <div className="flex items-center justify-center py-10">
                <i className="ri-loader-4-line animate-spin text-teal-400 text-3xl"></i>
              </div>
            ) : liveStatus ? (
              <div className="space-y-4">
                {/* 포지션 + 보유 봉 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-zinc-800 rounded-xl px-4 py-3">
                    <p className="text-xs text-zinc-500 mb-1.5">현재 포지션</p>
                    {positionBadge(liveStatus.currentPosition)}
                  </div>
                  <div className="bg-zinc-800 rounded-xl px-4 py-3">
                    <p className="text-xs text-zinc-500 mb-1">보유 봉 수</p>
                    <p className="text-sm font-semibold text-zinc-200">{liveStatus.barsHeld}</p>
                  </div>
                  <div className="bg-zinc-800 rounded-xl px-4 py-3">
                    <p className="text-xs text-zinc-500 mb-1">손절가 (Stop)</p>
                    <p className="text-sm font-semibold text-zinc-200">
                      {liveStatus.stopPrice != null ? liveStatus.stopPrice.toLocaleString() : '-'}
                    </p>
                  </div>
                  <div className="bg-zinc-800 rounded-xl px-4 py-3">
                    <p className="text-xs text-zinc-500 mb-1">익절가 (TP)</p>
                    <p className="text-sm font-semibold text-zinc-200">
                      {liveStatus.tpPrice != null ? liveStatus.tpPrice.toLocaleString() : '-'}
                    </p>
                  </div>
                </div>

                {/* 리스크 관리 상태 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-zinc-800 rounded-xl px-4 py-3">
                    <p className="text-xs text-zinc-500 mb-1">쿨다운 잔여 봉</p>
                    <p className={`text-sm font-semibold ${liveStatus.cooldownBarsLeft > 0 ? 'text-amber-400' : 'text-zinc-200'}`}>
                      {liveStatus.cooldownBarsLeft}
                    </p>
                  </div>
                  <div className="bg-zinc-800 rounded-xl px-4 py-3">
                    <p className="text-xs text-zinc-500 mb-1">연속 손절 횟수</p>
                    <p className={`text-sm font-semibold ${liveStatus.consecSlCount > 0 ? 'text-red-400' : 'text-zinc-200'}`}>
                      {liveStatus.consecSlCount}
                    </p>
                  </div>
                  <div className="bg-zinc-800 rounded-xl px-4 py-3">
                    <p className="text-xs text-zinc-500 mb-1">현재 자산</p>
                    <p className={`text-sm font-semibold ${liveStatus.currentEquity >= 1 ? 'text-teal-400' : 'text-red-400'}`}>
                      {liveStatus.currentEquity.toFixed(6)}
                    </p>
                  </div>
                  <div className="bg-zinc-800 rounded-xl px-4 py-3">
                    <p className="text-xs text-zinc-500 mb-1">최고 자산</p>
                    <p className="text-sm font-semibold text-zinc-200">
                      {liveStatus.peakEquity.toFixed(6)}
                    </p>
                  </div>
                </div>

                {/* 메타 */}
                <div className="flex items-center gap-4 pt-1 flex-wrap">
                  <span className="text-xs text-zinc-600">
                    생성: {liveStatus.createdAt}
                  </span>
                  <span className="text-xs text-zinc-600">
                    마지막 업데이트: {liveStatus.lastUpdatedAt}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
