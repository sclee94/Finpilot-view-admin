import { useState } from 'react';
import type { CustomFormParams } from '../strategyTypes';
import { SYMBOL_OPTIONS } from '../strategyTypes';
import { Section, NumberField, SelectField, ToggleField, FieldLabel } from './StrategyFormFields';

interface CustomParamFormProps {
  params: CustomFormParams;
  onChange: <K extends keyof CustomFormParams>(key: K, value: CustomFormParams[K]) => void;
}

export default function CustomParamForm({ params, onChange }: CustomParamFormProps) {
  const set = <K extends keyof CustomFormParams>(key: K, value: CustomFormParams[K]) => onChange(key, value);
  const [symbolMode, setSymbolMode] = useState<'dropdown' | 'direct'>('dropdown');

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
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <FieldLabel label="종목" desc="백테스트 및 전략 실행 대상 종목" />
            <div className="ml-auto flex bg-zinc-800 rounded-md p-0.5 gap-0.5">
              <button
                type="button"
                onClick={() => { setSymbolMode('dropdown'); set('symbol', ''); }}
                className={`px-3 py-1 text-sm rounded transition-colors cursor-pointer ${symbolMode === 'dropdown' ? 'bg-teal-500 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                선택
              </button>
              <button
                type="button"
                onClick={() => { setSymbolMode('direct'); set('symbol', ''); }}
                className={`px-3 py-1 text-sm rounded transition-colors cursor-pointer ${symbolMode === 'direct' ? 'bg-teal-500 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                직접입력
              </button>
            </div>
          </div>
          {symbolMode === 'dropdown' ? (
            <SelectField label="" desc=""
              value={params.symbol} options={SYMBOL_OPTIONS} withPlaceholder
              onChange={v => set('symbol', v)} />
          ) : (
            <input
              type="text"
              value={params.symbol}
              onChange={e => set('symbol', e.target.value)}
              placeholder="종목 코드를 입력하세요 (예: 005930.KS)"
              className="w-full px-3 py-2.5 border rounded-lg text-lg text-zinc-200 focus:outline-none transition-colors bg-zinc-800 border-zinc-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-zinc-600"
            />
          )}
        </div>
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
