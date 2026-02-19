
import { 
  Users, 
  ShoppingBag, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  RefreshCw,
  TrendingUp,
  Package
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import api from "../services/api";

const Dashboard = () => {
  const { user, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token from website
    const checkWebsiteToken = async () => {
      const websiteToken = localStorage.getItem('userPanelToken');
      if (websiteToken && !user) {
        try {
          await loginWithToken(websiteToken);
          localStorage.removeItem('userPanelToken');
        } catch (error) {
          console.error('Failed to login with website token:', error);
        }
      }
    };
    
    checkWebsiteToken();
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get("/user-dashboard/overview");
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboard();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { stats, amc, rental, recentActivity } = dashboardData || {};

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {user?.firstName?.toUpperCase() || 'USER'}
        </h1>
        <Link 
          to="/service-support"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={16} /> Request Service
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active AMC */}
        <Link to="/my-amcs" className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 hover:border-blue-200 transition-all group block">
           <div className="flex justify-between items-start mb-6">
              <div className={`p-3 rounded-2xl ${amc?.active ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                 <ShieldCheck size={24} strokeWidth={2.5} />
              </div>
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${amc?.active ? 'bg-green-100/50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {amc?.status || 'Inactive'}
              </span>
           </div>
           <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">AMC Status</p>
              <h3 className="text-lg font-black text-slate-900 leading-tight truncate">
                {amc?.planName || 'No Active Plan'}
              </h3>
              {amc?.expiry && (
                 <p className="text-[11px] font-bold text-slate-400 mt-2 flex items-center gap-1.5">
                   <Clock size={12} /> {amc.expiry}
                 </p>
              )}
           </div>
        </Link>

        {/* Rental Status */}
        <Link to="/rented-ro" className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 hover:border-blue-200 transition-all group block">
           <div className="flex justify-between items-start mb-6">
              <div className={`p-3 rounded-2xl ${rental?.active ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                 <RefreshCw size={24} strokeWidth={2.5} />
              </div>
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${rental?.active ? 'bg-blue-100/50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                {rental?.status || 'No Rental'}
              </span>
           </div>
           <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">RO Rental</p>
              <h3 className="text-lg font-black text-slate-900 leading-tight truncate">
                {rental?.planName || 'All Good'}
              </h3>
              {rental?.expiry && (
                 <p className="text-[11px] font-bold text-slate-400 mt-2 flex items-center gap-1.5">
                   <Clock size={12} /> Due: {rental.expiry}
                 </p>
              )}
           </div>
        </Link>

        {/* Active Orders */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 hover:border-blue-200 transition-all group">
           <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                 <ShoppingBag size={24} strokeWidth={2.5} />
              </div>
              <span className="bg-orange-100/50 text-orange-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
                {stats?.activeOrders || 0} Orders
              </span>
           </div>
           <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Active Shipments</p>
              <h3 className="text-lg font-black text-slate-900 leading-tight">
                 {stats?.activeOrders > 0 ? 'In Progress' : 'No Active'}
              </h3>
              <Link to="/my-orders" className="inline-flex items-center gap-1.5 text-[11px] font-black text-blue-600 mt-2 uppercase tracking-widest hover:gap-2 transition-all">
                Details <ArrowRight size={12} strokeWidth={3}/>
              </Link>
           </div>
        </div>

         {/* Total Spent */}
         <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 hover:border-blue-200 transition-all group">
           <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                 <TrendingUp size={24} strokeWidth={2.5} />
              </div>
              <span className="bg-indigo-100/50 text-indigo-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">Lifetime</span>
           </div>
           <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Spent</p>
              <h3 className="text-lg font-black text-slate-900 leading-tight">
                ₹{stats?.totalSpent?.toLocaleString() || '0'}
              </h3>
              <p className="text-[11px] font-bold text-slate-400 mt-2">
                Across {stats?.totalOrders || 0} orders
              </p>
           </div>
        </div>
      </div>

      {/* Recent Activity & Banner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Recent Activity Card */}
         <div className="lg:col-span-2 bg-white p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Recent Activity</h3>
                <Link to="/my-orders" className="text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors">View All</Link>
             </div>
             
             <div className="space-y-4">
                {recentActivity?.length > 0 ? (
                  recentActivity.map((item, i) => (
                    <div 
                      key={i} 
                      onClick={() => {
                        if (item.type === 'order' && item.refId) navigate(`/orders/${item.refId}`);
                        else if (item.type === 'service') navigate('/service-support');
                      }}
                      className="flex items-center gap-5 p-5 rounded-3xl bg-white border border-slate-100 hover:border-blue-100 hover:shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all group cursor-pointer"
                    >
                       <div className={`p-3 rounded-2xl shrink-0 ${item.type === 'order' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                          {item.type === 'order' ? <Package size={20} strokeWidth={2.5} /> : <Clock size={20} strokeWidth={2.5} />}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-900 truncate mb-0.5">{item.title}</p>
                          <p className="text-[11px] font-bold text-slate-400 capitalize tracking-wide">{new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                       </div>
                       <div className="shrink-0">
                          <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest ${
                            item.status === 'delivered' || item.status === 'resolved' ? 'bg-green-100/60 text-green-700' : 
                            item.status === 'cancelled' || item.status === 'failed' ? 'bg-red-100/60 text-red-700' : 
                            'bg-yellow-100/60 text-yellow-700'
                          }`}>
                            {item.status}
                          </span>
                       </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                    <p className="text-sm font-bold text-slate-400">No recent activity to show 📭</p>
                  </div>
                )}
             </div>
         </div>

         {/* Right Section: Banner & Points */}
         <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#2563eb] to-[#4f46e5] p-10 rounded-[40px] shadow-2xl shadow-blue-500/20 text-white relative overflow-hidden group">
                <div className="relative z-10">
                   <h3 className="text-3xl font-black mb-4 leading-tight">Upgrade to <span className="text-yellow-400">Platinum?</span></h3>
                   <p className="text-blue-100/80 mb-10 font-bold text-sm leading-relaxed">
                      Get unlimited service visits, free membrane replacement, and 20% off on spare parts.
                   </p>
                   <Link to="/amc-plans" className="inline-block bg-white text-blue-600 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95">
                      View AMC Plans
                   </Link>
                </div>
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-white/20 transition-all duration-500"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-black/10 rounded-full blur-2xl group-hover:scale-110 transition-all duration-500"></div>
            </div>

            {/* Support Quick Link */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-100 transition-all cursor-pointer">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Need help?</p>
                  <h4 className="text-sm font-black text-slate-900">Contact Support</h4>
               </div>
               <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                  <ArrowRight size={20} />
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
