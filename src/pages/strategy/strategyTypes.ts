// Spring Boot StrategyConfigDTO 매핑 (KOSPI 전략)
export interface StrategyConfigDTO {
  id?:                  number;
  userUid?:             string | null; // 소유자 — null이면 관리자 지정 추천(공용) 전략
  isPublic?:             number;       // 1=모두 사용 가능(공용), 0=본인 전용
  name?:                 string | null; // 전략 이름
  takeProfitPct?:       number;       // 즉시 익절 기준 % (당일 시가 대비)
  stopLossPct?:         number;       // 즉시 손절 기준 % (매수가 대비)
  pullbackMinPct?:      number;       // 눌림목 최소 하락폭 % (당일 고가 대비)
  pullbackMaxPct?:      number;       // 눌림목 최대 하락폭 % (당일 고가 대비)
  buyingVolumeRatio?:   number;       // 불타기 거래량 기준 % (현재 >= 평균 × ratio/100)
  stopLossVolumeRatio?: number;       // 손절 거래량 기준 % (현재 >= 평균 × ratio/100)
  pullbackVolumeRatio?: number;       // 눌림목 거래량 기준 % (현재 <= 평균 × ratio/100)
  rsiOversold?:               number; // 눌림목 매수 보너스 RSI(14) 과매도 기준 (미만이면 보너스)
  rsiOverbought?:             number; // 익절 조기청산 RSI(14) 과매수 기준 (초과면 강화)
  rsiExitMinGainPct?:         number; // RSI 과매수 조기청산 발동 최소 수익률 % (매수가 대비)
  scoreTakeProfitThreshold?: number;  // 익절 스코어링 매도 문턱값 (0~4점 만점)
  scoreStopLossThreshold?:   number;  // 손절 스코어링 매도 문턱값 (0~4점 만점)
  volBaselineCv?:             number; // 변동성 배수 산출 기준 ATR%(평범한 30분 True Range 변동률) — 필드명은 과거 CV% 시절 그대로 유지
  volMultMin?:                number; // 변동성 배수 하한
  volMultMax?:                number; // 변동성 배수 상한
  stopLossCooldownMinutes?:  number;  // 손절 후 재진입 쿨다운 (분)
  adxPeriod?:                 number; // ADX 계산 기간 (기본 14)
  adxThreshold?:              number; // ADX 추세강도 진입 게이트 문턱값 (미만이면 신규진입 차단, 청산엔 미적용)
  pullbackTrendMaDays?:       number; // 눌림목 일봉 추세 게이트 — N일 이동평균 (현재가가 이 위에 있어야 눌림목 인정)
  riskPerTradePct?:           number; // 트레이드당 리스크 상한 % (계좌총액 기준) — 손절 시 이 비율만 잃도록 매수금액을 ATR 기반으로 캡
  gradeCutoffBullish?:        number; // 시장+종목 상대강도 필터 — 불타기 컷오프 (등급이 이보다 나쁘면 차단, 기본 12)
  gradeCutoffPullback?:       number; // 시장+종목 상대강도 필터 — 눌림목 컷오프 (등급이 이보다 나쁘면 차단, 기본 14)
  createdAt?:           string;
}

// Spring Boot StrategyMenuDTO 매핑 (매수 등급별 매수 비율)
export interface StrategyMenuDTO {
  id:         number;
  name:       string;                                              // 예: "불타기 1등급"
  menuType:   'BULLISH' | 'PULLBACK' | 'TAKE_PROFIT' | 'STOP_LOSS';
  menuGrade:  number;
  buyRatio:   number | null;                                       // 매수 비율 % — 매도/제외 등급은 null
  createdAt:  string;
}
