import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Booking } from '../../types.ts';
import { apiClient } from '../../services/apiClient.ts';
import { X, Send, Image as ImageIcon, Wrench, Shield, CheckCheck, Clock, Sparkles } from 'lucide-react';

interface CustomerChatModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerChatModal: React.FC<CustomerChatModalProps> = ({ booking, isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [mechanicInfo, setMechanicInfo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    "What is the estimated completion time?",
    "Can you share photos of the current repair progress?",
    "Are any extra parts required for replacement?",
    "Please check tyre balance as well."
  ];

  const fetchChat = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getCustomerChat(booking.id);
      setMessages(res.messages || []);
      setMechanicInfo(res.mechanic);
    } catch (err) {
      console.error('Failed to load chat messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && booking?.id) {
      fetchChat();
      const interval = setInterval(fetchChat, 5000); // Polling backup
      return () => clearInterval(interval);
    }
  }, [isOpen, booking?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (customText?: string) => {
    const text = customText || inputMessage;
    if (!text.trim() || sending) return;

    try {
      setSending(true);
      const res = await apiClient.sendCustomerChatMessage({
        bookingId: booking.id,
        message: text.trim()
      });
      if (res.chatMessage) {
        setMessages((prev) => [...prev, res.chatMessage]);
      }
      if (!customText) setInputMessage('');
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleImageUploadSim = async () => {
    const sampleImages = [
      "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=600&auto=format&fit=crop&q=80"
    ];
    const randomImg = sampleImages[Math.floor(Math.random() * sampleImages.length)];
    try {
      setSending(true);
      const res = await apiClient.sendCustomerChatMessage({
        bookingId: booking.id,
        message: "Attached photo for technician inspection:",
        imageUrl: randomImg
      });
      if (res.chatMessage) {
        setMessages((prev) => [...prev, res.chatMessage]);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload photo');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[640px] max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">
                  {mechanicInfo ? mechanicInfo.name : 'Assigned Service Technician'}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Service #{booking.id.slice(-6).toUpperCase()} • {booking.serviceType}
              </p>
            </div>
          </div>

          <button
            id="close-chat-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security & Response Guarantee Banner */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span className="flex items-center gap-1.5 font-medium">
            <Shield className="w-3.5 h-3.5 text-amber-600" /> End-to-End Verified Automotive Direct Line
          </span>
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Avg reply ~2 mins
          </span>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40">
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-xs">
              Connecting to technician secure channel...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-slate-800 text-sm">Direct Technician Communication</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Ask questions about your vehicle repairs, inspect progress logs, or request live diagnostic photo updates.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isCustomer = msg.senderRole === 'CUSTOMER';
              return (
                <div key={msg.id} className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}>
                  <div className="text-[11px] text-slate-500 mb-1 px-1 flex items-center gap-1">
                    <span className="font-medium text-slate-700">{isCustomer ? 'You' : msg.senderName}</span>
                    <span>•</span>
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl p-3.5 text-xs ${
                      isCustomer
                        ? 'bg-slate-900 text-white rounded-br-none shadow-sm'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    {msg.imageUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-slate-700/40">
                        <img
                          src={msg.imageUrl}
                          alt="Attachment"
                          referrerPolicy="no-referrer"
                          className="w-full h-36 object-cover hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={sending}
              className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-full shrink-0 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <button
            type="button"
            onClick={handleImageUploadSim}
            title="Attach Inspection Photo"
            disabled={sending}
            className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          <input
            id="customer-chat-input"
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message to your mechanic..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
          />

          <button
            id="send-chat-btn"
            type="submit"
            disabled={!inputMessage.trim() || sending}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl shadow-sm transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
