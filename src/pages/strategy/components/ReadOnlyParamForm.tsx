import type { StrategyParams } from '../strategyTypes';
import { SYMBOL_OPTIONS } from '../strategyTypes';
import { Section, ReadOnlyNumberField, SelectField, ToggleField } from './StrategyFormFields';

export default function ReadOnlyParamForm({ params }: { params: StrategyParams }) {
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
      <Section title="지표 설정" icon="ri-bar-chart-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadOnlyNumberField label="지표 룩백 기간" desc="ADX/RSI/ATR 공통 룩백 기간 (봉 수)" value={params.indicator_window} />
          <ReadOnlyNumberField label="연간 거래일 수" desc="Sharpe 비율 연간화 기준 거래일 수" value={params.trading_days_per_year} />
        </div>
      </Section>
    </div>
  );
}
