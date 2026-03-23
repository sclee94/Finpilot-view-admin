import { useState, useEffect } from 'react';
import PageLayout from '../../components/PageLayout';

interface StrategyParams {
  symbol: string;
  adx_threshold: number;
  adx_persist: number;
  rsi_long_entry: number;
  rsi_short_entry: number;
  atr_sl_mult: number;
  atr_tp_mult: number;
  min_hold_bars: number;
  sl_cooldown_bars: number;
  consec_sl_limit: number;
  max_dd_stop: number;
  commission: number;
  slippage: number;
  risk_per_trade: number;
  initial_capital: number;
  use_prev_bar_signal: boolean;
}

interface BoardItem {
  id: number;
  title: string;
  symbol: string;
  date: string;
  params: StrategyParams;
}

interface TestLogEntry {
  no: number;
  title: string;
  stockName: string;
  strategy: string;
  date: string;
}

const APPLIED_KEY = 'strategyApplied';
const TESTLOG_KEY = 'testLogEntries';

function loadApplied(): BoardItem | null {
  try {
    const saved = localStorage.getItem(APPLIED_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return null;
}

function loadLogs(): TestLogEntry[] {
  try {
    const saved = localStorage.getItem(TESTLOG_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return [];
}

const PARAM_LABELS: { key: keyof StrategyParams; label: string; format?: (v: unknown) => string }[] = [
  { key: 'symbol',            label: '종목 코드' },
  { key: 'initial_capital',   label: '초기 자본',       format: v => Number(v).toLocaleString() + ' 원' },
  { key: 'risk_per_trade',    label: '위험 비율',        format: v => (Number(v) * 100).toFixed(1) + '%' },
  { key: 'adx_threshold',     label: 'ADX 임계값' },
  { key: 'adx_persist',       label: 'ADX 지속 기간' },
  { key: 'rsi_long_entry',    label: 'RSI 롱 진입' },
  { key: 'rsi_short_entry',   label: 'RSI 숏 진입' },
  { key: 'atr_sl_mult',       label: 'ATR 손절 배수' },
  { key: 'atr_tp_mult',       label: 'ATR 익절 배수' },
  { key: 'min_hold_bars',     label: '최소 보유 봉' },
  { key: 'sl_cooldown_bars',  label: '손절 쿨다운' },
  { key: 'consec_sl_limit',   label: '연속 손절 한도' },
  { key: 'max_dd_stop',       label: '최대 낙폭 정지' },
  { key: 'commission',        label: '수수료' },
  { key: 'slippage',          label: '슬리피지' },
  { key: 'use_prev_bar_signal', label: '이전 봉 신호', format: v => v ? 'ON' : 'OFF' },
];

export default function TestLog() {
  const [appliedItem, setAppliedItem] = useState<BoardItem | null>(null);
  const [logs, setLogs] = useState<TestLogEntry[]>(loadLogs);
  const [running, setRunning] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  useEffect(() => {
    setAppliedItem(loadApplied());

    // 전략 설정에서 applied 변경 시 동기화 (같은 탭)
    const handleCustom = (e: Event) => {
      setAppliedItem((e as CustomEvent).detail ?? null);
    };
    // 다른 탭에서 변경 시 동기화
    const handleStorage = (e: StorageEvent) => {
      if (e.key === APPLIED_KEY) {
        setAppliedItem(e.newValue ? JSON.parse(e.newValue) : null);
      }
    };

    window.addEventListener('strategyAppliedChanged', handleCustom);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('strategyAppliedChanged', handleCustom);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleRun = () => {
    if (!appliedItem || running) return;
    setRunning(true);

    const newEntry: TestLogEntry = {
      no:         logs.length + 1,
      title:      appliedItem.title,
      stockName:  appliedItem.symbol,
      strategy:   `ADX ${appliedItem.params.adx_threshold} / RSI ${appliedItem.params.rsi_long_entry}·${appliedItem.params.rsi_short_entry}`,
      date:       new Date().toLocaleString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      }),
    };

    const updated = [newEntry, ...logs];
    setLogs(updated);
    localStorage.setItem(TESTLOG_KEY, JSON.stringify(updated));
  };

  const handleStop = () => {
    setRunning(false);
  };

  const handleDeleteConfirm = () => {
    const updated = logs.filter(l => l.no !== deleteTarget);
    setLogs(updated);
    localStorage.setItem(TESTLOG_KEY, JSON.stringify(updated));
    setDeleteTarget(null);
  };

  return (
    <PageLayout>
      {/* 삭제 확인 팝업 */}
      {deleteTarget !== null && (() => {
        const target = logs.find(l => l.no === deleteTarget);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={() => setDeleteTarget(null)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative z-10 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                  <i className="ri-delete-bin-line text-red-400 text-lg"></i>
                </div>
                <div>
                  <p className="text-base font-semibold text-zinc-100">기록 삭제</p>
                  <p className="text-sm text-zinc-400 mt-0.5">이 기록을 삭제하시겠습니까?</p>
                </div>
              </div>
              {target && (
                <div className="bg-zinc-800 rounded-lg px-4 py-2.5">
                  <p className="text-sm font-medium text-zinc-200">{target.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{target.stockName} · {target.date}</p>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-2.5 text-sm font-semibold bg-red-500 hover:bg-red-400 text-white rounded-lg transition-colors cursor-pointer"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-zinc-100">전략 테스트</h1>

        {/* 적용된 전략 카드 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-200">적용된 전략 설정</h2>
            {running && (
              <span className="flex items-center gap-2 text-sm text-teal-400">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                실행 중
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
                      <p className="text-sm font-semibold text-zinc-200">
                        {format ? format(val) : String(val)}
                      </p>
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

          {/* 실행/중지 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={handleRun}
              disabled={!appliedItem || running}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold transition-colors ${
                !appliedItem || running
                  ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                  : 'bg-teal-500 hover:bg-teal-400 text-white cursor-pointer'
              }`}
            >
              <i className="ri-play-fill text-lg"></i>
              실행하기
            </button>
            <button
              onClick={handleStop}
              disabled={!running}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold transition-colors ${
                !running
                  ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-400 text-white cursor-pointer'
              }`}
            >
              <i className="ri-stop-fill text-lg"></i>
              중지
            </button>
          </div>
        </div>

        {/* 테스트 로그 리스트 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-200">실행 기록</h2>
            <span className="text-sm text-zinc-500">총 {logs.length}건</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-800/50">
                  <th className="text-left px-6 py-3 text-sm font-medium text-zinc-400 w-16">No</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-zinc-400">제목</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-zinc-400">종목명</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-zinc-400">적용 전략</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-zinc-400">날짜</th>
                  <th className="px-6 py-3 text-sm font-medium text-zinc-400 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-zinc-500">
                      <i className="ri-file-list-line text-4xl block mb-2"></i>
                      실행 기록이 없습니다.
                    </td>
                  </tr>
                ) : (
                  logs.map((entry) => (
                    <tr key={entry.no} className="border-b border-zinc-800 hover:bg-zinc-800/40 transition-colors">
                      <td className="px-6 py-4 text-sm text-zinc-500">{entry.no}</td>
                      <td className="px-6 py-4 text-sm font-medium text-zinc-200">{entry.title}</td>
                      <td className="px-6 py-4 text-sm text-zinc-300">{entry.stockName}</td>
                      <td className="px-6 py-4 text-sm text-zinc-400">{entry.strategy}</td>
                      <td className="px-6 py-4 text-sm text-zinc-500">{entry.date}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setDeleteTarget(entry.no)}
                          className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                        >
                          제거
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
