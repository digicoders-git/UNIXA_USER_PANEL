import { useEffect, useState } from "react";
import api from "../services/api";
import { 
  ShieldCheck, 
  Calendar, 
  Clock, 
  Wrench, 
  AlertCircle, 
  CheckCircle,
  TrendingUp,
  Package,
  ArrowRight
} from "lucide-react";
import Swal from "sweetalert2";

const MyAMCs = () => {
  const [amcs, setAmcs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Active');
  const [expandedAmcId, setExpandedAmcId] = useState(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [amcsRes, summaryRes] = await Promise.all([
        api.get(`/my-amcs?status=${filter}`),
        api.get('/my-amcs/summary')
      ]);
      
      setAmcs(amcsRes.data?.amcs || []);
      setSummary(summaryRes.data?.summary || null);
    } catch (error) {
      console.error("Failed to fetch AMC data:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to load AMC plans",
        icon: "error",
        confirmButtonColor: '#2563eb'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestService = async (amc) => {
    if (amc.servicesRemaining <= 0) {
      Swal.fire({
        title: "No Services Remaining",
        text: "All service visits have been used. Please renew your AMC.",
        icon: "warning",
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    const result = await Swal.fire({
      title: "Request Service",
      html: `
        <p class="text-sm text-slate-600 mb-4">Request a service visit for <strong>${amc.productName}</strong></p>
        <textarea 
          id="service-notes" 
          class="w-full p-3 border border-slate-200 rounded-xl text-sm"
          placeholder="Describe the issue (optional)"
          rows="3"
        ></textarea>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      confirmButtonText: 'Submit Request',
      preConfirm: () => {
        return document.getElementById('service-notes').value;
      }
    });

    if (result.isConfirmed) {
      try {
        await api.post(`/my-amcs/${amc._id}/request-service`, {
          notes: result.value || 'Service requested'
        });
        
        Swal.fire({
          title: "Request Submitted!",
          text: "Our team will contact you within 24 hours.",
          icon: "success",
          confirmButtonColor: '#2563eb'
        });
        
        fetchData(); // Refresh data
      } catch {
        Swal.fire({
          title: "Failed",
          text: "Could not submit service request. Please try again.",
          icon: "error",
          confirmButtonColor: '#2563eb'
        });
      }
    }
  };

  const getStatusColor = (amc) => {
    if (amc.status === 'Expired') return 'bg-red-50 text-red-600 border-red-100';
    if (amc.daysRemaining <= 30) return 'bg-yellow-50 text-yellow-600 border-yellow-100';
    return 'bg-emerald-50 text-emerald-600 border-emerald-100';
  };

  const getStatusText = (amc) => {
    if (amc.status === 'Expired') return 'Expired';
    if (amc.daysRemaining <= 30) return `Expiring in ${amc.daysRemaining} days`;
    return 'Active';
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-600"></div>
          <p className="text-sm font-black text-slate-400 animate-pulse uppercase tracking-widest">Loading AMCs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full mb-3">
            <ShieldCheck size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">My Coverage</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Active <span className="text-blue-600">AMC Plans</span>
          </h1>
          <p className="text-slate-500 font-medium mt-2 max-w-lg">
            Manage your maintenance plans and service requests
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
          {['Active', 'Expired', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                filter === status
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle size={20} />
              </div>
              <span className="text-2xl font-black text-slate-900">{summary.activeAmcs}</span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Plans</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Wrench size={20} />
              </div>
              <span className="text-2xl font-black text-slate-900">{summary.totalServicesUsed}</span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Services Used</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                <AlertCircle size={20} />
              </div>
              <span className="text-2xl font-black text-slate-900">{summary.expiredAmcs}</span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expired</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-yellow-50 text-yellow-600 flex items-center justify-center">
                <Clock size={20} />
              </div>
              <span className="text-2xl font-black text-slate-900">{summary.upcomingExpiry?.length || 0}</span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expiring Soon</p>
          </div>
        </div>
      )}

      {/* AMC Cards */}
      {amcs.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {amcs.map((amc) => (
            <div 
              key={amc._id} 
              className="bg-white rounded-[40px] border border-slate-100 overflow-hidden hover:shadow-xl transition-all group"
            >
              {/* Product Header */}
              <div className="relative h-48 bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-8">
                {amc.productImage ? (
                  <img 
                    src={amc.productImage} 
                    alt={amc.productName}
                    className="h-full w-auto object-contain"
                  />
                ) : (
                  <Package size={64} className="text-slate-300" />
                )}
                
                {/* Status Badge */}
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusColor(amc)}`}>
                  {getStatusText(amc)}
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                {/* Product & Plan Name */}
                <div className="mb-6">
                  <h3 className="text-xl font-black text-slate-900 mb-1">{amc.productName}</h3>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full">
                    <ShieldCheck size={12} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{amc.amcPlanName} Plan</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">Coverage Progress</span>
                    <span className="text-xs font-black text-slate-900">{amc.progressPercent}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                      style={{ width: `${amc.progressPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={14} className="text-blue-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase">Expires</span>
                    </div>
                    <p className="text-sm font-black text-slate-900">
                      {new Date(amc.endDate).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={14} className="text-emerald-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase">Remaining</span>
                    </div>
                    <p className="text-sm font-black text-slate-900">{amc.daysRemaining} days</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Wrench size={14} className="text-orange-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase">Services</span>
                    </div>
                    <p className="text-sm font-black text-slate-900">
                      {amc.servicesUsed}/{amc.servicesTotal} used
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp size={14} className="text-purple-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase">Duration</span>
                    </div>
                    <p className="text-sm font-black text-slate-900">{amc.durationMonths} months</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleRequestService(amc)}
                    disabled={amc.status === 'Expired' || amc.servicesRemaining <= 0}
                    className="flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Wrench size={14} />
                    Request Service
                  </button>
                  <button 
                    onClick={() => setExpandedAmcId(expandedAmcId === amc._id ? null : amc._id)}
                    className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all active:scale-95 ${
                      expandedAmcId === amc._id ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {expandedAmcId === amc._id ? 'Close' : 'Details'}
                  </button>
                </div>

                {/* Expanded Details Section */}
                {expandedAmcId === amc._id && (
                  <div className="mt-8 pt-8 border-t border-slate-100 animate-fade-in">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Service History</h4>
                    {amc.serviceHistory && amc.serviceHistory.length > 0 ? (
                      <div className="space-y-4">
                        {amc.serviceHistory.map((service, idx) => (
                          <div key={idx} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-black text-slate-900">{service.type}</span>
                              <span className="text-[10px] font-bold text-slate-400">
                                {new Date(service.date).toLocaleDateString('en-IN')}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mb-3 leading-relaxed italic">"{service.notes || 'No notes provided'}"</p>
                            
                            {service.technicianName && (
                              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/60">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                  <Clock size={10} />
                                </div>
                                <div>
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight leading-none">Technician</p>
                                  <p className="text-[11px] font-bold text-slate-900">{service.technicianName}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-6 text-xs font-bold text-slate-300 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        No service visits yet
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-[40px] border border-dashed border-slate-200">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
            <ShieldCheck size={40} />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">No AMC Plans Found</h3>
          <p className="text-slate-400 text-sm font-medium max-w-xs mx-auto mb-6">
            {filter === 'Active' 
              ? 'You don\'t have any active AMC plans yet.'
              : 'No plans found for this filter.'}
          </p>
          <button 
            onClick={() => window.location.href = '/amc-plans'}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all"
          >
            Browse Plans <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default MyAMCs;
