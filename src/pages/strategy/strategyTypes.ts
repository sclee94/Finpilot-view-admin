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

export type NumVal = number | '';

export interface CustomFormParams {
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

export interface BoardItem {
  id:     number;
  title:  string;
  symbol: string;
  date:   string;
  params: StrategyParams;
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
  use_prev_bar_signal: false,
  initial_capital:     '',
};

export const DEFAULT_PARAMS: StrategyParams = {
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

export const SYMBOL_OPTIONS = [
  { value: '^KS11',     label: 'KOSPI (^KS11)' },
  { value: '^KQ11',     label: 'KOSDAQ (^KQ11)' },
  { value: 'NQ=F',      label: 'NASDAQ Futures (NQ=F)' },
  { value: '005930.KS', label: '삼성전자 (005930.KS)' },
];

export const BOARD_KEY   = 'strategyBoard';
export const APPLIED_KEY = 'strategyApplied';

export function loadBoard(): BoardItem[] {
  try {
    const saved = localStorage.getItem(BOARD_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return [];
}

export function toStrategyParams(form: CustomFormParams): StrategyParams | null {
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
