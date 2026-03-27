
import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, Zap, Wrench, Clock, ArrowRight, AlertCircle, Check, Award, X, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

const AMCPlans = () => {
   const { user } = useAuth();
   const navigate = useNavigate();
   const location = useLocation();

   // Extract product from URL if coming from Order Details
   const queryParams = new URLSearchParams(location.search);
   const preSelectedProductId = queryParams.get('productId');
   const preSelectedProductName = queryParams.get('productName');

   const [activePlan, setActivePlan] = useState(null);
   const [plans, setPlans] = useState([]);
   const [eligibleProducts, setEligibleProducts] = useState([]);
   const [loading, setLoading] = useState(true);
   const [processingId, setProcessingId] = useState(null);
   const [detailPlan, setDetailPlan] = useState(null);
   const [amcSelection, setAmcSelection] = useState({});

   useEffect(() => {
      fetchData();
   }, []);

   const fetchData = async () => {
      try {
         const requests = [
            api.get("amc-user/my-subscriptions").catch(() => ({ data: { amc: [] } })),
            api.get("amc-plans").catch(() => ({ data: { plans: [] } }))
         ];

         if (user) {
            requests.push(api.get("my-amcs/eligible-products").catch(() => ({ data: { products: [] } })));
         }

         const results = await Promise.all(requests);
         const subsRes = results[0];
         const plansRes = results[1];
         const productsRes = results[2];

         if (subsRes.data?.amc?.length > 0) {
            setActivePlan(subsRes.data.amc[0]);
         }
         setPlans(plansRes.data?.plans || []);

         if (productsRes) {
            setEligibleProducts(productsRes.data?.products || []);
         }
      } catch (error) {
         console.error("Failed to fetch AMC data", error);
      } finally {
         setLoading(false);
      }
   };

   const handleChoosePlan = (plan) => {
      if (!user) {
         toast.error('Please login to purchase a plan.');
         navigate('/login');
         return;
      }

      let productOptionsHtml = '';
      if (eligibleProducts.length > 0) {
         productOptionsHtml = `
          <div class="mt-4 text-left">
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Select Product to Cover</label>
            <select id="amc-product-select" class="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="">General Inquiry (No specific product)</option>
              ${eligibleProducts.map(p => `
                <option value="${p._id}" data-name="${p.name}" ${p._id === preSelectedProductId ? 'selected' : ''}>
                  ${p.name} ${p.hasActiveAmc ? '(Currently Covered)' : ''}
                </option>
              `).join('')}
            </select>
          </div>
        `;
      } else if (preSelectedProductId) {
         // Fallback if products haven't loaded or current product is the only known one
         productOptionsHtml = `
          <div class="mt-4 text-left">
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Covering Product</label>
            <div class="w-full p-4 rounded-2xl border border- blue-100 bg-blue-50/50 font-bold text-blue-700">
               ${preSelectedProductName || 'Selected Product'}
               <input type="hidden" id="amc-product-select" value="${preSelectedProductId}" data-name="${preSelectedProductName}">
            </div>
          </div>
        `;
      }

      Swal.fire({
         title: `Confirm Selection`,
         html: `
            <div class="text-slate-500 font-medium mb-4">
              You are interested in the <span class="font-black text-blue-600">${plan.name}</span> plan for <span class="font-black text-slate-900">₹${plan.price}</span>.
            </div>
            ${productOptionsHtml}
            <div class="mt-4 text-xs text-slate-400">Our team will contact you shortly to complete the activation process.</div>
         `,
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
         },
         preConfirm: () => {
            const select = document.getElementById('amc-product-select');
            if (select) {
               const selectedOption = select.options[select.selectedIndex];
               return {
                  productId: select.value,
                  productName: selectedOption.getAttribute('data-name')
               };
            }
            return null;
         }
      }).then(async (result) => {
         if (result.isConfirmed) {
            const productData = result.value;
            setProcessingId(plan._id);
            try {
               let notes = `User is interested in purchasing the AMC Plan: ${plan.name} (Price: ₹${plan.price}, Duration: ${plan.durationMonths} months).`;

               if (productData && productData.productId) {
                  notes += `\nSelected Product: ${productData.productName} (ID: ${productData.productId})`;
               }

               await api.post("/amc-user/request-service", {
                  type: "AMC Inquiry",
                  notes: notes,
                  date: new Date()
               });
               toast.success('Request Received! Our team will contact you within 24 hours.');
            } catch (error) {
               console.error("Plan request failed", error);
               toast.error('Could not submit your request. Try again.');
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
               {plans.map((plan) => {
                  const firstCfg = plan.productConfigs?.[0];
                  const disc = firstCfg?.discount || 0;
                  const afterDisc = (r) => disc > 0 ? Math.round(r - r * disc / 100) : r;
                  const lowestRate = firstCfg ? Math.min(...[firstCfg.rateOneYear, firstCfg.rateTwoYear, firstCfg.rateThreeYear].filter(r => r > 0)) : plan.price;
                  return (
                  <div
                     key={plan._id}
                     onClick={() => { setDetailPlan(plan); setAmcSelection({}); }}
                     className={`relative bg-white p-8 md:p-10 rounded-[40px] border border-slate-100 shadow-sm transition-all duration-300 group hover:shadow-2xl hover:border-blue-100 flex flex-col cursor-pointer
                      ${plan.isPopular ? 'ring-2 ring-blue-600 ring-offset-4 ring-offset-slate-50' : ''}
                   `}
                  >
                     {plan.isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-[0.2em] py-2 px-6 rounded-full shadow-lg">
                           Best Seller
                        </div>
                     )}
                     <div className="mb-6">
                        <h3 className="text-xl font-black text-slate-900 mb-1">{plan.name}</h3>
                        {firstCfg?.productId?.name && <p className="text-xs text-slate-400 font-bold mb-3">{firstCfg.productId.name}</p>}
                        {lowestRate > 0 ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900">₹{afterDisc(lowestRate)}</span>
                            {disc > 0 && <span className="text-sm line-through text-slate-300">₹{lowestRate}</span>}
                            {disc > 0 && <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{disc}% OFF</span>}
                          </div>
                        ) : (
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-slate-900">₹{plan.price}</span>
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400 font-bold mt-1">Starting price • tap to see all options</p>
                     </div>
                     <div className="space-y-3 mb-8 flex-1">
                        <div className="flex items-center gap-3">
                           <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Check size={14} strokeWidth={3} /></div>
                           <p className="text-sm font-bold text-slate-700">{plan.servicesIncluded} Service Visits</p>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Check size={14} strokeWidth={3} /></div>
                           <p className="text-sm font-bold text-slate-700">{plan.partsIncluded ? 'Full Spares Covered' : 'Spares Chargeable'}</p>
                        </div>
                        {plan.features?.slice(0,2).map((f, fi) => (
                           <div key={fi} className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Check size={14} strokeWidth={3} /></div>
                              <p className="text-sm font-bold text-slate-700">{f}</p>
                           </div>
                        ))}
                     </div>
                     <button
                        onClick={e => { e.stopPropagation(); setDetailPlan(plan); setAmcSelection({}); }}
                        className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2
                         ${plan.isPopular ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 hover:bg-blue-700' : 'bg-slate-900 text-white shadow-xl shadow-slate-100 hover:bg-slate-800'}`}
                     >
                        View & Book <ArrowRight size={16} />
                     </button>
                  </div>
                  );
               })}
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

         {/* AMC Detail Modal */}
         {detailPlan && (
           <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDetailPlan(null)}>
             <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
               <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-slate-100 flex justify-between items-start z-10">
                 <div>
                   <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 ${detailPlan.amcType === 'Free' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{detailPlan.amcType || 'Paid'}</span>
                   <h2 className="text-2xl font-black text-slate-900">{detailPlan.name}</h2>
                 </div>
                 <button onClick={() => setDetailPlan(null)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} className="text-slate-400" /></button>
               </div>
               <div className="p-6 space-y-6">
                 <div className="grid grid-cols-2 gap-3">
                   <div className="bg-slate-50 rounded-2xl p-4 text-center">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Services</p>
                     <p className="text-2xl font-black text-slate-900">{detailPlan.servicesIncluded || 0}</p>
                   </div>
                   <div className="bg-slate-50 rounded-2xl p-4 text-center">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Parts</p>
                     <p className="text-lg font-black text-slate-900">{detailPlan.partsIncluded ? '✅ Included' : '❌ Chargeable'}</p>
                   </div>
                 </div>

                 {/* Step 1: Select Your Product */}
                 <div>
                   <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3">Step 1 — Select Your Product</h3>
                   {eligibleProducts.length > 0 ? (
                     <div className="space-y-2">
                       {eligibleProducts.map(p => (
                         <button key={p._id || p.name} type="button"
                           onClick={() => {
                             if (p.hasActiveAmc) return; // block selection
                             setAmcSelection(prev => ({ ...prev, selectedProduct: prev.selectedProduct?._id === p._id ? null : p }));
                           }}
                           className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all ${
                             p.hasActiveAmc
                               ? 'border-amber-200 bg-amber-50 cursor-not-allowed opacity-70'
                               : amcSelection.selectedProduct?._id === p._id
                                 ? 'border-blue-500 bg-blue-50'
                                 : 'border-slate-100 hover:border-slate-300'
                           }`}
                         >
                           <div>
                             <p className="font-black text-sm text-slate-800">{p.name}</p>
                             <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                               Ordered: {new Date(p.purchaseDate).toLocaleDateString('en-IN')}
                               {p.deliveredAt && ` · Delivered: ${new Date(p.deliveredAt).toLocaleDateString('en-IN')}`}
                             </p>
                             {p.address && <p className="text-[10px] text-slate-400 font-bold">{p.address.city}, {p.address.state}</p>}
                             {p.hasActiveAmc
                               ? <p className="text-[10px] text-amber-600 font-bold mt-0.5">⚠️ Active AMC already exists — cannot request again</p>
                               : null
                             }
                           </div>
                           {!p.hasActiveAmc && amcSelection.selectedProduct?._id === p._id && <Check size={16} className="text-blue-500 shrink-0" strokeWidth={3} />}
                         </button>
                       ))}
                       <button type="button"
                         onClick={() => setAmcSelection(prev => ({ ...prev, selectedProduct: prev.selectedProduct === 'other' ? null : 'other' }))}
                         className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all ${
                           amcSelection.selectedProduct === 'other' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-300'
                         }`}
                       >
                         <p className="font-black text-sm text-slate-600">Other / Not in list</p>
                         {amcSelection.selectedProduct === 'other' && <Check size={16} className="text-blue-500 shrink-0" strokeWidth={3} />}
                       </button>
                     </div>
                   ) : (
                     <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-500 font-medium">
                       No purchased products found. We'll cover any product you have.
                     </div>
                   )}
                 </div>

                 {/* Step 2: Select Plan Duration */}
                 {detailPlan.productConfigs?.length > 0 && (
                   <div>
                     <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3">Step 2 — Select Duration</h3>
                     <div className="space-y-3">
                       {detailPlan.productConfigs.map((c, i) => {
                         const disc = c.discount || 0;
                         const afterDisc = (r) => disc > 0 ? Math.round(r - r * disc / 100) : r;
                         const productKey = c.productId?._id || String(i);
                         const selectedDur = amcSelection[productKey];
                         return (
                           <div key={i} className={`border-2 rounded-2xl overflow-hidden transition-all ${selectedDur ? 'border-blue-500' : 'border-slate-100'}`}>
                             <div className="bg-slate-50 px-4 py-3 flex justify-between items-center">
                               <p className="font-black text-sm text-slate-800">{c.productId?.name || 'Plan'}</p>
                               <div className="flex items-center gap-2">
                                 {disc > 0 && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-black rounded-full">{disc}% OFF</span>}
                                 <span className="text-[10px] font-bold text-slate-400">{c.serviceSchedule?.type || 'Half Yearly'}</span>
                               </div>
                             </div>
                             <div className="p-4 grid grid-cols-3 gap-3">
                               {[
                                 { label: '1 Year', rate: c.rateOneYear, key: '1Y' },
                                 { label: '2 Years', rate: c.rateTwoYear, key: '2Y' },
                                 { label: '3 Years', rate: c.rateThreeYear, key: '3Y' },
                               ].filter(d => d.rate > 0).map(d => (
                                 <button key={d.key} type="button"
                                   onClick={() => setAmcSelection(prev => ({
                                     ...prev,
                                     [productKey]: selectedDur?.key === d.key ? null : { ...d, productName: c.productId?.name || 'Plan', productId: productKey, disc, finalRate: afterDisc(d.rate) }
                                   }))}
                                   className={`rounded-xl p-3 border-2 text-center transition-all ${selectedDur?.key === d.key ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-300'}`}
                                 >
                                   <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{d.label}</p>
                                   <p className="font-black text-slate-900">₹{afterDisc(d.rate)}</p>
                                   {disc > 0 && <p className="text-[10px] line-through text-slate-300">₹{d.rate}</p>}
                                 </button>
                               ))}
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 )}

                 {detailPlan.features?.length > 0 && (
                   <div>
                     <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3">What's Included</h3>
                     <ul className="space-y-2">
                       {detailPlan.features.map((f, i) => (
                         <li key={i} className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                           <Check size={14} className="text-green-500 shrink-0" strokeWidth={3} />{f}
                         </li>
                       ))}
                     </ul>
                   </div>
                 )}

                 {/* Summary */}
                 {(amcSelection.selectedProduct || Object.values(amcSelection).some(v => v && v.key)) && (
                   <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 space-y-1">
                     <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Your Selection</p>
                     {amcSelection.selectedProduct && amcSelection.selectedProduct !== 'other' && (
                       <div className="flex justify-between text-sm font-bold text-slate-700">
                         <span>Product</span><span>{amcSelection.selectedProduct.name}</span>
                       </div>
                     )}
                     {amcSelection.selectedProduct === 'other' && (
                       <div className="flex justify-between text-sm font-bold text-slate-700">
                         <span>Product</span><span>Other</span>
                       </div>
                     )}
                     {Object.values(amcSelection).filter(v => v && v.key).map((s, i) => (
                       <div key={i} className="flex justify-between text-sm font-bold text-slate-700">
                         <span>{s.label} Plan</span><span className="text-blue-600">₹{s.finalRate}</span>
                       </div>
                     ))}
                   </div>
                 )}

                 <button
                   disabled={processingId !== null}
                   onClick={async () => {
                     const durSelections = Object.values(amcSelection).filter(v => v && v.key);
                     const selectedProduct = amcSelection.selectedProduct;

                     // Block if no product selected
                     if (!selectedProduct) {
                       toast.warning('Please select the product you want AMC for.');
                       return;
                     }

                     // Block if selected product already has active AMC
                     if (selectedProduct && selectedProduct !== 'other' && selectedProduct.hasActiveAmc) {
                       toast.error(`${selectedProduct.name} already has an active AMC.`);
                       return;
                     }

                     const productName = selectedProduct && selectedProduct !== 'other'
                       ? selectedProduct.name
                       : durSelections[0]?.productName || '';
                     const summary = durSelections.length > 0
                       ? durSelections.map(s => `${s.label}: ₹${s.finalRate}`).join(', ')
                       : detailPlan.name;
                     setDetailPlan(null);
                     setProcessingId(detailPlan._id);
                     try {
                       await api.post("/amc-enquiries", {
                         amcPlanId: detailPlan._id,
                         amcPlanName: detailPlan.name,
                         productId: selectedProduct && selectedProduct !== 'other' ? selectedProduct._id : null,
                         productName,
                         duration: durSelections[0]?.label || '',
                         price: durSelections[0]?.finalRate || detailPlan.price || 0,
                         notes: `Plan: ${detailPlan.name}. Product: ${productName || 'Not specified'}. Duration: ${summary}${
                           selectedProduct && selectedProduct !== 'other' && selectedProduct.purchaseDate
                             ? `\nOrdered: ${new Date(selectedProduct.purchaseDate).toLocaleDateString('en-IN')}${
                                 selectedProduct.deliveredAt ? '\nDelivered: ' + new Date(selectedProduct.deliveredAt).toLocaleDateString('en-IN') : ''
                               }${
                                 selectedProduct.address ? `\nAddress: ${selectedProduct.address.addressLine1 || ''}, ${selectedProduct.address.city}, ${selectedProduct.address.state} - ${selectedProduct.address.pincode}` : ''
                               }` : ''
                         }`,
                         source: 'user_panel',
                       });
                       toast.success('Request Received! Our team will contact you within 24 hours.');
                     } catch {
                       toast.error('Could not submit. Try again.');
                     } finally { setProcessingId(null); }
                   }}
                   className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                 >
                   {processingId ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" /> : <>Submit AMC Request <ArrowRight size={16} /></>}
                 </button>
               </div>
             </div>
           </div>
         )}
      </div>
   );
};

export default AMCPlans;
