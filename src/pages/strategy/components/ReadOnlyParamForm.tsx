import type { StrategyParams } from '../strategyTypes';
import { Section, ReadOnlyNumberField, ToggleField } from './StrategyFormFields';

interface ReadOnlyParamFormProps {
  params: StrategyParams | null;
}

export default function ReadOnlyParamForm({ params }: ReadOnlyParamFormProps) {
  const n = (v: number | undefined): number | '' => v ?? '';

  return (
    <div className="space-y-6">
      <Section title="자본 설정" icon="ri-funds-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadOnlyNumberField label="초기 자본금 (원)" desc="포지션 사이징 기준 초기 자본" value={n(params?.initial_capital)} />
          <ReadOnlyNumberField label="거래당 위험 비율" desc="자산 대비 위험 비율 (예: 0.01 = 1%)" value={n(params?.risk_per_trade)} />
          <div className="sm:col-span-2">
            <ToggleField label="이전 봉 신호 사용" desc="신호 발생 봉의 다음 봉 시가에 진입 (룩어헤드 바이어스 방지)"
              value={params?.use_prev_bar_signal ?? false} readOnly onChange={() => {}} />
          </div>
        </div>
      </Section>
      <Section title="종목 설정" icon="ri-stock-line">
        <input
          type="text"
          value={params?.symbol ?? ''}
          readOnly
          placeholder="추천받기 후 표시됩니다"
          className="w-full px-3 py-2.5 border rounded-lg text-lg text-zinc-400 bg-zinc-800/50 border-zinc-700/50 cursor-default focus:outline-none placeholder-zinc-600"
        />
      </Section>
      <Section title="추세 지표 (ADX)" icon="ri-line-chart-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadOnlyNumberField label="ADX 임계치" desc="이 값 이상일 때 추세 있음으로 판단" value={n(params?.adx_threshold)} />
          <ReadOnlyNumberField label="ADX 횡보 하한선" desc="이 값 미만이면 ADX 임계치 무관하게 신호 차단" value={n(params?.adx_sideways_floor)} />
          <ReadOnlyNumberField label="ADX 연속 유지 봉 수" desc="ADX 조건이 유지되어야 하는 60분봉 수" value={n(params?.adx_persist)} />
          <ReadOnlyNumberField label="DI 격차 최소값" desc="+DI와 -DI 차이가 이 값 미만이면 방향성 약함으로 신호 차단" value={n(params?.di_gap_min)} />
        </div>
      </Section>
      <Section title="RSI 진입 조건" icon="ri-swap-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadOnlyNumberField label="롱 진입 RSI 하한" desc="RSI가 이 값 초과일 때 롱 진입 허용 (0=비활성)" value={n(params?.rsi_long_floor)} />
          <ReadOnlyNumberField label="롱 진입 RSI 상한" desc="RSI가 이 값 미만일 때 롱 진입" value={n(params?.rsi_long_entry)} />
          <ReadOnlyNumberField label="숏 진입 RSI 하한" desc="RSI가 이 값 초과일 때 숏 진입" value={n(params?.rsi_short_entry)} />
          <ReadOnlyNumberField label="과매도 반등 RSI 상한" desc="ADX 조건 없이 롱 진입 (rsi_long_floor보다 낮아야 함)" value={n(params?.rsi_oversold_entry)} />
        </div>
      </Section>
      <Section title="리스크 관리" icon="ri-shield-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadOnlyNumberField label="손절 ATR 배수" desc="ATR × 이 배수를 손절폭으로 설정" value={n(params?.atr_sl_mult)} />
          <ReadOnlyNumberField label="익절 ATR 배수" desc="ATR × 이 배수를 익절폭으로 설정" value={n(params?.atr_tp_mult)} />
          <ReadOnlyNumberField label="최소 유지 봉 수" desc="추세 청산 허용까지 최소 보유 봉 수" value={n(params?.min_hold_bars)} />
          <ReadOnlyNumberField label="SL 쿨다운 봉 수" desc="손절 후 재진입 금지 봉 수" value={n(params?.sl_cooldown_bars)} />
          <ReadOnlyNumberField label="연속 손절 한도" desc="연속 손절 N회 초과 시 쿨다운 2배 적용" value={n(params?.consec_sl_limit)} />
          <ReadOnlyNumberField label="최대 MDD 차단 비율" desc="누적 MDD 초과 시 신규 진입 차단 (0 = 비활성)" value={n(params?.max_dd_stop)} />
        </div>
      </Section>
      <Section title="비용 설정" icon="ri-percent-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadOnlyNumberField label="수수료 (편도)" desc="예: 0.0002 = 0.02%" value={n(params?.commission)} />
          <ReadOnlyNumberField label="슬리피지 (편도)" desc="예: 0.0001 = 0.01%" value={n(params?.slippage)} />
        </div>
      </Section>
      <Section title="지표 설정" icon="ri-bar-chart-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadOnlyNumberField label="지표 룩백 기간" desc="ADX/RSI/ATR 공통 룩백 기간 (봉 수)" value={n(params?.indicator_window)} />
          <ReadOnlyNumberField label="연간 거래일 수" desc="Sharpe 비율 연간화 기준 거래일 수" value={n(params?.trading_days_per_year)} />
        </div>
      </Section>
    </div>
  );
}
