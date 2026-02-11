
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
  Receipt
} from "lucide-react";
import { format } from "date-fns";

const OrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

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

          {/* Timeline / Tracking (Simple Placeholder for now) */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Truck size={18} className="text-slate-400" /> Order Timeline
            </h3>
            <div className="relative pl-4 border-l-2 border-slate-100 space-y-8">
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white shadow-sm"></div>
                <p className="text-sm font-bold text-slate-900">Order Placed</p>
                <p className="text-xs text-slate-500 mt-1">{format(new Date(order.createdAt), "MMM dd, yyyy 'at' hh:mm a")}</p>
              </div>
              {/* You can map more statuses here dynamically based on backend data if available */}
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

        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
