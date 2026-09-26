import React, { useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, X, ShieldCheck, User, Phone, Mail, FileText, Globe, Key, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ReceiptModal({ data, onClose, isDarkMode }) {
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {
      console.log('Confetti error', e);
    }
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!data) return null;

  const qrValue = `GRE-REG|ID:${data.id}|NAME:${data.firstName}_${data.lastName}|JSHSHIR:${data.jshshir}|PASS:${data.passportNumber}|LANG:${data.examLanguage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className={`relative w-full max-w-md sm:max-w-lg rounded-2xl p-4 sm:p-5 border transition-all my-auto max-h-[92vh] overflow-y-auto space-y-4 ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
      }`}>
        
        {/* Modal Controls */}
        <div className="flex items-center justify-between border-b pb-2.5 border-slate-200 dark:border-slate-800 no-print">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Registratsiya Muvaffaqiyatli Yakunlandi!</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ticket Details */}
        <div id="printable-receipt" className="space-y-3">
          {/* Header Banner */}
          <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-xl border ${
            isDarkMode 
              ? 'bg-slate-800/50 border-slate-700' 
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-base shrink-0">
                GRE
              </div>
              <div>
                <h2 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                  GRE EXAM REGISTRATION TICKET
                </h2>
                <p className="text-[10px] text-slate-500 font-medium">
                  Xalqaro Imtihon Qabul Varaqasi
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l pt-1.5 sm:pt-0 sm:pl-3 border-slate-200 dark:border-slate-800 w-full sm:w-auto flex sm:block justify-between items-center">
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">ARIZA ID</div>
              <div className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{data.id}</div>
              <div className="text-[9px] text-slate-400">{data.submittedAt}</div>
            </div>
          </div>

          {/* Candidate Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* Candidate Name */}
            <div className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50/80 border-slate-200'}`}>
              <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mb-0.5">
                <User className="w-3 h-3 text-blue-600" /> F.I.SH
              </div>
              <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                {data.lastName} {data.firstName}
              </div>
            </div>

            {/* Exam Language */}
            <div className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50/80 border-slate-200'}`}>
              <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mb-0.5">
                <Globe className="w-3 h-3 text-blue-600" /> Imtihon Tili
              </div>
              <div className="font-bold text-xs text-blue-600 dark:text-blue-400">
                {data.examLanguage}
              </div>
            </div>

            {/* Passport Number */}
            <div className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50/80 border-slate-200'}`}>
              <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mb-0.5">
                <FileText className="w-3 h-3 text-blue-600" /> Pasport Seriya va Raqam
              </div>
              <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                {data.passportNumber}
              </div>
            </div>

            {/* JSHSHIR */}
            <div className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50/80 border-slate-200'}`}>
              <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mb-0.5">
                <Key className="w-3 h-3 text-blue-600" /> JSHSHIR (PINFL)
              </div>
              <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                {data.jshshir}
              </div>
            </div>

            {/* Birth Date */}
            <div className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50/80 border-slate-200'}`}>
              <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mb-0.5">
                <Calendar className="w-3 h-3 text-blue-600" /> Tug'ilgan Sanasi
              </div>
              <div className="font-semibold text-xs text-slate-900 dark:text-white">
                {data.birthDate}
              </div>
            </div>

            {/* Phone */}
            <div className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50/80 border-slate-200'}`}>
              <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mb-0.5">
                <Phone className="w-3 h-3 text-blue-600" /> Telefon Raqam
              </div>
              <div className="font-mono font-semibold text-xs text-slate-900 dark:text-white">
                {data.phone}
              </div>
            </div>

            {/* Email */}
            <div className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50/80 border-slate-200'} sm:col-span-2`}>
              <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mb-0.5">
                <Mail className="w-3 h-3 text-blue-600" /> Email
              </div>
              <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                {data.email}
              </div>
            </div>
          </div>

          {/* QR Code Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="p-1 bg-white rounded-lg border border-slate-200 shrink-0">
                <QRCodeSVG value={qrValue} size={60} level="M" />
              </div>
              <div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> TASDIQLANGAN
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 max-w-[200px]">
                  Imtihon kunida ushbu varaqani hamda pasportingizni olib keling.
                </p>
              </div>
            </div>

            <div className="text-center sm:text-right">
              <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-bold rounded inline-block">
                STATUS: QABUL QILINDI
              </span>
              <p className="text-[9px] text-slate-400 mt-0.5">GRE System v2026</p>
            </div>
          </div>
        </div>

        {/* Action Button - Single Prominent Close / Home Button */}
        <div className="pt-2 no-print">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <span>Yopish (Asosiy oynaga qaytish)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
