import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Link } from './ui/link';
import { authService } from '../services/AuthService';
import { Button } from './ui/button';
import { Building2, Layers, Settings, Users, LogOut, Menu, X, Video, Thermometer, Lightbulb, Wind, DoorOpen } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/locations', icon: Building2, label: 'Локации', exact: true },
    { path: '/systems', icon: Settings, label: 'Системы' },
  ];

  if (authService.canManageUsers()) {
    navItems.push({ path: '/users', icon: Users, label: 'Пользователи' });
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Building2 className="size-6 text-white" />
              </div>
              <div>
                <h1 className="font-semibold">УЗ БМС</h1>
                <p className="text-xs text-gray-500">Управление зданием</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-xl"
          >
            {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact 
              ? location.pathname === item.path
              : isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  active
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="size-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className={`${sidebarOpen ? 'mb-4' : ''}`}>
            {sidebarOpen && user && (
              <div className="px-4 py-3 bg-gray-50 rounded-xl">
                <p className="text-sm font-medium">{user.username}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
                <p className="text-xs mt-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full inline-block">
                  {user.role}
                </p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={`w-full rounded-xl ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
          >
            <LogOut className="size-5" />
            {sidebarOpen && <span className="ml-3">Выйти</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}