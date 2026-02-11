import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ArrowRight, User, Lock, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

const Login = () => {
  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleTokenLogin = async (token) => {
      setLoading(true);
      try {
        await loginWithToken(token);
        navigate("/dashboard");
      } catch (error) {
         console.error("Token login failed", error);
      } finally {
        setLoading(false);
      }
    };

    const token = searchParams.get("token");
    if (token) {
      handleTokenLogin(token);
    }
  }, [searchParams, loginWithToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate("/dashboard");
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: typeof error === 'string' ? error : 'Invalid credentials',
        confirmButtonColor: '#2563eb'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
       <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden md:p-12 p-8 animate-fade-in space-y-8">
           <div className="text-center space-y-2">
              <h1 className="text-4xl font-black text-blue-600 tracking-tighter">UNIXA</h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">User Portal</p>
           </div>
           
           <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                 <div className="relative group">
                    <User className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input 
                       type="email" 
                       required 
                       placeholder="Email Address"
                       className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-700 transition-all placeholder:text-slate-400"
                       value={formData.email}
                       onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                 </div>
                 <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input 
                       type="password" 
                       required 
                       placeholder="Password"
                       className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-700 transition-all placeholder:text-slate-400"
                       value={formData.password}
                       onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                 </div>
              </div>

              <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-0.5 transition-all disabled:opacity-70 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
              >
                 {loading ? <Loader2 className="animate-spin" /> : <>Sign In <ArrowRight size={16} /></>}
              </button>
           </form>

           
       </div>
    </div>
  );
};

export default Login;
