import { CalendarDays, BookOpen, ShoppingCart, Heart, CookingPot, LogOut, Settings, X } from 'lucide-react';
import type { TabId } from '../../types';
import TabButton from '../ui/TabButton';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  userName?: string;
  onLogout?: () => void;
  onOpenSettings?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const tabs: { id: TabId; label: string; icon: typeof CalendarDays }[] = [
  { id: 'weekly-plan', label: 'Weekly Plan', icon: CalendarDays },
  { id: 'recipes', label: 'Recipes', icon: BookOpen },
  { id: 'shopping-list', label: 'Shopping List', icon: ShoppingCart },
  { id: 'favorites', label: 'Favorites', icon: Heart },
];

export default function Sidebar({ activeTab, onTabChange, userName, onLogout, onOpenSettings, isOpen, onClose }: SidebarProps) {
  const handleTabChange = (tab: TabId) => {
    onTabChange(tab);
    onClose?.();
  };

  const sidebar = (
    <aside className="w-64 bg-sidebar flex flex-col h-full shadow-xl shrink-0">
      <div className="flex items-center justify-between px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <CookingPot className="w-8 h-8 text-primary-400" />
          <h1 className="text-xl font-bold text-white tracking-tight">MealPlan</h1>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-1">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            icon={tab.icon}
            label={tab.label}
            isActive={activeTab === tab.id}
            onClick={() => handleTabChange(tab.id)}
          />
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-white/10">
        {userName ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0">
                {userName[0].toUpperCase()}
              </div>
              <span className="text-sm text-gray-300 truncate">{userName}</span>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-500">Plan your meals, eat well.</p>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop: always visible */}
      <div className="hidden md:flex h-full">
        {sidebar}
      </div>

      {/* Mobile: overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <div className="relative h-full">
            {sidebar}
          </div>
        </div>
      )}
    </>
  );
}
