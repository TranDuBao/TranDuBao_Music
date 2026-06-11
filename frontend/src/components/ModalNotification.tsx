import React from 'react';
import { useModalStore } from '../store/useModalStore';

export default function ModalNotification() {
  const { isOpen, title, message, type, onConfirm, onCancel, closeModal } = useModalStore();

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    closeModal();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    closeModal();
  };

  // Color mapping based on modal type
  const typeStyles = {
    info: {
      border: 'border-blue-500/30',
      glow: 'shadow-[0_0_40px_rgba(59,130,246,0.15)]',
      iconBg: 'bg-blue-500/10 text-blue-400',
      btnBg: 'bg-blue-600 hover:bg-blue-500',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    success: {
      border: 'border-emerald-500/30',
      glow: 'shadow-[0_0_40px_rgba(16,185,129,0.15)]',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      btnBg: 'bg-emerald-600 hover:bg-emerald-500',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    warning: {
      border: 'border-amber-500/30',
      glow: 'shadow-[0_0_40px_rgba(245,158,11,0.15)]',
      iconBg: 'bg-amber-500/10 text-amber-400',
      btnBg: 'bg-amber-600 hover:bg-amber-500',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    error: {
      border: 'border-rose-500/30',
      glow: 'shadow-[0_0_40px_rgba(244,63,94,0.15)]',
      iconBg: 'bg-rose-500/10 text-rose-400',
      btnBg: 'bg-rose-600 hover:bg-rose-500',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    confirm: {
      border: 'border-purple-500/30',
      glow: 'shadow-[0_0_40px_rgba(168,85,247,0.15)]',
      iconBg: 'bg-purple-500/10 text-purple-400',
      btnBg: 'bg-purple-600 hover:bg-purple-500',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  };

  const style = typeStyles[type] || typeStyles.info;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className={`w-full max-w-md bg-zinc-950 border ${style.border} ${style.glow} rounded-2xl p-6 relative overflow-hidden transform scale-100 transition-all duration-300 shadow-2xl`}
      >
        {/* Glow backdrop decorative */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${style.iconBg} flex-shrink-0`}>
            {style.icon}
          </div>

          <div className="flex-1 space-y-1">
            <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
            <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          {type === 'confirm' ? (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 text-white font-bold rounded-xl text-xs transition-all ${style.btnBg}`}
              >
                Xác nhận
              </button>
            </>
          ) : (
            <button
              onClick={closeModal}
              className={`px-5 py-2 text-white font-bold rounded-xl text-xs transition-all ${style.btnBg}`}
            >
              Đồng ý
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
