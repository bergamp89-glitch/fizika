import React, { useEffect } from 'react';
import { AlertTriangle, PhoneCall } from 'lucide-react';

export default function DuplicateModal({ candidate, onClose, isDarkMode, appSettings }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!candidate) return null;

  const phone = appSettings?.supportPhone || "+998 (99) 627-99-99";
  const telHref = "tel:" + phone.replace(/[^\d+]/g, '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className={`relative w-full max-w-lg rounded-3xl p-5 sm:p-8 border shadow-2xl transition-all my-auto max-h-[92vh] overflow-y-auto text-center space-y-5 ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Warning Icon */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-200 dark:border-amber-500/20 shadow-xs">
          <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            Siz Ro'yxatda Allaqachon Mavjudsiz!
          </h3>
          <p className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
            Qayta ro'yxatdan o'tishga ruxsat berilmaydi
          </p>
        </div>

        {/* Description box */}
        <div className={`p-4 rounded-2xl border text-xs text-left space-y-2 font-medium ${
          isDarkMode ? 'bg-slate-800/60 border-slate-700/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <p>
            Kiritilgan <span className="font-bold text-blue-600 dark:text-blue-400">JSHSHIR</span> yoki <span className="font-bold text-blue-600 dark:text-blue-400">Pasport seriyasi</span> bo'yicha tizimda allaqachon qabul qilingan ariza mavjud:
          </p>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
            <div>
              <span className="text-slate-400 block font-sans">Pasport:</span>
              <span className="font-bold text-slate-900 dark:text-white">{candidate.passportNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-sans">JSHSHIR:</span>
              <span className="font-bold text-slate-900 dark:text-white">{candidate.jshshir}</span>
            </div>
          </div>
          <p className="pt-1 text-[11px] text-slate-500 dark:text-slate-400">
            * Admin tomonidan arizangiz o'chirilmagunicha, qayta ariza topshira olmaysiz.
          </p>
        </div>

        {/* Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={telHref}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Qo'llab-quvvatlash ({phone})</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs border transition-colors ${
              isDarkMode 
                ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                : 'border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Tushundim (Yopish)
          </button>
        </div>

      </div>
    </div>
  );
}
