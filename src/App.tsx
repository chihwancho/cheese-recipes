import { useState } from 'react';
import { Menu } from 'lucide-react';
import type { TabId } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { createLocalAuthProvider } from './services/auth/localAuthProvider';
import { createSupabaseAuthProvider } from './services/auth/supabaseAuthProvider';
import { MealPlanProvider } from './context/MealPlanContext';
import { RecipeProvider } from './context/RecipeContext';
import { ShoppingListProvider } from './context/ShoppingListContext';
import { SettingsProvider } from './context/SettingsContext';
import LoginPage from './components/auth/LoginPage';
import Sidebar from './components/layout/Sidebar';
import ContentPanel from './components/layout/ContentPanel';
import SettingsModal from './components/ui/SettingsModal';
import WeeklyPlan from './components/tabs/WeeklyPlan';
import Recipes from './components/tabs/Recipes';
import ShoppingList from './components/tabs/ShoppingList';
import Favorites from './components/tabs/Favorites';
import { useEmbeddingSync } from './hooks/useEmbeddingSync';

const authProvider = createSupabaseAuthProvider() ?? createLocalAuthProvider();

function EmbeddingSyncRunner() {
  useEmbeddingSync();
  return null;
}

function AuthenticatedApp() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('weekly-plan');
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'weekly-plan':
        return <WeeklyPlan />;
      case 'recipes':
        return <Recipes />;
      case 'shopping-list':
        return <ShoppingList />;
      case 'favorites':
        return <Favorites />;
    }
  };

  return (
    <SettingsProvider userId={user!.id}>
      <RecipeProvider userId={user!.id}>
        <ShoppingListProvider userId={user!.id}>
          <MealPlanProvider userId={user!.id}>
            <EmbeddingSyncRunner />
            <div className="flex h-screen bg-gray-50">
              <Sidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                userName={user!.displayName}
                onLogout={logout}
                onOpenSettings={() => setShowSettings(true)}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
              />
              <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile header with hamburger */}
                <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  <span className="text-sm font-semibold text-gray-800">MealPlan</span>
                </div>
                <ContentPanel>{renderContent()}</ContentPanel>
              </div>
            </div>
            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
          </MealPlanProvider>
        </ShoppingListProvider>
      </RecipeProvider>
    </SettingsProvider>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return isAuthenticated ? <AuthenticatedApp /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider authProvider={authProvider}>
      <AppContent />
    </AuthProvider>
  );
}
