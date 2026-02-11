
import { useState, useEffect } from "react";
import api from "../services/api";
import { Bell, CheckCircle, Info, AlertTriangle, Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/notifications/user");
      setNotifications(res.data || []);
      
      // Mark as read when page is opened
      if (res.data?.some(n => !n.isRead)) {
          await api.put("/notifications/user/mark-read");
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "Success": return <CheckCircle className="text-emerald-500" size={20} />;
      case "Alert": return <AlertTriangle className="text-red-500" size={20} />;
      case "Service": return <Clock className="text-blue-500" size={20} />;
      default: return <Info className="text-slate-400" size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Notifications</h1>
          <p className="text-slate-500 text-sm font-medium">Stay updated with your latest activities</p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-2xl">
           <span className="text-blue-600 font-bold text-sm">{notifications.length} Total</span>
        </div>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
            <div className="max-w-2xl mx-auto bg-white rounded-4xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100 text-center py-20">
            <Bell size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-lg font-bold text-slate-900">All clear!</h3>
            <p className="text-slate-400 font-medium">No new notifications for you right now.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif._id} 
              className={`flex items-start gap-4 bg-white p-5 rounded-3xl border transition-all hover:shadow-md ${notif.isRead ? 'border-slate-100 opacity-80' : 'border-blue-100 shadow-sm'}`}
            >
              <div className={`mt-1 w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  notif.type === 'Alert' ? 'bg-red-50' : 
                  notif.type === 'Service' ? 'bg-blue-50' : 
                  'bg-slate-50'
              }`}>
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`text-sm font-bold truncate pr-4 ${notif.isRead ? 'text-slate-600' : 'text-slate-900'}`}>
                    {notif.title}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter whitespace-nowrap">
                    {format(new Date(notif.createdAt), "MMM dd, p")}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed italic">{notif.message}</p>
                {notif.refId && (
                    <div className="mt-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                        Ref: {notif.refId}
                    </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
