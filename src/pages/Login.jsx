import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ArrowRight, User, Shield, Loader2, Phone, Mail } from "lucide-react";
import Swal from "sweetalert2";

const Login = () => {
  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1); // 1: Enter mobile/email, 2: Enter OTP
  const [formData, setFormData] = useState({ 
    identifier: '', // mobile or email
    otp: ''
  });
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    const handleTokenLogin = async (token) => {
      setLoading(true);
      try {
        await loginWithToken(token);
        navigate("/dashboard");
      } catch (error) {
         console.error("Token login failed", error);
         // If token login fails, stay on login page
      } finally {
        setLoading(false);
      }
    };

    const token = searchParams.get("token") || localStorage.getItem('userPanelToken');
    if (token) {
      handleTokenLogin(token);
      // Clear the token from localStorage after use
      localStorage.removeItem('userPanelToken');
    }
  }, [searchParams, loginWithToken, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'identifier') {
      setFormData({ ...formData, [name]: value });
    } else if (name === 'otp') {
      const numbersOnly = value.replace(/[^0-9]/g, '').slice(0, 6);
      setFormData({ ...formData, [name]: numbersOnly });
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!formData.identifier.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Required Field',
        text: 'Please enter your mobile number or email',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    const isEmail = /\S+@\S+\.\S+/.test(formData.identifier);
    const isPhone = /^[6-9]\d{9}$/.test(formData.identifier);
    
    if (!isEmail && !isPhone) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Format',
        text: 'Please enter a valid mobile number or email address',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: formData.identifier
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setOtpSent(true);
        setStep(2);
        Swal.fire({
          icon: 'success',
          title: 'OTP Sent!',
          text: 'Please check your phone/email for the OTP',
          confirmButtonColor: '#2563eb'
        });
      } else {
        throw new Error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error("Send OTP Error:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to send OTP. Please try again.',
        confirmButtonColor: '#2563eb'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!formData.otp) {
      Swal.fire({
        icon: 'error',
        title: 'Required Field',
        text: 'Please enter the OTP',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: formData.identifier,
          otp: formData.otp
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Store token and user data with consistent keys
        const tokenData = {
          token: data.token,
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
        };
        localStorage.setItem('userToken', JSON.stringify(tokenData));
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        Swal.fire({
          icon: 'success',
          title: 'Login Successful!',
          text: 'Welcome to UNIXA User Panel',
          confirmButtonColor: '#2563eb'
        }).then(() => {
          // Force page reload to trigger AuthContext
          window.location.href = '/dashboard';
        });
      } else {
        throw new Error(data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error("Verify OTP Error:", error);
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: error.message || 'Invalid OTP. Please try again.',
        confirmButtonColor: '#2563eb'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({ identifier: '', otp: '' });
    setOtpSent(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
       <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden md:p-12 p-8 animate-fade-in space-y-8">
           <div className="text-center space-y-2">
              <h1 className="text-4xl font-black text-blue-600 tracking-tighter">UNIXA</h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">User Portal</p>
              <p className="text-slate-400 text-sm font-medium">
                {step === 1 ? 'Enter your mobile number or email' : 'Enter the OTP sent to your device'}
              </p>
           </div>
           
           {step === 1 ? (
             // Step 1: Enter Mobile/Email
             <form onSubmit={handleSendOTP} className="space-y-6">
                <div className="space-y-4">
                   <div className="relative group">
                      <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        {formData.identifier.includes('@') ? 
                          <Mail size={20} /> : <Phone size={20} />
                        }
                      </div>
                      <input 
                         type="text" 
                         name="identifier"
                         required 
                         placeholder="Mobile Number or Email"
                         className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-700 transition-all placeholder:text-slate-400"
                         value={formData.identifier}
                         onChange={handleChange}
                      />
                   </div>
                </div>

                <button 
                   type="submit" 
                   disabled={loading}
                   className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-0.5 transition-all disabled:opacity-70 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                >
                   {loading ? <Loader2 className="animate-spin" /> : <>Send OTP <ArrowRight size={16} /></>}
                </button>
             </form>
           ) : (
             // Step 2: Enter OTP
             <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="space-y-4">
                   <div className="relative group">
                      <Shield className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                      <input 
                         type="text" 
                         name="otp"
                         required 
                         placeholder="Enter 6-digit OTP"
                         className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-700 transition-all placeholder:text-slate-400 text-center text-lg tracking-widest"
                         value={formData.otp}
                         onChange={handleChange}
                         maxLength="6"
                      />
                   </div>
                   <p className="text-xs text-center text-slate-500">
                     OTP sent to: <span className="font-bold">{formData.identifier}</span>
                   </p>
                </div>

                <div className="space-y-3">
                  <button 
                     type="submit" 
                     disabled={loading}
                     className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-0.5 transition-all disabled:opacity-70 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                  >
                     {loading ? <Loader2 className="animate-spin" /> : <>Login <ArrowRight size={16} /></>}
                  </button>
                  
                  <button
                     type="button"
                     onClick={resetForm}
                     className="w-full text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"
                  >
                     ← Change Mobile/Email
                  </button>
                </div>
             </form>
           )}

           {step === 2 && (
             <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
               <p className="text-xs text-blue-600 text-center font-bold">
                 Demo OTP: 123456
               </p>
             </div>
           )}
       </div>
    </div>
  );
};

export default Login;
