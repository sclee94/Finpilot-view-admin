import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type ModalType = 'signup' | 'findId' | 'findPw' | null;

export default function Home() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [autoLogin, setAutoLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-5">
          <img
            src="https://public.readdy.ai/ai/img_res/1e74d93b-2151-4e20-b57f-a5c03641098e.png"
            alt="Logo"
            className="h-12 sm:h-16 w-auto mx-auto mb-3 object-contain"
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">FINPILOT</h1>
          <p className="text-sm text-gray-400 mt-1">관리자 포털에 로그인하세요</p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-700 rounded-2xl shadow-xl border border-gray-600 p-5 sm:p-7">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                아이디 (이메일)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="ri-user-line text-gray-400 text-base"></i>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@stock.com"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-500 bg-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                비밀번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="ri-lock-line text-gray-400 text-base"></i>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-500 bg-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-500 hover:text-gray-400"
                >
                  <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-base`}></i>
                </button>
              </div>
            </div>

            {/* Auto Login */}
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => setAutoLogin(!autoLogin)}
                  className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors cursor-pointer ${
                    autoLogin ? 'bg-teal-600 border-teal-600' : 'border-gray-500 bg-gray-600'
                  }`}
                >
                  {autoLogin && <i className="ri-check-line text-white text-xs"></i>}
                </div>
                <span className="text-sm text-gray-300">자동 로그인</span>
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 active:scale-95 transition-all shadow-md whitespace-nowrap cursor-pointer"
            >
              <i className="ri-login-box-line mr-1.5"></i>
              로그인
            </button>
          </form>

          {/* Test: Dashboard shortcut */}
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full mt-3 py-2.5 bg-amber-900/30 border border-amber-700 text-amber-400 text-sm font-medium rounded-lg hover:bg-amber-900/50 transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5"
          >
            <i className="ri-flashlight-line"></i>
            [테스트] 로그인 없이 대시보드 바로가기
          </button>

          {/* Secondary Buttons */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <button
              type="button"
              onClick={() => setActiveModal('signup')}
              className="py-2 border border-teal-500 text-teal-400 text-xs font-medium rounded-lg hover:bg-teal-900/30 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-user-add-line mr-1"></i>
              회원가입
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('findId')}
              className="py-2 border border-gray-500 text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-600 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-search-line mr-1"></i>
              아이디 찾기
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('findPw')}
              className="py-2 border border-gray-500 text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-600 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-key-line mr-1"></i>
              비밀번호 찾기
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-5">
          © 2025 finpilot. All rights reserved.
        </p>
      </div>

      {/* 회원가입 Modal */}
      {activeModal === 'signup' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto">
          <div className="bg-gray-700 rounded-2xl shadow-2xl w-full max-w-sm p-5 sm:p-7 border border-gray-600 my-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white">회원가입</h2>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-600 cursor-pointer text-gray-400"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">이름</label>
                <input type="text" placeholder="이름을 입력하세요" className="w-full px-3 py-2.5 text-sm border border-gray-500 bg-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">이메일</label>
                <input type="email" placeholder="이메일을 입력하세요" className="w-full px-3 py-2.5 text-sm border border-gray-500 bg-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">비밀번호</label>
                <input type="password" placeholder="비밀번호를 입력하세요" className="w-full px-3 py-2.5 text-sm border border-gray-500 bg-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">비밀번호 확인</label>
                <input type="password" placeholder="비밀번호를 다시 입력하세요" className="w-full px-3 py-2.5 text-sm border border-gray-500 bg-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer mt-1"
              >
                신청하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 아이디 찾기 Modal */}
      {activeModal === 'findId' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto">
          <div className="bg-gray-700 rounded-2xl shadow-2xl w-full max-w-sm p-5 sm:p-7 border border-gray-600 my-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">아이디 찾기</h2>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-600 cursor-pointer text-gray-400"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">가입 시 등록한 이름과 연락처를 입력하면 아이디를 찾을 수 있습니다.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">이름</label>
                <input type="text" placeholder="이름을 입력하세요" className="w-full px-3 py-2.5 text-sm border border-gray-500 bg-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">연락처</label>
                <input type="tel" placeholder="010-0000-0000" className="w-full px-3 py-2.5 text-sm border border-gray-500 bg-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer mt-1"
              >
                아이디 찾기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 비밀번호 찾기 Modal */}
      {activeModal === 'findPw' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto">
          <div className="bg-gray-700 rounded-2xl shadow-2xl w-full max-w-sm p-5 sm:p-7 border border-gray-600 my-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">비밀번호 찾기</h2>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-600 cursor-pointer text-gray-400"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">가입 시 등록한 이메일로 비밀번호 재설정 링크를 보내드립니다.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">이름</label>
                <input type="text" placeholder="이름을 입력하세요" className="w-full px-3 py-2.5 text-sm border border-gray-500 bg-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">가입 이메일</label>
                <input type="email" placeholder="이메일을 입력하세요" className="w-full px-3 py-2.5 text-sm border border-gray-500 bg-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">연락처</label>
                <input type="tel" placeholder="010-0000-0000" className="w-full px-3 py-2.5 text-sm border border-gray-500 bg-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer mt-1"
              >
                재설정 링크 보내기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
