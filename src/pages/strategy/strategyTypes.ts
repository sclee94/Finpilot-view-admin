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
  use_prev_bar_signal:    boolean;
  initial_capital:        number;
  indicator_window:       number;
  trading_days_per_year:  number;
}

export type NumVal = number | '';

export interface CustomFormParams {
  symbol:                string;
  adx_threshold:         NumVal;
  adx_persist:           NumVal;
  rsi_long_entry:        NumVal;
  rsi_short_entry:       NumVal;
  atr_sl_mult:           NumVal;
  atr_tp_mult:           NumVal;
  min_hold_bars:         NumVal;
  sl_cooldown_bars:      NumVal;
  consec_sl_limit:       NumVal;
  max_dd_stop:           NumVal;
  commission:            NumVal;
  slippage:              NumVal;
  risk_per_trade:        NumVal;
  use_prev_bar_signal:   boolean;
  initial_capital:       NumVal;
  indicator_window:      NumVal;
  trading_days_per_year: NumVal;
}

export interface BoardItem {
  id:     number;
  title:  string;
  symbol: string;
  date:   string;
  isUse:  number;   // 1: 적용 중, 0: 미적용
  params: StrategyParams;
}

// Spring Boot StrategyConfigDTO 매핑
export interface StrategyConfigDTO {
  userUid?:          string;
  id?:               number;
  title?:            string;
  symbol?:           string;
  initialCapital?:   number;
  riskPerTrade?:     number;
  usePrevBarSignal?: boolean;
  adxThreshold?:     number;
  adxPersist?:       number;
  rsiLongEntry?:     number;
  rsiShortEntry?:    number;
  atrSlMult?:        number;
  atrTpMult?:        number;
  minHoldBars?:      number;
  slCooldownBars?:   number;
  consecSlLimit?:    number;
  maxDdStop?:        number;
  commission?:           number;
  slippage?:             number;
  indicatorWindow?:      number;
  tradingDaysPerYear?:   number;
  isUse?:                number;
  createdAt?:            string;
}

export const EMPTY_CUSTOM: CustomFormParams = {
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
  use_prev_bar_signal:   false,
  initial_capital:       '',
  indicator_window:      '',
  trading_days_per_year: '',
};

export const DEFAULT_PARAMS: StrategyParams = {
  symbol:              'NQ=F',
  adx_threshold:       18.0,
  adx_persist:         1,
  rsi_long_entry:      40,
  rsi_short_entry:     57,
  atr_sl_mult:         2.5,
  atr_tp_mult:         5.0,
  min_hold_bars:       16,
  sl_cooldown_bars:    4,
  consec_sl_limit:     1,
  max_dd_stop:         0.0,
  commission:          0.0002,
  slippage:            0.0001,
  risk_per_trade:      0.01,
  use_prev_bar_signal:   true,
  initial_capital:       10000000,
  indicator_window:      14,
  trading_days_per_year: 252,
};

export const SYMBOL_OPTIONS = [
  { value: '^KS11', label: 'KOSPI (^KS11)' },
  { value: '^KQ11', label: 'KOSDAQ (^KQ11)' },
  { value: 'NQ=F',  label: 'NASDAQ Futures (NQ=F)' },
];

export const APPLIED_KEY = 'strategyApplied';

/** DTO → BoardItem 변환 */
export function dtoToBoardItem(dto: StrategyConfigDTO): BoardItem {
  return {
    id:     dto.id!,
    title:  dto.title ?? '',
    symbol: dto.symbol ?? '',
    date:   dto.createdAt ?? '',
    isUse:  dto.isUse ?? 0,
    params: {
      symbol:              dto.symbol ?? '',
      adx_threshold:       dto.adxThreshold ?? 0,
      adx_persist:         dto.adxPersist ?? 0,
      rsi_long_entry:      dto.rsiLongEntry ?? 0,
      rsi_short_entry:     dto.rsiShortEntry ?? 0,
      atr_sl_mult:         dto.atrSlMult ?? 0,
      atr_tp_mult:         dto.atrTpMult ?? 0,
      min_hold_bars:       dto.minHoldBars ?? 0,
      sl_cooldown_bars:    dto.slCooldownBars ?? 0,
      consec_sl_limit:     dto.consecSlLimit ?? 0,
      max_dd_stop:         dto.maxDdStop ?? 0,
      commission:          dto.commission ?? 0,
      slippage:            dto.slippage ?? 0,
      risk_per_trade:      dto.riskPerTrade ?? 0,
      use_prev_bar_signal:   dto.usePrevBarSignal ?? false,
      initial_capital:       dto.initialCapital ?? 0,
      indicator_window:      dto.indicatorWindow ?? 14,
      trading_days_per_year: dto.tradingDaysPerYear ?? 252,
    },
  };
}

/** StrategyParams + 메타 → DTO 변환 */
export function strategyToDto(
  params: StrategyParams,
  title: string,
  userUid: string,
  id?: number,
): StrategyConfigDTO {
  return {
    userUid,
    ...(id !== undefined && { id }),
    title,
    symbol:           params.symbol,
    initialCapital:   params.initial_capital,
    riskPerTrade:     params.risk_per_trade,
    usePrevBarSignal: params.use_prev_bar_signal,
    adxThreshold:     params.adx_threshold,
    adxPersist:       params.adx_persist,
    rsiLongEntry:     params.rsi_long_entry,
    rsiShortEntry:    params.rsi_short_entry,
    atrSlMult:        params.atr_sl_mult,
    atrTpMult:        params.atr_tp_mult,
    minHoldBars:      params.min_hold_bars,
    slCooldownBars:   params.sl_cooldown_bars,
    consecSlLimit:    params.consec_sl_limit,
    maxDdStop:        params.max_dd_stop,
    commission:          params.commission,
    slippage:            params.slippage,
    indicatorWindow:     params.indicator_window,
    tradingDaysPerYear:  params.trading_days_per_year,
  };
}

export function toStrategyParams(form: CustomFormParams): StrategyParams | null {
  const numFields: (keyof CustomFormParams)[] = [
    'adx_threshold', 'adx_persist', 'rsi_long_entry', 'rsi_short_entry',
    'atr_sl_mult', 'atr_tp_mult', 'min_hold_bars', 'sl_cooldown_bars',
    'consec_sl_limit', 'max_dd_stop', 'commission', 'slippage',
    'risk_per_trade', 'initial_capital', 'indicator_window', 'trading_days_per_year',
  ];
  if (!form.symbol) return null;
  for (const k of numFields) {
    if (form[k] === '') return null;
  }
  return form as unknown as StrategyParams;
}
