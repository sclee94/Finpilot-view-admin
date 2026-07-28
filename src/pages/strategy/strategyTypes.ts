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
  createdAt?:           string;
}

export type SymbolOption = { value: string; label: string; group: string };

// Spring Boot StrategyMenuDTO 매핑 (매수 등급별 매수 비율)
export interface StrategyMenuDTO {
  id:         number;
  name:       string;                                              // 예: "불타기 1등급"
  menuType:   'BULLISH' | 'PULLBACK' | 'TAKE_PROFIT' | 'STOP_LOSS';
  menuGrade:  number;
  buyRatio:   number | null;                                       // 매수 비율 % — 매도/제외 등급은 null
  createdAt:  string;
}

export const SYMBOL_OPTIONS: SymbolOption[] = [
  // ── 지수 ──────────────────────────────────────────
  { group: '지수',     value: '^KS11',      label: 'KOSPI (^KS11)' },
  { group: '지수',     value: '^KQ11',      label: 'KOSDAQ (^KQ11)' },
  // ── KOSPI 시가총액 상위 ──────────────────────────
  { group: 'KOSPI',   value: '005930.KS',  label: '삼성전자 (005930.KS)' },
  { group: 'KOSPI',   value: '005931.KS',  label: '삼성전자우 (005931.KS)' },
  { group: 'KOSPI',   value: '000660.KS',  label: 'SK하이닉스 (000660.KS)' },
  { group: 'KOSPI',   value: '373220.KS',  label: 'LG에너지솔루션 (373220.KS)' },
  { group: 'KOSPI',   value: '207940.KS',  label: '삼성바이오로직스 (207940.KS)' },
  { group: 'KOSPI',   value: '005380.KS',  label: '현대차 (005380.KS)' },
  { group: 'KOSPI',   value: '000270.KS',  label: '기아 (000270.KS)' },
  { group: 'KOSPI',   value: '012450.KS',  label: '한화에어로스페이스 (012450.KS)' },
  { group: 'KOSPI',   value: '402340.KS',  label: 'SK스퀘어 (402340.KS)' },
  { group: 'KOSPI',   value: '034020.KS',  label: '두산에너빌리티 (034020.KS)' },
  { group: 'KOSPI',   value: '035420.KS',  label: 'NAVER (035420.KS)' },
  { group: 'KOSPI',   value: '051910.KS',  label: 'LG화학 (051910.KS)' },
  { group: 'KOSPI',   value: '006400.KS',  label: '삼성SDI (006400.KS)' },
  { group: 'KOSPI',   value: '035720.KS',  label: '카카오 (035720.KS)' },
  { group: 'KOSPI',   value: '028260.KS',  label: '삼성물산 (028260.KS)' },
  { group: 'KOSPI',   value: '012330.KS',  label: '현대모비스 (012330.KS)' },
  { group: 'KOSPI',   value: '068270.KS',  label: '셀트리온 (068270.KS)' },
  { group: 'KOSPI',   value: '066570.KS',  label: 'LG전자 (066570.KS)' },
  { group: 'KOSPI',   value: '005490.KS',  label: 'POSCO홀딩스 (005490.KS)' },
  { group: 'KOSPI',   value: '003670.KS',  label: '포스코퓨처엠 (003670.KS)' },
  { group: 'KOSPI',   value: '096770.KS',  label: 'SK이노베이션 (096770.KS)' },
  { group: 'KOSPI',   value: '034730.KS',  label: 'SK (034730.KS)' },
  { group: 'KOSPI',   value: '003550.KS',  label: 'LG (003550.KS)' },
  { group: 'KOSPI',   value: '032830.KS',  label: '삼성생명 (032830.KS)' },
  { group: 'KOSPI',   value: '018260.KS',  label: '삼성에스디에스 (018260.KS)' },
  { group: 'KOSPI',   value: '009150.KS',  label: '삼성전기 (009150.KS)' },
  { group: 'KOSPI',   value: '009830.KS',  label: '한화솔루션 (009830.KS)' },
  { group: 'KOSPI',   value: '042660.KS',  label: '한화오션 (042660.KS)' },
  { group: 'KOSPI',   value: '047810.KS',  label: '한국항공우주 (047810.KS)' },
  { group: 'KOSPI',   value: '079550.KS',  label: 'LIG넥스원 (079550.KS)' },
  { group: 'KOSPI',   value: '010130.KS',  label: '고려아연 (010130.KS)' },
  { group: 'KOSPI',   value: '009540.KS',  label: '한국조선해양 (009540.KS)' },
  { group: 'KOSPI',   value: '010140.KS',  label: '삼성중공업 (010140.KS)' },
  { group: 'KOSPI',   value: '105560.KS',  label: 'KB금융 (105560.KS)' },
  { group: 'KOSPI',   value: '055550.KS',  label: '신한지주 (055550.KS)' },
  { group: 'KOSPI',   value: '086790.KS',  label: '하나금융지주 (086790.KS)' },
  { group: 'KOSPI',   value: '316140.KS',  label: '우리금융지주 (316140.KS)' },
  { group: 'KOSPI',   value: '024110.KS',  label: '기업은행 (024110.KS)' },
  { group: 'KOSPI',   value: '088350.KS',  label: '한화생명 (088350.KS)' },
  { group: 'KOSPI',   value: '005940.KS',  label: 'NH투자증권 (005940.KS)' },
  { group: 'KOSPI',   value: '016360.KS',  label: '삼성증권 (016360.KS)' },
  { group: 'KOSPI',   value: '006800.KS',  label: '미래에셋증권 (006800.KS)' },
  { group: 'KOSPI',   value: '039490.KS',  label: '키움증권 (039490.KS)' },
  { group: 'KOSPI',   value: '017670.KS',  label: 'SK텔레콤 (017670.KS)' },
  { group: 'KOSPI',   value: '030200.KS',  label: 'KT (030200.KS)' },
  { group: 'KOSPI',   value: '032640.KS',  label: 'LG유플러스 (032640.KS)' },
  { group: 'KOSPI',   value: '003490.KS',  label: '대한항공 (003490.KS)' },
  { group: 'KOSPI',   value: '180640.KS',  label: '한진칼 (180640.KS)' },
  { group: 'KOSPI',   value: '015760.KS',  label: '한국전력 (015760.KS)' },
  { group: 'KOSPI',   value: '036460.KS',  label: '한국가스공사 (036460.KS)' },
  { group: 'KOSPI',   value: '010950.KS',  label: 'S-Oil (010950.KS)' },
  { group: 'KOSPI',   value: '011170.KS',  label: '롯데케미칼 (011170.KS)' },
  { group: 'KOSPI',   value: '047050.KS',  label: '포스코인터내셔널 (047050.KS)' },
  { group: 'KOSPI',   value: '011790.KS',  label: 'SKC (011790.KS)' },
  { group: 'KOSPI',   value: '004020.KS',  label: '현대제철 (004020.KS)' },
  { group: 'KOSPI',   value: '000720.KS',  label: '현대건설 (000720.KS)' },
  { group: 'KOSPI',   value: '034220.KS',  label: 'LG디스플레이 (034220.KS)' },
  { group: 'KOSPI',   value: '033780.KS',  label: 'KT&G (033780.KS)' },
  { group: 'KOSPI',   value: '271560.KS',  label: '오리온 (271560.KS)' },
  { group: 'KOSPI',   value: '003230.KS',  label: '삼양식품 (003230.KS)' },
  { group: 'KOSPI',   value: '007310.KS',  label: '오뚜기 (007310.KS)' },
  { group: 'KOSPI',   value: '000080.KS',  label: '하이트진로 (000080.KS)' },
  { group: 'KOSPI',   value: '001040.KS',  label: 'CJ (001040.KS)' },
  { group: 'KOSPI',   value: '004170.KS',  label: '신세계 (004170.KS)' },
  { group: 'KOSPI',   value: '069960.KS',  label: '현대백화점 (069960.KS)' },
  { group: 'KOSPI',   value: '000100.KS',  label: '유한양행 (000100.KS)' },
  { group: 'KOSPI',   value: '185750.KS',  label: '종근당 (185750.KS)' },
  { group: 'KOSPI',   value: '006280.KS',  label: '녹십자 (006280.KS)' },
  { group: 'KOSPI',   value: '302440.KS',  label: 'SK바이오사이언스 (302440.KS)' },
  { group: 'KOSPI',   value: '326030.KS',  label: 'SK바이오팜 (326030.KS)' },
  { group: 'KOSPI',   value: '036570.KS',  label: '엔씨소프트 (036570.KS)' },
  { group: 'KOSPI',   value: '251270.KS',  label: '넷마블 (251270.KS)' },
  { group: 'KOSPI',   value: '263750.KS',  label: '펄어비스 (263750.KS)' },
  { group: 'KOSPI',   value: '161390.KS',  label: '한국타이어앤테크놀로지 (161390.KS)' },
  { group: 'KOSPI',   value: '092200.KS',  label: '현대오토에버 (092200.KS)' },
  { group: 'KOSPI',   value: '011210.KS',  label: '현대위아 (011210.KS)' },
  // ── KOSDAQ ──────────────────────────────────────
  { group: 'KOSDAQ',  value: '041190.KQ',  label: '우리기술투자 (041190.KQ)' },
  // ── 나스닥 ──────────────────────────────────────
  { group: '나스닥',  value: 'AAPL',       label: 'Apple (AAPL)' },
  { group: '나스닥',  value: 'MSFT',       label: 'Microsoft (MSFT)' },
  { group: '나스닥',  value: 'NVDA',       label: 'NVIDIA (NVDA)' },
  { group: '나스닥',  value: 'AMZN',       label: 'Amazon (AMZN)' },
  { group: '나스닥',  value: 'META',       label: 'Meta (META)' },
  { group: '나스닥',  value: 'GOOGL',      label: 'Alphabet (GOOGL)' },
  { group: '나스닥',  value: 'TSLA',       label: 'Tesla (TSLA)' },
  { group: '나스닥',  value: 'NFLX',       label: 'Netflix (NFLX)' },
  { group: '나스닥',  value: 'AMD',        label: 'AMD (AMD)' },
  { group: '나스닥',  value: 'INTC',       label: 'Intel (INTC)' },
  { group: '나스닥',  value: 'QCOM',       label: 'Qualcomm (QCOM)' },
  { group: '나스닥',  value: 'AVGO',       label: 'Broadcom (AVGO)' },
  { group: '나스닥',  value: 'TXN',        label: 'Texas Instruments (TXN)' },
  { group: '나스닥',  value: 'AMAT',       label: 'Applied Materials (AMAT)' },
  { group: '나스닥',  value: 'BKNG',       label: 'Booking Holdings (BKNG)' },
  { group: '나스닥',  value: 'ISRG',       label: 'Intuitive Surgical (ISRG)' },
  { group: '나스닥',  value: 'MU',         label: 'Micron (MU)' },
  { group: '나스닥',  value: 'LRCX',       label: 'Lam Research (LRCX)' },
  { group: '나스닥',  value: 'ADI',        label: 'Analog Devices (ADI)' },
  { group: '나스닥',  value: 'KLAC',       label: 'KLA (KLAC)' },
  { group: '나스닥',  value: 'PANW',       label: 'Palo Alto Networks (PANW)' },
  { group: '나스닥',  value: 'GILD',       label: 'Gilead Sciences (GILD)' },
  { group: '나스닥',  value: 'REGN',       label: 'Regeneron (REGN)' },
  { group: '나스닥',  value: 'CDNS',       label: 'Cadence (CDNS)' },
  { group: '나스닥',  value: 'SNPS',       label: 'Synopsys (SNPS)' },
  { group: '나스닥',  value: 'ASML',       label: 'ASML (ASML)' },
  { group: '나스닥',  value: 'MRVL',       label: 'Marvell (MRVL)' },
  { group: '나스닥',  value: 'CRWD',       label: 'CrowdStrike (CRWD)' },
  { group: '나스닥',  value: 'ABNB',       label: 'Airbnb (ABNB)' },
  { group: '나스닥',  value: 'MELI',       label: 'MercadoLibre (MELI)' },
  { group: '나스닥',  value: 'WDAY',       label: 'Workday (WDAY)' },
  { group: '나스닥',  value: 'FTNT',       label: 'Fortinet (FTNT)' },
  { group: '나스닥',  value: 'DDOG',       label: 'Datadog (DDOG)' },
  { group: '나스닥',  value: 'ZS',         label: 'Zscaler (ZS)' },
  { group: '나스닥',  value: 'PLTR',       label: 'Palantir (PLTR)' },
  { group: '나스닥',  value: 'ARM',        label: 'Arm Holdings (ARM)' },
  { group: '나스닥',  value: 'DASH',       label: 'DoorDash (DASH)' },
  { group: '나스닥',  value: 'AXON',       label: 'Axon (AXON)' },
  { group: '나스닥',  value: 'SMCI',       label: 'SuperMicro (SMCI)' },
  { group: '나스닥',  value: 'OKTA',       label: 'Okta (OKTA)' },
  { group: '나스닥',  value: 'TEAM',       label: 'Atlassian (TEAM)' },
  { group: '나스닥',  value: 'PYPL',       label: 'PayPal (PYPL)' },
  { group: '나스닥',  value: 'SBUX',       label: 'Starbucks (SBUX)' },
  { group: '나스닥',  value: 'CSCO',       label: 'Cisco (CSCO)' },
  { group: '나스닥',  value: 'TMUS',       label: 'T-Mobile (TMUS)' },
  { group: '나스닥',  value: 'PEP',        label: 'PepsiCo (PEP)' },
  { group: '나스닥',  value: 'CMCSA',      label: 'Comcast (CMCSA)' },
  { group: '나스닥',  value: 'MRNA',       label: 'Moderna (MRNA)' },
  { group: '나스닥',  value: 'NXPI',       label: 'NXP Semi (NXPI)' },
  { group: '나스닥',  value: 'LULU',       label: 'Lululemon (LULU)' },
  { group: '나스닥',  value: 'TTD',        label: 'The Trade Desk (TTD)' },
  { group: '나스닥',  value: 'ENPH',       label: 'Enphase (ENPH)' },
  { group: '나스닥',  value: 'CEG',        label: 'Constellation Energy (CEG)' },
  { group: '나스닥',  value: 'MDLZ',       label: 'Mondelez (MDLZ)' },
  { group: '나스닥',  value: 'ORLY',       label: "O'Reilly Auto (ORLY)" },
  { group: '나스닥',  value: 'CTAS',       label: 'Cintas (CTAS)' },
  { group: '나스닥',  value: 'MNST',       label: 'Monster Beverage (MNST)' },
  { group: '나스닥',  value: 'CPRT',       label: 'Copart (CPRT)' },
  { group: '나스닥',  value: 'PCAR',       label: 'PACCAR (PCAR)' },
  { group: '나스닥',  value: 'ADP',        label: 'ADP (ADP)' },
  { group: '나스닥',  value: 'ROST',       label: 'Ross Stores (ROST)' },
  { group: '나스닥',  value: 'KDP',        label: 'Keurig Dr Pepper (KDP)' },
  { group: '나스닥',  value: 'DXCM',       label: 'DexCom (DXCM)' },
  { group: '나스닥',  value: 'FANG',       label: 'Diamondback Energy (FANG)' },
  { group: '나스닥',  value: 'IDXX',       label: 'IDEXX Labs (IDXX)' },
  { group: '나스닥',  value: 'VRSK',       label: 'Verisk (VRSK)' },
  { group: '나스닥',  value: 'BIIB',       label: 'Biogen (BIIB)' },
  { group: '나스닥',  value: 'EXC',        label: 'Exelon (EXC)' },
  { group: '나스닥',  value: 'XEL',        label: 'Xcel Energy (XEL)' },
  { group: '나스닥',  value: 'AEP',        label: 'AEP (AEP)' },
  { group: '나스닥',  value: 'ON',         label: 'ON Semi (ON)' },
  { group: '나스닥',  value: 'FAST',       label: 'Fastenal (FAST)' },
  { group: '나스닥',  value: 'CTSH',       label: 'Cognizant (CTSH)' },
  { group: '나스닥',  value: 'CDW',        label: 'CDW (CDW)' },
  { group: '나스닥',  value: 'ILMN',       label: 'Illumina (ILMN)' },
  { group: '나스닥',  value: 'VRSN',       label: 'VeriSign (VRSN)' },
  { group: '나스닥',  value: 'DLTR',       label: 'Dollar Tree (DLTR)' },
  { group: '나스닥',  value: 'ALGN',       label: 'Align Technology (ALGN)' },
  { group: '나스닥',  value: 'CSX',        label: 'CSX (CSX)' },
  { group: '나스닥',  value: 'CHTR',       label: 'Charter Comm (CHTR)' },
  { group: '나스닥',  value: 'EBAY',       label: 'eBay (EBAY)' },
  { group: '나스닥',  value: 'PAYX',       label: 'Paychex (PAYX)' },
  { group: '나스닥',  value: 'KHC',        label: 'Kraft Heinz (KHC)' },
  { group: '나스닥',  value: 'HON',        label: 'Honeywell (HON)' },
  { group: '나스닥',  value: 'EA',         label: 'Electronic Arts (EA)' },
  { group: '나스닥',  value: 'MAR',        label: 'Marriott (MAR)' },
  { group: '나스닥',  value: 'ODFL',       label: 'Old Dominion (ODFL)' },
  { group: '나스닥',  value: 'GEHC',       label: 'GE HealthCare (GEHC)' },
  { group: '나스닥',  value: 'ROP',        label: 'Roper Tech (ROP)' },
  { group: '나스닥',  value: 'WBD',        label: 'Warner Bros (WBD)' },
  { group: '나스닥',  value: 'SIRI',       label: 'SiriusXM (SIRI)' },
  { group: '나스닥',  value: 'GFS',        label: 'GlobalFoundries (GFS)' },
  { group: '나스닥',  value: 'ANSS',       label: 'ANSYS (ANSS)' },
  // ── 선물 ─────────────────────────────────────────
  { group: '선물',    value: 'NQ=F',       label: '나스닥선물 (NQ=F)' },
  { group: '선물',    value: 'ES=F',       label: 'S&P500선물 (ES=F)' },
  { group: '선물',    value: 'GC=F',       label: '금선물 (GC=F)' },
  { group: '선물',    value: 'CL=F',       label: '원유선물 (CL=F)' },
];
