import { useState, useCallback } from 'react';
import PageLayout from '../../components/PageLayout';
import { apiClient } from '../../api/apiClient';
import type { ApiResponse } from '../../types';

const SYMBOL_OPTIONS = [
  { value: '^KS11',     label: 'KOSPI (^KS11)' },
  { value: '^KQ11',     label: 'KOSDAQ (^KQ11)' },
  { value: 'NQ=F',      label: 'NASDAQ Futures (NQ=F)' },
  { value: '005930.KS', label: '삼성전자 (005930.KS)' },
];

// 서버 저장용 완전한 파라미터 타입
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

// 커스텀 폼 상태 — number 필드는 빈 문자열 허용
type NumVal = number | '';
interface CustomFormParams {
  symbol:              string;
  adx_threshold:       NumVal;
  adx_persist:         NumVal;
  rsi_long_entry:      NumVal;
  rsi_short_entry:     NumVal;
  atr_sl_mult:         NumVal;
  atr_tp_mult:         NumVal;
  min_hold_bars:       NumVal;
  sl_cooldown_bars:    NumVal;
  consec_sl_limit:     NumVal;
  max_dd_stop:         NumVal;
  commission:          NumVal;
  slippage:            NumVal;
  risk_per_trade:      NumVal;
  use_prev_bar_signal: boolean;
  initial_capital:     NumVal;
}

const EMPTY_CUSTOM: CustomFormParams = {
  symbol:              '',
  adx_threshold:       '',
  adx_persist:         '',
  rsi_long_entry:      '',
  rsi_short_entry:     '',
  atr_sl_mult:         '',
  atr_tp_mult:         '',
  min_hold_bars:       '',
  sl_cooldown_bars:    '',
  consec_sl_limit:     '',
  max_dd_stop:         '',
  commission:          '',
  slippage:            '',
  risk_per_trade:      '',
  use_prev_bar_signal: false,
  initial_capital:     '',
};

// 추천탭에 표시할 기본 추천값
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

interface BoardItem {
  id: number;
  title: string;
  symbol: string;
  date: string;
  params: StrategyParams;
}

const BOARD_KEY = 'strategyBoard';

function loadBoard(): BoardItem[] {
  try {
    const saved = localStorage.getItem(BOARD_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return [];
}

// CustomFormParams → StrategyParams 변환 (모든 필드가 채워진 경우만 반환)
function toStrategyParams(form: CustomFormParams): StrategyParams | null {
  const numFields: (keyof CustomFormParams)[] = [
    'adx_threshold', 'adx_persist', 'rsi_long_entry', 'rsi_short_entry',
    'atr_sl_mult', 'atr_tp_mult', 'min_hold_bars', 'sl_cooldown_bars',
    'consec_sl_limit', 'max_dd_stop', 'commission', 'slippage',
    'risk_per_trade', 'initial_capital',
  ];
  if (!form.symbol) return null;
  for (const k of numFields) {
    if (form[k] === '') return null;
  }
  return form as unknown as StrategyParams;
}

type TabType = 'custom' | 'recommend';

export default function Strategy() {
  const [activeTab, setActiveTab] = useState<TabType>('custom');

  // 커스텀 탭
  const [params, setParams] = useState<CustomFormParams>({ ...EMPTY_CUSTOM });
  const [title, setTitle] = useState('');
  const [saved, setSaved] = useState(false);

  // 게시판
  const [board, setBoard] = useState<BoardItem[]>(loadBoard);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [appliedItem, setAppliedItem] = useState<BoardItem | null>(null);

  // 추천 탭 — DEFAULT_PARAMS로 초기화
  const [recommended, setRecommended] = useState<StrategyParams>(DEFAULT_PARAMS);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [recTitle, setRecTitle] = useState('');
  const [recSaved, setRecSaved] = useState(false);

  const fetchRecommended = useCallback(() => {
    setRecLoading(true);
    setRecError(null);
    apiClient.get<ApiResponse<StrategyParams>>('/strategy/recommend')
      .then(res => {
        if (res && typeof res.status === 'number' && res.status < 400 && res.data) {
          setRecommended(res.data);
        } else {
          setRecError(res?.message || '알 수 없는 오류가 발생했습니다.');
        }
      })
      .catch(() => setRecError('서버 연결에 실패했습니다.'))
      .finally(() => setRecLoading(false));
  }, []);

  const set = <K extends keyof CustomFormParams>(key: K, value: CustomFormParams[K]) => {
    setParams(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const isFormComplete = toStrategyParams(params) !== null;

  const handleSave = () => {
    if (!title.trim()) return;
    const converted = toStrategyParams(params);
    if (!converted) return;
    const newItem: BoardItem = {
      id:     Date.now(),
      title:  title.trim(),
      symbol: converted.symbol,
      date:   new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      params: converted,
    };
    const updated = [newItem, ...board];
    setBoard(updated);
    localStorage.setItem(BOARD_KEY, JSON.stringify(updated));
    setSelectedId(newItem.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setParams({ ...EMPTY_CUSTOM });
    setTitle('');
    setSaved(false);
    setSelectedId(null);
  };

  const handleBoardClick = (item: BoardItem) => {
    setSelectedId(item.id);
    setParams(item.params as unknown as CustomFormParams);
    setTitle(item.title);
    setActiveTab('custom');
  };

  const handleDeleteBoard = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = board.filter(b => b.id !== id);
    setBoard(updated);
    localStorage.setItem(BOARD_KEY, JSON.stringify(updated));
    if (selectedId === id) { setSelectedId(null); setTitle(''); }
    if (appliedItem?.id === id) setAppliedItem(null);
  };

  const handleApplyRecommended = () => {
    setParams(recommended as unknown as CustomFormParams);
    setActiveTab('custom');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRecSave = () => {
    if (!recTitle.trim()) return;
    const newItem: BoardItem = {
      id:     Date.now(),
      title:  recTitle.trim(),
      symbol: recommended.symbol,
      date:   new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      params: { ...recommended },
    };
    const updated = [newItem, ...board];
    setBoard(updated);
    localStorage.setItem(BOARD_KEY, JSON.stringify(updated));
    setSelectedId(newItem.id);
    setRecTitle('');
    setRecSaved(true);
    setTimeout(() => setRecSaved(false), 2000);
  };

  return (
    <PageLayout>
      <div className="space-y-6">

        {/* 헤더 */}
        <h1 className="text-3xl font-bold text-white">전략 설정</h1>

        {/* 탭 */}
        <div className="flex bg-zinc-800 rounded-lg p-1 gap-1 w-fit">
          <TabButton active={activeTab === 'custom'} onClick={() => setActiveTab('custom')}>
            <i className="ri-edit-line mr-1.5"></i>커스텀
          </TabButton>
          <TabButton active={activeTab === 'recommend'} onClick={() => setActiveTab('recommend')}>
            <i className="ri-magic-line mr-1.5"></i>추천
          </TabButton>
        </div>

        {/* 커스텀 탭 */}
        {activeTab === 'custom' && (
          <div className="grid grid-cols-2 gap-6 items-start">

            {/* 좌: 폼 */}
            <div className="min-w-0 space-y-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={e => { setTitle(e.target.value); setSaved(false); }}
                  placeholder="설정 제목을 입력하세요"
                  className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-base text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-base bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-refresh-line mr-1.5"></i>초기화
                </button>
                <button
                  onClick={handleSave}
                  disabled={!title.trim() || !isFormComplete}
                  className={`px-4 py-2 text-base font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
                    saved ? 'bg-green-600 text-white' : 'bg-teal-500 hover:bg-teal-400 text-white'
                  }`}
                >
                  {saved
                    ? <><i className="ri-check-line mr-1.5"></i>저장됨</>
                    : <><i className="ri-save-line mr-1.5"></i>저장</>
                  }
                </button>
              </div>

              <CustomParamForm params={params} onChange={set} />
            </div>

            {/* 우: 게시판 */}
            <BoardPanel
              board={board}
              selectedId={selectedId}
              appliedItem={appliedItem}
              onClickItem={handleBoardClick}
              onDeleteItem={handleDeleteBoard}
              onApplyItem={setAppliedItem}
            />

          </div>
        )}

        {/* 추천 탭 */}
        {activeTab === 'recommend' && (
          <div className="grid grid-cols-2 gap-6 items-start">

            {/* 좌: 추천 폼 */}
            <div className="min-w-0 space-y-6">
              {/* 제목 + 저장 버튼 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={recTitle}
                  onChange={e => { setRecTitle(e.target.value); setRecSaved(false); }}
                  placeholder="저장할 설정 제목을 입력하세요"
                  className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-base text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <button
                  onClick={fetchRecommended}
                  disabled={recLoading}
                  className="px-4 py-2 text-base bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                >
                  <i className={`ri-refresh-line mr-1.5 ${recLoading ? 'animate-spin' : ''}`}></i>새로고침
                </button>
                <button
                  onClick={handleApplyRecommended}
                  className="px-4 py-2 text-base font-semibold bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-download-line mr-1.5"></i>커스텀에 적용
                </button>
                <button
                  onClick={handleRecSave}
                  disabled={!recTitle.trim()}
                  className={`px-4 py-2 text-base font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
                    recSaved ? 'bg-green-600 text-white' : 'bg-teal-500 hover:bg-teal-400 text-white'
                  }`}
                >
                  {recSaved
                    ? <><i className="ri-check-line mr-1.5"></i>저장됨</>
                    : <><i className="ri-save-line mr-1.5"></i>저장</>
                  }
                </button>
              </div>

              {recError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <i className="ri-error-warning-line text-red-400"></i>
                  <p className="text-sm text-red-400">{recError} — 기본 추천값을 표시합니다.</p>
                </div>
              )}

              {recLoading ? (
                <div className="flex items-center justify-center h-48 text-zinc-500">
                  <i className="ri-loader-4-line animate-spin text-2xl mr-2"></i>추천값 불러오는 중...
                </div>
              ) : (
                <ReadOnlyParamForm params={recommended} />
              )}
            </div>

            {/* 우: 게시판 (공유) */}
            <BoardPanel
              board={board}
              selectedId={selectedId}
              appliedItem={appliedItem}
              onClickItem={handleBoardClick}
              onDeleteItem={handleDeleteBoard}
              onApplyItem={setAppliedItem}
            />

          </div>
        )}

      </div>
    </PageLayout>
  );
}

/* ── 커스텀 탭 폼 (빈 값 허용) ── */
interface CustomParamFormProps {
  params: CustomFormParams;
  onChange: <K extends keyof CustomFormParams>(key: K, value: CustomFormParams[K]) => void;
}

function CustomParamForm({ params, onChange }: CustomParamFormProps) {
  const set = <K extends keyof CustomFormParams>(key: K, value: CustomFormParams[K]) => onChange(key, value);
  return (
    <div className="space-y-6">
      <Section title="자본 설정" icon="ri-funds-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="초기 자본금 (원)" desc="포지션 사이징 기준 초기 자본"
            value={params.initial_capital} step={1000000} isInt onChange={v => set('initial_capital', v)} />
          <NumberField label="거래당 위험 비율" desc="자산 대비 위험 비율 (예: 0.01 = 1%)"
            value={params.risk_per_trade} step={0.001} min={0.005} max={0.05} onChange={v => set('risk_per_trade', v)} />
          <div className="sm:col-span-2">
            <ToggleField label="이전 봉 신호 사용" desc="신호 발생 봉의 다음 봉 시가에 진입 (룩어헤드 바이어스 방지)"
              value={params.use_prev_bar_signal} onChange={v => set('use_prev_bar_signal', v)} />
          </div>
        </div>
      </Section>
      <Section title="종목 설정" icon="ri-stock-line">
        <SelectField label="종목" desc="백테스트 및 전략 실행 대상 종목"
          value={params.symbol} options={SYMBOL_OPTIONS} withPlaceholder
          onChange={v => set('symbol', v)} />
      </Section>
      <Section title="추세 지표 (ADX)" icon="ri-line-chart-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="ADX 임계치" desc="이 값 이상일 때 추세 있음으로 판단"
            value={params.adx_threshold} step={0.5} min={15} max={50} onChange={v => set('adx_threshold', v)} />
          <NumberField label="ADX 연속 유지 봉 수" desc="ADX 조건이 유지되어야 하는 60분봉 수"
            value={params.adx_persist} step={1} min={1} max={10} isInt onChange={v => set('adx_persist', v)} />
        </div>
      </Section>
      <Section title="RSI 진입 조건" icon="ri-swap-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="롱 진입 RSI 상한" desc="RSI가 이 값 미만일 때 롱 진입"
            value={params.rsi_long_entry} step={1} min={30} max={55} isInt onChange={v => set('rsi_long_entry', v)} />
          <NumberField label="숏 진입 RSI 하한" desc="RSI가 이 값 초과일 때 숏 진입"
            value={params.rsi_short_entry} step={1} min={45} max={70} isInt onChange={v => set('rsi_short_entry', v)} />
        </div>
      </Section>
      <Section title="리스크 관리" icon="ri-shield-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="손절 ATR 배수" desc="ATR × 이 배수를 손절폭으로 설정"
            value={params.atr_sl_mult} step={0.1} min={0.5} max={5.0} onChange={v => set('atr_sl_mult', v)} />
          <NumberField label="익절 ATR 배수" desc="ATR × 이 배수를 익절폭으로 설정"
            value={params.atr_tp_mult} step={0.1} min={1.0} max={10.0} onChange={v => set('atr_tp_mult', v)} />
          <NumberField label="최소 유지 봉 수" desc="추세 청산 허용까지 최소 보유 봉 수"
            value={params.min_hold_bars} step={1} min={1} max={20} isInt onChange={v => set('min_hold_bars', v)} />
          <NumberField label="SL 쿨다운 봉 수" desc="손절 후 재진입 금지 봉 수"
            value={params.sl_cooldown_bars} step={1} min={0} max={20} isInt onChange={v => set('sl_cooldown_bars', v)} />
          <NumberField label="연속 손절 한도" desc="연속 손절 N회 초과 시 쿨다운 2배 적용"
            value={params.consec_sl_limit} step={1} min={1} max={5} isInt onChange={v => set('consec_sl_limit', v)} />
          <NumberField label="최대 MDD 차단 비율" desc="누적 MDD 초과 시 신규 진입 차단 (0 = 비활성)"
            value={params.max_dd_stop} step={0.01} min={0.0} max={0.5} onChange={v => set('max_dd_stop', v)} />
        </div>
      </Section>
      <Section title="비용 설정" icon="ri-percent-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="수수료 (편도)" desc="예: 0.0002 = 0.02%"
            value={params.commission} step={0.0001} onChange={v => set('commission', v)} />
          <NumberField label="슬리피지 (편도)" desc="예: 0.0001 = 0.01%"
            value={params.slippage} step={0.0001} onChange={v => set('slippage', v)} />
        </div>
      </Section>
    </div>
  );
}

/* ── 추천 탭 폼 (읽기 전용 / StrategyParams) ── */
function ReadOnlyParamForm({ params }: { params: StrategyParams }) {
  return (
    <div className="space-y-6">
      <Section title="자본 설정" icon="ri-funds-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadOnlyNumberField label="초기 자본금 (원)" desc="포지션 사이징 기준 초기 자본" value={params.initial_capital} />
          <ReadOnlyNumberField label="거래당 위험 비율" desc="자산 대비 위험 비율 (예: 0.01 = 1%)" value={params.risk_per_trade} />
          <div className="sm:col-span-2">
            <ToggleField label="이전 봉 신호 사용" desc="신호 발생 봉의 다음 봉 시가에 진입 (룩어헤드 바이어스 방지)"
              value={params.use_prev_bar_signal} readOnly onChange={() => {}} />
          </div>
        </div>
      </Section>
      <Section title="종목 설정" icon="ri-stock-line">
        <SelectField label="종목" desc="백테스트 및 전략 실행 대상 종목"
          value={params.symbol} options={SYMBOL_OPTIONS} readOnly onChange={() => {}} />
      </Section>
      <Section title="추세 지표 (ADX)" icon="ri-line-chart-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadOnlyNumberField label="ADX 임계치" desc="이 값 이상일 때 추세 있음으로 판단" value={params.adx_threshold} />
          <ReadOnlyNumberField label="ADX 연속 유지 봉 수" desc="ADX 조건이 유지되어야 하는 60분봉 수" value={params.adx_persist} />
        </div>
      </Section>
      <Section title="RSI 진입 조건" icon="ri-swap-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadOnlyNumberField label="롱 진입 RSI 상한" desc="RSI가 이 값 미만일 때 롱 진입" value={params.rsi_long_entry} />
          <ReadOnlyNumberField label="숏 진입 RSI 하한" desc="RSI가 이 값 초과일 때 숏 진입" value={params.rsi_short_entry} />
        </div>
      </Section>
      <Section title="리스크 관리" icon="ri-shield-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadOnlyNumberField label="손절 ATR 배수" desc="ATR × 이 배수를 손절폭으로 설정" value={params.atr_sl_mult} />
          <ReadOnlyNumberField label="익절 ATR 배수" desc="ATR × 이 배수를 익절폭으로 설정" value={params.atr_tp_mult} />
          <ReadOnlyNumberField label="최소 유지 봉 수" desc="추세 청산 허용까지 최소 보유 봉 수" value={params.min_hold_bars} />
          <ReadOnlyNumberField label="SL 쿨다운 봉 수" desc="손절 후 재진입 금지 봉 수" value={params.sl_cooldown_bars} />
          <ReadOnlyNumberField label="연속 손절 한도" desc="연속 손절 N회 초과 시 쿨다운 2배 적용" value={params.consec_sl_limit} />
          <ReadOnlyNumberField label="최대 MDD 차단 비율" desc="누적 MDD 초과 시 신규 진입 차단 (0 = 비활성)" value={params.max_dd_stop} />
        </div>
      </Section>
      <Section title="비용 설정" icon="ri-percent-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadOnlyNumberField label="수수료 (편도)" desc="예: 0.0002 = 0.02%" value={params.commission} />
          <ReadOnlyNumberField label="슬리피지 (편도)" desc="예: 0.0001 = 0.01%" value={params.slippage} />
        </div>
      </Section>
    </div>
  );
}

/* ── UI 컴포넌트 ── */
/* ── 저장된 설정 패널 (커스텀·추천 탭 공유) ── */
interface BoardPanelProps {
  board: BoardItem[];
  selectedId: number | null;
  appliedItem: BoardItem | null;
  onClickItem: (item: BoardItem) => void;
  onDeleteItem: (id: number, e: React.MouseEvent) => void;
  onApplyItem: (item: BoardItem | null) => void;
}

const PARAM_SUMMARY_ROWS: { label: string; key: keyof StrategyParams; format?: (v: number) => string }[][] = [
  [
    { label: '초기 자본',     key: 'initial_capital', format: v => `${(v / 10000).toFixed(0)}만` },
    { label: '거래당 위험',   key: 'risk_per_trade', format: v => `${(v * 100).toFixed(1)}%` },
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

function BoardPanel({ board, selectedId, appliedItem, onClickItem, onDeleteItem, onApplyItem }: BoardPanelProps) {
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

        {/* 적용된 설정 요약 */}
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
                  : format
                    ? format(val as number)
                    : String(val);
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
                  <p className="text-base font-semibold text-zinc-100">설정 삭제</p>
                  <p className="text-sm text-zinc-400 mt-0.5">이 설정을 삭제하시겠습니까?</p>
                </div>
              </div>
              <div className="bg-zinc-800 rounded-lg px-4 py-2.5">
                <p className="text-sm font-medium text-zinc-200">{deleteTarget.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{deleteTarget.symbol} · {deleteTarget.date}</p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  onClick={e => { onDeleteItem(deleteTarget.id, e as unknown as React.MouseEvent); setDeleteTarget(null); }}
                  className="flex-1 py-2.5 text-sm font-semibold bg-red-500 hover:bg-red-400 text-white rounded-lg transition-colors cursor-pointer"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}

        {board.length === 0 ? (
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
                  selectedId === item.id
                    ? 'bg-teal-500/10 border-l-2 border-teal-500'
                    : 'hover:bg-zinc-800/50'
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

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-4 py-1.5 text-base font-medium rounded-md transition-colors cursor-pointer ${active ? 'bg-teal-500 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>
      {children}
    </button>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-zinc-800 bg-zinc-800/40">
        <i className={`${icon} text-teal-400 text-xl`}></i>
        <h2 className="text-lg font-semibold text-zinc-200">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/* 라벨 + 툴팁 아이콘 */
function FieldLabel({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-lg font-medium text-zinc-300">{label}</span>
      <span className="relative group/tip">
        <i className="ri-information-line text-zinc-400 hover:text-teal-400 text-base cursor-help transition-colors"></i>
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 px-4 py-3 bg-zinc-700 border border-zinc-600 text-zinc-100 text-lg rounded-lg shadow-xl opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-50 whitespace-normal leading-relaxed">
          {desc}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-700"></span>
        </span>
      </span>
    </div>
  );
}

function NumberField({ label, desc, value, step, min, max, isInt, onChange }: {
  label: string; desc: string; value: NumVal; step: number; min?: number; max?: number; isInt?: boolean;
  onChange: (v: NumVal) => void;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel label={label} desc={desc} />
      <input
        type="number" value={value} step={step} min={min} max={max}
        placeholder="값을 입력하세요"
        onChange={e => {
          const raw = e.target.value;
          if (raw === '') { onChange(''); return; }
          const parsed = isInt ? parseInt(raw) : parseFloat(raw);
          if (!isNaN(parsed)) onChange(parsed);
        }}
        className="w-full px-3 py-2.5 border rounded-lg text-lg text-zinc-200 focus:outline-none transition-colors bg-zinc-800 border-zinc-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-zinc-600"
      />
    </div>
  );
}

function ReadOnlyNumberField({ label, desc, value }: { label: string; desc: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <FieldLabel label={label} desc={desc} />
      <input
        type="number" value={value} readOnly
        className="w-full px-3 py-2.5 border rounded-lg text-lg text-zinc-400 bg-zinc-800/50 border-zinc-700/50 cursor-default focus:outline-none"
      />
    </div>
  );
}

function SelectField({ label, desc, value, options, readOnly, withPlaceholder, onChange }: {
  label: string; desc: string; value: string;
  options: { value: string; label: string }[];
  readOnly?: boolean; withPlaceholder?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel label={label} desc={desc} />
      <select value={value} disabled={readOnly} onChange={e => onChange(e.target.value)}
        className={`w-full px-3 py-2.5 border rounded-lg text-lg focus:outline-none transition-colors ${readOnly ? 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 cursor-default' : 'bg-zinc-800 border-zinc-700 text-zinc-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent'}`}>
        {withPlaceholder && <option value="" disabled>— 종목을 선택하세요 —</option>}
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

function ToggleField({ label, desc, value, readOnly, onChange }: {
  label: string; desc: string; value: boolean; readOnly?: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
      <FieldLabel label={label} desc={desc} />
      <button type="button" disabled={readOnly} onClick={() => !readOnly && onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${value ? 'bg-teal-500' : 'bg-zinc-600'} ${readOnly ? 'cursor-default opacity-70' : 'cursor-pointer'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

/* ── 파라미터 상세 모달 ── */
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      {/* 배경 */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* 모달 본체 */}
      <div
        className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
          <div>
            <h2 className="text-xl font-bold text-white">{item.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">{item.symbol}</span>
              <span className="text-xs text-zinc-500">{item.date}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 transition-colors mt-0.5 cursor-pointer"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* 종목 + 이전봉 신호 */}
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

        {/* 섹션별 파라미터 */}
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
                    <div
                      key={key}
                      className={`flex items-center justify-between px-5 py-4 ${i >= 2 ? 'border-t border-zinc-700/50' : ''}`}
                    >
                      <span className="text-base text-zinc-400">{label}</span>
                      <span className="text-base font-semibold text-zinc-100">{display}</span>
                    </div>
                  );
                })}
                {section.rows.length % 2 !== 0 && (
                  <div className="border-t border-zinc-700/50" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
