
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import UserLayout from "./layouts/UserLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MyOrders from "./pages/MyOrders";
import OrderDetails from "./pages/OrderDetails";
import RentedRO from "./pages/RentedRO";
import AMCPlans from "./pages/AMCPlans";
import MyAMCs from "./pages/MyAMCs";
import ServiceSupport from "./pages/ServiceSupport";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-slate-400">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return children;
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* <Route path="/register" element={<Register />} /> */}
          
          <Route path="/" element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="my-orders" element={<MyOrders />} />
            <Route path="orders/:orderId" element={<OrderDetails />} />
            <Route path="rented-ro" element={<RentedRO />} />
            <Route path="amc-plans" element={<AMCPlans />} />
            <Route path="my-amcs" element={<MyAMCs />} />
            <Route path="service-support" element={<ServiceSupport />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
