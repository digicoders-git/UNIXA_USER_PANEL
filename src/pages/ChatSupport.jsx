import { useState, useEffect, useRef } from "react";
import { getHistory, simulateIncoming } from "../services/sms";
import { useAuth } from "../context/AuthContext";
import { Send, Clock, ShieldCheck, Headphones } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Swal from "sweetalert2";

export default function ChatSupport() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef(null);

  const userPhone = user?.phone || user?.mobile || "";

  useEffect(() => {
    if (userPhone) fetchHistory();
  }, [userPhone]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getHistory(userPhone);
      setMessages(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !userPhone) return;
    try {
      const resp = await simulateIncoming({ phoneNumber: userPhone, message: newMessage });
      setMessages([...messages, { ...resp, direction: 'inbound' }]);
      setNewMessage("");
    } catch (err) {
      Swal.fire("Error", "Failed to send message", "error");
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-160px)] flex flex-col bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400">
            <Headphones size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Support Chat</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Connect with Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
          Online Support
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-30">
            <ShieldCheck size={64} className="mb-4" />
            <h3 className="text-xl font-bold">Secure Communication</h3>
            <p className="max-w-xs text-sm mt-1">Start a conversation with our support team. We're here to help you 24/7.</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={msg._id || idx} className={`flex ${msg.direction === 'inbound' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[80%]">
              <div className={`p-4 rounded-3xl shadow-sm text-sm transition-all ${msg.direction === 'inbound'
                ? 'bg-blue-600 text-white rounded-tr-none font-medium'
                : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none font-medium shadow-sm'}`}>
                {msg.message}
                <div className={`flex items-center gap-1 mt-2 text-[9px] font-bold opacity-60 ${msg.direction === 'inbound' ? 'justify-end' : 'justify-start'}`}>
                  <Clock size={10} /> {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex items-center gap-3">
        <input type="text" placeholder="Type your query here..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-bold placeholder:text-slate-400" />
        <button type="submit" disabled={!newMessage.trim()}
          className="bg-blue-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
          <Send size={24} />
        </button>
      </form>
    </div>
  );
}
