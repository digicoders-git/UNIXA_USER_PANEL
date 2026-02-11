import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Clock, 
  ShieldCheck, 
  Wrench, 
  User, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Globe
} from 'lucide-react';

const UserLayout = () => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/my-orders', label: 'My Orders', icon: ShoppingBag },
    { path: '/rented-ro', label: 'Rented ROs', icon: Clock },
    { path: '/amc-plans', label: 'AMC Plans', icon: ShieldCheck },
    { path: '/service-support', label: 'Service & Support', icon: Wrench },
    { path: '/profile', label: 'My Profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100">
           <span className="text-2xl font-black text-blue-600 tracking-tighter">UNIXA</span>
           <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600">
             <X size={24} />
           </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
                ${isActive 
                  ? 'bg-blue-50 text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
              `}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-100 bg-slate-50/50">
           <button 
             onClick={handleLogout}
             className="flex items-center gap-3 px-4 py-3 w-full text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium text-sm"
           >
             <LogOut size={20} />
             Sign Out
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-8">
           <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
             <Menu size={24} />
           </button>

            <div className="flex items-center gap-4 ml-auto">
               <a 
                 href={import.meta.env.VITE_WEBSITE_URL || 'http://localhost:5180'} 
                 className="hidden sm:flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-bold text-xs uppercase tracking-widest border border-slate-100"
               >
                 <Globe size={16} />
                 <span>Go to Website</span>
               </a>

               <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition relative">
                  <Bell size={20} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
               </button>
              
              <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
                 <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-slate-700">{user?.name || 'User'}</p>
                    <p className="text-xs text-slate-400 font-medium truncate max-w-[150px]">{user?.email}</p>
                 </div>
                 <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                 </div>
              </div>
           </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
           <Outlet />
        </main>

      </div>
    </div>
  );
};

export default UserLayout;
