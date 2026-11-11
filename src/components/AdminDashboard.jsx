import React, { useState } from 'react';
import { 
  Search, Download, Trash2, Eye, Filter, UserCheck, 
  FileText, Settings, UserPlus, Edit3, Check, X, Printer, 
  CheckCircle2, Clock, XCircle, Save, Phone, Globe, Loader2, RefreshCw, Send, AlertTriangle,
  MapPin, Calendar, Key, User, Building, CalendarCheck, ArrowRightLeft
} from 'lucide-react';
import { UZBEKISTAN_REGIONS } from '../constants/regions';

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
  const [selectedRegion, setSelectedRegion] = useState('all');
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
          message: `❌ Server xatosi: HTTP ${response.status}`
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
        message: `❌ Ulanish xatosi: ${err.message || 'Brauzer so\'rovni yubora olmadi'}. Apps Script 'Who has access: Anyone' qilinganini tekshiring!`
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  // Add Candidate Form state
  const [newCandidateForm, setNewCandidateForm] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    email: '',
    phone: '+998 ',
    birthDate: '',
    region: '',
    district: '',
    examRegion: '',
    examDate: '',
    examLanguage: "O'zbek tili",
    passportNumber: '',
    jshshir: '',
    status: 'Qabul qilindi'
  });
  const [addFormErrors, setAddFormErrors] = useState({});

  // Filter candidates logic
  const filteredData = registrations.filter(candidate => {
    const term = searchTerm.toLowerCase();
    const fullName = `${candidate.lastName || ''} ${candidate.firstName || ''} ${candidate.middleName || ''}`.toLowerCase();
    
    const matchesSearch = 
      fullName.includes(term) ||
      candidate.email?.toLowerCase().includes(term) ||
      candidate.passportNumber?.toLowerCase().includes(term) ||
      candidate.jshshir?.includes(term) ||
      candidate.phone?.includes(term) ||
      candidate.region?.toLowerCase().includes(term) ||
      candidate.district?.toLowerCase().includes(term) ||
      candidate.examRegion?.toLowerCase().includes(term) ||
      candidate.id?.toLowerCase().includes(term);

    const matchesRegion = selectedRegion === 'all' || candidate.examRegion === selectedRegion || candidate.region === selectedRegion;
    const matchesStatus = selectedStatus === 'all' || (candidate.status || 'Qabul qilindi') === selectedStatus;

    return matchesSearch && matchesRegion && matchesStatus;
  });

  // Calculate statistics
  const totalCount = registrations.length;
  const approvedCount = registrations.filter(r => (r.status || 'Qabul qilindi') === 'Qabul qilindi').length;
  const pendingCount = registrations.filter(r => r.status === 'Kutilmoqda').length;
  const rejectedCount = registrations.filter(r => r.status === 'Rad etildi').length;

  // CSV export with formula injection protection
  const handleExportCSV = () => {
    if (registrations.length === 0) return;

    const sanitizeCSV = (val) => {
      if (val == null) return '';
      const str = String(val);
      if (/^[=+\-@\t\r]/.test(str)) {
        return `"'${str.replace(/"/g, '""')}"`;
      }
      if (/[",\n\r]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      'Ariza ID', 'Familiya', 'Ism', 'Otasining ismi', 'Tugilgan Sana', 
      'Telefon', 'Email', 'Yashash Viloyati', 'Yashash Tumani', 
      'Test Hududi', 'Test Sanasi', 'Imtihon Tili', 'Pasport', 'JSHSHIR', 
      'Google Doc Havolasi', 'Status', 'Ariza Sanasi'
    ];

    const rows = registrations.map(r => [
      r.id,
      r.lastName,
      r.firstName,
      r.middleName || '',
      r.birthDate,
      r.phone,
      r.email,
      r.region || '',
      r.district || '',
      r.examRegion || '',
      r.examDate || '',
      r.examLanguage || "O'zbek tili",
      r.passportNumber,
      r.jshshir,
      r.googleDocUrl || '',
      r.status || 'Qabul qilindi',
      r.submittedAt
    ].map(sanitizeCSV));

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fizika_Registratsiyalar_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add Candidate submit
  const handleAddSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!newCandidateForm.lastName.trim()) errs.lastName = "Familiya kiritilishi shart";
    if (!newCandidateForm.firstName.trim()) errs.firstName = "Ism kiritilishi shart";
    if (!newCandidateForm.passportNumber.trim()) errs.passportNumber = "Pasport seriyasi shart";
    if (newCandidateForm.jshshir.length !== 14) errs.jshshir = "JSHSHIR 14 ta raqam bo'lishi kerak";

    if (Object.keys(errs).length > 0) {
      setAddFormErrors(errs);
      return;
    }

    const submissionId = 'FIZ-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000);
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
      lastName: '',
      firstName: '',
      middleName: '',
      email: '',
      phone: '+998 ',
      birthDate: '',
      region: '',
      district: '',
      examRegion: '',
      examDate: '',
      examLanguage: "O'zbek tili",
      passportNumber: '',
      jshshir: '',
      status: 'Qabul qilindi'
    });
    setAddFormErrors({});
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b pb-3 border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('candidates')}
            className={`flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer active:scale-95 ${
              activeTab === 'candidates' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Nomzodlar</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'candidates' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer active:scale-95 ${
              activeTab === 'settings' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Sozlamalar</span>
          </button>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto justify-center px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Yangi Nomzod Qo'shish</span>
        </button>
      </div>

      {/* TAB 1: CANDIDATES MANAGEMENT */}
      {activeTab === 'candidates' && (
        <div className="space-y-4 sm:space-y-5 animate-fadeIn">
          
          {/* Top Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'}`}>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">Jami Arizalar</span>
              <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5 block">{totalCount} ta</span>
            </div>

            <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'}`}>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Qabul
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">{approvedCount} ta</span>
            </div>

            <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'}`}>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Kutilmoqda
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5 block">{pendingCount} ta</span>
            </div>

            <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'}`}>
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block uppercase tracking-wider flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> Rad
              </span>
              <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5 block">{rejectedCount} ta</span>
            </div>
          </div>

          {/* Controls Bar: Search & Actions */}
          <div className={`p-3 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3 ${
            isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            {/* Search input */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Qidiruv (F.I.Sh, Pasport, Tel)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-semibold outline-none border transition-all clean-input"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex-1 sm:flex-none min-w-[140px]">
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl text-xs font-semibold outline-none border clean-input cursor-pointer"
                >
                  <option value="all">Barcha Hududlar</option>
                  {UZBEKISTAN_REGIONS.map(reg => (
                    <option key={reg} value={reg}>{reg}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 sm:flex-none min-w-[130px]">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl text-xs font-semibold outline-none border clean-input cursor-pointer"
                >
                  <option value="all">Barcha Statuslar</option>
                  <option value="Qabul qilindi">✓ Qabul qilindi</option>
                  <option value="Kutilmoqda">⏳ Kutilmoqda</option>
                  <option value="Rad etildi">✕ Rad etildi</option>
                </select>
              </div>

              {/* Export CSV */}
              <button
                onClick={handleExportCSV}
                disabled={registrations.length === 0}
                className="px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-50 active:scale-95"
                title="Excel / CSV formatida yuklab olish"
              >
                <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>CSV</span>
              </button>

              {/* Clear Registrations */}
              <button
                onClick={() => {
                  if (window.confirm("Haqiqatan ham barcha nomzodlar ro'yxatini tozalashni xohlaysizmi?")) {
                    onClearRegistrations();
                  }
                }}
                disabled={registrations.length === 0}
                className="p-2 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-50 active:scale-95"
                title="Barcha arizalarni tozalash"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile swipe hint */}
          <div className="md:hidden flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <ArrowRightLeft className="w-3 h-3 text-blue-500" /> Jadvalni suring
            </span>
            <span>{filteredData.length} ta nomzod</span>
          </div>

          {/* Candidates Table Container */}
          <div className={`rounded-2xl border overflow-hidden shadow-xs ${
            isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full min-w-[950px] text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b text-[10px] uppercase font-bold tracking-wider ${
                    isDarkMode ? 'bg-slate-800/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}>
                    <th className="py-3 px-3">Ariza ID</th>
                    <th className="py-3 px-3">Nomzod (F.I.Sh)</th>
                    <th className="py-3 px-3">Aloqa & Tug'ilgan sana</th>
                    <th className="py-3 px-3">Yashash manzili</th>
                    <th className="py-3 px-3">Test Hududi / Sanasi</th>
                    <th className="py-3 px-3">Pasport / JSHSHIR</th>
                    <th className="py-3 px-3 text-center">Hujjat (Doc)</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="font-semibold">Hozircha hech qanday ariza mavjud emas</p>
                        <p className="text-[11px] mt-0.5">Yangi ro'yxatdan o'tgan nomzodlar shu yerda paydo bo'ladi</p>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((candidate) => {
                      const fullCandidateName = `${candidate.lastName || ''} ${candidate.firstName || ''} ${candidate.middleName || ''}`.trim();
                      const addressStr = `${candidate.region || ''}${candidate.district ? ', ' + candidate.district : ''}`;

                      return (
                        <tr 
                          key={candidate.id}
                          className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                            candidate.status === 'Rad etildi' ? 'opacity-60' : ''
                          }`}
                        >
                          {/* ID */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                              {candidate.id}
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              {candidate.submittedAt}
                            </span>
                          </td>

                          {/* F.I.Sh */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {fullCandidateName || "Noma'lum"}
                            </div>
                            <div className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                              {candidate.examLanguage || "O'zbek tili"}
                            </div>
                          </td>

                          {/* Phone / Email / BirthDate */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-mono font-medium text-slate-700 dark:text-slate-300">
                              {candidate.phone}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {candidate.email}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              T-yil: {candidate.birthDate}
                            </div>
                          </td>

                          {/* Yashash Manzili */}
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                              <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                              {addressStr || "—"}
                            </span>
                          </td>

                          {/* Test Hududi va Sanasi */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-bold text-emerald-600 dark:text-emerald-400">
                              {candidate.examRegion || "—"}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                              <CalendarCheck className="w-3 h-3 text-slate-400" />
                              {candidate.examDate || "—"}
                            </div>
                          </td>

                          {/* Passport & JSHSHIR */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {candidate.passportNumber}
                            </div>
                            <div className="font-mono text-[10px] text-slate-400">
                              {candidate.jshshir}
                            </div>
                          </td>

                          {/* Google Doc Link */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {candidate.googleDocUrl && candidate.googleDocUrl.startsWith('http') ? (
                              <a
                                href={candidate.googleDocUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:underline border border-blue-200 dark:border-blue-500/20"
                              >
                                <FileText className="w-3 h-3" />
                                <span>Doc'da Ko'rish</span>
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Yuklanmagan</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <select
                              value={candidate.status || 'Qabul qilindi'}
                              onChange={(e) => onUpdateCandidateStatus(candidate.id, e.target.value)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border clean-input cursor-pointer ${
                                candidate.status === 'Rad etildi'
                                  ? 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 border-rose-200'
                                  : candidate.status === 'Kutilmoqda'
                                  ? 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200'
                                  : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200'
                              }`}
                            >
                              <option value="Qabul qilindi">Qabul qilindi</option>
                              <option value="Kutilmoqda">Kutilmoqda</option>
                              <option value="Rad etildi">Rad etildi</option>
                            </select>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1">
                              {/* Sync button */}
                              {onSyncCandidate && (
                                <button
                                  type="button"
                                  onClick={() => onSyncCandidate(candidate.id)}
                                  className={`p-1.5 rounded-lg flex items-center gap-1 font-bold text-[10px] cursor-pointer transition-colors active:scale-95 ${
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

                              {/* View Receipt */}
                              <button
                                onClick={() => onViewReceipt(candidate)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors active:scale-95"
                                title="Kvitansiyani ko'rish"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => setEditingCandidate({ ...candidate })}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors active:scale-95"
                                title="Tahrirlash"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => {
                                  if (window.confirm(`${fullCandidateName} nomzodni o'chirmoqchimisiz?`)) {
                                    onDeleteCandidate(candidate.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors active:scale-95"
                                title="O'chirish"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PORTAL SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-5 animate-fadeIn max-w-2xl">
          <div className={`p-4 sm:p-6 rounded-2xl border space-y-4 ${
            isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-600" />
              <span>Tizim Sozlamalari</span>
            </h3>

            <div className="space-y-4 text-xs">
              {/* Exam Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700 dark:text-slate-300">
                  Imtihon Nomi
                </label>
                <input
                  type="text"
                  value={settingsForm.examTitle}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, examTitle: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold clean-input"
                  placeholder="Masalan: Fizika Imtihoni"
                />
              </div>

              {/* Support Phone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700 dark:text-slate-300">
                  Qo'llab-quvvatlash Telefoni
                </label>
                <input
                  type="text"
                  value={settingsForm.supportPhone}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, supportPhone: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold clean-input"
                  placeholder="+998 (99) 627-99-99"
                />
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
                    className="absolute right-1.5 top-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    {isTestingWebhook ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Sinash...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3" />
                        <span>Test Qilish</span>
                      </>
                    )}
                  </button>
                </div>
                {webhookTestResult && (
                  <div className={`mt-2 p-2.5 rounded-xl text-xs font-medium flex items-start gap-2 ${
                    webhookTestResult.success 
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                      : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}>
                    {webhookTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    )}
                    <span>{webhookTestResult.message}</span>
                  </div>
                )}
              </div>

              {/* Registration Open/Closed Toggle */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    Ro'yxatdan O'tishni Ochish / Yopish
                  </div>
                  <div className="text-[11px] text-slate-500">
                    O'chirilganda, yangi nomzodlar ro'yxatdan o'ta olmaydi
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.registrationOpen}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, registrationOpen: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Save Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onSaveSettings(settingsForm)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Sozlamalarni Saqlash</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD CANDIDATE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className={`relative max-w-lg w-full rounded-2xl p-4 sm:p-6 border shadow-2xl my-auto max-h-[92vh] overflow-y-auto ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <span>Yangi Nomzod Qo'shish</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Familiya</label>
                  <input
                    type="text"
                    required
                    value={newCandidateForm.lastName}
                    onChange={(e) => setNewCandidateForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg border clean-input"
                    placeholder="KARIMOV"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Ism</label>
                  <input
                    type="text"
                    required
                    value={newCandidateForm.firstName}
                    onChange={(e) => setNewCandidateForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg border clean-input"
                    placeholder="ANVAR"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Sharif</label>
                  <input
                    type="text"
                    value={newCandidateForm.middleName}
                    onChange={(e) => setNewCandidateForm(prev => ({ ...prev, middleName: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg border clean-input"
                    placeholder="BAXTIYOROVICH"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Telefon</label>
                  <input
                    type="text"
                    value={newCandidateForm.phone}
                    onChange={(e) => setNewCandidateForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg border clean-input font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={newCandidateForm.email}
                    onChange={(e) => setNewCandidateForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg border clean-input"
                    placeholder="nomzod@mail.uz"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Yashash Viloyati</label>
                  <select
                    value={newCandidateForm.region}
                    onChange={(e) => setNewCandidateForm(prev => ({ ...prev, region: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg border clean-input cursor-pointer"
                  >
                    <option value="">Tanlang...</option>
                    {UZBEKISTAN_REGIONS.map(reg => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Tuman / Shahar</label>
                  <input
                    type="text"
                    value={newCandidateForm.district}
                    onChange={(e) => setNewCandidateForm(prev => ({ ...prev, district: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg border clean-input"
                    placeholder="Chilonzor tumani"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Test Hududi</label>
                  <select
                    value={newCandidateForm.examRegion}
                    onChange={(e) => setNewCandidateForm(prev => ({ ...prev, examRegion: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg border clean-input cursor-pointer"
                  >
                    <option value="">Tanlang...</option>
                    {UZBEKISTAN_REGIONS.map(reg => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Test Sanasi</label>
                  <input
                    type="date"
                    value={newCandidateForm.examDate}
                    onChange={(e) => setNewCandidateForm(prev => ({ ...prev, examDate: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg border clean-input"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Imtihon Tili</label>
                  <select
                    value={newCandidateForm.examLanguage}
                    onChange={(e) => setNewCandidateForm(prev => ({ ...prev, examLanguage: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg border clean-input cursor-pointer font-bold"
                  >
                    <option value="O'zbek tili">O'zbek tili</option>
                    <option value="Rus tili">Rus tili</option>
                    <option value="Ingliz tili">Ingliz tili</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Pasport</label>
                  <input
                    type="text"
                    required
                    value={newCandidateForm.passportNumber}
                    onChange={(e) => setNewCandidateForm(prev => ({ ...prev, passportNumber: e.target.value.toUpperCase() }))}
                    className="w-full px-2.5 py-2 rounded-lg border clean-input font-mono"
                    placeholder="AA 1234567"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">JSHSHIR (14 ta raqam)</label>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    value={newCandidateForm.jshshir}
                    onChange={(e) => setNewCandidateForm(prev => ({ ...prev, jshshir: e.target.value.replace(/\D/g, '') }))}
                    className="w-full px-2.5 py-2 rounded-lg border clean-input font-mono"
                    placeholder="14 ta raqam"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border clean-input font-bold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer active:scale-95"
                >
                  Qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CANDIDATE */}
      {editingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className={`relative max-w-lg w-full rounded-2xl p-4 sm:p-6 border shadow-2xl my-auto max-h-[92vh] overflow-y-auto ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2 truncate">
                <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="truncate">Tahrirlash: {editingCandidate.id}</span>
              </h3>
              <button onClick={() => setEditingCandidate(null)} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onEditCandidate(editingCandidate);
                setEditingCandidate(null);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Familiya</label>
                  <input
                    type="text"
                    required
                    value={editingCandidate.lastName || ''}
                    onChange={(e) => setEditingCandidate(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg border clean-input"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Ism</label>
                  <input
                    type="text"
                    required
                    value={editingCandidate.firstName || ''}
                    onChange={(e) => setEditingCandidate(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg border clean-input"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Sharif</label>
                  <input
                    type="text"
                    value={editingCandidate.middleName || ''}
                    onChange={(e) => setEditingCandidate(prev => ({ ...prev, middleName: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg border clean-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Telefon</label>
                  <input
                    type="text"
                    value={editingCandidate.phone || ''}
                    onChange={(e) => setEditingCandidate(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg border clean-input font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={editingCandidate.email || ''}
                    onChange={(e) => setEditingCandidate(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg border clean-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Yashash Viloyati</label>
                  <select
                    value={editingCandidate.region || ''}
                    onChange={(e) => setEditingCandidate(prev => ({ ...prev, region: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg border clean-input cursor-pointer"
                  >
                    <option value="">Tanlang...</option>
                    {UZBEKISTAN_REGIONS.map(reg => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Tuman / Shahar</label>
                  <input
                    type="text"
                    value={editingCandidate.district || ''}
                    onChange={(e) => setEditingCandidate(prev => ({ ...prev, district: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg border clean-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Test Hududi</label>
                  <select
                    value={editingCandidate.examRegion || ''}
                    onChange={(e) => setEditingCandidate(prev => ({ ...prev, examRegion: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg border clean-input cursor-pointer"
                  >
                    <option value="">Tanlang...</option>
                    {UZBEKISTAN_REGIONS.map(reg => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Test Sanasi</label>
                  <input
                    type="date"
                    value={editingCandidate.examDate || ''}
                    onChange={(e) => setEditingCandidate(prev => ({ ...prev, examDate: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg border clean-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Pasport</label>
                  <input
                    type="text"
                    value={editingCandidate.passportNumber || ''}
                    onChange={(e) => setEditingCandidate(prev => ({ ...prev, passportNumber: e.target.value.toUpperCase() }))}
                    className="w-full px-2.5 py-2 rounded-lg border clean-input font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">JSHSHIR</label>
                  <input
                    type="text"
                    maxLength={14}
                    value={editingCandidate.jshshir || ''}
                    onChange={(e) => setEditingCandidate(prev => ({ ...prev, jshshir: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg border clean-input font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Status</label>
                  <select
                    value={editingCandidate.status || 'Qabul qilindi'}
                    onChange={(e) => setEditingCandidate(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg border clean-input font-bold cursor-pointer"
                  >
                    <option value="Qabul qilindi">Qabul qilindi</option>
                    <option value="Kutilmoqda">Kutilmoqda</option>
                    <option value="Rad etildi">Rad etildi</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCandidate(null)}
                  className="px-4 py-2 rounded-xl border clean-input font-bold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer active:scale-95"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
