import React, { useState } from 'react';
import { 
  Search, Download, Trash2, Eye, Filter, UserCheck, 
  FileText, Settings, UserPlus, Edit3, Check, X, Printer, 
  CheckCircle2, Clock, XCircle, Save, Phone, Globe, Loader2, RefreshCw, Send, AlertTriangle
} from 'lucide-react';


export default function AdminDashboard({ 
  registrations, 
  onClearRegistrations, 
  onSyncCandidate,
  onDeleteCandidate,
  onUpdateCandidateStatus,
  onEditCandidate,
  onAddCandidate,
  onViewReceipt,
  appSettings,
  onSaveSettings,
  isDarkMode 
}) {
  const [activeTab, setActiveTab] = useState('candidates'); // 'candidates' | 'settings'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Modals state
  const [viewCandidate, setViewCandidate] = useState(null);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({ ...appSettings });
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState(null);

  const handleTestWebhook = async () => {
    const url = (settingsForm.googleSheetsWebhook || '').trim();
    if (!url) {
      setWebhookTestResult({ success: false, message: "⚠️ Webhook URL kiritilmagan!" });
      return;
    }
    setIsTestingWebhook(true);
    setWebhookTestResult(null);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'ping' }),
        redirect: 'follow'
      });

      if (!response.ok) {
        setWebhookTestResult({
          success: false,
          message: `❌ Server xatosi qaytardi: HTTP ${response.status}`
        });
        return;
      }

      const res = await response.json();
      if (res.result === 'success') {
        setWebhookTestResult({
          success: true,
          message: res.message || "✅ Google Sheets Webhook faol va muvaffaqiyatli ulangan!"
        });
      } else {
        setWebhookTestResult({
          success: false,
          message: `⚠️ Script xatosi: ${res.error || res.message || 'Noma\'lum xatolik'}`
        });
      }
    } catch (err) {
      setWebhookTestResult({
        success: false,
        message: `❌ Ulanish xatosi: ${err.message || 'Brauzer so\'rovni yubora olmadi'}. Apps Script 'Who has access: Anyone' qilinganini va URL to'g'riligini tekshiring!`
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  // Add Candidate Form state
  const [newCandidateForm, setNewCandidateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '+998 ',
    birthDate: '',
    passportNumber: '',
    jshshir: '',
    examLanguage: 'English',
    status: 'Qabul qilindi'
  });
  const [addFormErrors, setAddFormErrors] = useState({});

  // Filter candidates logic
  const filteredData = registrations.filter(candidate => {
    const matchesSearch = 
      candidate.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.passportNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.jshshir?.includes(searchTerm) ||
      candidate.phone?.includes(searchTerm) ||
      candidate.id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLang = selectedLanguage === 'all' || candidate.examLanguage === selectedLanguage;
    const matchesStatus = selectedStatus === 'all' || (candidate.status || 'Qabul qilindi') === selectedStatus;

    return matchesSearch && matchesLang && matchesStatus;
  });

  // Calculate statistics
  const totalCount = registrations.length;
  const approvedCount = registrations.filter(r => (r.status || 'Qabul qilindi') === 'Qabul qilindi').length;
  const pendingCount = registrations.filter(r => r.status === 'Kutilmoqda').length;
  const rejectedCount = registrations.filter(r => r.status === 'Rad etildi').length;
  const englishCount = registrations.filter(r => r.examLanguage === 'English' || r.examLanguage === 'Ingliz tili').length;
  const russianCount = registrations.filter(r => r.examLanguage === 'Russian' || r.examLanguage === 'Rus tili').length;

  // CSV export with formula injection protection
  const handleExportCSV = () => {
    if (registrations.length === 0) return;

    // Sanitize CSV cell value to prevent formula injection
    const sanitizeCSV = (val) => {
      if (val == null) return '';
      const str = String(val);
      // Escape values starting with formula-triggering characters
      if (/^[=+\-@\t\r]/.test(str)) {
        return `"'${str.replace(/"/g, '""')}"`;
      }
      // Wrap in quotes if contains comma, quote, or newline
      if (/[",\n\r]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = ['Ariza ID', 'Ism', 'Familiya', 'Email', 'Telefon', 'Tugilgan Sana', 'Pasport', 'JSHSHIR', 'Imtihon Tili', 'Status', 'Sana'];
    const rows = registrations.map(r => [
      r.id,
      r.firstName,
      r.lastName,
      r.email,
      r.phone,
      r.birthDate,
      r.passportNumber,
      r.jshshir,
      r.examLanguage,
      r.status || 'Qabul qilindi',
      r.submittedAt
    ].map(sanitizeCSV));

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GRE_Registratsiyalar_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add Candidate submit
  const handleAddSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!newCandidateForm.firstName.trim()) errs.firstName = "Ism kiritilishi shart";
    if (!newCandidateForm.lastName.trim()) errs.lastName = "Familiya kiritilishi shart";
    if (!newCandidateForm.passportNumber.trim()) errs.passportNumber = "Pasport seriyasi shart";
    if (newCandidateForm.jshshir.length !== 14) errs.jshshir = "JSHSHIR 14 ta raqam bo'lishi kerak";

    if (Object.keys(errs).length > 0) {
      setAddFormErrors(errs);
      return;
    }

    const submissionId = 'GRE-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000);
    const newCand = {
      ...newCandidateForm,
      id: submissionId,
      submittedAt: new Date().toLocaleString('uz-UZ'),
      passportFront: null,
      passportBack: null,
      termsAgreed: true
    };

    onAddCandidate(newCand);
    setShowAddModal(false);
    setNewCandidateForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '+998 ',
      birthDate: '',
      passportNumber: '',
      jshshir: '',
      examLanguage: 'English',
      status: 'Qabul qilindi'
    });
    setAddFormErrors({});
  };

  // Edit Candidate submit
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingCandidate) return;
    onEditCandidate(editingCandidate);
    setEditingCandidate(null);
  };

  // Save Settings submit
  const handleSettingsSubmit = (e) => {
    e.preventDefault();
    onSaveSettings(settingsForm);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-5">
      
      {/* Admin Sub Header Navigation */}
      <div className={`p-2.5 sm:p-3.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 ${
        isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center space-x-1.5 sm:space-x-2 w-full sm:w-auto overflow-x-auto pb-0.5 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('candidates')}
            className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 sm:gap-2 transition-all shrink-0 ${
              activeTab === 'candidates'
                ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/20'
                : isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Nomzodlar ({registrations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 sm:gap-2 transition-all shrink-0 ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/20'
                : isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Portal Sozlamalari</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-stretch sm:justify-end shrink-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto justify-center px-3 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Yangi Nomzod Qo'shish</span>
          </button>
        </div>
      </div>


      {/* TAB 1: CANDIDATES MANAGEMENT */}
      {activeTab === 'candidates' && (
        <div className="space-y-4 sm:space-y-5 animate-fadeIn">
          
          {/* Top Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
            <div className={`p-2.5 sm:p-3 rounded-xl border ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'}`}>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">Jami Arizalar</span>
              <span className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5 block">{totalCount} ta</span>
            </div>

            <div className={`p-2.5 sm:p-3 rounded-xl border ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'}`}>
              <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Qabul Qilingan
              </span>
              <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">{approvedCount} ta</span>
            </div>

            <div className={`p-2.5 sm:p-3 rounded-xl border ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'}`}>
              <span className="text-[9px] sm:text-[10px] font-bold text-amber-600 dark:text-amber-400 block uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" /> Kutilmoqda
              </span>
              <span className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5 block">{pendingCount} ta</span>
            </div>

            <div className={`p-2.5 sm:p-3 rounded-xl border ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'}`}>
              <span className="text-[9px] sm:text-[10px] font-bold text-rose-600 dark:text-rose-400 block uppercase tracking-wider flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Rad Etilgan
              </span>
              <span className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5 block">{rejectedCount} ta</span>
            </div>

            <div className={`p-2.5 sm:p-3 rounded-xl border col-span-2 sm:col-span-1 ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'}`}>
              <span className="text-[9px] sm:text-[10px] font-bold text-purple-600 dark:text-purple-400 block uppercase tracking-wider">
                🇬🇧 {englishCount} / 🇷🇺 {russianCount}
              </span>
              <span className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5 block">Tillar</span>
            </div>
          </div>


          {/* Controls Bar: Search & Actions */}
          <div className={`p-2.5 sm:p-3.5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-3 ${
            isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            {/* Search input */}
            <div className="relative w-full md:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Qidiruv (Ism, Pasport, ID)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs font-semibold outline-none border transition-all clean-input"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center space-x-1">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold outline-none border clean-input cursor-pointer"
                >
                  <option value="all">Barcha Tillar</option>
                  <option value="English">🇬🇧 English</option>
                  <option value="Russian">🇷🇺 Russian</option>
                </select>
              </div>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold outline-none border clean-input cursor-pointer"
              >
                <option value="all">Barcha Statuslar</option>
                <option value="Qabul qilindi">✓ Qabul qilindi</option>
                <option value="Kutilmoqda">⏳ Kutilmoqda</option>
                <option value="Rad etildi">✕ Rad etildi</option>
              </select>

              <button
                onClick={handleExportCSV}
                disabled={registrations.length === 0}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  registrations.length > 0
                    ? 'bg-blue-600 text-white hover:bg-blue-500 cursor-pointer'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
                }`}
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>

              {registrations.length > 0 && (
                <button
                  onClick={onClearRegistrations}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  title="Barcha arizalarni tozalash"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Tozalash
                </button>
              )}
            </div>
          </div>

          {/* Table of Candidates */}
          <div className={`rounded-2xl border overflow-hidden transition-all ${
            isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            {filteredData.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <UserCheck className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600" />
                <h3 className={`text-base font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Mos arizalar topilmadi
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
                  Qidiruv parametringizni o'zgartiring yoki "Yangi Nomzod Qo'shish" tugmasini bosing.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider ${
                      isDarkMode ? 'border-slate-800 bg-slate-800/40 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}>
                      <th className="py-2.5 px-3"># ID</th>
                      <th className="py-2.5 px-3">F.I.SH</th>
                      <th className="py-2.5 px-3">Pasport & JSHSHIR</th>
                      <th className="py-2.5 px-3">Imtihon Tili</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Telefon / Email</th>
                      <th className="py-2.5 px-3 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40 text-xs font-semibold">
                    {filteredData.map((candidate) => {
                      const status = candidate.status || 'Qabul qilindi';
                      return (
                        <tr key={candidate.id} className={`hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-colors ${
                          isDarkMode ? 'text-slate-200' : 'text-slate-800'
                        }`}>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                            {candidate.id}
                          </td>

                          <td className="py-2.5 px-3 font-extrabold">
                            <div className="whitespace-nowrap">{candidate.lastName} {candidate.firstName}</div>
                            <div className="text-[10px] text-slate-500 font-normal">{candidate.birthDate}</div>
                          </td>

                          <td className="py-2.5 px-3 font-mono">
                            <div className="text-emerald-600 dark:text-emerald-400 font-extrabold whitespace-nowrap">{candidate.passportNumber}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">{candidate.jshshir}</div>
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold inline-flex items-center gap-1 ${
                              candidate.examLanguage === 'English' || candidate.examLanguage === 'Ingliz tili'
                                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20'
                                : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20'
                            }`}>
                              {candidate.examLanguage === 'English' || candidate.examLanguage === 'Ingliz tili' ? '🇬🇧 English' : '🇷🇺 Russian'}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <select
                              value={status}
                              onChange={(e) => onUpdateCandidateStatus(candidate.id, e.target.value)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold outline-none border cursor-pointer ${
                                status === 'Qabul qilindi'
                                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                                  : status === 'Kutilmoqda'
                                  ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30'
                                  : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-500/30'
                              }`}
                            >
                              <option value="Qabul qilindi">✓ Qabul qilindi</option>
                              <option value="Kutilmoqda">⏳ Kutilmoqda</option>
                              <option value="Rad etildi">✕ Rad etildi</option>
                            </select>
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">{candidate.phone}</div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[130px] font-normal">{candidate.email}</div>
                          </td>

                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1">
                              {onSyncCandidate && (
                                <button
                                  type="button"
                                  onClick={() => onSyncCandidate(candidate.id)}
                                  className={`p-1.5 rounded-lg flex items-center gap-1 font-bold text-[10px] cursor-pointer transition-colors ${
                                    candidate.syncedToGoogleSheets || candidate.googleDocUrl
                                      ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                                      : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-800'
                                  }`}
                                  title={candidate.syncedToGoogleSheets || candidate.googleDocUrl ? "Google Sheets'ga yuborilgan (Qayta yuborish)" : "⚠️ Google Sheets'ga o'tmagan! Qayta yuborish uchun bosing"}
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  {!(candidate.syncedToGoogleSheets || candidate.googleDocUrl) && <span>Sync</span>}
                                </button>
                              )}

                              {candidate.googleDocUrl && (
                                <a
                                  href={candidate.googleDocUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 flex items-center gap-1 font-bold text-[10px]"
                                  title="Google Doc Faylini Ochiq Oynada Ochish"
                                >
                                  <FileText className="w-3.5 h-3.5" /> Doc
                                </a>
                              )}

                              <button
                                type="button"
                                onClick={() => onViewReceipt(candidate)}
                                className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 cursor-pointer"
                                title="Kvitansiya"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setViewCandidate(candidate)}
                                className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 cursor-pointer"
                                title="Batafsil ko'rish"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditingCandidate({ ...candidate })}
                                className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer"
                                title="Tahrirlash"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`${candidate.firstName} ${candidate.lastName} arizasini o'chirishni tasdiqlaysizmi?`)) {
                                    onDeleteCandidate(candidate.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                                title="O'chirish"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}


      {/* TAB 2: PORTAL SETTINGS */}
      {activeTab === 'settings' && (
        <div className="animate-fadeIn max-w-3xl mx-auto">
          <form onSubmit={handleSettingsSubmit} className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${
            isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-md'
          }`}>
            <div className="border-b pb-4 border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                GRE Imtihon Portali Tizim Sozlamalari
              </h2>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Saytdagi sarlavhalar, aloqa raqami va ro'yxatdan o'tish imkoniyatini admin paneldan boshqaring
              </p>
            </div>

            <div className="space-y-4">
              {/* Exam Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700 dark:text-slate-300">
                  Imtihon Nomi (Header & Banner sarlavhasi)
                </label>
                <input
                  type="text"
                  value={settingsForm.examTitle}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, examTitle: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold clean-input"
                  placeholder="GRE Imtihoni"
                />
              </div>

              {/* Support Phone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700 dark:text-slate-300">
                  Aloqa Telefon Raqami (Header Phone)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={settingsForm.supportPhone}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, supportPhone: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-mono font-bold clean-input"
                    placeholder="+998 (99) 627-99-99"
                  />
                </div>
              </div>

              {/* Registration Open Toggle */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Ro'yxatdan O'tish Holati
                  </h4>
                  <p className="text-xs text-slate-500">
                    Ochiq bo'lsa nomzodlar forma to'ldira oladi, yopiq bo'lsa arizalar qabul qilinmaydi.
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => setSettingsForm(prev => ({ ...prev, registrationOpen: !prev.registrationOpen }))}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    settingsForm.registrationOpen
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {settingsForm.registrationOpen ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Ochiq (Qabul Qilinmoqda)
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" /> Yopiq (Qabul To'xtatilgan)
                    </>
                  )}
                </button>
              </div>

              {/* Google Sheets Webhook URL */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700 dark:text-slate-300">
                  Google Sheets Webhook URL (Google Apps Script)
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="url"
                    value={settingsForm.googleSheetsWebhook}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, googleSheetsWebhook: e.target.value }))}
                    className="w-full pl-10 pr-28 py-2.5 rounded-xl text-xs font-mono clean-input"
                    placeholder="https://script.google.com/macros/s/.../exec"
                  />
                  <button
                    type="button"
                    onClick={handleTestWebhook}
                    disabled={isTestingWebhook}
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isTestingWebhook ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Tekshirilmoqda...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Test Qilish</span>
                      </>
                    )}
                  </button>
                </div>

                {webhookTestResult && (
                  <div className={`mt-2 p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                    webhookTestResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
                  }`}>
                    {webhookTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    )}
                    <span>{webhookTestResult.message}</span>
                  </div>
                )}

                <div className="mt-2.5 p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 space-y-1.5 font-medium">
                  <p className="font-bold flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                    💡 Google Sheets + Google Docs integratsiyasini ulash:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                    <li>Google Sheets yangi jadval yarating va <b>Kengaytmalar (Extensions) -&gt; Apps Script</b> ga kiring.</li>
                    <li>Loyihadagi <code>google-script/GoogleAppsScript.gs</code> fayli ichidagi kodni nusxalab u yerga joylang va saqlang.</li>
                    <li><b>Deploy -&gt; New deployment -&gt; Web app</b> ni tanlang (Who has access: <b>Anyone</b>) va Deploy bosing.</li>
                    <li>Olingan <b>Web app URL</b> manzilini tepadagi maydonga joylang va <b>Test Qilish</b> bosing. Yo'riqnoma: <code>README_GOOGLE_SCRIPT.md</code></li>
                  </ol>
                </div>
              </div>

              {/* Notice Banner */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700 dark:text-slate-300">
                  Forma Yuqorisidagi E'lon Matni
                </label>
                <textarea
                  rows={3}
                  value={settingsForm.registrationNotice}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, registrationNotice: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-xs font-medium clean-input"
                  placeholder="Imtihonda qatnashish uchun shaxsiy ma'lumotlaringizni to'ldiring..."
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Sozlamalarni Saqlash</span>
              </button>
            </div>
          </form>
        </div>
      )}


      {/* CANDIDATE DETAIL MODAL */}
      {viewCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className={`relative w-full max-w-3xl rounded-3xl p-5 sm:p-8 shadow-2xl border transition-all my-auto max-h-[92vh] overflow-y-auto ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-4 mb-4 border-slate-200 dark:border-slate-800">
              <h3 className="font-extrabold text-lg text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <FileText className="w-5 h-5" /> Ariza Tafsilotlari — {viewCandidate.id}
              </h3>
              <button
                onClick={() => setViewCandidate(null)}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl"
              >
                ✕ Yopish
              </button>
            </div>

            <div className="space-y-6">
              {/* Personal Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block font-medium">Ism va Familiya:</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{viewCandidate.lastName} {viewCandidate.firstName}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block font-medium">Tug'ilgan sanasi:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{viewCandidate.birthDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block font-medium">Imtihon Tili:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{viewCandidate.examLanguage}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block font-medium">Pasport Raqami:</span>
                  <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{viewCandidate.passportNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block font-medium">JSHSHIR (PINFL):</span>
                  <span className="font-bold font-mono text-amber-600 dark:text-amber-400">{viewCandidate.jshshir}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block font-medium">Telefon:</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">{viewCandidate.phone}</span>
                </div>
              </div>

              {viewCandidate.googleDocUrl && (
                <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <div>
                      <h5 className="font-bold text-xs text-indigo-900 dark:text-indigo-200">Google Doc Hujjat Fayli</h5>
                      <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">Ushbu nomzod pasport rasmlari 1ta Google Doc fayliga joylangan.</p>
                    </div>
                  </div>
                  <a
                    href={viewCandidate.googleDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shrink-0 transition-colors"
                  >
                    Doc'ni Ochish ↗
                  </a>
                </div>
              )}

              {/* Passport Photos Section */}
              <div className="border-t pt-4 border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-300">Yuklangan Pasport Rasmlari:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Front Side */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Oldi tarafi:</label>
                    {viewCandidate.passportFront?.dataUrl ? (
                      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1">
                        <img src={viewCandidate.passportFront.dataUrl} alt="Passport Front" className="w-full max-h-48 object-contain rounded-lg" />
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 text-xs text-center">Fayl yuklanmagan</div>
                    )}
                  </div>

                  {/* Back Side */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Orqa tarafi:</label>
                    {viewCandidate.passportBack?.dataUrl ? (
                      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1">
                        <img src={viewCandidate.passportBack.dataUrl} alt="Passport Back" className="w-full max-h-48 object-contain rounded-lg" />
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 text-xs text-center">Fayl yuklanmagan</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* EDIT CANDIDATE MODAL */}
      {editingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className={`relative w-full max-w-xl rounded-3xl p-4 sm:p-6 shadow-2xl border transition-all my-auto max-h-[92vh] overflow-y-auto ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-extrabold text-sm sm:text-base text-amber-600 dark:text-amber-400 flex items-center gap-2 truncate">
                <Edit3 className="w-4 h-4 shrink-0" /> Nomzod Ma'lumotlarini Tahrirlash — {editingCandidate.id}
              </h3>
              <button onClick={() => setEditingCandidate(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Ism</label>
                  <input
                    type="text"
                    value={editingCandidate.firstName}
                    onChange={(e) => setEditingCandidate(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border clean-input"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Familiya</label>
                  <input
                    type="text"
                    value={editingCandidate.lastName}
                    onChange={(e) => setEditingCandidate(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border clean-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Pasport Seriya & Raqam</label>
                  <input
                    type="text"
                    value={editingCandidate.passportNumber}
                    onChange={(e) => setEditingCandidate(prev => ({ ...prev, passportNumber: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border font-mono uppercase clean-input"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">JSHSHIR</label>
                  <input
                    type="text"
                    maxLength={14}
                    value={editingCandidate.jshshir}
                    onChange={(e) => setEditingCandidate(prev => ({ ...prev, jshshir: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border font-mono clean-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Telefon</label>
                  <input
                    type="text"
                    value={editingCandidate.phone}
                    onChange={(e) => setEditingCandidate(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border font-mono clean-input"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={editingCandidate.email}
                    onChange={(e) => setEditingCandidate(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border clean-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Imtihon Tili</label>
                  <select
                    value={editingCandidate.examLanguage}
                    onChange={(e) => setEditingCandidate(prev => ({ ...prev, examLanguage: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border clean-input cursor-pointer"
                  >
                    <option value="English">🇬🇧 English</option>
                    <option value="Russian">🇷🇺 Russian</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Ariza Statusi</label>
                  <select
                    value={editingCandidate.status || 'Qabul qilindi'}
                    onChange={(e) => setEditingCandidate(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border clean-input cursor-pointer font-bold"
                  >
                    <option value="Qabul qilindi">✓ Qabul qilindi</option>
                    <option value="Kutilmoqda">⏳ Kutilmoqda</option>
                    <option value="Rad etildi">✕ Rad etildi</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingCandidate(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ADD CANDIDATE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className={`relative w-full max-w-xl rounded-3xl p-4 sm:p-6 shadow-2xl border transition-all my-auto max-h-[92vh] overflow-y-auto ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-extrabold text-sm sm:text-base text-emerald-600 dark:text-emerald-400 flex items-center gap-2 truncate">
                <UserPlus className="w-4 h-4 shrink-0" /> Admin Tomonidan Yangi Nomzod Qo'shish
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Ism *</label>
                  <input
                    type="text"
                    placeholder="Abbos"
                    value={newCandidateForm.firstName}
                    onChange={(e) => setNewCandidateForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border clean-input"
                  />
                  {addFormErrors.firstName && <p className="text-rose-500 text-[10px] mt-0.5">{addFormErrors.firstName}</p>}
                </div>
                <div>
                  <label className="block font-semibold mb-1">Familiya *</label>
                  <input
                    type="text"
                    placeholder="Sobirov"
                    value={newCandidateForm.lastName}
                    onChange={(e) => setNewCandidateForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border clean-input"
                  />
                  {addFormErrors.lastName && <p className="text-rose-500 text-[10px] mt-0.5">{addFormErrors.lastName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Pasport Seriya & Raqam *</label>
                  <input
                    type="text"
                    placeholder="AA 1234567"
                    value={newCandidateForm.passportNumber}
                    onChange={(e) => setNewCandidateForm(prev => ({ ...prev, passportNumber: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 rounded-xl border font-mono uppercase clean-input"
                  />
                  {addFormErrors.passportNumber && <p className="text-rose-500 text-[10px] mt-0.5">{addFormErrors.passportNumber}</p>}
                </div>
                <div>
                  <label className="block font-semibold mb-1">JSHSHIR (14 raqam) *</label>
                  <input
                    type="text"
                    maxLength={14}
                    placeholder="31204981230045"
                    value={newCandidateForm.jshshir}
                    onChange={(e) => setNewCandidateForm(prev => ({ ...prev, jshshir: e.target.value.replace(/\D/g, '') }))}
                    className="w-full px-3 py-2 rounded-xl border font-mono clean-input"
                  />
                  {addFormErrors.jshshir && <p className="text-rose-500 text-[10px] mt-0.5">{addFormErrors.jshshir}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Telefon</label>
                  <input
                    type="text"
                    placeholder="+998 90 123-45-67"
                    value={newCandidateForm.phone}
                    onChange={(e) => setNewCandidateForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border font-mono clean-input"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="abbos@mail.uz"
                    value={newCandidateForm.email}
                    onChange={(e) => setNewCandidateForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border clean-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Tug'ilgan sana</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="25.04.2000"
                    maxLength={10}
                    value={newCandidateForm.birthDate}
                    onChange={(e) => {
                      let val = e.target.value;
                      const digits = val.replace(/\D/g, '').slice(0, 8);
                      let formatted = '';
                      if (digits.length > 0) formatted += digits.slice(0, 2);
                      if (digits.length > 2) formatted += '.' + digits.slice(2, 4);
                      if (digits.length > 4) formatted += '.' + digits.slice(4, 8);
                      setNewCandidateForm(prev => ({ ...prev, birthDate: formatted }));
                    }}
                    className="w-full px-3 py-2 rounded-xl border font-mono clean-input"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Imtihon Tili</label>
                  <select
                    value={newCandidateForm.examLanguage}
                    onChange={(e) => setNewCandidateForm(prev => ({ ...prev, examLanguage: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border clean-input cursor-pointer"
                  >
                    <option value="English">🇬🇧 English</option>
                    <option value="Russian">🇷🇺 Russian</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" /> Qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
