import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MENU_ITEMS } from '../../../constants';
import ProfileModal from './ProfileModal';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleNavigation = (path: string) => {
    navigate(path);
    if (typeof onClose === 'function') onClose();
  };

  const handleLogout = () => {
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

      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[420px] bg-zinc-900 border-r border-zinc-800 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* 로고 영역 */}
          <div className="flex flex-col items-center justify-center h-36 border-b border-zinc-800 px-6">
            <button
              onClick={() => handleNavigation('/dashboard')}
              className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img
                src="https://public.readdy.ai/ai/img_res/1e74d93b-2151-4e20-b57f-a5c03641098e.png"
                alt="Logo"
                className="h-16 w-auto object-contain"
              />
              <span className="text-xl font-bold text-zinc-200 mt-2 whitespace-nowrap">FINPILOT</span>
            </button>
          </div>

          {/* 네비게이션 */}
          <nav className="flex-1 overflow-y-auto py-6">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center px-12 py-6 text-xl font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  location.pathname === item.path
                    ? 'bg-teal-500/10 text-teal-400 border-r-4 border-teal-500'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                <i className={`${item.icon} text-2xl w-10 h-10 flex items-center justify-center mr-6`}></i>
                {item.label}
              </button>
            ))}
          </nav>

          {/* 계정 영역 */}
          <div className="border-t border-zinc-800 p-8 relative">
            {/* 드롭업 메뉴 */}
            {accountMenuOpen && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-zinc-800 border border-zinc-700 rounded-xl shadow-lg overflow-hidden z-10">
                <button
                  onClick={() => { setShowProfileModal(true); setAccountMenuOpen(false); }}
                  className="w-full flex items-center gap-4 px-8 py-5 text-lg text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <div className="w-9 h-9 flex items-center justify-center">
                    <i className="ri-user-settings-line text-2xl text-zinc-400"></i>
                  </div>
                  프로필
                </button>
                <div className="border-t border-zinc-700"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-8 py-5 text-lg text-red-400 hover:bg-zinc-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <div className="w-9 h-9 flex items-center justify-center">
                    <i className="ri-logout-box-r-line text-2xl"></i>
                  </div>
                  로그아웃
                </button>
              </div>
            )}

            <button
              onClick={() => setAccountMenuOpen(!accountMenuOpen)}
              className="w-full flex items-center hover:bg-zinc-800 rounded-xl p-4 transition-colors cursor-pointer"
            >
              <div className="w-[4.5rem] h-[4.5rem] rounded-full bg-teal-500/20 flex items-center justify-center shrink-0">
                <i className="ri-user-line text-teal-400 text-3xl"></i>
              </div>
              <div className="ml-5 flex-1 text-left">
                <p className="text-xl font-medium text-zinc-200">관리자</p>
                <p className="text-base text-zinc-500">admin@stock.com</p>
              </div>
              <div className="w-8 h-8 flex items-center justify-center">
                <i className={`ri-arrow-${accountMenuOpen ? 'down' : 'up'}-s-line text-zinc-500 text-2xl`}></i>
              </div>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}