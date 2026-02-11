
import { useState, useEffect } from "react";
import api from "../services/api";
import { Clock, CheckCircle, AlertCircle, Wrench, ShieldCheck, Calendar, IndianRupee } from "lucide-react";
import { format, differenceInDays } from "date-fns";

const RentedRO = () => {
  const [rental, setRental] = useState(null);
  const [amc, setAmc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRentalDetails();
  }, []);

  const fetchRentalDetails = async () => {
    try {
      const { data } = await api.get("/user-rentals");
      setRental(data?.rental || null);
      setAmc(data?.amc || null);
    } catch (error) {
      console.error("Failed to fetch rental details", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-black text-slate-900 tracking-tight">Rented Machines</h1>
           <p className="text-slate-500 text-sm font-medium mt-1">Manage your active RO subscriptions</p>
        </div>
      </div>

      {!rental ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
           <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="text-indigo-500" size={40} />
           </div>
           <h3 className="text-xl font-bold text-slate-900">No active rental plan</h3>
           <p className="text-slate-500 text-sm max-w-sm mx-auto mt-3 leading-relaxed">
              Get an advanced RO purifier with zero initial cost and free lifetime maintenance. Plans start at just <span className="font-bold text-slate-900">₹399/mo</span>.
           </p>
           {/* Placeholder button - to be linked to rental plans page later */}
           <button className="mt-8 px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all text-sm flex items-center gap-2 mx-auto">
              Explore Rental Plans
           </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl overflow-hidden shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100">
           <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-8 lg:gap-12">
              
              {/* Product Image */}
              <div className="w-full lg:w-1/3 shrink-0">
                 <div className="aspect-[4/3] bg-slate-50 rounded-2xl flex items-center justify-center p-8 border border-slate-100 overflow-hidden relative">
                    {rental.machineImage ? (
                       <img src={rental.machineImage} alt="RO Machine" className="w-full h-full object-contain mix-blend-multiply" />
                    ) : (
                       <div className="flex flex-col items-center justify-center text-slate-300 font-bold">
                          <ShieldCheck size={48} />
                          <span className="mt-2 text-xs uppercase tracking-widest">No Image</span>
                       </div>
                    )}
                 </div>
              </div>
              
              {/* Details */}
              <div className="flex-1 space-y-8">
                 <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div>
                       <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2 block">{rental.planName || "Standard Plan"}</span>
                       <h2 className="text-3xl font-black text-slate-900 mb-2">{rental.machineModel || "Water Purifier"}</h2>
                       <p className="text-slate-500 font-medium text-lg flex items-center gap-1">
                          <IndianRupee size={16} /> {rental.amount}/month
                       </p>
                    </div>
                     <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                       rental.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 
                       rental.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                       'bg-red-100 text-red-700'
                     }`}>
                        {rental.status === 'Active' ? <CheckCircle size={14} /> : 
                         rental.status === 'Pending' ? <Clock size={14} /> : 
                         <AlertCircle size={14} />} 
                        {rental.status}
                     </span>
                 </div>

                 {/* Stats Grid */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100 transition-colors hover:bg-orange-100/50">
                       <p className="text-xs text-orange-400 font-extrabold uppercase tracking-wider mb-2 flex items-center gap-2">
                          <Clock size={14} /> Next Payment
                       </p>
                       <p className="text-xl font-black text-slate-800">
                          {rental.nextDueDate ? format(new Date(rental.nextDueDate), "MMM dd, yyyy") : 'N/A'}
                       </p>
                       {rental.nextDueDate && (
                         <p className="text-[10px] text-orange-500 font-bold mt-1">
                            Due in {differenceInDays(new Date(rental.nextDueDate), new Date())} days
                         </p>
                       )}
                    </div>
                    
                    <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 transition-colors hover:bg-blue-100/50">
                       <p className="text-xs text-blue-400 font-extrabold uppercase tracking-wider mb-2 flex items-center gap-2">
                          <Calendar size={14} /> Started On
                       </p>
                       <p className="text-xl font-black text-slate-800">
                          {rental.startDate ? format(new Date(rental.startDate), "MMM dd, yyyy") : 'N/A'}
                       </p>
                       <p className="text-[10px] text-blue-500 font-bold mt-1">Free Service Included</p>
                    </div>
                 </div>

                 {/* AMC Details if active */}
                 {amc && amc.status === 'Active' && (
                    <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 space-y-4 transition-all hover:bg-indigo-50">
                       <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                             <ShieldCheck className="text-indigo-600" size={20} />
                             <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">Active AMC Plan</h3>
                          </div>
                          <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{amc.planName}</span>
                       </div>
                       
                       <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                             <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Services</p>
                             <p className="font-black text-slate-800">{amc.servicesUsed}/{amc.servicesTotal}</p>
                          </div>
                          <div className="text-center border-x border-slate-200">
                             <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Parts</p>
                             <p className="font-black text-slate-800 text-xs">{amc.partsIncluded ? 'COVERED' : 'NOT COVERED'}</p>
                          </div>
                          <div className="text-center">
                             <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Expiry</p>
                             <p className="font-black text-slate-800">{amc.endDate ? format(new Date(amc.endDate), "dd/MM/yy") : 'N/A'}</p>
                          </div>
                       </div>
                    </div>
                 )}

                 <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-50">
                    <button className="flex-1 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 hover:-translate-y-0.5 transition-all shadow-lg shadow-indigo-200 text-sm flex items-center justify-center gap-2">
                       <IndianRupee size={18} /> Pay Rent Now
                    </button>
                    <button className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm">
                       <Wrench size={18} /> Request Service
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default RentedRO;
