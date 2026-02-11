
import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Zap, Wrench, Clock, ArrowRight, AlertCircle, Check, Award, LayoutGrid } from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";

const AMCPlans = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activePlan, setActivePlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subsRes, plansRes] = await Promise.all([
        api.get("/amc-user/my-subscriptions").catch(() => ({ data: { amc: [] } })),
        api.get("/amc-plans").catch(() => ({ data: { plans: [] } }))
      ]);

      if (subsRes.data?.amc?.length > 0) {
        setActivePlan(subsRes.data.amc[0]);
      }
      setPlans(plansRes.data?.plans || []);
    } catch (error) {
      console.error("Failed to fetch AMC data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChoosePlan = (plan) => {
     if (!user) {
        Swal.fire({
          title: "Login Required",
          text: "Please login to purchase a plan.",
          icon: "warning",
          confirmButtonColor: '#2563eb'
        }).then(() => navigate("/login"));
        return;
     }

     Swal.fire({
        title: `Confirm Selection`,
        html: `You are interested in the <span class="font-black text-blue-600">${plan.name}</span> plan for <span class="font-black text-slate-900">₹${plan.price}</span>.<br/><br/>Our team will contact you shortly to complete the activation process.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        confirmButtonText: 'Submit Interest',
        cancelButtonText: 'Cancel',
        padding: '2rem',
        customClass: {
           popup: 'rounded-[32px]',
           confirmButton: 'rounded-xl px-8 py-3 font-black uppercase tracking-widest text-[10px]',
           cancelButton: 'rounded-xl px-8 py-3 font-black uppercase tracking-widest text-[10px]'
        }
     }).then(async (result) => {
        if (result.isConfirmed) {
           setProcessingId(plan._id);
           try {
              await api.post("/amc-user/request-service", {
                 type: "AMC Inquiry",
                 notes: `User is interested in purchasing the AMC Plan: ${plan.name} (Price: ₹${plan.price}, Duration: ${plan.durationMonths} months).`,
                 date: new Date()
              });
              
              Swal.fire({
                 title: 'Request Received!',
                 text: 'Our team will contact you within 24 hours.',
                 icon: 'success',
                 confirmButtonColor: '#2563eb',
                 customClass: { popup: 'rounded-[32px]' }
              });
           } catch (error) {
              console.error("Plan request failed", error);
              Swal.fire({
                title: "Failed",
                text: "Could not submit your request. Try again.",
                icon: "error",
                confirmButtonColor: '#2563eb'
              });
           } finally {
              setProcessingId(null);
           }
        }
     });
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-600"></div>
          <p className="text-sm font-black text-slate-400 animate-pulse uppercase tracking-widest">Loading Plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in pb-20">
       
       {/* Header */}
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full mb-3">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Protection Plans</span>
             </div>
             <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">AMC <span className="text-blue-600">Packages</span></h1>
             <p className="text-slate-500 font-medium mt-2 max-w-lg">
                Hassle-free maintenance for your RO system. Expert technicians, genuine parts, and priority service.
             </p>
          </div>
          {activePlan && (
             <div className="px-6 py-4 bg-emerald-50 border border-emerald-100 rounded-3xl">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 mb-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Active Coverage
                </p>
                <p className="text-lg font-black text-slate-900">{activePlan.planName}</p>
             </div>
          )}
       </div>

       {/* Subscriptions Grid */}
       {plans.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
             {plans.map((plan) => (
                <div 
                   key={plan._id} 
                   className={`relative bg-white p-8 md:p-10 rounded-[40px] border border-slate-100 shadow-sm transition-all duration-300 group hover:shadow-2xl hover:border-blue-100 flex flex-col
                      ${plan.isPopular ? 'ring-2 ring-blue-600 ring-offset-4 ring-offset-slate-50' : ''}
                   `}
                >
                   {plan.isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-[0.2em] py-2 px-6 rounded-full shadow-lg">
                         Best Seller
                      </div>
                   )}

                   <div className="mb-8">
                      <h3 className="text-xl font-black text-slate-900 mb-2">{plan.name}</h3>
                      <div className="flex items-baseline gap-1">
                         <span className="text-4xl font-black text-slate-900 tracking-tight">₹{plan.price}</span>
                         <span className="text-xs font-bold text-slate-400">/ {plan.durationMonths} months</span>
                      </div>
                   </div>

                   <div className="space-y-4 mb-10 flex-1">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Check size={16} strokeWidth={3} />
                         </div>
                         <p className="text-sm font-bold text-slate-700">{plan.servicesIncluded} Service Visits</p>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Check size={16} strokeWidth={3} />
                         </div>
                         <p className="text-sm font-bold text-slate-700">{plan.partsIncluded ? 'Full Spares Covered' : 'Spares Chargeable'}</p>
                      </div>
                      
                      {/* Dynamic Features Coverage */}
                      {plan.features?.map((f, fi) => (
                        <div key={fi} className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                              <Check size={16} strokeWidth={3} />
                           </div>
                           <p className="text-sm font-bold text-slate-700">{f}</p>
                        </div>
                      ))}

                      {(!plan.features || plan.features.length === 0) && (
                        <>
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Check size={16} strokeWidth={3} />
                             </div>
                             <p className="text-sm font-bold text-slate-700">Unlimited Repair Calls</p>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Check size={16} strokeWidth={3} />
                             </div>
                             <p className="text-sm font-bold text-slate-700">24h Response Time</p>
                          </div>
                        </>
                      )}
                   </div>

                   <button 
                      onClick={() => handleChoosePlan(plan)}
                      disabled={processingId !== null}
                      className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2
                         ${plan.isPopular 
                            ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 hover:bg-blue-700' 
                            : 'bg-slate-900 text-white shadow-xl shadow-slate-100 hover:bg-slate-800'
                         }
                      `}
                   >
                      {processingId === plan._id ? (
                         <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                      ) : (
                         <>Get Covered <ArrowRight size={16} /></>
                      )}
                   </button>
                </div>
             ))}
          </div>
       ) : (
          <div className="text-center py-24 bg-white rounded-[40px] border border-dashed border-slate-200">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <AlertCircle size={40} />
             </div>
             <h3 className="text-xl font-black text-slate-900 mb-2">No Plans Available</h3>
             <p className="text-slate-400 text-sm font-medium max-w-xs mx-auto">
                Please contact our support team to get a custom maintainance quote.
             </p>
          </div>
       )}

       {/* Trust Section */}
       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-4">
          {[
             { title: "Genuine Spares", icon: Zap, color: "text-blue-500 bg-blue-50" },
             { title: "Trained Staff", icon: Award, color: "text-indigo-500 bg-indigo-50" },
             { title: "Fast Repair", icon: Wrench, color: "text-orange-500 bg-orange-50" },
             { title: "Auto Reminder", icon: Clock, color: "text-emerald-500 bg-emerald-50" }
          ].map((item, i) => (
             <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-4 group hover:border-blue-100 transition-all">
                <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center ${item.color}`}>
                   <item.icon size={22} />
                </div>
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight leading-tight">{item.title}</h4>
             </div>
          ))}
       </div>
    </div>
  );
};

export default AMCPlans;
