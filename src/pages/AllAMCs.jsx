import { useEffect, useState } from "react";
import api from "../services/api";
import { 
  ShieldCheck, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  TrendingUp,
  Package,
  Wrench,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List
} from "lucide-react";
import Swal from "sweetalert2";

const AllAMCs = () => {
  const [amcs, setAmcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedAmcId, setExpandedAmcId] = useState(null);
  const [viewMode, setViewMode] = useState('table');

  useEffect(() => {
    fetchAllAmcs();
    const interval = setInterval(fetchAllAmcs, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllAmcs = async () => {
    try {
      setLoading(true);
      const res = await api.get('my-amcs?status=all');
      setAmcs(res.data?.amcs || []);
    } catch (error) {
      console.error("Failed to fetch AMCs:", error);
      Swal.fire('Error', 'Failed to load AMCs', 'error');
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

  const getAmcStatus = (amc) => {
    const isDateExpired = new Date(amc.endDate) < new Date();
    const isServicesExhausted = (amc.servicesUsed || 0) >= (amc.servicesTotal || 4);
    if (amc.status === 'Expired' || isDateExpired || isServicesExhausted) return 'expired';
    return 'active';
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
        fetchAllAmcs();
      }
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to book service', 'error');
    }
  };

  const filteredAmcs = amcs.filter(amc => {
    const matchesSearch = amc.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         amc.amcPlanName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || getAmcStatus(amc) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const AmcCard = ({ amc }) => (
    <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden hover:shadow-xl transition-all">
      <div className="relative h-48 bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-8">
        {amc.productImage ? <img src={amc.productImage} alt={amc.productName} className="h-full w-auto object-contain"/> : <Package size={64} className="text-slate-300" />}
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusColor(amc)}`}>
          {getStatusText(amc)}
        </div>
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
        <div className="flex gap-3">
          <button onClick={() => handleBookService(amc)} className="flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center justify-center gap-2"><Plus size={14} /> Book Service</button>
          <button onClick={() => setExpandedAmcId(expandedAmcId === amc._id ? null : amc._id)} className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${expandedAmcId === amc._id ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200 text-slate-600'}`}>{expandedAmcId === amc._id ? 'Close' : 'Details'}</button>
        </div>
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

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full mb-3"><ShieldCheck size={14} /> <span className="text-[10px] font-black uppercase tracking-widest">All Coverage</span></div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">All <span className="text-blue-600">AMC Plans</span></h1>
        <p className="text-slate-500 font-medium mt-2">View and manage all your maintenance plans.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by product or plan..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
          {['all', 'active', 'expired'].map((status) => (
            <button 
              key={status} 
              onClick={() => setStatusFilter(status)} 
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${statusFilter === status ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
            >
              <Filter size={14} />
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
          <button 
            onClick={() => setViewMode('table')} 
            className={`px-4 py-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
            title="Table View"
          >
            <List size={18} />
          </button>
          <button 
            onClick={() => setViewMode('cards')} 
            className={`px-4 py-2 rounded-xl transition-all ${viewMode === 'cards' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
            title="Cards View"
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center animate-pulse">Loading...</div>
      ) : filteredAmcs.length > 0 ? (
        viewMode === 'table' ? (
          <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">Plan</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">Expires</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">Services</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">Days Left</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAmcs.map(amc => (
                    <tr key={amc._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {amc.productImage ? (
                            <img src={amc.productImage} alt={amc.productName} className="w-10 h-10 object-contain" />
                          ) : (
                            <Package size={20} className="text-slate-300" />
                          )}
                          <span className="font-bold text-slate-900">{amc.productName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">
                          {amc.amcPlanName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(amc)}`}>
                          {getStatusText(amc)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        {new Date(amc.endDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        {amc.servicesUsed}/{amc.servicesTotal}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        {amc.daysRemaining} days
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleBookService(amc)}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-1"
                          >
                            <Plus size={14} /> Book
                          </button>
                          <button 
                            onClick={() => setExpandedAmcId(expandedAmcId === amc._id ? null : amc._id)}
                            className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all"
                          >
                            {expandedAmcId === amc._id ? 'Hide' : 'View'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {expandedAmcId && (
              <div className="border-t border-slate-100 p-6 bg-slate-50">
                {filteredAmcs.find(a => a._id === expandedAmcId)?.serviceHistory?.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-600 uppercase tracking-widest">Service History</h4>
                    {filteredAmcs.find(a => a._id === expandedAmcId)?.serviceHistory.map((service, idx) => (
                      <div key={idx} className="bg-white rounded-2xl p-4 border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-black text-slate-900">{service.type}</span>
                          <span className="text-[10px] font-bold text-slate-400">{new Date(service.date).toLocaleDateString('en-IN')}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mb-2 italic">"{service.notes || 'No notes'}"</p>
                        {service.technicianName && <p className="text-[10px] font-bold text-slate-700">Technician: {service.technicianName}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-6 text-xs font-bold text-slate-300">No service history</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredAmcs.map(amc => <AmcCard key={amc._id} amc={amc} />)}
          </div>
        )
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-[40px] text-slate-400">
          <Package size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-bold">No AMCs found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default AllAMCs;
