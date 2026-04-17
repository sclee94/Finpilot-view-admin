import { ReactNode, useState } from 'react';
import Sidebar from '../pages/dashboard/components/Sidebar';
import Header from '../pages/dashboard/components/Header';

interface PageLayoutProps {
  children: ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  const [sidebarOpen,      setSidebarOpen]      = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-zinc-950 relative">
      {/* 사이드바 래퍼 — 너비 트랜지션으로 공간 확보/해제 */}
      <div
        className={`flex-none h-full overflow-hidden transition-[width] duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-0' : 'w-96'
        }`}
      >
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* 데스크탑 전용 토글 버튼 — 사이드바 오른쪽 벽 중앙 */}
      <button
        onClick={() => setSidebarCollapsed(c => !c)}
        style={{ left: sidebarCollapsed ? 0 : '24rem' }}
        className="hidden lg:flex absolute top-1/2 -translate-y-1/2 z-50 transition-[left] duration-300 ease-in-out
                   w-4 h-14 items-center justify-center
                   bg-zinc-700 hover:bg-zinc-600
                   rounded-r-lg cursor-pointer shadow-lg"
        title={sidebarCollapsed ? '사이드바 열기' : '사이드바 닫기'}
      >
        <i className={`ri-arrow-${sidebarCollapsed ? 'right' : 'left'}-s-line text-zinc-300 text-sm`}></i>
      </button>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-zinc-950 p-3 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}