import { useState } from 'react';
import PageLayout from '../../components/PageLayout';
import SettingsSection from './components/SettingsSection';
import { NOTIFICATION_SETTINGS } from '../../constants';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState<Record<string, boolean>>(
    NOTIFICATION_SETTINGS.reduce((acc, item) => ({ ...acc, [item.id]: item.checked }), {})
  );

  const handleNotificationChange = (key: string) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">설정</h1>
          <p className="text-slate-400">시스템 설정을 관리합니다</p>
        </div>

        <SettingsSection title="알림 설정" icon="ri-notification-3-line">
          <div className="space-y-4">
            {NOTIFICATION_SETTINGS.map(item => (
              <div key={item.id} className="flex items-center justify-between">
                <span className="text-zinc-300">{item.label}</span>
                <button
                  onClick={() => handleNotificationChange(item.id)}
                  className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
                    notifications[item.id] ? 'bg-teal-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                      notifications[item.id] ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </SettingsSection>
      </div>
    </PageLayout>
  );
}
