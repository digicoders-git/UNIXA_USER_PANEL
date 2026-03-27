import { useEffect, useState } from "react";
import api, { getImageUrl } from "../services/api";
import { 
  ShieldCheck, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  TrendingUp,
  Package,
  ArrowRight,
  Wrench,
  Plus,
  Bell
} from "lucide-react";
import Swal from "sweetalert2";

const MyAMCs = () => {
  const [amcs, setAmcs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedAmcId, setExpandedAmcId] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [amcsRes, summaryRes] = await Promise.all([
        api.get(`my-amcs?status=${filter}`),
        api.get('my-amcs/summary')
      ]);
      
      setAmcs(amcsRes.data?.amcs || []);
      
      const allAmcs = amcsRes.data?.amcs || [];
      const expiredCount = allAmcs.filter(a => {
        const isDateExpired = new Date(a.endDate) < new Date();
        const isServicesExhausted = (a.servicesUsed || 0) >= (a.servicesTotal || 4);
        return a.status === 'Expired' || isDateExpired || isServicesExhausted;
      }).length;
      
      const expiringSoonCount = allAmcs.filter(a => {
        const isDateExpired = new Date(a.endDate) < new Date();
        const isServicesExhausted = (a.servicesUsed || 0) >= (a.servicesTotal || 4);
        const daysLeft = Math.ceil((new Date(a.endDate) - new Date()) / (1000 * 60 * 60 * 24));
        const servicesRemaining = (a.servicesTotal || 4) - (a.servicesUsed || 0);
        return a.status === 'Active' && !isDateExpired && !isServicesExhausted && (daysLeft > 0 && daysLeft <= 30 || servicesRemaining === 1);
      }).length;
      
      setSummary(summaryRes.data?.summary ? {
        ...summaryRes.data.summary,
        expiredAmcs: expiredCount,
        upcomingExpiry: expiringSoonCount > 0 ? Array(expiringSoonCount).fill({}) : []
      } : null);
    } catch (error) {
      console.error("Failed to fetch AMC data:", error);
    } finally {
      setLoading(false);
    }
  };


  const getStatusColor = (amc) => {
    const isDateExpired = new Date(amc.endDate) < new Date();
    const isServicesExhausted = (amc.servicesUsed || 0) >= (amc.servicesTotal || 4);
    if (amc.status === 'Expired' || isDateExpired || isServicesExhausted) return 'bg-red-50 text-red-600 border-red-100';
    if (amc.daysRemaining <= 30 || amc.servicesTotal - amc.servicesUsed === 1) return 'bg-yellow-50 text-yellow-600 border-yellow-100';
    return 'bg-emerald-50 text-emerald-600 border-emerald-100';
  };

  const getStatusText = (amc) => {
    const isDateExpired = new Date(amc.endDate) < new Date();
    const isServicesExhausted = (amc.servicesUsed || 0) >= (amc.servicesTotal || 4);
    if (amc.status === 'Expired' || isDateExpired || isServicesExhausted) return isServicesExhausted && !isDateExpired ? 'Services Used Up' : 'Expired';
    if (amc.servicesTotal - amc.servicesUsed === 1) return 'Last Service!';
    if (amc.daysRemaining <= 30) return `Expiring in ${amc.daysRemaining} days`;
    return 'Active';
  };

  const getDaysUntilNextService = (amc) => {
    if (!amc.nextServiceDueDate) return null;
    const now = new Date();
    const dueDate = new Date(amc.nextServiceDueDate);
    const diff = dueDate - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleBookService = async (amc) => {
    const isDateExpired = new Date(amc.endDate) < new Date();
    if (isDateExpired) {
      Swal.fire('Error', 'Cannot book service for expired AMC', 'error');
      return;
    }
    try {
      const result = await Swal.fire({
        title: 'Book Service',
        html: `<div class="text-left"><p class="mb-3"><strong>Product:</strong> ${amc.productName}</p><p class="mb-3"><strong>Plan:</strong> ${amc.amcPlanName}</p><textarea id="serviceNotes" class="w-full p-2 border rounded" placeholder="Service description (optional)" rows="3"></textarea></div>`,
        showCancelButton: true,
        confirmButtonText: 'Book Service',
        confirmButtonColor: '#1e293b',
        cancelButtonColor: '#cbd5e1'
      });
      if (result.isConfirmed) {
        const notes = document.getElementById('serviceNotes')?.value || '';
        await api.post(`my-amcs/${amc._id}/request-service`, { notes });
        Swal.fire('Success', 'Service booked successfully', 'success');
        fetchData();
      }
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to book service', 'error');
    }
  };

  const AmcCard = ({ amc, isHistory }) => {
    const daysUntilService = getDaysUntilNextService(amc);
    const isServiceDue = daysUntilService !== null && daysUntilService <= 0;
    const isServiceUpcoming = daysUntilService !== null && daysUntilService > 0 && daysUntilService <= 7;

    return (
      <div className={`bg-white rounded-[40px] border border-slate-100 overflow-hidden transition-all group ${isHistory ? 'opacity-70 grayscale-[0.5]' : 'hover:shadow-xl'}`}>
        <div className="relative h-48 bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-8">
          {amc.productImage ? <img src={getImageUrl(amc.productImage)} alt={amc.productName} className="h-full w-auto object-contain"/> : <Package size={64} className="text-slate-300" />}
          <div className={`absolute top-4 right-4 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusColor(amc)}`}>
            {getStatusText(amc)}
          </div>
          {isServiceDue && (
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-red-100 text-red-600 border border-red-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
              <Bell size={12} /> Service Due
            </div>
          )}
          {isServiceUpcoming && (
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-orange-100 text-orange-600 border border-orange-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
              <Bell size={12} /> Service Soon
            </div>
          )}
        </div>
        <div className="p-8">
          <div className="mb-6">
            <h3 className="text-xl font-black text-slate-900 mb-1">{amc.productName}</h3>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full">
              <ShieldCheck size={12} />
              <span className="text-[10px] font-black uppercase tracking-widest">{amc.amcPlanName} Plan</span>
            </div>
          </div>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Coverage Progress</span>
              <span className="text-xs font-black text-slate-900">{amc.progressPercent}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500" style={{ width: `${amc.progressPercent}%` }}></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-1"><Calendar size={14} className="text-blue-500" /><span className="text-[10px] font-black text-slate-400 uppercase">Expires</span></div>
              <p className="text-sm font-black text-slate-900">{new Date(amc.endDate).toLocaleDateString('en-IN')}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-1"><Clock size={14} className="text-emerald-500" /><span className="text-[10px] font-black text-slate-400 uppercase">Remaining</span></div>
              <p className="text-sm font-black text-slate-900 text-truncate">{amc.daysRemaining} days</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-1"><Wrench size={14} className="text-orange-500" /><span className="text-[10px] font-black text-slate-400 uppercase">Services</span></div>
              <p className="text-sm font-black text-slate-900">{amc.servicesUsed}/{amc.servicesTotal} used</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-1"><TrendingUp size={14} className="text-purple-500" /><span className="text-[10px] font-black text-slate-400 uppercase">Duration</span></div>
              <p className="text-sm font-black text-slate-900">{amc.durationMonths} months</p>
            </div>
          </div>

          {/* Next Service Due Date */}
          {amc.nextServiceDueDate && !isHistory && (
            <div className={`mb-6 p-4 rounded-2xl border-2 ${
              isServiceDue ? 'bg-red-50 border-red-200' :
              isServiceUpcoming ? 'bg-orange-50 border-orange-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Bell size={14} className={isServiceDue ? 'text-red-600' : isServiceUpcoming ? 'text-orange-600' : 'text-blue-600'} />
                <span className={`text-xs font-black uppercase ${isServiceDue ? 'text-red-600' : isServiceUpcoming ? 'text-orange-600' : 'text-blue-600'}`}>
                  Next Service
                </span>
              </div>
              <p className={`text-sm font-black ${isServiceDue ? 'text-red-700' : isServiceUpcoming ? 'text-orange-700' : 'text-blue-700'}`}>
                {new Date(amc.nextServiceDueDate).toLocaleDateString('en-IN')}
              </p>
              {daysUntilService !== null && (
                <p className={`text-[10px] font-bold mt-1 ${isServiceDue ? 'text-red-600' : isServiceUpcoming ? 'text-orange-600' : 'text-blue-600'}`}>
                  {isServiceDue ? 'OVERDUE' : `${daysUntilService} days remaining`}
                </p>
              )}
              {amc.serviceSchedule?.description && (
                <p className="text-[10px] text-slate-600 mt-2 italic">{amc.serviceSchedule.description}</p>
              )}
            </div>
          )}

          {!isHistory && (
            <div className="flex gap-3">
              <button onClick={() => handleBookService(amc)} className="flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center justify-center gap-2"><Plus size={14} /> Book Service</button>
              <button onClick={() => setExpandedAmcId(expandedAmcId === amc._id ? null : amc._id)} className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${expandedAmcId === amc._id ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200 text-slate-600'}`}>{expandedAmcId === amc._id ? 'Close' : 'Details'}</button>
            </div>
          )}
          {expandedAmcId === amc._id && (
            <div className="mt-8 pt-8 border-t border-slate-100 animate-fade-in">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Service History</h4>
              {amc.serviceHistory?.length > 0 ? (
                <div className="space-y-4">
                  {amc.serviceHistory.map((service, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <div className="flex justify-between items-start mb-2"><span className="text-xs font-black text-slate-900">{service.type}</span><span className="text-[10px] font-bold text-slate-400">{new Date(service.date).toLocaleDateString('en-IN')}</span></div>
                      <p className="text-[11px] text-slate-600 mb-2 italic">"{service.notes || 'No notes'}"</p>
                      {service.technicianName && <p className="text-[10px] font-bold text-slate-700">Technician: {service.technicianName}</p>}
                    </div>
                  ))}
                </div>
              ) : <p className="text-center py-6 text-xs font-bold text-slate-300">No visits yet</p>}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full mb-3"><ShieldCheck size={14} /> <span className="text-[10px] font-black uppercase tracking-widest">My Coverage</span></div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Active <span className="text-blue-600">AMC Plans</span></h1>
          <p className="text-slate-500 font-medium mt-2">Manage your maintenance plans and history.</p>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
          {['Active', 'Expired', 'all'].map((status) => (
            <button key={status} onClick={() => setFilter(status)} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === status ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>{status === 'all' ? 'All' : status}</button>
          ))}
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatMiniCard icon={CheckCircle} value={summary.activeAmcs} label="Active" color="emerald" />
          <StatMiniCard icon={Wrench} value={summary.totalServicesUsed} label="Used" color="blue" />
          <StatMiniCard icon={AlertCircle} value={summary.expiredAmcs} label="Expired" color="red" />
          <StatMiniCard icon={Clock} value={summary.upcomingExpiry?.length} label="Due Soon" color="yellow" />
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center animate-pulse">Loading...</div>
      ) : amcs.length > 0 ? (
        <div className="space-y-12">
          {/* Active Section */}
          {(filter === 'all' || filter === 'Active') && (
            <div className="space-y-6">
               {filter === 'all' && <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><CheckCircle size={20} className="text-emerald-500" /> Current Subscriptions</h2>}
               <div className="grid md:grid-cols-2 gap-6">
                  {amcs.filter(a => !(new Date(a.endDate) < new Date() || a.servicesUsed >= a.servicesTotal)).map(a => <AmcCard key={a._id} amc={a} />)}
               </div>
            </div>
          )}

          {/* History Section */}
          {(filter === 'all' || filter === 'Expired') && (
            <div className="space-y-6">
               {filter === 'all' && <h2 className="text-xl font-black text-slate-400 flex items-center gap-2"><Clock size={20} /> Subscription History</h2>}
               <div className="grid md:grid-cols-2 gap-6 opacity-80">
                  {amcs.filter(a => (new Date(a.endDate) < new Date() || a.servicesUsed >= a.servicesTotal)).map(a => <AmcCard key={a._id} amc={a} isHistory />)}
               </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-[40px] text-slate-400">No plans found.</div>
      )}
    </div>
  );
};

const StatMiniCard = ({ icon: Icon, value, label, color }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 italic">
    <div className="flex items-center gap-3 mb-1">
      <div className={`w-8 h-8 rounded-xl bg-${color}-50 text-${color}-600 flex items-center justify-center`}><Icon size={16} /></div>
      <span className="text-xl font-black text-slate-900">{value}</span>
    </div>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
  </div>
);

export default MyAMCs;
