import React from 'react';
import { Moon, Sun, PhoneCall, CheckCircle2, LogOut } from 'lucide-react';

export default function Header({ isDarkMode, setIsDarkMode, activeTab, setActiveTab, appSettings }) {
  const examTitle = appSettings?.examTitle || "GRE Imtihoni";
  const phone = appSettings?.supportPhone || "+998 (99) 627-99-99";
  const telHref = "tel:" + phone.replace(/[^\d+]/g, '');

  return (
    <header className={`sticky top-0 z-40 border-b transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-slate-900/95 border-slate-800 text-white backdrop-blur-sm' 
        : 'bg-white/95 border-slate-200 text-slate-900 backdrop-blur-sm shadow-xs'
    }`}>
      <div className="max-w-5xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2">
        {/* Logo & Brand */}
        <div 
          className="flex items-center space-x-2 sm:space-x-3 cursor-pointer select-none min-w-0" 
          onClick={() => {
            setActiveTab('form');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-base sm:text-xl tracking-tight shrink-0 shadow-xs">
            GRE
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
              <h1 className="font-bold text-sm sm:text-lg tracking-tight text-slate-900 dark:text-white truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">
                {examTitle}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/20 shrink-0">
                <CheckCircle2 className="w-3 h-3" /> Rasmiy
              </span>
            </div>
            <p className={`text-[11px] sm:text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} font-medium truncate`}>
              Onlayn ro'yxatdan o'tish tizimi
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          {/* Desktop Phone */}
          <a
            href={telHref}
            className={`hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              isDarkMode 
                ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800' 
                : 'bg-slate-100/80 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{phone}</span>
          </a>

          {/* Mobile Phone Icon Button */}
          <a
            href={telHref}
            className={`flex md:hidden p-2 rounded-xl border transition-colors ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700 text-blue-400 hover:bg-slate-700' 
                : 'bg-slate-100 border-slate-200 text-blue-600 hover:bg-slate-200'
            }`}
            title={`Qo'ng'iroq qilish: ${phone}`}
          >
            <PhoneCall className="w-4 h-4" />
          </a>

          {/* Admin Logout Button */}
          {activeTab === 'admin' && (
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-xs cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Chiqish</span>
            </button>
          )}

          {/* Dark/Light Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title={isDarkMode ? "Yorug' rejim" : "Tungi rejim"}
          >
            {isDarkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}


