import { useState, useEffect } from 'react';
import PageLayout from '../../components/PageLayout';
import { apiClient } from '../../api/apiClient';
import type { ApiResponse } from '../../types/index';
import type { StrategyMenuDTO } from '../strategy/strategyTypes';

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

function menuLabel(menu: StrategyMenuDTO): string {
  if (menu.menuType === 'TAKE_PROFIT' || menu.menuType === 'STOP_LOSS') {
    return menu.menuGrade === 1 ? '즉시 전량매도' : '매도 제외';
  }
  return menu.buyRatio != null ? `자산의 ${menu.buyRatio}% 매수` : '전략에서 제외';
}

function MenuRow({ menu }: { menu: StrategyMenuDTO }) {
  const excluded = menu.buyRatio == null && !(menu.menuType === 'TAKE_PROFIT' || menu.menuType === 'STOP_LOSS' ? menu.menuGrade === 1 : false);
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/60 last:border-0">
      <span className="text-sm text-zinc-400">{menu.name}</span>
      <span className={`text-sm font-semibold ${excluded ? 'text-zinc-500' : 'text-zinc-100'}`}>
        {menuLabel(menu)}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StrategyMenu() {
  const [menus,   setMenus]   = useState<StrategyMenuDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    apiClient.post<ApiResponse<StrategyMenuDTO[]>>('/strategy/getStrategyMenuList', {})
      .then(res => setMenus(res.data ?? []))
      .catch(() => setError('전략 메뉴판을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  const byType = (type: StrategyMenuDTO['menuType']) =>
    menus.filter(m => m.menuType === type).sort((a, b) => a.menuGrade - b.menuGrade);

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
      <div className="space-y-6 max-w-xl">
        <div>
          <h1 className="text-xl font-bold text-white mb-0.5">전략 메뉴판</h1>
          <p className="text-xs text-zinc-400">매수 판단 등급별 매수 비율(투자금 대비 %)입니다.</p>
        </div>

        {error ? (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-300">
            <i className="ri-error-warning-line shrink-0"></i>
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            <Section title="불타기 (상승 추세)" icon="ri-fire-line">
              {byType('BULLISH').map(m => <MenuRow key={m.id} menu={m} />)}
            </Section>
            <Section title="눌림목 (하락 후 반등)" icon="ri-arrow-down-line">
              {byType('PULLBACK').map(m => <MenuRow key={m.id} menu={m} />)}
            </Section>
            <Section title="익절 / 손절 (매도 판단)" icon="ri-shield-line">
              <p className="text-xs text-zinc-500 mb-2">보유 수량 전량을 매도할지 여부를 판단하는 등급입니다 (매수 비율과 무관).</p>
              {[...byType('TAKE_PROFIT'), ...byType('STOP_LOSS')].map(m => <MenuRow key={m.id} menu={m} />)}
            </Section>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
