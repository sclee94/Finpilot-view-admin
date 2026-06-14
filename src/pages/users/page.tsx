import { useState, useEffect } from 'react';
import UserTable from './components/UserTable';
import PageLayout from '../../components/PageLayout';
import type { User } from '../../types';
import { getUserList, userUpdate, deleteUser } from '../../api/userApi';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    setError(null);
    getUserList()
      .then(res => {
        if (res.status < 400) {
          setUsers(res.data?.content ?? []);
        } else {
          setError(res.message);
        }
      })
      .catch(() => setError('서버 연결에 실패했습니다.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const res = await userUpdate(updatedUser);
      if (res.status >= 400) return;
    } catch {
      return;
    }
    setUsers(prev => prev.map(u => u.userUid === updatedUser.userUid ? updatedUser : u));
  };

  const handleDeleteUser = async (userUid: string) => {
    try {
      const res = await deleteUser({ userUid });
      if (res.status >= 400) return;
    } catch {
      return;
    }
    setUsers(prev => prev.filter(u => u.userUid !== userUid));
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <h1 className="text-2xl font-bold text-white">사용자 관리</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-zinc-500">
            <i className="ri-loader-4-line animate-spin text-2xl mr-2"></i>
            불러오는 중...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-red-400"><i className="ri-error-warning-line mr-1"></i>{error}</p>
            <button
              onClick={fetchUsers}
              className="px-4 py-2 text-sm bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
            >
              <i className="ri-refresh-line mr-1"></i>다시 시도
            </button>
          </div>
        ) : (
          <UserTable
            users={users}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        )}
      </div>
    </PageLayout>
  );
}
