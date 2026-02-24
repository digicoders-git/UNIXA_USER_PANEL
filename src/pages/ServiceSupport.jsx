
import { useState, useEffect } from "react";
import api from "../services/api";
import Swal from "sweetalert2";
import { Wrench, Phone, MessageSquare, History, Clock, CheckCircle, Calendar, MapPin, XCircle, AlertTriangle } from "lucide-react";
import { FaUserTie } from "react-icons/fa";
import { format } from "date-fns";
import { useAuth } from "../context/AuthContext";

const ServiceSupport = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    subject: "Service Request",
    message: "",
    phone: user?.phone || "",
    address: user?.addresses?.[0]?.addressLine1 || "",
    preferredDate: ""
  });
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("new"); // 'new' or 'history'

  useEffect(() => {
    fetchHistory();
    if (user?.phone) {
       setFormData(prev => ({ ...prev, phone: user.phone }));
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get("/service-requests");
      setHistory(data.requests || []);
    } catch (error) {
      console.error("Failed to fetch history", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const description = `
Issue: ${formData.message}
Address: ${formData.address}
Preferred Date: ${formData.preferredDate || 'As soon as possible'}
Phone: ${formData.phone}
      `.trim();

      const requestData = { 
         type: formData.subject,
         description: description,
         date: new Date(),
         priority: "Medium" 
      };

      console.log('📤 Submitting service request:', requestData);
      const response = await api.post("/service-requests", requestData);
      console.log('✅ Response:', response.data);

      Swal.fire({
        icon: "success",
        title: "Request Submitted",
        text: "Our team has been notified.",
        confirmButtonColor: '#4f46e5'
      });
      
      setFormData(prev => ({ ...prev, message: "", preferredDate: "" }));
      fetchHistory();
      setActiveTab("history");
    } catch (error) {
      console.error('❌ Submit error:', error);
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: error.response?.data?.message || "Please try again later.",
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
     switch(status?.toLowerCase()) {
        case 'resolved': return 'text-emerald-600 bg-emerald-50 border-emerald-100/50';
        case 'in progress': return 'text-blue-600 bg-blue-50 border-blue-100/50';
        case 'cancelled': return 'text-red-600 bg-red-50 border-red-100/50';
        default: return 'text-amber-600 bg-amber-50 border-amber-100/50';
     }
  };

  const getStatusIcon = (status) => {
     switch(status?.toLowerCase()) {
        case 'resolved': return <CheckCircle size={14} />;
        case 'in progress': return <Wrench size={14} />;
        case 'cancelled': return <XCircle size={14} />;
        default: return <Clock size={14} />;
     }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-12">
       
       {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-6">
          <div>
             <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Service & Support</h1>
             <p className="text-slate-500 font-medium mt-2">
                Hello <span className="text-slate-900 font-bold">{user?.firstName || 'User'}</span>, how can we help you today?
             </p>
          </div>
          
          <div className="flex bg-slate-100/50 p-1 rounded-xl">
             <button 
                onClick={() => setActiveTab("new")}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "new" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
             >
                New Request
             </button>
             <button 
                onClick={() => setActiveTab("history")}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "history" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
             >
                History <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">{history.length}</span>
             </button>
          </div>
       </div>

       <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Main Content Area */}
          <div className="lg:col-span-8">
             {activeTab === "new" ? (
                <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                   
                   <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                      <div>
                         <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4">What do you need help with?</label>
                         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {['Service Request', 'Filter Change', 'Installation', 'Other Issue'].map(type => (
                               <button
                                  key={type}
                                  type="button"
                                  onClick={() => setFormData({...formData, subject: type})}
                                  className={`p-4 rounded-2xl border text-sm font-bold transition-all flex flex-col items-center gap-2 text-center
                                     ${formData.subject === type 
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30 transform scale-105' 
                                        : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-100 hover:bg-slate-50'}
                                  `}
                               >
                                  {type === 'Service Request' && <Wrench size={20} />}
                                  {type === 'Filter Change' && <Clock size={20} />}
                                  {type === 'Installation' && <MapPin size={20} />}
                                  {type === 'Other Issue' && <AlertTriangle size={20} />}
                                  {type}
                               </button>
                            ))}
                         </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                         <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Phone Number</label>
                            <div className="relative">
                               <Phone className="absolute left-4 top-3.5 text-slate-400" size={18} />
                               <input 
                                  type="tel" 
                                  required
                                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 placeholder:text-slate-400 transition-all"
                                  value={formData.phone}
                                  onChange={e => setFormData({...formData, phone: e.target.value})}
                               />
                            </div>
                         </div>
                         <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Preferred Date (Optional)</label>
                            <div className="relative">
                               <Calendar className="absolute left-4 top-3.5 text-slate-400" size={18} />
                               <input 
                                  type="date"
                                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 text-sm transition-all"
                                  value={formData.preferredDate}
                                  min={new Date().toISOString().split("T")[0]}
                                  onChange={e => setFormData({...formData, preferredDate: e.target.value})}
                               />
                            </div>
                         </div>
                      </div>

                      <div>
                         <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Service Address</label>
                         <textarea 
                            rows="2"
                            placeholder="Enter your full address..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 placeholder:text-slate-400 resize-none transition-all"
                            value={formData.address}
                            onChange={e => setFormData({...formData, address: e.target.value})}
                         ></textarea>
                      </div>

                      <div>
                         <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Describe the Issue</label>
                         <textarea 
                            required
                            rows="4"
                            placeholder="Please provide details about the problem (e.g., Strange noise, Water taste is bad)..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 placeholder:text-slate-400 resize-none transition-all"
                            value={formData.message}
                            onChange={e => setFormData({...formData, message: e.target.value})}
                         ></textarea>
                      </div>

                      <button 
                         type="submit" 
                         disabled={loading}
                         className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:translate-y-0 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                      >
                         {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : (
                            <>Submit Request <Wrench size={18} /></>
                         )}
                      </button>
                   </form>
                </div>
             ) : (
                <div className="space-y-6">
                   {history.length === 0 ? (
                      <div className="bg-white rounded-[2.5rem] p-16 text-center border border-dashed border-slate-300">
                         <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                            <History size={40} />
                         </div>
                         <h3 className="text-xl font-bold text-slate-900">No Service History</h3>
                         <p className="text-slate-500 mt-2">You haven't made any service requests yet.</p>
                         <button onClick={() => setActiveTab("new")} className="mt-6 text-indigo-600 font-bold hover:underline">Create New Request</button>
                      </div>
                   ) : (
                      history.map((req, idx) => (
                         <div key={idx} className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-lg shadow-slate-100 hover:shadow-xl transition-all group">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-50 pb-6">
                               <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                     req.type === 'Installation' ? 'bg-purple-50 text-purple-600' :
                                     req.type === 'Filter Change' ? 'bg-orange-50 text-orange-600' :
                                     'bg-indigo-50 text-indigo-600'
                                  }`}>
                                     {req.type === 'Installation' ? <MapPin size={24} /> :
                                      req.type === 'Filter Change' ? <Clock size={24} /> : 
                                      <Wrench size={24} />}
                                  </div>
                                  <div>
                                     <h3 className="font-black text-slate-900 text-lg">{req.type}</h3>
                                     <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">ID: #{req.ticketId}</p>
                                  </div>
                               </div>
                               <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${getStatusColor(req.status)}`}>
                                  {getStatusIcon(req.status)} {req.status}
                               </span>
                            </div>
                            
                            <div className="pl-0 md:pl-16 space-y-4">
                               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{req.description}</p>
                                  
                                  {req.assignedTechnician && (
                                     <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                           <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                              <FaUserTie size={14} />
                                           </div>
                                           <div>
                                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Technician Assigned</p>
                                              <p className="text-sm font-bold text-slate-900">{req.assignedTechnician}</p>
                                           </div>
                                        </div>
                                        <div className="hidden md:flex items-center gap-2 text-indigo-500">
                                           <CheckCircle size={14} />
                                           <span className="text-[10px] font-black uppercase tracking-widest">En Route</span>
                                        </div>
                                     </div>
                                  )}

                                  {req.resolutionNotes && (
                                     <div className={`mt-4 pt-4 border-t border-slate-200 ${!req.assignedTechnician ? '' : 'mt-2 border-t-0 pt-2'}`}>
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Update / Resolution Notes</p>
                                        <p className="text-slate-700 text-sm italic">"{req.resolutionNotes}"</p>
                                     </div>
                                  )}
                               </div>
                               <div className="flex items-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                  <span className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                                     <Calendar size={14} /> {format(new Date(req.date), "MMM dd, yyyy")}
                                  </span>
                                  {req.priority && (
                                     <span className="flex items-center gap-1.5 text-orange-400">
                                        <AlertTriangle size={14} /> {req.priority} Priority
                                     </span>
                                  )}
                               </div>
                            </div>
                         </div>
                      ))
                   )}
                </div>
             )}
          </div>

           {/* Sidebar / Contact Info */}
           <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl shadow-slate-200">
                 <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                       <Phone size={24} />
                    </div>
                    <div>
                       <h3 className="text-lg font-bold">Support Center</h3>
                       <p className="text-slate-400 text-xs font-medium">We're here to help</p>
                    </div>
                 </div>
                 
                 <div className="space-y-6">
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                       <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Customer Care</p>
                       <a href="tel:+919876543210" className="text-2xl font-black text-white hover:text-indigo-400 transition-colors block tracking-tight">
                          +91 987 654 000
                       </a>
                       <div className="flex items-center gap-2 mt-4 text-xs font-medium text-slate-400">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                          Mon-Sat, 9:00 AM - 6:00 PM
                       </div>
                    </div>

                    <button 
                       onClick={() => window.open('https://wa.me/919876543210', '_blank')}
                       className="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 hover:-translate-y-1"
                    >
                       <MessageSquare size={20} /> Chat on WhatsApp
                    </button>
                 </div>
              </div>

              <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-lg shadow-slate-100/50">
                 <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <CheckCircle size={20} className="text-emerald-500" /> Quick Tips
                 </h4>
                 <ul className="space-y-4">
                    {[
                       "Check if the water supply valve is fully open.",
                       "Ensure the power plug is connected securely.",
                       "Regular service increases machine life by 2 years."
                    ].map((tip, i) => (
                       <li key={i} className="flex gap-3 text-sm text-slate-500 font-medium">
                          <span className="w-1.5 h-1.5 bg-slate-300 rounded-full mt-2 shrink-0"></span>
                          {tip}
                       </li>
                    ))}
                 </ul>
              </div>
           </div>
       </div>
    </div>
  );
};

export default ServiceSupport;
