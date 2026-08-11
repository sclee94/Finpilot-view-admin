// 종목 추천(스크리너) — POST /api/screener/recommend 응답 타입.
// Java ScreenerRecommendationDTO/ScreenerResultDTO와 1:1 매칭.

export interface ScreenerRecommendation {
  symbol: string;
  symbolName: string | null;
  direction: 'BULLISH' | 'PULLBACK' | 'MEANREVERT';
  currentPrice: number;
  patternGrade: number | null;   // 패턴 점수 등급(1~2, strategy_menu 매칭용) — MEANREVERT는 항상 null
  patternScore: number | null;
  marketGrade: number | null;    // 시장+종목 상대강도 등급(1~15, 낮을수록 좋음) — MEANREVERT는 항상 null
  validated: boolean;            // true=평균회귀(research/holdout 검증됨) / false=불타기·눌림목(참고용, 방향예측력 미검증)
  strategyConfigId: number | null;  // "세션 추가" 시 이 ID를 그대로 써야 함(방향별로 다른 전략에 연결됨)
}

export interface ScreenerResult {
  scannedCount: number;
  skippedNoDataCount: number;
  recommendations: ScreenerRecommendation[];
}
