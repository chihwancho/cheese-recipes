import type { LucideIcon } from 'lucide-react';

interface TabButtonProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export default function TabButton({ icon: Icon, label, isActive, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 text-left transition-all duration-200 cursor-pointer ${
        isActive
          ? 'bg-sidebar-active text-white border-l-4 border-primary-400 font-semibold'
          : 'text-gray-400 hover:bg-sidebar-hover hover:text-white border-l-4 border-transparent'
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="text-sm">{label}</span>
    </button>
  );
}
