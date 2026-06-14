import { useState, useEffect, useRef, useCallback } from 'react';
import PageLayout from '../../components/PageLayout';
import { apiClient } from '../../api/apiClient';
import { authStorage } from '../../utils/auth';
import { PERMISSIONS } from '../../constants';
import type { ApiResponse, PageResponse } from '../../types/index';
import Pagination from '../../components/Pagination';
import { getSymbolName } from '../../constants/symbolNames';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StrategyParams {
  symbol:                string;
  adx_threshold:         number;
  adx_sideways_floor:    number;
  adx_persist:           number;
  rsi_long_entry:        number;
  rsi_short_entry:       number;
  rsi_oversold_entry:    number;
  atr_sl_mult:           number;
  atr_tp_mult:           number;
  min_hold_bars:         number;
  sl_cooldown_bars:      number;
  consec_sl_limit:       number;
  max_dd_stop:           number;
  commission:            number;
  slippage:              number;
  risk_per_trade:        number;
  initial_capital:       number;
  use_prev_bar_signal:   boolean;
  indicator_window:      number;
  trading_days_per_year: number;
  max_add_count:         number;
}

interface BoardItem {
  id:     number;
  title:  string;
  symbol: string;
  date:   string;
  params: StrategyParams;
}

// BacktestDTO (BacktestTradeDTO 포함) — Java @JsonFormat: "yyyy-MM-dd HH:mm"
interface BacktestTrade {
  id:               number;
  backtestResultId: number;
  userUid:          string;
  tradeNo:          number;
  symbol:           string;
  direction:        string;
  entryTime:        string;
  exitTime:         string;
  entryPrice:       number;
  exitPrice:        number;
  shares:           number;
  positionSizePct:  number;
  result:           string;
  returnPct:        number;
  equity:           number;
}

interface BacktestResult {
  id:               number;
  userUid:          string;
  userName?:        string;
  strategyConfigId: number | null;
  symbol:           string;
  periodStart:      string;
  periodEnd:        string;
  periodDays:       number;
  totalTrades:      number;
  winRate:          number;
  returnPct:        number;
  mddPct:           number;
  sharpe:           number | null;
  sharpeNote:       string | null;
  strategyTitle?:   string | null;
  createdAt:        string;
  trades?:          BacktestTrade[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

interface StrategyConfigDTO {
  id?:               number;
  title?:            string;
  symbol?:           string;
  initialCapital?:   number;
  riskPerTrade?:     number;
  usePrevBarSignal?: boolean;
  adxThreshold?:     number;
  adxSidewaysFloor?: number;
  adxPersist?:       number;
  rsiLongEntry?:        number;
  rsiShortEntry?:       number;
  rsiOversoldEntry?:    number;
  maxAddCount?:         number;
  atrSlMult?:        number;
  atrTpMult?:        number;
  minHoldBars?:      number;
  slCooldownBars?:   number;
  consecSlLimit?:    number;
  maxDdStop?:        number;
  commission?:       number;
  slippage?:         number;
  indicatorWindow?:  number;
  tradingDaysPerYear?: number;
  isUse?:            number;
  createdAt?:        string;
}

function dtoToApplied(dto: StrategyConfigDTO): BoardItem {
  return {
    id:     dto.id!,
    title:  dto.title ?? '',
    symbol: dto.symbol ?? '',
    date:   dto.createdAt ?? '',
    params: {
      symbol:                dto.symbol ?? '',
      adx_threshold:         dto.adxThreshold ?? 0,
      adx_sideways_floor:    dto.adxSidewaysFloor ?? 15,
      adx_persist:           dto.adxPersist ?? 0,
      rsi_long_entry:        dto.rsiLongEntry ?? 0,
      rsi_short_entry:       dto.rsiShortEntry ?? 0,
      rsi_oversold_entry:    dto.rsiOversoldEntry ?? 30,
      atr_sl_mult:           dto.atrSlMult ?? 0,
      atr_tp_mult:           dto.atrTpMult ?? 0,
      min_hold_bars:         dto.minHoldBars ?? 0,
      sl_cooldown_bars:      dto.slCooldownBars ?? 0,
      consec_sl_limit:       dto.consecSlLimit ?? 0,
      max_dd_stop:           dto.maxDdStop ?? 0,
      commission:            dto.commission ?? 0,
      slippage:              dto.slippage ?? 0,
      risk_per_trade:        dto.riskPerTrade ?? 0,
      use_prev_bar_signal:   dto.usePrevBarSignal ?? false,
      initial_capital:       dto.initialCapital ?? 0,
      indicator_window:      dto.indicatorWindow ?? 14,
      trading_days_per_year: dto.tradingDaysPerYear ?? 252,
      max_add_count:         dto.maxAddCount ?? 3,
    },
  };
}

const RESULTS_SIZE = 15;

const PARAM_LABELS: { key: keyof StrategyParams; label: string; format?: (v: unknown) => string }[] = [
  { key: 'symbol',                label: '종목 코드' },
  { key: 'initial_capital',       label: '초기 자본',       format: v => Number(v).toLocaleString() + ' 원' },
  { key: 'risk_per_trade',        label: '위험 비율',        format: v => (Number(v) * 100).toFixed(1) + '%' },
  { key: 'adx_threshold',         label: 'ADX 임계값' },
  { key: 'adx_sideways_floor',    label: 'ADX 횡보 하한선' },
  { key: 'adx_persist',           label: 'ADX 지속 기간' },
  { key: 'rsi_long_entry',        label: 'RSI 롱 진입' },
  { key: 'rsi_short_entry',       label: 'RSI 숏 진입' },
  { key: 'rsi_oversold_entry',    label: 'RSI 과매도 반등' },
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
  { key: 'max_add_count',         label: '최대 추가 매수' },
];

// ─── Trade Detail Modal ───────────────────────────────────────────────────────

function TradeDetailModal({ result, compResults, compPage, compTotalPage, compTotalCount, onCompPageChange, onClose }: {
  result:           BacktestResult;
  compResults:      BacktestResult[];
  compPage:         number;
  compTotalPage:    number;
  compTotalCount:   number;
  onCompPageChange: (page: number) => void;
  onClose:          () => void;
}) {
  const trades = result.trades ?? [];
  const [showCompare, setShowCompare] = useState(false);
  const [compareTarget, setCompareTarget] = useState<BacktestResult | null>(null);

  const COMPARE_FIELDS: { label: string; getValue: (r: BacktestResult) => string; colorFn?: (r: BacktestResult) => string }[] = [
    { label: '총 거래', getValue: r => `${r.totalTrades}건` },
    { label: '승률',   getValue: r => `${Number(r.winRate).toFixed(1)}%`, colorFn: () => 'text-teal-400' },
    { label: '수익률', getValue: r => `${Number(r.returnPct) >= 0 ? '+' : ''}${Number(r.returnPct).toFixed(2)}%`,
      colorFn: r => Number(r.returnPct) >= 0 ? 'text-teal-400' : 'text-red-400' },
    { label: '최대 낙폭', getValue: r => `-${Number(r.mddPct).toFixed(2)}%`, colorFn: () => 'text-red-400' },
    { label: '샤프 지수', getValue: r => r.sharpe != null ? Number(r.sharpe).toFixed(3) : '-' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
          <div>
            <h2 className="text-xl font-bold text-white">{getSymbolName(result.symbol)} <span className="text-zinc-300 text-base font-normal">({result.symbol})</span> 백테스트 결과</h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                {result.periodStart} ~ {result.periodEnd}
              </span>
              <span className="text-xs text-zinc-500">{result.periodDays}일</span>
              <span className="text-xs text-zinc-500">{result.createdAt}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <button
              onClick={() => setShowCompare(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                showCompare ? 'bg-teal-500 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <i className="ri-bar-chart-grouped-line"></i>
              백테스트 결과 비교하기
            </button>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer">
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        </div>

        {/* Compare Panel */}
        {showCompare && (
          <div className="border-b border-zinc-800 px-6 py-4 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-300">백테스트 결과 목록 ({compTotalCount}건)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-700 bg-zinc-800/50">
                    <th className="text-left px-3 py-2 text-zinc-400 font-medium">전략명</th>
                    <th className="text-left px-3 py-2 text-zinc-400 font-medium">종목</th>
                    <th className="text-left px-3 py-2 text-zinc-400 font-medium">기간</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {compResults.map(r => {
                    const isCurrent = r.id === result.id;
                    const isSelected = compareTarget?.id === r.id;
                    return (
                      <tr
                        key={r.id}
                        onClick={() => !isCurrent && setCompareTarget(isSelected ? null : r)}
                        className={`transition-colors ${
                          isCurrent ? 'bg-teal-500/10' :
                          isSelected ? 'bg-blue-500/10 cursor-pointer' :
                          'hover:bg-zinc-800/40 cursor-pointer'
                        }`}
                      >
                        <td className="px-3 py-2.5 text-zinc-200">
                          {r.strategyTitle ?? '-'}
                          {isCurrent && <span className="ml-2 text-xs text-teal-400 font-medium">현재</span>}
                          {isSelected && <span className="ml-2 text-xs text-blue-400 font-medium">비교 대상</span>}
                        </td>
                        <td className="px-3 py-2.5 text-zinc-400">
                          {getSymbolName(r.symbol)}
                          <span className="text-zinc-400 ml-1 text-xs">({r.symbol})</span>
                        </td>
                        <td className="px-3 py-2.5 text-zinc-200">
                          {r.periodStart} ~ {r.periodEnd}
                          <span className="text-zinc-400 ml-1">({r.periodDays}일)</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {compTotalPage > 1 && (
              <Pagination currentPage={compPage} totalPages={compTotalPage} onPageChange={onCompPageChange} />
            )}

            {/* 비교 뷰 */}
            {compareTarget && (
              <div className="mt-2">
                <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                  {/* 현재 */}
                  <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4">
                    <p className="text-xs font-semibold text-teal-400 mb-3">현재 — {result.strategyTitle ?? result.symbol}</p>
                    <div className="space-y-2.5">
                      {COMPARE_FIELDS.map(f => (
                        <div key={f.label} className="flex items-center justify-between">
                          <span className="text-xs text-zinc-500">{f.label}</span>
                          <span className={`text-sm font-semibold ${f.colorFn ? f.colorFn(result) : 'text-zinc-200'}`}>
                            {f.getValue(result)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* VS */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-zinc-500">VS</span>
                  </div>

                  {/* 비교 대상 */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <p className="text-xs font-semibold text-blue-400 mb-3 text-right">비교 — {compareTarget.strategyTitle ?? compareTarget.symbol}</p>
                    <div className="space-y-2.5">
                      {COMPARE_FIELDS.map(f => (
                        <div key={f.label} className="flex items-center justify-between">
                          <span className={`text-sm font-semibold ${f.colorFn ? f.colorFn(compareTarget) : 'text-zinc-200'}`}>
                            {f.getValue(compareTarget)}
                          </span>
                          <span className="text-xs text-zinc-500">{f.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary Cards */}
        <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-zinc-800">
          <div className="bg-zinc-800 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-zinc-500 mb-1">총 거래</p>
            <p className="text-lg font-bold text-zinc-100">{result.totalTrades}건</p>
          </div>
          <div className="bg-zinc-800 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-zinc-500 mb-1">승률</p>
            <p className="text-lg font-bold text-teal-400">{Number(result.winRate).toFixed(1)}%</p>
          </div>
          <div className="bg-zinc-800 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-zinc-500 mb-1">수익률</p>
            <p className={`text-lg font-bold ${Number(result.returnPct) >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
              {Number(result.returnPct) >= 0 ? '+' : ''}{Number(result.returnPct).toFixed(2)}%
            </p>
          </div>
          <div className="bg-zinc-800 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-zinc-500 mb-1">최대 낙폭</p>
            <p className="text-lg font-bold text-red-400">-{Number(result.mddPct).toFixed(2)}%</p>
          </div>
          {result.sharpe !== null && result.sharpe !== undefined && (
            <div className="bg-zinc-800 rounded-xl px-4 py-3 text-center col-span-2 sm:col-span-4">
              <p className="text-xs text-zinc-500 mb-1">샤프 지수</p>
              <p className="text-lg font-bold text-zinc-100">{Number(result.sharpe).toFixed(3)}</p>
              {result.sharpeNote && <p className="text-xs text-zinc-500 mt-0.5">{result.sharpeNote}</p>}
            </div>
          )}
        </div>

        {/* Trade Table */}
        <div className="px-6 pb-6 pt-4">
          <h3 className="text-base font-semibold text-zinc-200 mb-3">개별 거래 내역 ({trades.length}건)</h3>
          {trades.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-zinc-500">
              거래 내역이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-700 bg-zinc-800/50">
                    <th className="text-left px-3 py-2.5 text-zinc-400 font-medium">No</th>
                    <th className="text-left px-3 py-2.5 text-zinc-400 font-medium">방향</th>
                    <th className="text-left px-3 py-2.5 text-zinc-400 font-medium">진입 시각</th>
                    <th className="text-left px-3 py-2.5 text-zinc-400 font-medium">청산 시각</th>
                    <th className="text-right px-3 py-2.5 text-zinc-400 font-medium">진입가</th>
                    <th className="text-right px-3 py-2.5 text-zinc-400 font-medium">청산가</th>
                    <th className="text-right px-3 py-2.5 text-zinc-400 font-medium">수량</th>
                    <th className="text-right px-3 py-2.5 text-zinc-400 font-medium">비중</th>
                    <th className="text-left px-3 py-2.5 text-zinc-400 font-medium">청산 사유</th>
                    <th className="text-right px-3 py-2.5 text-zinc-400 font-medium">수익률</th>
                    <th className="text-right px-3 py-2.5 text-zinc-400 font-medium">누적자산</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {trades.map(t => (
                    <tr key={t.id ?? t.tradeNo} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="px-3 py-2.5 text-zinc-500">{t.tradeNo}</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          t.direction === 'BUY' || t.direction === 'LONG'
                            ? 'bg-teal-500/20 text-teal-400'
                            : t.direction === 'ADD_LONG'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {t.direction === 'BUY'      ? '매수'
                          : t.direction === 'SELL'    ? '매도'
                          : t.direction === 'LONG'    ? '매수 (LONG)'
                          : t.direction === 'SHORT'   ? '매도 (SHORT)'
                          : t.direction === 'ADD_LONG' ? '추가매수'
                          : t.direction}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-zinc-400">{t.entryTime}</td>
                      <td className="px-3 py-2.5 text-zinc-400">{t.exitTime}</td>
                      <td className="px-3 py-2.5 text-right text-zinc-300">{Number(t.entryPrice).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right text-zinc-300">{Number(t.exitPrice).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right text-zinc-300">{t.shares}</td>
                      <td className="px-3 py-2.5 text-right text-zinc-400">{Number(t.positionSizePct).toFixed(1)}%</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          t.result === 'SL' ? 'bg-red-500/20 text-red-400' :
                          t.result === 'TP' ? 'bg-teal-500/20 text-teal-400' :
                                              'bg-zinc-700 text-zinc-400'
                        }`}>
                          {t.result === 'SL' ? 'SL 손절'
                          : t.result === 'TP' ? 'TP 익절'
                          : t.result}
                        </span>
                      </td>
                      <td className={`px-3 py-2.5 text-right font-medium ${Number(t.returnPct) >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                        {Number(t.returnPct) >= 0 ? '+' : ''}{Number(t.returnPct).toFixed(3)}%
                      </td>
                      <td className="px-3 py-2.5 text-right text-zinc-300">{(Number(t.equity) * 100).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TestLog() {
  const loginUser = authStorage.get();
  const isAdmin = (loginUser?.permission ?? 0) >= PERMISSIONS.ADMIN;

  const [appliedItem, setAppliedItem] = useState<BoardItem | null>(null);

  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [results,           setResults]           = useState<BacktestResult[]>([]);
  const [resultsLoading,    setResultsLoading]    = useState(false);
  const [resultsPage,       setResultsPage]       = useState(1);
  const [resultsTotalPage,  setResultsTotalPage]  = useState(1);
  const [resultsTotalCount, setResultsTotalCount] = useState(0);

  const [compResults,    setCompResults]    = useState<BacktestResult[]>([]);
  const [compPage,       setCompPage]       = useState(1);
  const [compTotalPage,  setCompTotalPage]  = useState(1);
  const [compTotalCount, setCompTotalCount] = useState(0);

  const [selectedResult, setSelectedResult]     = useState<BacktestResult | null>(null);
  const [detailLoading, setDetailLoading]       = useState(false);
  const [deleteTarget, setDeleteTarget]         = useState<BacktestResult | null>(null);

  // Applied strategy — 백테스트 전용 적용 우선, 없으면 isUse === 1 fallback
  const fetchApplied = useCallback(async () => {
    const userUid = authStorage.get()?.userUid;
    if (!userUid) return;
    try {
      const res = await apiClient.post<ApiResponse<import('../../types').PageResponse<StrategyConfigDTO>>>(
        '/strategy/getStrategyConfigList',
        { userUid },
      );
      const list = res.data?.content ?? [];
      // localStorage에 백테스트 전용 적용 항목이 있으면 우선 사용
      let applied: StrategyConfigDTO | null = null;
      try {
        const backtestRaw = localStorage.getItem('strategyBacktestApplied');
        if (backtestRaw) {
          const backtestApplied = JSON.parse(backtestRaw) as { id: number };
          applied = list.find(d => d.id === backtestApplied.id) ?? null;
        }
      } catch { /* ignore */ }
      if (!applied) applied = list.find(d => d.isUse === 1) ?? null;
      setAppliedItem(applied ? dtoToApplied(applied) : null);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchApplied();

    // 전략 설정 탭에서 적용/해제 시 동기화
    const handleCustom = () => fetchApplied();
    window.addEventListener('strategyAppliedChanged', handleCustom);
    window.addEventListener('strategyBacktestAppliedChanged', handleCustom);
    return () => {
      window.removeEventListener('strategyAppliedChanged', handleCustom);
      window.removeEventListener('strategyBacktestAppliedChanged', handleCustom);
    };
  }, [fetchApplied]);

  // Timer cleanup on unmount
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // ── API: 결과 목록 조회 ────────────────────────────────────────────────────
  const refreshResults = useCallback(async (uid: string, page = 1) => {
    setResultsLoading(true);
    setResultsPage(page);
    try {
      const res = await apiClient.post<ApiResponse<PageResponse<BacktestResult>>>(
        '/backtest/getBacktestList',
        {
          ...(isAdmin ? { userUid: null, userName: '', email: '', permission: 0, status: 0 } : { userUid: uid }),
          page,
          size: RESULTS_SIZE,
        },
      );
      setResults(res.data?.content ?? []);
      setResultsTotalPage(res.data?.totalPage ?? 1);
      setResultsTotalCount(res.data?.totalCount ?? 0);
    } catch { /* silent */ } finally {
      setResultsLoading(false);
    }
  }, [isAdmin]);

  const refreshCompResults = useCallback(async (uid: string, page = 1) => {
    setCompPage(page);
    try {
      const res = await apiClient.post<ApiResponse<PageResponse<BacktestResult>>>(
        '/backtest/getBacktestList',
        {
          ...(isAdmin ? { userUid: null, userName: '', email: '', permission: 0, status: 0 } : { userUid: uid }),
          page,
          size: RESULTS_SIZE,
        },
      );
      setCompResults(res.data?.content ?? []);
      setCompTotalPage(res.data?.totalPage ?? 1);
      setCompTotalCount(res.data?.totalCount ?? 0);
    } catch { /* silent */ }
  }, [isAdmin]);

  useEffect(() => {
    const userUid = authStorage.get()?.userUid;
    if (userUid) refreshResults(userUid, 1);
  }, [refreshResults]);

  const formatElapsed = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}분 ${s}초` : `${s}초`;
  };

  // ── API: 실행 ──────────────────────────────────────────────────────────────
  const handleRun = async () => {
    if (!appliedItem || running) return;
    const userUid = authStorage.get()?.userUid;
    if (!userUid) return;

    setRunning(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);

    try {
      const p = appliedItem.params;

      // 1) Python 백테스트 실행
      const runRes = await apiClient.post<ApiResponse<BacktestResult>>(
        '/finpilot/backtest/run',
        {
          userUid,
          id:                 appliedItem.id,
          title:              appliedItem.title,
          symbol:             p.symbol,
          adxThreshold:       p.adx_threshold,
          adxSidewaysFloor:   p.adx_sideways_floor,
          adxPersist:         p.adx_persist,
          diGapMin:           p.di_gap_min,
          rsiLongFloor:       p.rsi_long_floor,
          rsiLongEntry:       p.rsi_long_entry,
          rsiShortEntry:      p.rsi_short_entry,
          rsiOversoldEntry:   p.rsi_oversold_entry,
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
          maxAddCount:        p.max_add_count,
        },
      );

      if (runRes.data) {
        refreshResults(userUid, 1);
      } else {
        setErrorMessage(runRes.message || '백테스트 실행에 실패했습니다.');
      }
    } catch {
      setErrorMessage('서버 연결에 실패했습니다.');
    } finally {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setRunning(false);
    }
  };

  // ── API: 단건 조회 (trades 포함) ───────────────────────────────────────────
  const handleResultClick = async (result: BacktestResult) => {
    const userUid = authStorage.get()?.userUid;
    setDetailLoading(true);
    setSelectedResult(result); // 팝업 즉시 열기 (로딩 표시)
    if (userUid) refreshCompResults(userUid, 1);
    try {
      const res = await apiClient.post<ApiResponse<BacktestResult>>(
        '/backtest/getBacktest',
        { id: result.id, userUid },
      );
      if (res.data) setSelectedResult(res.data);
    } catch { /* silent */ } finally {
      setDetailLoading(false);
    }
  };

  // ── API: 삭제 ──────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const userUid = authStorage.get()?.userUid;
    try {
      await apiClient.delete<ApiResponse<BacktestResult>>(
        '/backtest/deleteBacktest',
        { id: deleteTarget.id, userUid },
      );
      if (selectedResult?.id === deleteTarget.id) setSelectedResult(null);
      if (userUid) refreshResults(userUid, resultsPage);
    } catch { /* silent */ } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <PageLayout>
      {/* 거래 내역 팝업 */}
      {selectedResult && !detailLoading && (
        <TradeDetailModal
          result={selectedResult}
          compResults={compResults}
          compPage={compPage}
          compTotalPage={compTotalPage}
          compTotalCount={compTotalCount}
          onCompPageChange={page => { const uid = authStorage.get()?.userUid; if (uid) refreshCompResults(uid, page); }}
          onClose={() => setSelectedResult(null)}
        />
      )}

      {/* 실행 실패 팝업 */}
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

      {/* 로딩 오버레이 (단건 조회 중) */}
      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <i className="ri-loader-4-line animate-spin text-teal-400 text-4xl"></i>
        </div>
      )}

      {/* 삭제 확인 팝업 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={() => setDeleteTarget(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                <i className="ri-delete-bin-line text-red-400 text-lg"></i>
              </div>
              <div>
                <p className="text-base font-semibold text-zinc-100">결과 삭제</p>
                <p className="text-sm text-zinc-400 mt-0.5">거래 내역도 함께 삭제됩니다.</p>
              </div>
            </div>
            <div className="bg-zinc-800 rounded-lg px-4 py-2.5">
              <p className="text-sm font-medium text-zinc-200">{deleteTarget.symbol}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{deleteTarget.periodStart} ~ {deleteTarget.periodEnd} · {deleteTarget.createdAt}</p>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors cursor-pointer">
                취소
              </button>
              <button onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 text-sm font-semibold bg-red-500 hover:bg-red-400 text-white rounded-lg transition-colors cursor-pointer">
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-zinc-100">백테스트</h1>

        {/* Applied Strategy Card — 일반 사용자만 표시 */}
        {!isAdmin && <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-200">적용된 전략 설정</h2>
            {running && (
              <span className="flex items-center gap-2 text-sm text-teal-400">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                실행 중 ({formatElapsed(elapsed)})
              </span>
            )}
          </div>

          {appliedItem ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl font-bold text-teal-300">{appliedItem.title}</span>
                <span className="text-sm text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full">{appliedItem.symbol}</span>
                <span className="text-sm text-zinc-500">{appliedItem.date}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
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
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-zinc-500">
              <i className="ri-settings-3-line text-4xl mb-2"></i>
              <p className="text-base">전략 설정에서 적용할 설정을 선택해 주세요.</p>
            </div>
          )}

          {/* Loading Bar */}
          {running && (
            <div className="mb-4 bg-zinc-800 rounded-xl p-4 flex items-center gap-4">
              <i className="ri-loader-4-line animate-spin text-teal-400 text-xl shrink-0"></i>
              <div className="flex-1">
                <p className="text-sm text-zinc-300 font-medium">백테스트 실행 중...</p>
                <p className="text-xs text-zinc-500 mt-0.5">결과 분석까지 최대 3~5분 소요될 수 있습니다.</p>
                <div className="mt-2 h-1 bg-zinc-700 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full animate-pulse w-full"></div>
                </div>
              </div>
              <span className="text-sm text-zinc-400 font-mono shrink-0">{formatElapsed(elapsed)}</span>
            </div>
          )}

          <button
            onClick={handleRun}
            disabled={!appliedItem || running}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold transition-colors ${
              !appliedItem || running
                ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                : 'bg-teal-500 hover:bg-teal-400 text-white cursor-pointer'
            }`}
          >
            {running
              ? <><i className="ri-loader-4-line animate-spin text-lg"></i>실행 중...</>
              : <><i className="ri-play-fill text-lg"></i>실행하기</>
            }
          </button>
        </div>}

        {/* Backtest Result Board */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-200">백테스트 결과</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-500">총 {resultsTotalCount}건</span>
              <button
                onClick={() => { const uid = authStorage.get()?.userUid; if (uid) refreshResults(uid, resultsPage); }}
                className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                title="새로고침"
              >
                <i className={`ri-refresh-line ${resultsLoading ? 'animate-spin' : ''}`}></i>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-800/50">
                  <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400 w-12">No</th>
                  {isAdmin && <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">이름</th>}
                  <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">전략명</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">종목</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">기간</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-zinc-400">거래수</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-zinc-400">승률</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-zinc-400">수익률</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-zinc-400">MDD</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-zinc-400">샤프</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">실행일시</th>
                  {!isAdmin && <th className="px-4 py-3 text-sm font-medium text-zinc-400 w-16"></th>}
                </tr>
              </thead>
              <tbody>
                {resultsLoading ? (
                  <tr>
                    <td colSpan={isAdmin ? 10 : 11} className="text-center py-16 text-zinc-500">
                      <i className="ri-loader-4-line animate-spin text-3xl block mb-2"></i>
                      불러오는 중...
                    </td>
                  </tr>
                ) : results.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 10 : 11} className="text-center py-16 text-zinc-500">
                      <i className="ri-file-list-line text-4xl block mb-2"></i>
                      백테스트 결과가 없습니다.
                    </td>
                  </tr>
                ) : (
                  results.map((r, idx) => {
                    const no = resultsTotalCount - (resultsPage - 1) * RESULTS_SIZE - idx;
                    return (
                    <tr
                      key={r.id}
                      onClick={() => handleResultClick(r)}
                      className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3.5 text-sm text-zinc-500">{no}</td>
                      {isAdmin && <td className="px-4 py-3.5 text-sm text-zinc-300">{r.userName ?? '-'}</td>}
                      <td className="px-4 py-3.5 text-sm font-medium text-zinc-200">{r.strategyTitle ?? '-'}</td>
                      <td className="px-4 py-3.5 text-sm font-medium text-zinc-200">
                        {getSymbolName(r.symbol)}
                        <span className="text-zinc-300 ml-1 text-xs font-normal">({r.symbol})</span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-zinc-200">
                        {r.periodStart} ~ {r.periodEnd}
                        <span className="text-zinc-400 ml-1">({r.periodDays}일)</span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-right text-zinc-300">{r.totalTrades}</td>
                      <td className="px-4 py-3.5 text-sm text-right text-teal-400">{Number(r.winRate).toFixed(1)}%</td>
                      <td className={`px-4 py-3.5 text-sm text-right font-medium ${Number(r.returnPct) >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                        {Number(r.returnPct) >= 0 ? '+' : ''}{Number(r.returnPct).toFixed(2)}%
                      </td>
                      <td className="px-4 py-3.5 text-sm text-right text-red-400">-{Number(r.mddPct).toFixed(2)}%</td>
                      <td className="px-4 py-3.5 text-sm text-right text-zinc-300">
                        {r.sharpe !== null && r.sharpe !== undefined ? Number(r.sharpe).toFixed(3) : '-'}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-zinc-300">{r.createdAt}</td>
                      {!isAdmin && (
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={e => { e.stopPropagation(); setDeleteTarget(r); }}
                            className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                          >
                            제거
                          </button>
                        </td>
                      )}
                    </tr>
                  ); })
                )}
              </tbody>
            </table>
          </div>
          {resultsTotalPage > 1 && (
            <div className="px-6 py-4 border-t border-zinc-800">
              <Pagination
                currentPage={resultsPage}
                totalPages={resultsTotalPage}
                onPageChange={page => { const uid = authStorage.get()?.userUid; if (uid) refreshResults(uid, page); }}
              />
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
