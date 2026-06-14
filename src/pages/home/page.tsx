import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, signUp, getUserEmail, getUserPWD } from '../../api/userApi';
import { authStorage } from '../../utils/auth';

type ModalType = 'signup' | 'findId' | 'findPw' | null;

const SIGNUP_INIT  = { userName: '', email: '', password: '', passwordConfirm: '', userPhone: '' };
const FIND_ID_INIT = { userName: '', userPhone: '' };
const FIND_PW_INIT = { userName: '', email: '', userPhone: '' };

export default function Home() {
  const navigate = useNavigate();

  // 로그인
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saveCredentials, setSaveCredentials] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // 모달
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // 회원가입
  const [signupForm, setSignupForm] = useState(SIGNUP_INIT);
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // 아이디 찾기
  const [findIdForm, setFindIdForm] = useState(FIND_ID_INIT);
  const [findIdResult, setFindIdResult] = useState('');
  const [findIdError, setFindIdError] = useState('');
  const [findIdLoading, setFindIdLoading] = useState(false);

  // 비밀번호 찾기
  const [findPwForm, setFindPwForm] = useState(FIND_PW_INIT);
  const [findPwResult, setFindPwResult] = useState('');
  const [findPwError, setFindPwError] = useState('');
  const [findPwLoading, setFindPwLoading] = useState(false);

  // 저장된 아이디/비밀번호 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('savedCredentials');
    if (saved) {
      try {
        const { email: savedEmail, password: savedPassword } = JSON.parse(saved);
        setEmail(savedEmail ?? '');
        setPassword(savedPassword ?? '');
        setSaveCredentials(true);
      } catch { /* ignore */ }
    }
  }, []);

  const closeModal = () => {
    setActiveModal(null);
    setSignupForm(SIGNUP_INIT);
    setSignupError('');
    setSignupSuccess(false);
    setFindIdForm(FIND_ID_INIT);
    setFindIdResult('');
    setFindIdError('');
    setFindPwForm(FIND_PW_INIT);
    setFindPwResult('');
    setFindPwError('');
  };

  /* 로그인 */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const res = await login({ email, password });
      const isSuccess = res.status !== undefined
        ? res.status < 400
        : (res as unknown as { result?: boolean }).result === true;
      if (!isSuccess) {
        setAlertMessage(res.message || '로그인에 실패했습니다.');
        return;
      }
      authStorage.save(res.data);
      if (saveCredentials) {
        localStorage.setItem('savedCredentials', JSON.stringify({ email, password }));
      } else {
        localStorage.removeItem('savedCredentials');
      }
      // 비활성/블랙 상태면 이용 불가 페이지로 이동
      if (res.data.status === 0 || res.data.status === -1) {
        navigate('/blocked');
        return;
      }
      // 일반 사용자는 거래현황, 관리자 이상은 대시보드로 이동
      const isRegularUser = res.data.permission === 1;
      navigate(isRegularUser ? '/reports' : '/dashboard');
    } catch {
      setAlertMessage('서버 연결에 실패했습니다.');
    } finally {
      setLoginLoading(false);
    }
  };

  /* 회원가입 */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    if (signupForm.password !== signupForm.passwordConfirm) {
      setSignupError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setSignupLoading(true);
    try {
      const res = await signUp({
        userName: signupForm.userName,
        email: signupForm.email,
        password: signupForm.password,
        userPhone: signupForm.userPhone,
      });
      if (res.status >= 400) {
        setSignupError(res.message);
        return;
      }
      setSignupSuccess(true);
    } catch {
      setSignupError('서버 연결에 실패했습니다.');
    } finally {
      setSignupLoading(false);
    }
  };

  /* 아이디 찾기 */
  const handleFindId = async (e: React.FormEvent) => {
    e.preventDefault();
    setFindIdError('');
    setFindIdResult('');
    setFindIdLoading(true);
    try {
      const res = await getUserEmail({ userName: findIdForm.userName, userPhone: findIdForm.userPhone });
      if (res.status >= 400) {
        setFindIdError(res.message);
        return;
      }
      setFindIdResult(res.data.email ?? '');
    } catch {
      setFindIdError('서버 연결에 실패했습니다.');
    } finally {
      setFindIdLoading(false);
    }
  };

  /* 비밀번호 찾기 */
  const handleFindPw = async (e: React.FormEvent) => {
    e.preventDefault();
    setFindPwError('');
    setFindPwResult('');
    setFindPwLoading(true);
    try {
      const res = await getUserPWD({ email: findPwForm.email, userPhone: findPwForm.userPhone });
      if (res.status >= 400) {
        setFindPwError(res.message);
        return;
      }
      setFindPwResult(res.message);
    } catch {
      setFindPwError('서버 연결에 실패했습니다.');
    } finally {
      setFindPwLoading(false);
    }
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
          <form id="loginForm" onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">아이디 (이메일)</label>
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

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">비밀번호</label>
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

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => setSaveCredentials(!saveCredentials)}
                  className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors cursor-pointer ${
                    saveCredentials ? 'bg-teal-600 border-teal-600' : 'border-gray-500 bg-gray-600'
                  }`}
                >
                  {saveCredentials && <i className="ri-check-line text-white text-xs"></i>}
                </div>
                <span className="text-sm text-gray-300">아이디/비밀번호 저장</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 active:scale-95 transition-all shadow-md whitespace-nowrap cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loginLoading
                ? <><i className="ri-loader-4-line animate-spin mr-1.5"></i>로그인 중...</>
                : <><i className="ri-login-box-line mr-1.5"></i>로그인</>
              }
            </button>
          </form>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <button
              type="button"
              onClick={() => setActiveModal('signup')}
              className="py-2 border border-teal-500 text-teal-400 text-xs font-medium rounded-lg hover:bg-teal-900/30 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-user-add-line mr-1"></i>회원가입
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('findId')}
              className="py-2 border border-gray-500 text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-600 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-search-line mr-1"></i>아이디 찾기
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('findPw')}
              className="py-2 border border-gray-500 text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-600 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-key-line mr-1"></i>비밀번호 찾기
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-5">© 2025 finpilot. All rights reserved.</p>
      </div>

      {/* 회원가입 Modal */}
      {activeModal === 'signup' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto">
          <div className="bg-gray-700 rounded-2xl shadow-2xl w-full max-w-sm p-5 sm:p-7 border border-gray-600 my-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white">회원가입</h2>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-600 cursor-pointer text-gray-400">
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>

            {signupSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto">
                  <i className="ri-checkbox-circle-line text-teal-400 text-3xl"></i>
                </div>
                <p className="text-sm text-gray-300">회원가입 신청이 완료되었습니다.<br />관리자 승인 후 이용 가능합니다.</p>
                <button onClick={closeModal} className="w-full py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors cursor-pointer">
                  확인
                </button>
              </div>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">이름</label>
                  <input
                    type="text"
                    value={signupForm.userName}
                    onChange={(e) => setSignupForm({ ...signupForm, userName: e.target.value })}
                    placeholder="이름을 입력하세요"
                    className="w-full px-3 py-2.5 text-sm border border-gray-500 bg-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">이메일</label>
                  <input
                    type="email"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    placeholder="이메일을 입력하세요"
                    className="w-full px-3 py-2.5 text-sm border border-gray-500 bg-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">전화번호</label>
                  <input
                    type="tel"
                    value={signupForm.userPhone}
                    onChange={(e) => setSignupForm({ ...signupForm, userPhone: e.target.value })}
                    placeholder="010-0000-0000"
                    className="w-full px-3 py-2.5 text-sm border border-gray-500 bg-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">비밀번호</label>
                  <input
                    type="password"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    placeholder="비밀번호를 입력하세요"
                    className="w-full px-3 py-2.5 text-sm border border-gray-500 bg-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">비밀번호 확인</label>
                  <input
                    type="password"
                    value={signupForm.passwordConfirm}
                    onChange={(e) => setSignupForm({ ...signupForm, passwordConfirm: e.target.value })}
                    placeholder="비밀번호를 다시 입력하세요"
                    className="w-full px-3 py-2.5 text-sm border border-gray-500 bg-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                {signupError && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <i className="ri-error-warning-line"></i>{signupError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={signupLoading}
                  className="w-full py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {signupLoading ? <><i className="ri-loader-4-line animate-spin mr-1.5"></i>신청 중...</> : '신청하기'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 아이디 찾기 Modal */}
      {activeModal === 'findId' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto">
          <div className="bg-gray-700 rounded-2xl shadow-2xl w-full max-w-sm p-5 sm:p-7 border border-gray-600 my-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">아이디 찾기</h2>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-600 cursor-pointer text-gray-400">
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">가입 시 등록한 이름과 연락처를 입력하면 아이디를 찾을 수 있습니다.</p>

            <form onSubmit={handleFindId} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">이름</label>
                <input
                  type="text"
                  value={findIdForm.userName}
                  onChange={(e) => setFindIdForm({ ...findIdForm, userName: e.target.value })}
                  placeholder="이름을 입력하세요"
                  className="w-full px-3 py-2.5 text-sm border border-gray-500 bg-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">연락처</label>
                <input
                  type="tel"
                  value={findIdForm.userPhone}
                  onChange={(e) => setFindIdForm({ ...findIdForm, userPhone: e.target.value })}
                  placeholder="010-0000-0000"
                  className="w-full px-3 py-2.5 text-sm border border-gray-500 bg-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              {findIdResult && (
                <div className="px-3 py-2.5 bg-teal-900/30 border border-teal-700 rounded-lg text-sm text-teal-300">
                  <i className="ri-mail-line mr-1.5"></i>아이디: <span className="font-semibold">{findIdResult}</span>
                </div>
              )}
              {findIdError && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <i className="ri-error-warning-line"></i>{findIdError}
                </p>
              )}

              <button
                type="submit"
                disabled={findIdLoading}
                className="w-full py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {findIdLoading ? <><i className="ri-loader-4-line animate-spin mr-1.5"></i>조회 중...</> : '아이디 찾기'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 알림 팝업 */}
      {alertMessage && (
        <div
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center px-4"
          onKeyDown={e => { if (e.key === 'Enter') setAlertMessage(''); }}
          tabIndex={-1}
          ref={el => el?.focus()}
        >
          <div className="bg-gray-700 rounded-2xl shadow-2xl w-full max-w-xs p-6 border border-gray-600 text-center space-y-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <i className="ri-error-warning-line text-red-400 text-2xl"></i>
            </div>
            <p className="text-sm text-gray-200">{alertMessage}</p>
            <button
              onClick={() => setAlertMessage('')}
              className="w-full py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors cursor-pointer"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 비밀번호 찾기 Modal */}
      {activeModal === 'findPw' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto">
          <div className="bg-gray-700 rounded-2xl shadow-2xl w-full max-w-sm p-5 sm:p-7 border border-gray-600 my-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">비밀번호 찾기</h2>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-600 cursor-pointer text-gray-400">
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">가입 시 등록한 이름, 이메일, 연락처를 입력하세요.</p>

            <form onSubmit={handleFindPw} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">이름</label>
                <input
                  type="text"
                  value={findPwForm.userName}
                  onChange={(e) => setFindPwForm({ ...findPwForm, userName: e.target.value })}
                  placeholder="이름을 입력하세요"
                  className="w-full px-3 py-2.5 text-sm border border-gray-500 bg-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">가입 이메일</label>
                <input
                  type="email"
                  value={findPwForm.email}
                  onChange={(e) => setFindPwForm({ ...findPwForm, email: e.target.value })}
                  placeholder="이메일을 입력하세요"
                  className="w-full px-3 py-2.5 text-sm border border-gray-500 bg-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">연락처</label>
                <input
                  type="tel"
                  value={findPwForm.userPhone}
                  onChange={(e) => setFindPwForm({ ...findPwForm, userPhone: e.target.value })}
                  placeholder="010-0000-0000"
                  className="w-full px-3 py-2.5 text-sm border border-gray-500 bg-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              {findPwResult && (
                <div className="px-3 py-2.5 bg-teal-900/30 border border-teal-700 rounded-lg text-sm text-teal-300">
                  <i className="ri-checkbox-circle-line mr-1.5"></i>{findPwResult}
                </div>
              )}
              {findPwError && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <i className="ri-error-warning-line"></i>{findPwError}
                </p>
              )}

              <button
                type="submit"
                disabled={findPwLoading}
                className="w-full py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {findPwLoading ? <><i className="ri-loader-4-line animate-spin mr-1.5"></i>전송 중...</> : '재설정 링크 보내기'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
