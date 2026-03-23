import PageLayout from '../../components/PageLayout';
import { authStorage } from '../../utils/auth';
import { STATUS } from '../../constants';

export default function Blocked() {
  const loginUser = authStorage.get();
  const isBlocked = loginUser?.status === STATUS.BLOCKED;

  return (
    <PageLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 px-4">
        <div className="w-20 h-20 rounded-full bg-red-500/15 flex items-center justify-center">
          <i className={`text-4xl ${isBlocked ? 'ri-forbid-line text-red-400' : 'ri-user-forbid-line text-yellow-400'}`}></i>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-100">이용이 제한된 계정입니다</h1>
          <p className="text-zinc-400 text-base">
            현재 계정 상태:&nbsp;
            <span className={`font-semibold ${isBlocked ? 'text-red-400' : 'text-yellow-400'}`}>
              {isBlocked ? '블랙' : '비활성'}
            </span>
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-8 py-6 max-w-md w-full space-y-3">
          <p className="text-zinc-300 text-sm leading-relaxed">
            해당 유저는 <span className={`font-semibold ${isBlocked ? 'text-red-400' : 'text-yellow-400'}`}>
              {isBlocked ? '블랙' : '비활성'}
            </span> 상태로 이용이 불가능합니다.
          </p>
          <p className="text-zinc-500 text-sm leading-relaxed">
            서비스 이용을 원하시면 관리자에게 문의하여 계정 상태를 변경해 주세요.
          </p>
        </div>

        <p className="text-zinc-600 text-xs">
          계정 문의: 관리자에게 연락하세요
        </p>
      </div>
    </PageLayout>
  );
}
