import { useState, useEffect, useCallback } from 'react';
import PageLayout from '../../components/PageLayout';
import { apiClient } from '../../api/apiClient';
import { authStorage } from '../../utils/auth';
import { PERMISSIONS } from '../../constants';
import type { ApiResponse, PageResponse } from '../../types/index';
import type { StrategyConfigDTO } from './strategyTypes';

// ─── Types ────────────────────────────────────────────────────────────────────

type NumVal = number | '';

interface FormState {
  name:                string;
  takeProfitPct:       NumVal;
  stopLossPct:         NumVal;
  pullbackMinPct:      NumVal;
  pullbackMaxPct:      NumVal;
  buyingVolumeRatio:   NumVal;
  stopLossVolumeRatio: NumVal;
  pullbackVolumeRatio: NumVal;
  rsiOversold:               NumVal;
  rsiOverbought:             NumVal;
  rsiExitMinGainPct:         NumVal;
  scoreTakeProfitThreshold:  NumVal;
  scoreStopLossThreshold:    NumVal;
  volBaselineCv:             NumVal;
  volMultMin:                NumVal;
  volMultMax:                NumVal;
  stopLossCooldownMinutes:  NumVal;
  adxPeriod:                 NumVal;
  adxThreshold:              NumVal;
  pullbackTrendMaDays:       NumVal;
  riskPerTradePct:           NumVal;
}

const EMPTY_FORM: FormState = {
  name:                '',
  takeProfitPct:       '',
  stopLossPct:         '',
  pullbackMinPct:      '',
  pullbackMaxPct:      '',
  buyingVolumeRatio:   '',
  stopLossVolumeRatio: '',
  pullbackVolumeRatio: '',
  rsiOversold:               '',
  rsiOverbought:             '',
  rsiExitMinGainPct:         '',
  scoreTakeProfitThreshold:  '',
  scoreStopLossThreshold:    '',
  volBaselineCv:             '',
  volMultMin:                '',
  volMultMax:                '',
  stopLossCooldownMinutes:  '',
  adxPeriod:                 '',
  adxThreshold:              '',
  pullbackTrendMaDays:       '',
  riskPerTradePct:           '',
};

function dtoToForm(dto: StrategyConfigDTO): FormState {
  return {
    name:                dto.name ?? '',
    takeProfitPct:       dto.takeProfitPct        ?? '',
    stopLossPct:         dto.stopLossPct          ?? '',
    pullbackMinPct:      dto.pullbackMinPct        ?? '',
    pullbackMaxPct:      dto.pullbackMaxPct        ?? '',
    buyingVolumeRatio:   dto.buyingVolumeRatio     ?? '',
    stopLossVolumeRatio: dto.stopLossVolumeRatio   ?? '',
    pullbackVolumeRatio: dto.pullbackVolumeRatio   ?? '',
    rsiOversold:               dto.rsiOversold               ?? '',
    rsiOverbought:             dto.rsiOverbought             ?? '',
    rsiExitMinGainPct:         dto.rsiExitMinGainPct         ?? '',
    scoreTakeProfitThreshold:  dto.scoreTakeProfitThreshold  ?? '',
    scoreStopLossThreshold:    dto.scoreStopLossThreshold    ?? '',
    volBaselineCv:             dto.volBaselineCv             ?? '',
    volMultMin:                dto.volMultMin                ?? '',
    volMultMax:                dto.volMultMax                ?? '',
    stopLossCooldownMinutes:  dto.stopLossCooldownMinutes   ?? '',
    adxPeriod:                 dto.adxPeriod                 ?? '',
    adxThreshold:              dto.adxThreshold              ?? '',
    pullbackTrendMaDays:       dto.pullbackTrendMaDays       ?? '',
    riskPerTradePct:           dto.riskPerTradePct           ?? '',
  };
}

// ─── UI Components ────────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-zinc-800 bg-zinc-800/40 rounded-t-xl">
        <i className={`${icon} text-teal-400 text-lg`}></i>
        <h2 className="text-base font-semibold text-zinc-200">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function NumInput({
  label, desc, value, onChange, step = 0.1, suffix = '%', prefix = '', disabled = false,
}: {
  label: string; desc: string; value: NumVal;
  onChange: (v: NumVal) => void; step?: number; suffix?: string; prefix?: string; disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-0.5">{label}</label>
      <p className="text-xs text-zinc-500 mb-2">{desc}</p>
      <div className="flex items-center gap-2">
        {prefix && <span className="text-sm text-zinc-500 shrink-0">{prefix}</span>}
        <input
          type="number"
          value={value}
          step={step}
          disabled={disabled}
          onChange={e => {
            const v = e.target.value;
            if (v === '') { onChange(''); return; }
            onChange(parseFloat(v));
          }}
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-teal-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {suffix && <span className="text-sm text-zinc-500 shrink-0 w-8">{suffix}</span>}
      </div>
    </div>
  );
}

function RangeInput({
  label, desc, min, max, onChangeMin, onChangeMax, step = 0.1, suffix = '%', disabled = false,
}: {
  label: string; desc: string; min: NumVal; max: NumVal;
  onChangeMin: (v: NumVal) => void; onChangeMax: (v: NumVal) => void; step?: number; suffix?: string; disabled?: boolean;
}) {
  const parse = (v: string) => v === '' ? '' : parseFloat(v);
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-0.5">{label}</label>
      <p className="text-xs text-zinc-500 mb-2">{desc}</p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={min}
          step={step}
          disabled={disabled}
          onChange={e => onChangeMin(parse(e.target.value))}
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-teal-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <span className="text-sm text-zinc-500 shrink-0">{suffix} ~</span>
        <input
          type="number"
          value={max}
          step={step}
          disabled={disabled}
          onChange={e => onChangeMax(parse(e.target.value))}
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-teal-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <span className="text-sm text-zinc-500 shrink-0 w-8">{suffix}</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Strategy() {
  const loginUser = authStorage.get();
  const isAdmin = (loginUser?.permission ?? 0) >= PERMISSIONS.ADMIN;
  const myUid = loginUser?.userUid;

  const [strategies, setStrategies] = useState<StrategyConfigDTO[]>([]);
  const [selectedId,  setSelectedId]  = useState<number | null>(null);
  const [creating,    setCreating]    = useState(false);
  const [form,        setForm]        = useState<FormState>({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');

  const load = useCallback(async () => {
    try {
      const res = await apiClient.post<ApiResponse<PageResponse<StrategyConfigDTO>>>(
        '/strategy/getStrategyConfigList',
        { userUid: myUid },
      );
      const list = res.data?.content ?? [];
      setStrategies(list);
      if (list.length > 0) {
        setSelectedId(prev => (prev != null && list.some(s => s.id === prev)) ? prev : list[0].id!);
      }
    } catch {
      setError('전략 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [myUid]);

  useEffect(() => { load(); }, [load]);

  const selected = creating ? null : strategies.find(s => s.id === selectedId) ?? null;
  const isOwner  = !!selected && !!myUid && selected.userUid === myUid;
  const canEdit  = creating || isOwner || isAdmin;
  const canDelete = !!selected && (isOwner || (isAdmin && selected.userUid != null));

  useEffect(() => {
    if (creating) { setForm({ ...EMPTY_FORM }); return; }
    if (selected) setForm(dtoToForm(selected));
  }, [selected?.id, creating]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const isFormValid = Object.values(form).every(v => v !== '');

  const startCreate = () => {
    setCreating(true);
    setSelectedId(null);
    setForm({ ...EMPTY_FORM });
    setError('');
  };

  const handleSave = async () => {
    if (!isFormValid || saving || !myUid) return;
    setSaving(true);
    setError('');
    try {
      const payload: StrategyConfigDTO = {
        ...(selected?.id ? { id: selected.id } : {}),
        userUid: myUid,
        name:                form.name,
        takeProfitPct:       form.takeProfitPct        as number,
        stopLossPct:         form.stopLossPct          as number,
        pullbackMinPct:      form.pullbackMinPct        as number,
        pullbackMaxPct:      form.pullbackMaxPct        as number,
        buyingVolumeRatio:   form.buyingVolumeRatio     as number,
        stopLossVolumeRatio: form.stopLossVolumeRatio   as number,
        pullbackVolumeRatio: form.pullbackVolumeRatio   as number,
        rsiOversold:               form.rsiOversold               as number,
        rsiOverbought:             form.rsiOverbought             as number,
        rsiExitMinGainPct:         form.rsiExitMinGainPct         as number,
        scoreTakeProfitThreshold:  form.scoreTakeProfitThreshold  as number,
        scoreStopLossThreshold:    form.scoreStopLossThreshold    as number,
        volBaselineCv:             form.volBaselineCv             as number,
        volMultMin:                form.volMultMin                as number,
        volMultMax:                form.volMultMax                as number,
        stopLossCooldownMinutes:  form.stopLossCooldownMinutes   as number,
        adxPeriod:                 form.adxPeriod                 as number,
        adxThreshold:              form.adxThreshold              as number,
        pullbackTrendMaDays:       form.pullbackTrendMaDays       as number,
        riskPerTradePct:           form.riskPerTradePct           as number,
      };
      if (creating) {
        const res = await apiClient.post<ApiResponse<StrategyConfigDTO>>('/strategy/insertStrategyConfig', payload);
        if (res.data) {
          setCreating(false);
          await load();
          setSelectedId(res.data.id!);
        } else {
          setError(res.message || '생성에 실패했습니다.');
        }
      } else {
        const res = await apiClient.put<ApiResponse<StrategyConfigDTO>>('/strategy/updateStrategyConfig', payload);
        if (res.status >= 400) {
          setError(res.message || '저장에 실패했습니다.');
        } else {
          await load();
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected?.id || !myUid) return;
    if (!window.confirm('이 전략을 삭제하시겠습니까?')) return;
    try {
      const res = await apiClient.delete<ApiResponse<StrategyConfigDTO>>('/strategy/deleteStrategyConfig', { id: selected.id, userUid: myUid });
      if (res.status >= 400) {
        setError(res.message || '삭제에 실패했습니다.');
        return;
      }
      setSelectedId(null);
      await load();
    } catch {
      setError('서버 연결에 실패했습니다.');
    }
  };

  const handleReset = () => {
    if (creating) { setForm({ ...EMPTY_FORM }); return; }
    if (selected) setForm(dtoToForm(selected));
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-20">
          <i className="ri-loader-4-line animate-spin text-teal-400 text-3xl"></i>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* 좌측: 선택된 전략 상세/편집 */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-white mb-0.5">
                {creating ? '새 전략 만들기' : '전략 설정'}
              </h1>
              <p className="text-xs text-zinc-400">
                {creating
                  ? '나만의 KOSPI 매매 전략 파라미터를 설정합니다.'
                  : 'KOSPI 매매 전략 파라미터입니다.'}
                {!creating && selected?.createdAt && (
                  <span className="ml-2 text-zinc-600">마지막 업데이트: {selected.createdAt}</span>
                )}
              </p>
            </div>
            {(creating || canEdit) && (
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
                >
                  <i className="ri-refresh-line mr-1.5"></i>되돌리기
                </button>
                {!creating && canDelete && (
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors cursor-pointer"
                  >
                    <i className="ri-delete-bin-line mr-1.5"></i>삭제
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={!isFormValid || saving}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    saved ? 'bg-green-600 text-white' : 'bg-teal-500 hover:bg-teal-400 text-white'
                  }`}
                >
                  {saving ? (
                    <><i className="ri-loader-4-line animate-spin mr-1.5"></i>저장 중</>
                  ) : saved ? (
                    <><i className="ri-check-line mr-1.5"></i>저장됨</>
                  ) : (
                    <><i className="ri-save-line mr-1.5"></i>{creating ? '생성' : '저장'}</>
                  )}
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-300">
              <i className="ri-error-warning-line shrink-0"></i>
              {error}
            </div>
          )}

          {!creating && !selected ? (
            <div className="py-16 text-center text-zinc-500">
              <i className="ri-settings-3-line text-4xl block mb-2"></i>
              전략 설정이 없습니다
            </div>
          ) : (
            <div className="space-y-4 max-w-2xl">
              <Section title="전략 이름" icon="ri-price-tag-3-line">
                <input
                  type="text"
                  value={form.name}
                  disabled={!canEdit}
                  onChange={e => set('name', e.target.value)}
                  placeholder="예: 공격형 눌림목 전략"
                  maxLength={100}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-teal-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </Section>

              <Section title="1차 필터" icon="ri-filter-3-line">
                <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2.5 mb-4 text-xs text-zinc-400 leading-relaxed space-y-1">
                  <p>후보에 오르기 전에 가장 먼저 걸러내는 조건입니다. 여기서 탈락하면 정밀 판단 자체를 안 합니다.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <NumInput
                    label="불타기 거래량 (≥)"
                    desc="현재 거래량이 평균 대비 이 비율 이상이면 매수 후보 포함 (거래량 급증 확인)"
                    value={form.buyingVolumeRatio} step={10} disabled={!canEdit}
                    onChange={v => set('buyingVolumeRatio', v)}
                  />
                  <NumInput
                    label="손절 후 재진입 쿨다운"
                    desc="손절(마이너스 청산) 직후 같은 종목에 재진입하지 않는 최소 대기시간"
                    value={form.stopLossCooldownMinutes} step={5} suffix="분" disabled={!canEdit}
                    onChange={v => set('stopLossCooldownMinutes', v)}
                  />
                </div>
                <div className="mt-4">
                  <RangeInput
                    label="눌림목 하락폭 범위 (%)"
                    desc="당일 고가 대비 이 범위만큼 하락 시 눌림목 후보 포함"
                    min={form.pullbackMinPct} max={form.pullbackMaxPct} step={0.1} disabled={!canEdit}
                    onChangeMin={v => set('pullbackMinPct', v)}
                    onChangeMax={v => set('pullbackMaxPct', v)}
                  />
                </div>
                <div className="mt-4">
                  <NumInput
                    label="눌림목 거래량 (≤) — 미사용"
                    desc="예전 필터였으나 실측 검증 결과 실효성이 없어 현재 로직에서는 사용하지 않습니다. 값을 바꿔도 매매에 영향 없습니다."
                    value={form.pullbackVolumeRatio} step={10} disabled={true}
                    onChange={v => set('pullbackVolumeRatio', v)}
                  />
                </div>
              </Section>

              <Section title="2차 필터" icon="ri-shield-check-line">
                <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2.5 mb-4 text-xs text-zinc-400 leading-relaxed space-y-1">
                  <p>1차 필터를 통과한 후보를 정밀 판단(스코어링)하기 전에, 추세 강도로 한 번 더 거릅니다.</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <NumInput
                    label="ADX 계산 기간"
                    desc="추세강도(ADX) 계산에 사용할 봉 개수 (기본 14)"
                    value={form.adxPeriod} step={1} suffix="봉" disabled={!canEdit}
                    onChange={v => set('adxPeriod', v)}
                  />
                  <NumInput
                    label="ADX 진입 게이트 문턱값"
                    desc="ADX가 이 값 미만이면 추세가 약한(횡보) 구간으로 보고 신규 진입 차단 (청산엔 미적용)"
                    value={form.adxThreshold} step={1} suffix="" disabled={!canEdit}
                    onChange={v => set('adxThreshold', v)}
                  />
                  <NumInput
                    label="눌림목 일봉 추세 게이트 (N일 이평)"
                    desc="현재가가 최근 N일 이동평균 위(상승추세)일 때만 눌림목 진입 인정"
                    value={form.pullbackTrendMaDays} step={1} suffix="일" disabled={!canEdit}
                    onChange={v => set('pullbackTrendMaDays', v)}
                  />
                </div>
              </Section>

              <Section title="매수·매도 전략 1단계 (즉시 판단)" icon="ri-flashlight-line">
                <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2.5 mb-4 text-xs text-zinc-400 leading-relaxed space-y-1">
                  <p>2차 필터를 통과한 뒤, 정밀 스코어링 전에 정해진 비율을 넘으면 즉시 매수/매도가 체결됩니다.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <NumInput
                    label="즉시 익절 / 추격매수 방지 기준 (%)"
                    desc="매도: 당일 시가 대비 이 % 이상이면 즉시 익절 · 매수: 이 % 이상 오른 종목은 추격매수 방지로 후보 제외"
                    value={form.takeProfitPct} step={0.1} prefix="+" disabled={!canEdit}
                    onChange={v => set('takeProfitPct', v)}
                  />
                  <NumInput
                    label="즉시 손절 기준 (%)"
                    desc="매수가 대비 이 % 이상 하락 시 즉시 손절 (매도 전략에서만 사용)"
                    value={form.stopLossPct} step={0.1} prefix="-" disabled={!canEdit}
                    onChange={v => set('stopLossPct', v)}
                  />
                  <NumInput
                    label="트레이드당 리스크 상한 (%)"
                    desc="계좌 총액 대비 이 비율만큼만 잃도록 매수 금액 상한을 산출 (손절폭이 넓을수록 매수 금액 자동 축소). 0이면 미적용"
                    value={form.riskPerTradePct} step={0.1} disabled={!canEdit}
                    onChange={v => set('riskPerTradePct', v)}
                  />
                  <NumInput
                    label="변동성 기준값 (ATR%)"
                    desc="평범한 30분 ATR(True Range) 기준값 — 실측 변동성과 비교해 위 두 임계값의 배수를 산출 (매수·매도 공통)"
                    value={form.volBaselineCv} step={0.01} suffix="" disabled={!canEdit}
                    onChange={v => set('volBaselineCv', v)}
                  />
                  <NumInput
                    label="변동성 배수 하한"
                    desc="임계값에 곱해지는 변동성 배수의 하한"
                    value={form.volMultMin} step={0.1} suffix="배" disabled={!canEdit}
                    onChange={v => set('volMultMin', v)}
                  />
                  <NumInput
                    label="변동성 배수 상한"
                    desc="임계값에 곱해지는 변동성 배수의 상한"
                    value={form.volMultMax} step={0.1} suffix="배" disabled={!canEdit}
                    onChange={v => set('volMultMax', v)}
                  />
                </div>
              </Section>

              <Section title="매수·매도 전략 2단계 (정밀 스코어링)" icon="ri-settings-4-line">
                <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2.5 mb-4 text-xs text-zinc-400 leading-relaxed space-y-1">
                  <p>1단계에서 즉시 체결되지 않은 경우, 패턴·RSI 기반으로 정밀 판단합니다. 기본값을 잘 모르면 건드리지 않는 것을 권장합니다 — 백테스트로 충분히 검증 후 변경하세요.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <NumInput
                    label="눌림목 과매도 기준 (RSI 14) — 매수"
                    desc="눌림목 매수 시 RSI가 이 값 미만이어야만 진입 인정 (필수 조건)"
                    value={form.rsiOversold} step={1} suffix="" disabled={!canEdit}
                    onChange={v => set('rsiOversold', v)}
                  />
                  <NumInput
                    label="손절 거래량 (≥) — 매도"
                    desc="현재 거래량이 평균 대비 이 비율 이상이어야 손절 스코어링 진행 (패닉 매도 확인)"
                    value={form.stopLossVolumeRatio} step={10} disabled={!canEdit}
                    onChange={v => set('stopLossVolumeRatio', v)}
                  />
                  <NumInput
                    label="과매수 기준 (RSI 14) — 매도"
                    desc="보유 중 수익 상태에서 RSI가 이 값을 초과하면 조기청산 강화"
                    value={form.rsiOverbought} step={1} suffix="" disabled={!canEdit}
                    onChange={v => set('rsiOverbought', v)}
                  />
                  <NumInput
                    label="조기청산 최소 수익률 — 매도"
                    desc="RSI 과매수 조기청산은 매수가 대비 이 수익률 이상일 때만 발동"
                    value={form.rsiExitMinGainPct} step={0.1} disabled={!canEdit}
                    onChange={v => set('rsiExitMinGainPct', v)}
                  />
                  <NumInput
                    label="익절 스코어링 문턱값 — 매도"
                    desc="이동평균 방향+연속 하락 합산(0~4점)이 이 값 이상이면 익절 매도"
                    value={form.scoreTakeProfitThreshold} step={1} suffix="점" disabled={!canEdit}
                    onChange={v => set('scoreTakeProfitThreshold', v)}
                  />
                  <NumInput
                    label="손절 스코어링 문턱값 — 매도"
                    desc="이동평균 방향+연속 하락 합산(0~4점)이 이 값 이상이면 손절 매도"
                    value={form.scoreStopLossThreshold} step={1} suffix="점" disabled={!canEdit}
                    onChange={v => set('scoreStopLossThreshold', v)}
                  />
                </div>
              </Section>
            </div>
          )}
        </div>

        {/* 우측: 전략 리스트 */}
        <div className="w-full lg:w-80 shrink-0 space-y-3">
          <button
            onClick={startCreate}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-teal-500 hover:bg-teal-400 text-white rounded-xl transition-colors cursor-pointer"
          >
            <i className="ri-add-line text-base"></i>새 전략 만들기
          </button>

          <div className="space-y-2">
            {strategies.map(s => {
              const active = !creating && s.id === selectedId;
              const mine   = !!myUid && s.userUid === myUid;
              return (
                <button
                  key={s.id}
                  onClick={() => { setCreating(false); setSelectedId(s.id!); setError(''); }}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors cursor-pointer ${
                    active
                      ? 'border-teal-500 bg-teal-500/10'
                      : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {s.isPublic === 1 ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold">추천</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 font-semibold">
                        {mine ? '내 전략' : '전략'}
                      </span>
                    )}
                    <span className={`text-sm font-semibold truncate ${active ? 'text-teal-300' : 'text-zinc-200'}`}>
                      {s.name || `전략 #${s.id}`}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    익절 +{s.takeProfitPct}% · 손절 -{s.stopLossPct}%
                  </p>
                </button>
              );
            })}
            {strategies.length === 0 && (
              <div className="py-10 text-center text-zinc-600 text-sm">
                <i className="ri-inbox-line text-2xl block mb-2"></i>
                전략이 없습니다
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
