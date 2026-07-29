import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../types';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/customers', label: 'Customers', permission: 'manage_customers' as const },
    { to: '/products', label: 'Products', permission: 'manage_products' as const },
    { to: '/challans', label: 'Challans', permission: 'manage_challans' as const },
    { to: '/reports', label: 'Reports', permission: 'view_reports' as const },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-slate-800 text-white flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-lg font-bold">ERP/CRM Portal</h1>
          <p className="text-sm text-slate-400 mt-1">{user?.name}</p>
          <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-slate-700 rounded">
            {user?.role}
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(
            (item) =>
              user &&
              hasPermission(user.role, item.permission) && (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded text-sm ${
                      isActive ? 'bg-slate-600' : 'hover:bg-slate-700'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              )
          )}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-sm text-left rounded hover:bg-slate-700"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
