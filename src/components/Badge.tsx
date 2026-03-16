interface BadgeProps {
  variant: 'success' | 'warning' | 'danger' | 'info' | 'default';
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  danger: 'bg-red-500/20 text-red-400 border-red-500/30',
  info: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  default: 'bg-slate-700 text-slate-300 border-slate-600'
};

export default function Badge({ variant, children, className = '' }: BadgeProps) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
