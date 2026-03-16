import { useState } from 'react';
import UserTable from './components/UserTable';
import PageLayout from '../../components/PageLayout';
import type { User } from '../../types';
import { MOCK_USERS } from '../../mocks/users';

export default function Users() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const handleDeleteUser = (id: number) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">사용자 관리</h1>
        </div>

        <UserTable
          users={users}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
        />
      </div>
    </PageLayout>
  );
}