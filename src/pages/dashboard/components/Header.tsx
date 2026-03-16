interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden w-10 h-10 flex items-center justify-center text-zinc-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
      >
        <i className="ri-menu-line text-xl"></i>
      </button>

      <div className="flex-1" />
    </header>
  );
}
