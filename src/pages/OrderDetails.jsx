
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ArrowLeft,
  MapPin,
  CreditCard,
  Receipt,
  X,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";

const OrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundForm, setRefundForm] = useState({
    type: "Cancellation",
    reason: ""
  });

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const { data } = await api.get(`/user-orders/${orderId}`);
        setOrder(data.order);
      } catch (error) {
        console.error("Failed to fetch order details", error);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const getStatusConfig = (status) => {
    const s = status?.toLowerCase() || 'pending';
    if (s === 'delivered') return { color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: <CheckCircle size={16} />, label: "Delivered" };
    if (s === 'shipped') return { color: "bg-blue-50 text-blue-600 border-blue-100", icon: <Truck size={16} />, label: "Shipped" };
    if (s === 'confirmed') return { color: "bg-indigo-50 text-indigo-600 border-indigo-100", icon: <Package size={16} />, label: "Confirmed" };
    if (s === 'cancelled') return { color: "bg-red-50 text-red-600 border-red-100", icon: <AlertCircle size={16} />, label: "Cancelled" };
    return { color: "bg-amber-50 text-amber-600 border-amber-100", icon: <Clock size={16} />, label: "Processing" };
  };

  const handleRefundRequest = async () => {
    if (!refundForm.reason.trim()) {
      alert("Please provide a reason for refund");
      return;
    }
    try {
      await api.post("/refunds", {
        orderId: order._id,
        userId: order.userId,
        type: refundForm.type,
        reason: refundForm.reason,
        amount: order.total
      });
      alert("Refund request submitted successfully!");
      setShowRefundModal(false);
      setRefundForm({ type: "Cancellation", reason: "" });
    } catch (error) {
      alert(error.response?.data?.message || "Failed to submit refund request");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <h3 className="text-lg font-bold text-slate-900">Order not found</h3>
        <Link to="/my-orders" className="text-indigo-600 font-bold hover:underline mt-2 inline-block">
          Back to My Orders
        </Link>
      </div>
    );
  }

  const statusParams = getStatusConfig(order.status);

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          to="/my-orders" 
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Order Details</h1>
          <p className="text-slate-500 text-sm font-medium">#{order._id}</p>
        </div>
        <div className={`ml-auto px-4 py-2 rounded-xl font-bold text-sm border flex items-center gap-2 ${statusParams.color}`}>
          {statusParams.icon} {statusParams.label}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Items List */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
               <h3 className="font-bold text-slate-900 flex items-center gap-2">
                 <Package size={18} className="text-slate-400" /> Order Items
               </h3>
               <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{order.items.length} Items</span>
            </div>
            <div className="divide-y divide-slate-50">
              {order.items.map((item, index) => (
                <div key={index} className="p-6 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="w-20 h-20 bg-slate-100 rounded-xl border-2 border-white shadow-sm flex-shrink-0 overflow-hidden">
                    {item.product?.mainImage?.url ? (
                      <img src={item.product.mainImage.url} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xl">
                        {item.productName?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 text-lg">{item.productName}</h4>
                    {item.variant && <p className="text-sm text-slate-500">{item.variant}</p>}
                    <div className="mt-2 flex items-center justify-between">
                       <p className="text-sm font-medium text-slate-500">Qty: {item.quantity}</p>
                       <p className="font-black text-slate-900">₹{item.productPrice?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Order Timeline */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-8">
            <h3 className="font-bold text-slate-900 mb-8 flex items-center gap-2">
              <Truck size={18} className="text-slate-400" /> Order Tracking
            </h3>
            
            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100"></div>

              <div className="space-y-10 relative">
                {/* Placed */}
                <div className="flex gap-6 relative">
                  <div className="z-10 w-6 h-6 rounded-full bg-indigo-600 border-4 border-white shadow-md flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Order Placed</h4>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      {format(new Date(order.createdAt), "MMM dd, yyyy 'at' hh:mm a")}
                    </p>
                  </div>
                </div>

                {/* Confirmed */}
                {(order.confirmedAt || ['confirmed', 'shipped', 'delivered'].includes(order.status?.toLowerCase())) && (
                  <div className="flex gap-6 relative animate-in slide-in-from-left-2">
                    <div className="z-10 w-6 h-6 rounded-full bg-indigo-600 border-4 border-white shadow-md flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Order Confirmed</h4>
                      <p className="text-xs text-slate-400 font-medium mt-1">
                        {order.confirmedAt 
                          ? format(new Date(order.confirmedAt), "MMM dd, yyyy 'at' hh:mm a")
                          : "Your order has been confirmed and is being processed."
                        }
                      </p>
                    </div>
                  </div>
                )}

                {/* Shipped */}
                {(order.shippedAt || ['shipped', 'delivered'].includes(order.status?.toLowerCase())) && (
                  <div className="flex gap-6 relative animate-in slide-in-from-left-2">
                    <div className="z-10 w-6 h-6 rounded-full bg-indigo-600 border-4 border-white shadow-md flex items-center justify-center">
                       <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Shipped</h4>
                      <p className="text-xs text-slate-400 font-medium mt-1">
                        {order.shippedAt 
                          ? format(new Date(order.shippedAt), "MMM dd, yyyy 'at' hh:mm a")
                          : "Your package is on its way."
                        }
                      </p>
                    </div>
                  </div>
                )}

                {/* Delivered */}
                {(order.deliveredAt || order.status?.toLowerCase() === 'delivered') && (
                  <div className="flex gap-6 relative animate-in slide-in-from-left-2">
                    <div className="z-10 w-6 h-6 rounded-full bg-emerald-500 border-4 border-white shadow-md flex items-center justify-center">
                       <CheckCircle size={10} className="text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-emerald-600 uppercase tracking-tight">Delivered</h4>
                      <p className="text-xs text-slate-400 font-medium mt-1">
                        {order.deliveredAt 
                          ? format(new Date(order.deliveredAt), "MMM dd, yyyy 'at' hh:mm a")
                          : "Successfully delivered to your address."
                        }
                      </p>
                    </div>
                  </div>
                )}

                {/* Cancelled */}
                {(order.cancelledAt || order.status?.toLowerCase() === 'cancelled') && (
                  <div className="flex gap-6 relative animate-in slide-in-from-left-2">
                    <div className="z-10 w-6 h-6 rounded-full bg-red-500 border-4 border-white shadow-md flex items-center justify-center">
                       <X size={10} className="text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-red-600 uppercase tracking-tight">Cancelled</h4>
                      <p className="text-xs text-slate-400 font-medium mt-1">
                        {order.cancelledAt 
                          ? format(new Date(order.cancelledAt), "MMM dd, yyyy 'at' hh:mm a")
                          : "This order was cancelled."
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
           
           {/* Summary */}
           <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                 <Receipt size={18} className="text-slate-400" /> Order Summary
              </h3>
              <div className="space-y-3 text-sm">
                 <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-medium">₹{order.subtotal?.toLocaleString()}</span>
                 </div>
                 {order.discount > 0 && (
                   <div className="flex justify-between text-emerald-600">
                      <span>Discount</span>
                      <span className="font-bold">-₹{order.discount?.toLocaleString()}</span>
                   </div>
                 )}
                 <div className="flex justify-between text-slate-500">
                    <span>Shipping</span>
                    <span className="font-medium text-emerald-600">Free</span>
                 </div>
                 <div className="border-t border-slate-100 pt-3 flex justify-between items-center mt-2">
                    <span className="font-bold text-slate-900">Total</span>
                    <span className="font-black text-xl text-indigo-600">₹{order.total?.toLocaleString()}</span>
                 </div>
              </div>
           </div>

           {/* Shipping Address */}
           <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                 <MapPin size={18} className="text-slate-400" /> Shipping Address
              </h3>
              <div className="text-sm text-slate-500 leading-relaxed">
                 <p className="font-bold text-slate-900 mb-1">{order.shippingAddress?.name}</p>
                 <p>{order.shippingAddress?.street}</p>
                 <p>{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                 <p>{order.shippingAddress?.postalCode}</p>
                 <p className="mt-2 text-slate-400">{order.shippingAddress?.phone}</p>
              </div>
           </div>

           {/* Payment Info */}
           <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                 <CreditCard size={18} className="text-slate-400" /> Payment Info
              </h3>
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                    <CreditCard size={20} />
                 </div>
                 <div>
                    <p className="text-sm font-bold text-slate-900 uppercase">{order.paymentMethod}</p>
                    <p className="text-xs text-slate-500">{order.paymentStatus || 'Pending'}</p>
                 </div>
              </div>
           </div>

           {/* Actions */}
           {order.status === 'pending' && (
             <button 
               onClick={async () => {
                 if (window.confirm("Are you sure you want to cancel this order?")) {
                   try {
                     await api.put(`/user-orders/${order._id}/cancel`);
                     const { data } = await api.get(`/user-orders/${orderId}`);
                     setOrder(data.order);
                     alert("Order cancelled successfully");
                   } catch (error) {
                     alert(error.response?.data?.message || "Failed to cancel order");
                   }
                 }
               }}
               className="w-full py-4 bg-red-50 text-red-600 rounded-3xl font-bold text-sm hover:bg-red-100 transition-all border border-red-100 flex items-center justify-center gap-2"
             >
               <X size={18} /> Cancel Order
             </button>
           )}

           {/* Refund Request Button */}
           {['delivered', 'shipped'].includes(order.status?.toLowerCase()) && (
             <button 
               onClick={() => setShowRefundModal(true)}
               className="w-full py-4 bg-purple-50 text-purple-600 rounded-3xl font-bold text-sm hover:bg-purple-100 transition-all border border-purple-100 flex items-center justify-center gap-2"
             >
               <RefreshCw size={18} /> Request Refund
             </button>
           )}

        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-slate-900">Request Refund</h3>
              <button onClick={() => setShowRefundModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Request Type</label>
                <select 
                  value={refundForm.type}
                  onChange={(e) => setRefundForm({...refundForm, type: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="Cancellation">Cancellation</option>
                  <option value="Return">Return</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Reason</label>
                <textarea 
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm({...refundForm, reason: e.target.value})}
                  placeholder="Please explain why you want a refund..."
                  rows="4"
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                />
              </div>
              
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <p className="text-sm font-bold text-purple-900">Refund Amount</p>
                <p className="text-2xl font-black text-purple-600">₹{order.total?.toLocaleString()}</p>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowRefundModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRefundRequest}
                  className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
