import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Clock, 
  ShieldCheck,
  Award,
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
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications/user');
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.isRead).length || 0);
    } catch (err) {
      console.error("Layout fetch notifications error:", err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/user/mark-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/my-orders', label: 'My Orders', icon: ShoppingBag },
    { path: '/rented-ro', label: 'Rented ROs', icon: Clock },
    { path: '/my-amcs', label: 'My AMCs', icon: Award },
    { path: '/amc-plans', label: 'Browse Plans', icon: ShieldCheck },
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
                 href={import.meta.env.VITE_WEBSITE_URL || 'http://localhost:5177'} 
                 className="hidden sm:flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-bold text-xs uppercase tracking-widest border border-slate-100"
               >
                 <Globe size={16} />
                 <span>Go to Website</span>
               </a>

               <div className="relative">
                  <button 
                     onClick={() => setIsNotifOpen(!isNotifOpen)}
                     className={`p-2 rounded-full transition relative ${isNotifOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                  >
                     <Bell size={20} />
                     {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold">
                           {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                     )}
                  </button>

                  {/* Notification Dropdown */}
                  {isNotifOpen && (
                     <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)}></div>
                        <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                           <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                              <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">Updates</h3>
                              {unreadCount > 0 && (
                                 <button 
                                    onClick={markAllRead}
                                    className="text-[10px] font-black text-blue-600 uppercase hover:underline"
                                 >
                                    Mark all read
                                 </button>
                              )}
                           </div>
                           <div className="max-h-96 overflow-y-auto">
                              {notifications.length === 0 ? (
                                 <div className="p-10 text-center text-slate-400">
                                    <Bell size={32} className="mx-auto opacity-10 mb-2" />
                                    <p className="text-xs font-bold">No new notifications</p>
                                 </div>
                              ) : (
                                 <div className="divide-y divide-slate-50">
                                    {notifications.slice(0, 5).map(n => (
                                       <div key={n._id} className={`p-4 transition-colors hover:bg-slate-50 ${n.isRead ? 'opacity-60' : 'bg-blue-50/30'}`}>
                                          <p className="text-xs font-bold text-slate-900 mb-0.5">{n.title}</p>
                                          <p className="text-[11px] text-slate-500 leading-tight line-clamp-2">{n.message}</p>
                                          <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase tracking-tight">
                                             {format(new Date(n.createdAt), 'p')}
                                          </p>
                                       </div>
                                    ))}
                                 </div>
                              )}
                           </div>
                           <Link 
                              to="/notifications" 
                              onClick={() => setIsNotifOpen(false)}
                              className="block p-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 hover:text-blue-600 transition-all border-t border-slate-50"
                           >
                              See all notifications
                           </Link>
                        </div>
                     </>
                  )}
               </div>
              
              <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
                 <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-slate-700">{user?.firstName || user?.name || 'User'}</p>
                    <p className="text-xs text-slate-400 font-medium truncate max-w-[150px]">{user?.email}</p>
                 </div>
                 <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                    {user?.name?.[0]?.toUpperCase() || user?.firstName?.[0]?.toUpperCase() || 'U'}
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
