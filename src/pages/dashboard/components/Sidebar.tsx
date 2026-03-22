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
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-zinc-900 border-r border-zinc-800 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* 로고 영역 */}
          <div className="flex flex-col items-center justify-center h-20 border-b border-zinc-800 px-4">
            <button
              onClick={() => handleNavigation(isRegularUser ? '/reports' : '/dashboard')}
              className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img
                src="https://public.readdy.ai/ai/img_res/1e74d93b-2151-4e20-b57f-a5c03641098e.png"
                alt="Logo"
                className="h-10 w-auto object-contain"
              />
              <span className="text-base font-bold text-zinc-200 mt-1 whitespace-nowrap">FINPILOT</span>
            </button>
          </div>

          {/* 네비게이션 */}
          <nav className="flex-1 overflow-y-auto py-4">
            {visibleMenuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center px-5 py-3 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  location.pathname === item.path
                    ? 'bg-teal-500/10 text-teal-400 border-r-4 border-teal-500'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                <i className={`${item.icon} text-lg w-7 h-7 flex items-center justify-center mr-3`}></i>
                {item.label}
              </button>
            ))}
          </nav>

          {/* 스크롤 버튼 */}
          <div className="flex flex-col gap-1 px-3 pb-2">
            <button
              onClick={() => document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center justify-center py-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title="맨 위로"
            >
              <i className="ri-arrow-up-line text-base"></i>
            </button>
            <button
              onClick={() => { const m = document.querySelector('main'); if (m) m.scrollTo({ top: m.scrollHeight, behavior: 'smooth' }); }}
              className="flex items-center justify-center py-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title="맨 아래로"
            >
              <i className="ri-arrow-down-line text-base"></i>
            </button>
          </div>

          {/* 계정 영역 */}
          <div className="border-t border-zinc-800 p-3 relative">
            {/* 드롭업 메뉴 */}
            {accountMenuOpen && (
              <div className="absolute bottom-full left-2 right-2 mb-2 bg-zinc-800 border border-zinc-700 rounded-xl shadow-lg overflow-hidden z-10">
                <button
                  onClick={() => { setShowProfileModal(true); setAccountMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <div className="w-7 h-7 flex items-center justify-center">
                    <i className="ri-user-settings-line text-lg text-zinc-400"></i>
                  </div>
                  프로필
                </button>
                <div className="border-t border-zinc-700"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-zinc-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <div className="w-7 h-7 flex items-center justify-center">
                    <i className="ri-logout-box-r-line text-lg"></i>
                  </div>
                  로그아웃
                </button>
              </div>
            )}

            <button
              onClick={() => setAccountMenuOpen(!accountMenuOpen)}
              className="w-full flex items-center hover:bg-zinc-800 rounded-xl p-2 transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0">
                <i className="ri-user-line text-teal-400 text-lg"></i>
              </div>
              <div className="ml-2.5 flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">{loginUser?.userName ?? '관리자'}</p>
                <p className="text-xs text-zinc-500 truncate">{loginUser?.email ?? '-'}</p>
              </div>
              <div className="w-6 h-6 flex items-center justify-center shrink-0">
                <i className={`ri-arrow-${accountMenuOpen ? 'down' : 'up'}-s-line text-zinc-500 text-lg`}></i>
              </div>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}