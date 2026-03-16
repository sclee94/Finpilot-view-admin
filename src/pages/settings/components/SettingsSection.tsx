interface SettingsSectionProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
}

export default function SettingsSection({ title, icon, children }: SettingsSectionProps) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
      <div className="flex items-center gap-3 mb-6">
        {icon && (
          <div className="w-10 h-10 flex items-center justify-center bg-teal-500/15 rounded-xl">
            <i className={`${icon} text-xl text-teal-400`}></i>
          </div>
        )}
        <h2 className="text-xl font-bold text-zinc-100">{title}</h2>
      </div>
      {children}
    </div>
  );
}
