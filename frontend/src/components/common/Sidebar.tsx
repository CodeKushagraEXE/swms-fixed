import { NavLink } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppDispatch';

const navItems = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/projects', icon: '📁', label: 'Projects' },
];

export default function Sidebar() {
  const sidebarOpen = useAppSelector(s => s.ui.sidebarOpen);
  const user = useAppSelector(s => s.auth.user);
  const items = user?.role === 'ADMIN'
    ? [...navItems, { to: '/admin/auth-audit', icon: '🔐', label: 'Auth Audit' }]
    : navItems;

  return (
    <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 shrink-0`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
            SW
          </div>
          {sidebarOpen && (
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-white">SWMS</p>
              <p className="text-xs text-gray-400">Workflow Manager</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium
               ${isActive
                 ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                 : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'}`
            }>
            <span className="text-xl shrink-0">{item.icon}</span>
            {sidebarOpen && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className={`p-3 border-t border-gray-200 dark:border-gray-700 ${!sidebarOpen && 'flex justify-center'}`}>
          {sidebarOpen ? (
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">{user.role}</span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
