import { useState } from 'react';
import type { BoardItem, StrategyParams } from '../strategyTypes';

interface BoardPanelProps {
  board: BoardItem[];
  selectedId: number | null;
  appliedItem: BoardItem | null;
  loading?: boolean;
  onClickItem: (item: BoardItem) => void;
  onDeleteItem: (id: number, e: React.MouseEvent) => void;
  onApplyItem: (item: BoardItem | null) => void;
}

const PARAM_SUMMARY_ROWS: { label: string; key: keyof StrategyParams; format?: (v: number) => string }[][] = [
  [
    { label: '초기 자본',     key: 'initial_capital', format: v => `${(v / 10000).toFixed(0)}만` },
    { label: '거래당 위험',   key: 'risk_per_trade',  format: v => `${(v * 100).toFixed(1)}%` },
  ],
  [
    { label: 'ADX 임계치',    key: 'adx_threshold' },
    { label: 'ADX 유지 봉',   key: 'adx_persist' },
  ],
  [
    { label: 'RSI 롱 상한',   key: 'rsi_long_entry' },
    { label: 'RSI 숏 하한',   key: 'rsi_short_entry' },
  ],
  [
    { label: '손절 ATR 배수', key: 'atr_sl_mult' },
    { label: '익절 ATR 배수', key: 'atr_tp_mult' },
  ],
  [
    { label: '최소 유지 봉',  key: 'min_hold_bars' },
    { label: 'SL 쿨다운 봉', key: 'sl_cooldown_bars' },
  ],
  [
    { label: '연속 손절 한도', key: 'consec_sl_limit' },
    { label: 'MDD 차단',       key: 'max_dd_stop', format: v => v === 0 ? '비활성' : String(v) },
  ],
  [
    { label: '수수료',        key: 'commission', format: v => `${(v * 100).toFixed(3)}%` },
    { label: '슬리피지',      key: 'slippage',   format: v => `${(v * 100).toFixed(3)}%` },
  ],
];

const MODAL_SECTIONS: { title: string; icon: string; rows: { label: string; key: keyof StrategyParams; format?: (v: number) => string }[] }[] = [
  {
    title: '자본 설정', icon: 'ri-funds-line',
    rows: [
      { label: '초기 자본금', key: 'initial_capital', format: v => `${v.toLocaleString()}원` },
      { label: '거래당 위험', key: 'risk_per_trade',  format: v => `${(v * 100).toFixed(1)}%` },
    ],
  },
  {
    title: '추세 지표 (ADX)', icon: 'ri-line-chart-line',
    rows: [
      { label: 'ADX 임계치',      key: 'adx_threshold' },
      { label: 'ADX 연속 유지 봉', key: 'adx_persist' },
    ],
  },
  {
    title: 'RSI 진입 조건', icon: 'ri-swap-line',
    rows: [
      { label: '롱 진입 RSI 상한', key: 'rsi_long_entry' },
      { label: '숏 진입 RSI 하한', key: 'rsi_short_entry' },
    ],
  },
  {
    title: '리스크 관리', icon: 'ri-shield-line',
    rows: [
      { label: '손절 ATR 배수',   key: 'atr_sl_mult' },
      { label: '익절 ATR 배수',   key: 'atr_tp_mult' },
      { label: '최소 유지 봉 수', key: 'min_hold_bars' },
      { label: 'SL 쿨다운 봉 수', key: 'sl_cooldown_bars' },
      { label: '연속 손절 한도',  key: 'consec_sl_limit' },
      { label: 'MDD 차단 비율',   key: 'max_dd_stop', format: v => v === 0 ? '비활성' : `${(v * 100).toFixed(0)}%` },
    ],
  },
  {
    title: '비용 설정', icon: 'ri-percent-line',
    rows: [
      { label: '수수료 (편도)',   key: 'commission', format: v => `${(v * 100).toFixed(3)}%` },
      { label: '슬리피지 (편도)', key: 'slippage',   format: v => `${(v * 100).toFixed(3)}%` },
    ],
  },
];

function ParamDetailModal({ item, onClose }: { item: BoardItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
          <div>
            <h2 className="text-xl font-bold text-white">{item.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">{item.symbol}</span>
              <span className="text-xs text-zinc-500">{item.date}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors mt-0.5 cursor-pointer">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <div className="px-6 pt-5 pb-2 flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-4 py-2">
            <i className="ri-stock-line text-teal-400"></i>
            <span className="text-sm text-zinc-400">종목</span>
            <span className="text-sm font-semibold text-zinc-100">{item.params.symbol}</span>
          </div>
          <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-4 py-2">
            <i className="ri-eye-line text-teal-400"></i>
            <span className="text-sm text-zinc-400">이전 봉 신호</span>
            <span className={`text-sm font-semibold ${item.params.use_prev_bar_signal ? 'text-teal-400' : 'text-zinc-400'}`}>
              {item.params.use_prev_bar_signal ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        <div className="px-6 pb-6 pt-3 space-y-4">
          {MODAL_SECTIONS.map(section => (
            <div key={section.title} className="bg-zinc-800/50 rounded-xl border border-zinc-700/50 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-zinc-700/50">
                <i className={`${section.icon} text-teal-400 text-lg`}></i>
                <span className="text-base font-semibold text-zinc-200">{section.title}</span>
              </div>
              <div className="grid grid-cols-2 divide-x divide-zinc-700/50">
                {section.rows.map(({ label, key, format }, i) => {
                  const val = item.params[key] as number;
                  const display = format ? format(val) : String(val);
                  return (
                    <div key={key} className={`flex items-center justify-between px-5 py-4 ${i >= 2 ? 'border-t border-zinc-700/50' : ''}`}>
                      <span className="text-base text-zinc-400">{label}</span>
                      <span className="text-base font-semibold text-zinc-100">{display}</span>
                    </div>
                  );
                })}
                {section.rows.length % 2 !== 0 && <div className="border-t border-zinc-700/50" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BoardPanel({ board, selectedId, appliedItem, loading, onClickItem, onDeleteItem, onApplyItem }: BoardPanelProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BoardItem | null>(null);

  return (
    <div className="min-w-0">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden sticky top-6">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-800/40">
          <i className="ri-list-check text-teal-400"></i>
          <h2 className="text-base font-semibold text-zinc-200">저장된 설정</h2>
          <span className="ml-auto text-sm text-zinc-500">{board.length}개</span>
        </div>

        {appliedItem && (
          <>
            {modalOpen && <ParamDetailModal item={appliedItem} onClose={() => setModalOpen(false)} />}
            <div
              onClick={() => setModalOpen(true)}
              className="border-b border-zinc-800 p-4 space-y-3 bg-teal-500/5 cursor-pointer hover:bg-teal-500/10 transition-colors group/summary"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="ri-check-double-line text-teal-400 text-base"></i>
                  <span className="text-base font-semibold text-teal-300">{appliedItem.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 opacity-0 group-hover/summary:opacity-100 transition-opacity">
                    <i className="ri-expand-diagonal-line mr-1"></i>클릭해서 상세보기
                  </span>
                  <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">{appliedItem.symbol}</span>
                  <button
                    onClick={e => { e.stopPropagation(); onApplyItem(null as unknown as BoardItem); }}
                    className="text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    <i className="ri-close-line text-sm"></i>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {PARAM_SUMMARY_ROWS.flat().map(({ label, key, format }) => {
                  const val = appliedItem.params[key];
                  const display = typeof val === 'boolean'
                    ? (val ? 'ON' : 'OFF')
                    : format ? format(val as number) : String(val);
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500">{label}</span>
                      <span className="text-sm font-medium text-zinc-200">{display}</span>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between col-span-2">
                  <span className="text-sm text-zinc-500">이전 봉 신호</span>
                  <span className="text-sm font-medium text-zinc-200">{appliedItem.params.use_prev_bar_signal ? 'ON' : 'OFF'}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={() => setDeleteTarget(null)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative z-10 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                  <i className="ri-delete-bin-line text-red-400 text-lg"></i>
                </div>
                <div>
                  <p className="text-base font-semibold text-zinc-100">설정 삭제</p>
                  <p className="text-sm text-zinc-400 mt-0.5">이 설정을 삭제하시겠습니까?</p>
                </div>
              </div>
              <div className="bg-zinc-800 rounded-lg px-4 py-2.5">
                <p className="text-sm font-medium text-zinc-200">{deleteTarget.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{deleteTarget.symbol} · {deleteTarget.date}</p>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors cursor-pointer">
                  취소
                </button>
                <button onClick={e => { onDeleteItem(deleteTarget.id, e as unknown as React.MouseEvent); setDeleteTarget(null); }}
                  className="flex-1 py-2.5 text-sm font-semibold bg-red-500 hover:bg-red-400 text-white rounded-lg transition-colors cursor-pointer">
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
            <i className="ri-loader-4-line animate-spin text-3xl mb-2"></i>
            <p className="text-sm">불러오는 중...</p>
          </div>
        ) : board.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
            <i className="ri-file-list-3-line text-3xl mb-2"></i>
            <p className="text-sm">저장된 설정이 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            <div className="grid grid-cols-[2rem_1fr_4.5rem_4rem_3rem_3rem] px-3 py-2 text-sm font-semibold text-zinc-500 bg-zinc-800/30">
              <span>No</span>
              <span>제목</span>
              <span>종목</span>
              <span>날짜</span>
              <span className="text-center">적용</span>
              <span className="text-center">제거</span>
            </div>
            {board.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => onClickItem(item)}
                className={`grid grid-cols-[2rem_1fr_4.5rem_4rem_3rem_3rem] items-center px-3 py-2.5 cursor-pointer transition-colors text-sm ${
                  selectedId === item.id ? 'bg-teal-500/10 border-l-2 border-teal-500' : 'hover:bg-zinc-800/50'
                }`}
              >
                <span className="text-zinc-500">{board.length - idx}</span>
                <span className={`truncate ${selectedId === item.id ? 'text-teal-300 font-medium' : 'text-zinc-300'}`}>
                  {item.title}
                </span>
                <span className="text-zinc-400 truncate">{item.symbol}</span>
                <span className="text-zinc-500">{item.date.replace(/\. /g, '.').replace(/\.$/, '')}</span>
                <div className="flex justify-center">
                  <button
                    onClick={e => { e.stopPropagation(); onApplyItem(item); }}
                    className={`px-1.5 py-0.5 rounded text-sm font-medium transition-colors ${
                      appliedItem?.id === item.id
                        ? 'bg-teal-500 text-white'
                        : 'bg-zinc-700 text-zinc-300 hover:bg-teal-500/80 hover:text-white'
                    }`}
                  >
                    적용
                  </button>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteTarget(item); }}
                    className="px-1.5 py-0.5 rounded text-sm font-medium bg-zinc-700 text-zinc-300 hover:bg-red-500/80 hover:text-white transition-colors"
                  >
                    제거
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
