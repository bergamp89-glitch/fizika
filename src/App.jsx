import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import RegistrationForm from './components/RegistrationForm';
import AdminDashboard from './components/AdminDashboard';
import ReceiptModal from './components/ReceiptModal';
import DuplicateModal from './components/DuplicateModal';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

const DEFAULT_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbw4zUbOkUsRTfuwEVIrOyviO_QV5B3CXDTq0iwNwhLQKU2jNc9bwFQ3roL2pBE7mW5fKQ/exec";

const DEFAULT_SETTINGS = {
  examTitle: import.meta.env.VITE_EXAM_TITLE || "Fizika Imtihoni",
  supportPhone: import.meta.env.VITE_SUPPORT_PHONE || "+998 (99) 627-99-99",
  googleSheetsWebhook: import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK || DEFAULT_WEBHOOK_URL,
  registrationOpen: true,
  registrationNotice: "Fizika imtihonida qatnashish uchun shaxsiy ma'lumotlaringizni to'ldiring."
};

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [isNewRegistration, setIsNewRegistration] = useState(false);
  const [resetFormSignal, setResetFormSignal] = useState(0);
  const [duplicateCandidate, setDuplicateCandidate] = useState(null);
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const savedTab = sessionStorage.getItem('fizika_active_tab');
      return savedTab || 'form';
    } catch {
      return 'form';
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('fizika_active_tab', activeTab);
    } catch (e) {
      console.warn("Active tab saqlashda xatolik:", e);
    }
  }, [activeTab]);

  // Settings State: Preserves custom settings if saved by Admin, otherwise uses DEFAULT_SETTINGS
  const [appSettings, setAppSettings] = useState(() => {
    try {
      const savedCustom = localStorage.getItem('fizika_custom_app_settings');
      if (savedCustom) {
        const parsed = JSON.parse(savedCustom);
        const resolvedTitle = parsed.examTitle
          ? parsed.examTitle 
          : (import.meta.env.VITE_EXAM_TITLE || "Fizika Imtihoni");
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          examTitle: resolvedTitle,
          googleSheetsWebhook: parsed.googleSheetsWebhook && parsed.googleSheetsWebhook.trim()
            ? parsed.googleSheetsWebhook
            : (import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK || DEFAULT_WEBHOOK_URL)
        };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Registrations State
  const [registrations, setRegistrations] = useState(() => {
    try {
      const saved = localStorage.getItem('fizika_registrations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save registrations to localStorage with quota overflow fallback
  useEffect(() => {
    try {
      localStorage.setItem('fizika_registrations', JSON.stringify(registrations));
    } catch (e) {
      console.warn("localStorage kotasi to'ldi, rasmsiz engil variant saqlanmoqda:", e);
      try {
        const lightRegistrations = registrations.map(c => ({
          ...c,
          passportFront: c.passportFront ? { name: c.passportFront.name, size: c.passportFront.size, type: c.passportFront.type } : null,
          passportBack: c.passportBack ? { name: c.passportBack.name, size: c.passportBack.size, type: c.passportBack.type } : null
        }));
        localStorage.setItem('fizika_registrations', JSON.stringify(lightRegistrations));
      } catch (e2) {
        console.error("Xotirada saqlab bo'lmadi:", e2);
      }
    }
  }, [registrations]);

  // Initialize theme from system preference or previous setting
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('fizika_theme');
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setIsDarkMode(true);
      }
    } catch (e) {
      console.log('Theme init error', e);
    }
  }, []);

  // Update theme on toggle
  useEffect(() => {
    try {
      localStorage.setItem('fizika_theme', isDarkMode ? 'dark' : 'light');
    } catch (e) {
      console.log('Theme save error', e);
    }
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const submitToGoogleSheets = async (candidateData) => {
    const webhookUrl = (appSettings.googleSheetsWebhook || DEFAULT_WEBHOOK_URL).trim();
    if (!webhookUrl) {
      console.warn("⚠️ Google Sheets Webhook URL o'rnatilmagan! Admin paneldan URL manzilini kiriting.");
      showToast("⚠️ Webhook URL o'rnatilmagan! Ma'lumot faqat lokal saqlandi.", "warning");
      return { success: false, duplicate: false, docUrl: null };
    }

    try {
      // Clean payload for Google Apps Script Webhook
      const payload = {
        id: candidateData.id,
        lastName: candidateData.lastName,
        firstName: candidateData.firstName,
        middleName: candidateData.middleName || '',
        birthDate: candidateData.birthDate,
        phone: candidateData.phone,
        email: candidateData.email,
        region: candidateData.region || '',
        district: candidateData.district || '',
        examRegion: candidateData.examRegion || '',
        examDate: candidateData.examDate || '',
        passportNumber: candidateData.passportNumber,
        jshshir: candidateData.jshshir,
        submittedAt: candidateData.submittedAt,
        passportFront: candidateData.passportFront ? {
          name: candidateData.passportFront.name,
          dataUrl: candidateData.passportFront.dataUrl
        } : null,
        passportBack: candidateData.passportBack ? {
          name: candidateData.passportBack.name,
          dataUrl: candidateData.passportBack.dataUrl
        } : null,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout limit

      let response;
      try {
        response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload),
          redirect: 'follow',
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        console.warn("⚠️ Google Sheets server xatolik qaytardi:", response.status);
        showToast("Google Sheets serverda xatolik yuz berdi: HTTP " + response.status, "warning");
        return { success: false, duplicate: false, docUrl: null };
      }

      const result = await response.json();
      console.log("✅ Google Sheets va Docs javobi:", result);

      if (result.result === 'duplicate') {
        showToast(result.message || "Bu ma'lumotlar allaqachon jadvalda mavjud!", "error");
        return { success: false, duplicate: true, docUrl: null, message: result.message };
      }

      if (result.result === 'error') {
        console.error("❌ Google Apps Script xatolik qaytardi:", result.error);
        showToast("⚠️ Google Sheets xatosi: " + (result.error || "Noma'lum xatolik"), "error");
        return { success: false, duplicate: false, docUrl: null, error: result.error };
      }

      return { success: true, duplicate: false, docUrl: result.docUrl || null };
    } catch (error) {
      console.error("❌ Google Sheets yuborishda xatolik:", error);
      if (error.name === 'AbortError') {
        showToast("⚠️ Google Sheets'ga uzatish vaqti tugadi (timeout). Ma'lumot lokal saqlandi.", "warning");
      } else {
        showToast("Google Sheets'ga yuborishda xatolik yuz berdi. Ma'lumot lokal saqlandi.", "warning");
      }
      return { success: false, duplicate: false, docUrl: null };
    }
  };

  // Re-sync single candidate to Google Sheets from Admin
  const handleSyncCandidateToSheets = async (candidateId) => {
    const candidate = registrations.find(c => c.id === candidateId);
    if (!candidate) return;

    showToast("Google Sheets'ga qayta yuborilmoqda...", "warning");
    const webRes = await submitToGoogleSheets(candidate);

    if (webRes.success) {
      setRegistrations(prev => prev.map(c => c.id === candidateId ? {
        ...c,
        googleDocUrl: webRes.docUrl || c.googleDocUrl,
        syncedToGoogleSheets: true
      } : c));
      showToast("✅ Google Sheets'ga muvaffaqiyatli saqlandi!");
    } else if (webRes.duplicate) {
      setRegistrations(prev => prev.map(c => c.id === candidateId ? {
        ...c,
        syncedToGoogleSheets: true
      } : c));
      showToast("⚠️ Nomzod jadvalda allaqachon mavjud!", "warning");
    } else {
      showToast("❌ Google Sheets'ga yuborishda xatolik yuz berdi", "error");
    }
  };

  // Form submission handler
  const handleRegistrationSuccess = async (newCandidate) => {
    setIsSubmitting(true);

    try {
      // Duplicate check: Check strictly by Passport Number or JSHSHIR
      const existingCandidate = registrations.find(c => {
        const cleanPassExisting = (c.passportNumber || '').replace(/\s/g, '').toLowerCase();
        const cleanPassNew = (newCandidate.passportNumber || '').replace(/\s/g, '').toLowerCase();
        
        const jshshirMatch = Boolean(c.jshshir && newCandidate.jshshir && c.jshshir.trim() === newCandidate.jshshir.trim());
        const passMatch = Boolean(cleanPassExisting && cleanPassNew && cleanPassExisting === cleanPassNew);

        return jshshirMatch || passMatch;
      });

      if (existingCandidate) {
        setDuplicateCandidate(existingCandidate);
        showToast("Siz tizimda allaqachon ro'yxatdan o'tgansiz!", "error");
        return;
      }

      let webRes = { success: false, duplicate: false, docUrl: null };
      try {
        webRes = await submitToGoogleSheets(newCandidate);
      } catch (err) {
        console.error("Webhook error:", err);
      }

      // If Google Sheets returns duplicate error, stop registration and show duplicate warning!
      if (webRes && webRes.duplicate) {
        setDuplicateCandidate(newCandidate);
        return;
      }

      const candidateWithStatus = {
        ...newCandidate,
        googleDocUrl: webRes.docUrl || newCandidate.googleDocUrl || null,
        syncedToGoogleSheets: webRes.success || false,
        status: 'Qabul qilindi'
      };

      setRegistrations(prev => [candidateWithStatus, ...prev]);
      setIsNewRegistration(true);
      setActiveReceipt(candidateWithStatus);
      
      if (webRes.success) {
        showToast("Registratsiya va Google Sheets integratsiyasi muvaffaqiyatli yakunlandi!");
      } else {
        showToast("⚠️ Registratsiya saqlandi, lekin Google Sheets'ga uzatishda xatolik yuz berdi.", "warning");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseReceipt = () => {
    setActiveReceipt(null);
    if (isNewRegistration) {
      setIsNewRegistration(false);
      setResetFormSignal(prev => prev + 1);
    }
  };

  const handleSaveSettings = (newSettings) => {
    setAppSettings(newSettings);
    try {
      localStorage.setItem('fizika_custom_app_settings', JSON.stringify(newSettings));
      showToast("Sozlamalar muvaffaqiyatli saqlandi!");
    } catch (e) {
      console.warn("Sozlamalarni saqlashda xatolik:", e);
      showToast("Sozlamalarni saqlashda xatolik", "error");
    }
  };

  const handleClearRegistrations = () => {
    setRegistrations([]);
    try {
      localStorage.removeItem('fizika_registrations');
      showToast("Barcha ro'yxatdan o'tganlar to tozalandi!");
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCandidate = (id) => {
    setRegistrations(prev => prev.filter(c => c.id !== id));
    showToast("Nomzod arizasi o'chirildi!");
  };

  const handleUpdateCandidateStatus = (id, newStatus) => {
    setRegistrations(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    showToast(`Status '${newStatus}' ga o'zgartirildi!`);
  };

  const handleEditCandidate = (updatedCandidate) => {
    setRegistrations(prev => prev.map(c => c.id === updatedCandidate.id ? updatedCandidate : c));
    showToast("Nomzod ma'lumotlari yangilandi!");
  };

  const handleAddCandidate = (newCand) => {
    setRegistrations(prev => [newCand, ...prev]);
    showToast("Yangi nomzod muvaffaqiyatli qo'shildi!");
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-3 left-3 right-3 sm:left-auto sm:right-4 z-50 animate-bounce max-w-md mx-auto sm:mx-0">
          <div className={`px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold border ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-500'
              : toast.type === 'warning'
              ? 'bg-amber-600 text-white border-amber-500'
              : 'bg-emerald-600 text-white border-emerald-500'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header 
        isDarkMode={isDarkMode} 
        setIsDarkMode={setIsDarkMode} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        appSettings={appSettings}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-2.5 sm:px-6 py-4 sm:py-8">
        {activeTab === 'form' ? (
          <div className="space-y-6">
            <RegistrationForm
              onSubmitSuccess={handleRegistrationSuccess}
              onAdminLogin={() => {
                setActiveTab('admin');
                showToast("Admin panelga muvaffaqiyatli kirdingiz!");
              }}
              isDarkMode={isDarkMode}
              isSubmitting={isSubmitting}
              appSettings={appSettings}
              resetFormSignal={resetFormSignal}
            />
          </div>
        ) : (
          <AdminDashboard
            registrations={registrations}
            onClearRegistrations={handleClearRegistrations}
            onSyncCandidate={handleSyncCandidateToSheets}
            onDeleteCandidate={handleDeleteCandidate}
            onUpdateCandidateStatus={handleUpdateCandidateStatus}
            onEditCandidate={handleEditCandidate}
            onAddCandidate={handleAddCandidate}
            onViewReceipt={(cand) => setActiveReceipt(cand)}
            appSettings={appSettings}
            onSaveSettings={handleSaveSettings}
            isDarkMode={isDarkMode}
          />
        )}
      </main>

      {/* Printable Receipt Modal */}
      {activeReceipt && (
        <ReceiptModal
          data={activeReceipt}
          onClose={handleCloseReceipt}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Duplicate Alert Modal */}
      {duplicateCandidate && (
        <DuplicateModal
          candidate={duplicateCandidate}
          onClose={() => setDuplicateCandidate(null)}
          isDarkMode={isDarkMode}
          appSettings={appSettings}
        />
      )}

      {/* Minimal Footer */}
      <footer className={`py-4 border-t text-center text-xs transition-colors ${
        isDarkMode ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'
      }`}>
        <p className="font-semibold select-none flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>{appSettings.examTitle} &copy; {new Date().getFullYear()} — Barcha huquqlar himoyalangan</span>
        </p>
      </footer>
    </div>
  );
}
