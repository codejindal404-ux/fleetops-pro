import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MessageSquare,
  Send,
  Camera,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  ShieldCheck,
  Zap,
  HelpCircle,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { Booking, ChatMessage, User as UserType } from '../../types.ts';
import { getSocket } from '../../services/socketClient.ts';

interface WorkshopChatModalProps {
  booking: Booking;
  currentUser: UserType | null;
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (data: {
    bookingId: string;
    message: string;
    imageUrl?: string;
    type?: 'TEXT' | 'IMAGE' | 'APPROVAL_REQUEST' | 'SYSTEM';
    actionPayload?: any;
  }) => Promise<void>;
  onUpdateApproval?: (messageId: string, status: 'APPROVED' | 'REJECTED') => Promise<void>;
}

const QUICK_DISPATCH_PROMPTS = [
  'Inspection completed: All primary safety systems nominal.',
  'Found excessive brake wear on front axle. Recommending replacement.',
  'Mechanical repair completed. Performing quality road-test.',
  'Your vehicle is ready for pickup in Service Bay #1!'
];

export const WorkshopChatModal: React.FC<WorkshopChatModalProps> = ({
  booking,
  currentUser,
  isOpen,
  onClose,
  messages,
  onSendMessage,
  onUpdateApproval
}) => {
  const [inputText, setInputText] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalItemName, setApprovalItemName] = useState('Front Ceramic Brake Rotors Replacement');
  const [approvalAmount, setApprovalAmount] = useState<number>(140);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage({
        bookingId: booking.id,
        message: inputText.trim(),
        type: 'TEXT'
      });
      setInputText('');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendApprovalRequest = async () => {
    if (!approvalItemName.trim()) return;
    setIsSending(true);
    try {
      await onSendMessage({
        bookingId: booking.id,
        message: `Authorization Requested: ${approvalItemName.trim()} for estimated $${approvalAmount}`,
        type: 'APPROVAL_REQUEST',
        actionPayload: {
          itemName: approvalItemName.trim(),
          amount: approvalAmount,
          requestedAt: new Date().toISOString()
        }
      });
      setShowApprovalModal(false);
      setApprovalItemName('');
    } finally {
      setIsSending(false);
    }
  };

  const isMechanic = currentUser?.role === 'MECHANIC' || currentUser?.role === 'ADMIN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Bay Communication
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {booking.customerName || 'Customer'} • {booking.vehicle?.brand} {booking.vehicle?.model}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white font-['Oswald'] uppercase mt-0.5">
                Direct Customer Messaging & Authorizations
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Dispatch Presets */}
        <div className="bg-slate-950/80 border-b border-slate-800/80 p-2.5 px-4 flex items-center gap-2 overflow-x-auto flex-shrink-0">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold whitespace-nowrap flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            Quick Dispatch:
          </span>
          {QUICK_DISPATCH_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setInputText(prompt)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 hover:bg-amber-500/10 hover:border-amber-500/50 text-[11px] font-mono text-slate-300 whitespace-nowrap transition"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Message Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-slate-950/40">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-2">
              <MessageSquare className="w-12 h-12 text-slate-700 mx-auto" />
              <div className="text-sm font-semibold text-slate-300">No Chat Messages Yet</div>
              <p className="text-xs text-slate-500 max-w-sm">
                Initiate a message with the vehicle owner to provide repair updates or request part approval.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUser?.id;
              const isApproval = msg.type === 'APPROVAL_REQUEST';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 px-1">
                    <span className="font-bold text-slate-300">
                      {msg.senderName} ({msg.senderRole})
                    </span>
                    <span>•</span>
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-lg p-3.5 rounded-2xl text-xs space-y-2 shadow-md ${
                      isApproval
                        ? 'bg-amber-950/60 border border-amber-500/40 text-amber-200'
                        : isMe
                        ? 'bg-amber-600 text-white rounded-br-none'
                        : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                    }`}
                  >
                    {isApproval && (
                      <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold text-[11px] uppercase">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Customer Authorization Required
                      </div>
                    )}

                    <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>

                    {/* Image if any */}
                    {msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt="Attachment"
                        referrerPolicy="no-referrer"
                        className="rounded-xl border border-slate-700 max-h-48 object-cover w-full mt-1"
                      />
                    )}

                    {/* Approval Action Buttons if Approval Request */}
                    {isApproval && (
                      <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between gap-3">
                        <span className="text-[11px] font-mono">
                          Status:{' '}
                          <span
                            className={`font-bold ${
                              msg.approvalStatus === 'APPROVED'
                                ? 'text-emerald-400'
                                : msg.approvalStatus === 'REJECTED'
                                ? 'text-rose-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {msg.approvalStatus || 'PENDING'}
                          </span>
                        </span>

                        {!isMechanic && msg.approvalStatus === 'PENDING' && onUpdateApproval && (
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => onUpdateApproval(msg.id, 'APPROVED')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-mono font-bold flex items-center gap-1"
                            >
                              <ThumbsUp className="w-3 h-3" /> Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateApproval(msg.id, 'REJECTED')}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-mono font-bold flex items-center gap-1"
                            >
                              <ThumbsDown className="w-3 h-3" /> Decline
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Authorization Request Modal Overlay if Open */}
        {showApprovalModal && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3 animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-amber-400 font-bold uppercase flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                Draft Customer Authorization Request
              </span>
              <button
                type="button"
                onClick={() => setShowApprovalModal(false)}
                className="text-xs text-slate-400 hover:text-white font-mono"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                  Item / Service Required
                </label>
                <input
                  type="text"
                  value={approvalItemName}
                  onChange={(e) => setApprovalItemName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                  Estimated Added Cost ($)
                </label>
                <input
                  type="number"
                  value={approvalAmount}
                  onChange={(e) => setApprovalAmount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSendApprovalRequest}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold uppercase flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                Send Authorization Request
              </button>
            </div>
          </div>
        )}

        {/* Input Footer Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col gap-2 flex-shrink-0">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            {isMechanic && (
              <button
                type="button"
                onClick={() => setShowApprovalModal((prev) => !prev)}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 text-xs font-mono font-bold flex items-center gap-1.5 transition whitespace-nowrap"
              >
                <AlertCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Request Authorization</span>
              </button>
            )}

            <input
              type="text"
              placeholder="Type diagnostic update or message to vehicle owner..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
            />

            <button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-mono font-bold uppercase transition flex items-center gap-2 shadow-lg shadow-amber-950/50"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
