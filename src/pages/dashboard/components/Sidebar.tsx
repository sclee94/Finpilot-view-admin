import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MENU_ITEMS } from '../../../constants';
import ProfileModal from './ProfileModal';
import { authStorage } from '../../../utils/auth';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const loginUser = authStorage.get();
  const isRegularUser = loginUser?.permission === 1;
  const isRestricted = loginUser?.status === 0 || loginUser?.status === -1;
  const visibleMenuItems = MENU_ITEMS.filter(item => !item.adminOnly || !isRegularUser);

  const handleNavigation = (path: string) => {
    navigate(path);
    if (typeof onClose === 'function') onClose();
  };

  const handleLogout = () => {
    authStorage.clear();
    setAccountMenuOpen(false);
    navigate('/');
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} user={loginUser} />

      <aside
        className={`relative fixed lg:static inset-y-0 left-0 z-50 w-96 bg-zinc-900 border-r border-zinc-800 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* 로고 영역 */}
          <div className="flex flex-col items-center justify-center h-28 border-b border-zinc-800 px-4">
            <button
              onClick={() => handleNavigation(isRegularUser ? '/reports' : '/dashboard')}
              className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img
                src="https://public.readdy.ai/ai/img_res/1e74d93b-2151-4e20-b57f-a5c03641098e.png"
                alt="Logo"
                className="h-14 w-auto object-contain"
              />
              <span className="text-xl font-bold text-zinc-200 mt-1.5 whitespace-nowrap">FINPILOT</span>
            </button>
          </div>

          {/* 네비게이션 */}
          <nav className="flex-1 overflow-y-auto py-4">
            {visibleMenuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => !isRestricted && handleNavigation(item.path)}
                disabled={isRestricted}
                className={`w-full flex items-center px-6 py-4 text-base font-medium transition-colors whitespace-nowrap ${
                  isRestricted
                    ? 'text-zinc-600 cursor-not-allowed'
                    : location.pathname === item.path
                      ? 'bg-teal-500/10 text-teal-400 border-r-4 border-teal-500 cursor-pointer'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer'
                }`}
              >
                <i className={`${item.icon} text-2xl w-9 h-9 flex items-center justify-center mr-4`}></i>
                {item.label}
              </button>
            ))}
          </nav>

          {/* 스크롤 버튼 - 사이드바 우측 고정 */}
          <div className="absolute right-3 bottom-24 flex flex-col gap-2">
            <button
              onClick={() => document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-9 h-9 rounded-full bg-zinc-700 hover:bg-zinc-600 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xl font-bold leading-none"
              title="맨 위로"
            >
              +
            </button>
            <button
              onClick={() => { const m = document.querySelector('main'); if (m) m.scrollTo({ top: m.scrollHeight, behavior: 'smooth' }); }}
              className="w-9 h-9 rounded-full bg-zinc-700 hover:bg-zinc-600 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xl font-bold leading-none"
              title="맨 아래로"
            >
              −
            </button>
          </div>

          {/* 계정 영역 */}
          <div className="border-t border-zinc-800 p-4 relative">
            {/* 드롭업 메뉴 */}
            {accountMenuOpen && (
              <div className="absolute bottom-full left-2 right-2 mb-2 bg-zinc-800 border border-zinc-700 rounded-xl shadow-lg overflow-hidden z-10">
                <button
                  onClick={() => { setShowProfileModal(true); setAccountMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-5 py-4 text-base text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <div className="w-8 h-8 flex items-center justify-center">
                    <i className="ri-user-settings-line text-xl text-zinc-400"></i>
                  </div>
                  프로필
                </button>
                <div className="border-t border-zinc-700"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-5 py-4 text-base text-red-400 hover:bg-zinc-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <div className="w-8 h-8 flex items-center justify-center">
                    <i className="ri-logout-box-r-line text-xl"></i>
                  </div>
                  로그아웃
                </button>
              </div>
            )}

            <button
              onClick={() => setAccountMenuOpen(!accountMenuOpen)}
              className="w-full flex items-center hover:bg-zinc-800 rounded-xl p-3 transition-colors cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0">
                <i className="ri-user-line text-teal-400 text-2xl"></i>
              </div>
              <div className="ml-3 flex-1 text-left min-w-0">
                <p className="text-base font-medium text-zinc-200 truncate">{loginUser?.userName ?? '관리자'}</p>
                <p className="text-sm text-zinc-500 truncate">{loginUser?.email ?? '-'}</p>
              </div>
              <div className="w-7 h-7 flex items-center justify-center shrink-0">
                <i className={`ri-arrow-${accountMenuOpen ? 'down' : 'up'}-s-line text-zinc-500 text-xl`}></i>
              </div>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
