import { useState, useEffect } from 'react';
import PageLayout from '../../components/PageLayout';
import { apiClient } from '../../api/apiClient';
import type { ApiResponse } from '../../types';

const SYMBOL_OPTIONS = [
  { value: '^KS11',     label: 'KOSPI (^KS11)' },
  { value: '^KQ11',     label: 'KOSDAQ (^KQ11)' },
  { value: 'NQ=F',      label: 'NASDAQ Futures (NQ=F)' },
  { value: '005930.KS', label: '삼성전자 (005930.KS)' },
];

export interface StrategyParams {
  symbol:              string;
  adx_threshold:       number;
  adx_persist:         number;
  rsi_long_entry:      number;
  rsi_short_entry:     number;
  atr_sl_mult:         number;
  atr_tp_mult:         number;
  min_hold_bars:       number;
  sl_cooldown_bars:    number;
  consec_sl_limit:     number;
  max_dd_stop:         number;
  commission:          number;
  slippage:            number;
  risk_per_trade:      number;
  use_prev_bar_signal: boolean;
  initial_capital:     number;
}

interface BoardItem {
  id: number;
  title: string;
  symbol: string;
  date: string;
  params: StrategyParams;
}

const DEFAULT_PARAMS: StrategyParams = {
  symbol:              'NQ=F',
  adx_threshold:       30.0,
  adx_persist:         3,
  rsi_long_entry:      45,
  rsi_short_entry:     52,
  atr_sl_mult:         2.2,
  atr_tp_mult:         5.0,
  min_hold_bars:       4,
  sl_cooldown_bars:    6,
  consec_sl_limit:     2,
  max_dd_stop:         0.0,
  commission:          0.0002,
  slippage:            0.0001,
  risk_per_trade:      0.01,
  use_prev_bar_signal: true,
  initial_capital:     10000000,
};

const PARAMS_KEY = 'strategyParams';
const BOARD_KEY  = 'strategyBoard';

function loadCustomParams(): StrategyParams {
  try {
    const saved = localStorage.getItem(PARAMS_KEY);
    if (saved) return { ...DEFAULT_PARAMS, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return { ...DEFAULT_PARAMS };
}

function loadBoard(): BoardItem[] {
  try {
    const saved = localStorage.getItem(BOARD_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return [];
}

type TabType = 'custom' | 'recommend';

export default function Strategy() {
  const [activeTab, setActiveTab] = useState<TabType>('custom');

  // 커스텀
  const [params, setParams] = useState<StrategyParams>(loadCustomParams);
  const [title, setTitle] = useState('');
  const [saved, setSaved] = useState(false);

  // 게시판
  const [board, setBoard] = useState<BoardItem[]>(loadBoard);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // 추천
  const [recommended, setRecommended] = useState<StrategyParams | null>(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);

  const fetchRecommended = () => {
    setRecLoading(true);
    setRecError(null);
    apiClient.get<ApiResponse<StrategyParams>>('/strategy/recommend')
      .then(res => {
        if (res.status < 400) setRecommended(res.data);
        else setRecError(res.message);
      })
      .catch(() => setRecError('서버 연결에 실패했습니다.'))
      .finally(() => setRecLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'recommend' && !recommended && !recLoading) {
      fetchRecommended();
    }
  }, [activeTab]);

  const set = <K extends keyof StrategyParams>(key: K, value: StrategyParams[K]) => {
    setParams(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    if (!title.trim()) return;
    const newItem: BoardItem = {
      id:     Date.now(),
      title:  title.trim(),
      symbol: params.symbol,
      date:   new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      params: { ...params },
    };
    const updated = [newItem, ...board];
    setBoard(updated);
    localStorage.setItem(BOARD_KEY, JSON.stringify(updated));
    localStorage.setItem(PARAMS_KEY, JSON.stringify(params));
    setSelectedId(newItem.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setParams({ ...DEFAULT_PARAMS });
    setTitle('');
    setSaved(false);
  };

  const handleBoardClick = (item: BoardItem) => {
    setSelectedId(item.id);
    setParams({ ...item.params });
    setTitle(item.title);
  };

  const handleDeleteBoard = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = board.filter(b => b.id !== id);
    setBoard(updated);
    localStorage.setItem(BOARD_KEY, JSON.stringify(updated));
    if (selectedId === id) { setSelectedId(null); setTitle(''); }
  };

  const handleApplyRecommended = () => {
    if (!recommended) return;
    setParams({ ...recommended });
    localStorage.setItem(PARAMS_KEY, JSON.stringify(recommended));
    setActiveTab('custom');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <PageLayout>
      <div className="space-y-6">

        {/* 헤더 */}
        <h1 className="text-2xl font-bold text-white">전략 설정</h1>

        {/* 탭 */}
        <div className="flex bg-zinc-800 rounded-lg p-1 gap-1 w-fit">
          <TabButton active={activeTab === 'custom'} onClick={() => setActiveTab('custom')}>
            <i className="ri-edit-line mr-1.5"></i>커스텀
          </TabButton>
          <TabButton active={activeTab === 'recommend'} onClick={() => setActiveTab('recommend')}>
            <i className="ri-magic-line mr-1.5"></i>추천
          </TabButton>
        </div>

        {/* 커스텀 탭 - 좌우 레이아웃 */}
        {activeTab === 'custom' && (
          <div className="grid grid-cols-2 gap-6 items-start">

            {/* 좌: 폼 */}
            <div className="min-w-0 space-y-6">
              {/* 제목 + 저장 버튼 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={e => { setTitle(e.target.value); setSaved(false); }}
                  placeholder="설정 제목을 입력하세요"
                  className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-refresh-line mr-1.5"></i>초기화
                </button>
                <button
                  onClick={handleSave}
                  disabled={!title.trim()}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
                    saved ? 'bg-green-600 text-white' : 'bg-teal-500 hover:bg-teal-400 text-white'
                  }`}
                >
                  {saved
                    ? <><i className="ri-check-line mr-1.5"></i>저장됨</>
                    : <><i className="ri-save-line mr-1.5"></i>저장</>
                  }
                </button>
              </div>

              <ParamForm params={params} onChange={set} />
            </div>

            {/* 우: 게시판 */}
            <div className="min-w-0">
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden sticky top-6">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-800/40">
                  <i className="ri-list-check text-teal-400"></i>
                  <h2 className="text-sm font-semibold text-zinc-200">저장된 설정</h2>
                  <span className="ml-auto text-xs text-zinc-500">{board.length}개</span>
                </div>

                {board.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
                    <i className="ri-file-list-3-line text-3xl mb-2"></i>
                    <p className="text-xs">저장된 설정이 없습니다</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800">
                    {/* 헤더 행 */}
                    <div className="grid grid-cols-[2rem_1fr_4.5rem_4.5rem] px-3 py-2 text-xs font-semibold text-zinc-500 bg-zinc-800/30">
                      <span>No</span>
                      <span>제목</span>
                      <span>종목</span>
                      <span>날짜</span>
                    </div>
                    {/* 데이터 행 */}
                    {board.map((item, idx) => (
                      <div
                        key={item.id}
                        onClick={() => handleBoardClick(item)}
                        className={`grid grid-cols-[2rem_1fr_4.5rem_4.5rem] items-center px-3 py-2.5 cursor-pointer transition-colors text-xs group ${
                          selectedId === item.id
                            ? 'bg-teal-500/10 border-l-2 border-teal-500'
                            : 'hover:bg-zinc-800/50'
                        }`}
                      >
                        <span className="text-zinc-500">{board.length - idx}</span>
                        <span className={`truncate pr-1 ${selectedId === item.id ? 'text-teal-300 font-medium' : 'text-zinc-300'}`}>
                          {item.title}
                        </span>
                        <span className="text-zinc-400 truncate">{item.symbol}</span>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">{item.date.replace(/\. /g, '.').replace('.', '')}</span>
                          <button
                            onClick={e => handleDeleteBoard(item.id, e)}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity ml-1"
                          >
                            <i className="ri-close-line"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* 추천 탭 */}
        {activeTab === 'recommend' && (
          <div className="max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">서버에서 분석된 최적 파라미터 추천값입니다.</p>
              <button
                onClick={fetchRecommended}
                disabled={recLoading}
                className="px-3 py-1.5 text-sm bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <i className={`ri-refresh-line mr-1.5 ${recLoading ? 'animate-spin' : ''}`}></i>새로고침
              </button>
            </div>

            {recLoading && (
              <div className="flex items-center justify-center h-48 text-zinc-500">
                <i className="ri-loader-4-line animate-spin text-2xl mr-2"></i>추천값 불러오는 중...
              </div>
            )}

            {recError && (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <p className="text-red-400"><i className="ri-error-warning-line mr-1"></i>{recError}</p>
                <button onClick={fetchRecommended} className="px-4 py-2 text-sm bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer">
                  <i className="ri-refresh-line mr-1"></i>다시 시도
                </button>
              </div>
            )}

            {recommended && !recLoading && (
              <>
                <ParamForm params={recommended} readOnly />
                <div className="flex justify-end">
                  <button
                    onClick={handleApplyRecommended}
                    className="px-5 py-2.5 text-sm font-semibold bg-teal-500 hover:bg-teal-400 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <i className="ri-download-line mr-1.5"></i>이 설정 적용하기
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </PageLayout>
  );
}

/* ── 파라미터 폼 ── */
interface ParamFormProps {
  params: StrategyParams;
  onChange?: <K extends keyof StrategyParams>(key: K, value: StrategyParams[K]) => void;
  readOnly?: boolean;
}

function ParamForm({ params, onChange, readOnly = false }: ParamFormProps) {
  const set = <K extends keyof StrategyParams>(key: K, value: StrategyParams[K]) => onChange?.(key, value);
  return (
    <div className="space-y-6">
      <Section title="종목 설정" icon="ri-stock-line">
        <SelectField label="종목" desc="백테스트 및 전략 실행 대상 종목"
          value={params.symbol} options={SYMBOL_OPTIONS} readOnly={readOnly} onChange={v => set('symbol', v)} />
      </Section>
      <Section title="추세 지표 (ADX)" icon="ri-line-chart-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="ADX 임계치" desc="이 값 이상일 때 추세 있음으로 판단"
            value={params.adx_threshold} step={0.5} readOnly={readOnly} onChange={v => set('adx_threshold', v)} />
          <NumberField label="ADX 연속 유지 봉 수" desc="ADX 조건이 유지되어야 하는 60분봉 수"
            value={params.adx_persist} step={1} isInt readOnly={readOnly} onChange={v => set('adx_persist', v)} />
        </div>
      </Section>
      <Section title="RSI 진입 조건" icon="ri-swap-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="롱 진입 RSI 상한" desc="RSI가 이 값 미만일 때 롱 진입"
            value={params.rsi_long_entry} step={1} isInt readOnly={readOnly} onChange={v => set('rsi_long_entry', v)} />
          <NumberField label="숏 진입 RSI 하한" desc="RSI가 이 값 초과일 때 숏 진입"
            value={params.rsi_short_entry} step={1} isInt readOnly={readOnly} onChange={v => set('rsi_short_entry', v)} />
        </div>
      </Section>
      <Section title="리스크 관리" icon="ri-shield-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="손절 ATR 배수" desc="ATR × 이 배수를 손절폭으로 설정"
            value={params.atr_sl_mult} step={0.1} readOnly={readOnly} onChange={v => set('atr_sl_mult', v)} />
          <NumberField label="익절 ATR 배수" desc="ATR × 이 배수를 익절폭으로 설정"
            value={params.atr_tp_mult} step={0.1} readOnly={readOnly} onChange={v => set('atr_tp_mult', v)} />
          <NumberField label="최소 유지 봉 수" desc="추세 청산 허용까지 최소 보유 봉 수"
            value={params.min_hold_bars} step={1} isInt readOnly={readOnly} onChange={v => set('min_hold_bars', v)} />
          <NumberField label="SL 쿨다운 봉 수" desc="손절 후 재진입 금지 봉 수"
            value={params.sl_cooldown_bars} step={1} isInt readOnly={readOnly} onChange={v => set('sl_cooldown_bars', v)} />
          <NumberField label="연속 손절 한도" desc="연속 손절 N회 초과 시 쿨다운 2배 적용"
            value={params.consec_sl_limit} step={1} isInt readOnly={readOnly} onChange={v => set('consec_sl_limit', v)} />
          <NumberField label="최대 MDD 차단 비율" desc="누적 MDD 초과 시 신규 진입 차단 (0 = 비활성)"
            value={params.max_dd_stop} step={0.01} readOnly={readOnly} onChange={v => set('max_dd_stop', v)} />
        </div>
      </Section>
      <Section title="비용 설정" icon="ri-percent-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="수수료 (편도)" desc="예: 0.0002 = 0.02%"
            value={params.commission} step={0.0001} readOnly={readOnly} onChange={v => set('commission', v)} />
          <NumberField label="슬리피지 (편도)" desc="예: 0.0001 = 0.01%"
            value={params.slippage} step={0.0001} readOnly={readOnly} onChange={v => set('slippage', v)} />
        </div>
      </Section>
      <Section title="자본 설정" icon="ri-funds-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="초기 자본금 (원)" desc="포지션 사이징 기준 초기 자본"
            value={params.initial_capital} step={1000000} isInt readOnly={readOnly} onChange={v => set('initial_capital', v)} />
          <NumberField label="거래당 위험 비율" desc="자산 대비 위험 비율 (예: 0.01 = 1%)"
            value={params.risk_per_trade} step={0.001} readOnly={readOnly} onChange={v => set('risk_per_trade', v)} />
          <div className="sm:col-span-2">
            <ToggleField label="이전 봉 신호 사용" desc="신호 발생 봉의 다음 봉 시가에 진입 (룩어헤드 바이어스 방지)"
              value={params.use_prev_bar_signal} readOnly={readOnly} onChange={v => set('use_prev_bar_signal', v)} />
          </div>
        </div>
      </Section>
    </div>
  );
}

/* ── UI 컴포넌트 ── */
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${active ? 'bg-teal-500 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>
      {children}
    </button>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-zinc-800 bg-zinc-800/40">
        <i className={`${icon} text-teal-400 text-lg`}></i>
        <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function NumberField({ label, desc, value, step, isInt, readOnly, onChange }: { label: string; desc: string; value: number; step: number; isInt?: boolean; readOnly?: boolean; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-zinc-300">{label}</label>
      <p className="text-xs text-zinc-500">{desc}</p>
      <input type="number" value={value} step={step} readOnly={readOnly}
        onChange={e => !readOnly && onChange(isInt ? parseInt(e.target.value) : parseFloat(e.target.value))}
        className={`w-full px-3 py-2 border rounded-lg text-sm text-zinc-200 focus:outline-none transition-colors ${readOnly ? 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 cursor-default' : 'bg-zinc-800 border-zinc-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent'}`}
      />
    </div>
  );
}

function SelectField({ label, desc, value, options, readOnly, onChange }: { label: string; desc: string; value: string; options: { value: string; label: string }[]; readOnly?: boolean; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-zinc-300">{label}</label>
      <p className="text-xs text-zinc-500">{desc}</p>
      <select value={value} disabled={readOnly} onChange={e => onChange(e.target.value)}
        className={`w-full px-3 py-2 border rounded-lg text-sm text-zinc-200 focus:outline-none transition-colors ${readOnly ? 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 cursor-default' : 'bg-zinc-800 border-zinc-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent'}`}>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

function ToggleField({ label, desc, value, readOnly, onChange }: { label: string; desc: string; value: boolean; readOnly?: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
      <div>
        <p className="text-sm font-medium text-zinc-300">{label}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
      </div>
      <button type="button" disabled={readOnly} onClick={() => !readOnly && onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${value ? 'bg-teal-500' : 'bg-zinc-600'} ${readOnly ? 'cursor-default opacity-70' : 'cursor-pointer'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}
