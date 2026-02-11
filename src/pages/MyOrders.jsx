
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ChevronRight,
  ArrowRight,
  ShoppingBag,
  Calendar,
  CreditCard
} from "lucide-react";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get("/user-orders");
      setOrders(data.orders || []);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase() || 'pending';
    switch (s) {
      case 'delivered': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'shipped': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'confirmed': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-amber-600 bg-amber-50 border-amber-100';
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-600"></div>
          <p className="text-sm font-bold text-slate-400 animate-pulse uppercase tracking-widest">Fetching Orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full mb-3">
              <ShoppingBag size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Order History</span>
           </div>
           <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">My <span className="text-blue-600">Orders</span></h1>
        </div>
        <div className="px-4 py-2 bg-white border border-slate-100 rounded-2xl shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Volume</p>
           <p className="text-lg font-black text-slate-900">{orders.length} <span className="text-xs text-slate-400">purchases</span></p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[40px] border border-dashed border-slate-200 shadow-sm">
          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
            <Package size={40} />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Your box is empty</h3>
          <p className="text-slate-400 text-sm font-medium mb-8 max-w-xs mx-auto">Looks like you haven't made any purchases yet. Start exploring our premium collection.</p>
          <Link to="/" className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95">
             Explore Shop <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link 
              key={order._id} 
              to={`/orders/${order._id}`} 
              className="block bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group relative overflow-hidden"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
                {/* Visual Icon */}
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
                   <Package className="text-blue-500" size={32} strokeWidth={1.5} />
                </div>

                {/* Main Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(order.status)}`}>
                       {order.status}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                       <Calendar size={12} /> {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                     #{order._id.slice(-6).toUpperCase()}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 truncate">
                    {order.items.map(item => item.productName).join(", ")}
                  </p>
                </div>

                {/* Price & Action */}
                <div className="flex items-center justify-between md:flex-col md:items-end gap-2 md:pl-8 md:border-l border-slate-50">
                  <p className="text-2xl font-black text-slate-900">₹{order.total?.toLocaleString()}</p>
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 group-hover:gap-3 transition-all">
                    Details <ChevronRight size={14} />
                  </span>
                </div>
              </div>
              
              {/* Subtle background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-50 transition-colors"></div>
            </Link>
          ))}
        </div>
      )}

      {/* Footer Info */}
      <div className="pt-8 text-center">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Showing your most recent orders</p>
      </div>
    </div>
  );
};

export default MyOrders;
