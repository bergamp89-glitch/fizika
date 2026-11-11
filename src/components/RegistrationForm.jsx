import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, Calendar, CreditCard, Key, ArrowRight, ArrowLeft, 
  Check, AlertCircle, Loader2, XCircle, MapPin, Building, CalendarCheck, HelpCircle 
} from 'lucide-react';
import StepProgress from './StepProgress';
import FileUpload from './FileUpload';
import { UZBEKISTAN_REGIONS } from '../constants/regions';

const INITIAL_FORM_DATA = {
  lastName: '',
  firstName: '',
  middleName: '',
  birthDate: '',
  phone: '+998 ',
  email: '',
  region: '',
  district: '',
  examRegion: '',
  examDate: '',
  examLanguage: "O'zbek tili",
  passportNumber: '',
  jshshir: '',
  passportFront: null,
  passportBack: null,
  termsAgreed: false,
};

export default function RegistrationForm({ 
  onSubmitSuccess, 
  onAdminLogin, 
  isDarkMode, 
  isSubmitting = false, 
  appSettings, 
  resetFormSignal = 0 
}) {
  const isRegistrationOpen = appSettings?.registrationOpen ?? true;

  // Persist step across browser refreshes
  const [currentStep, setCurrentStep] = useState(() => {
    try {
      const savedStep = sessionStorage.getItem('fizika_draft_step');
      return savedStep ? Math.min(Math.max(parseInt(savedStep, 10), 1), 4) : 1;
    } catch {
      return 1;
    }
  });

  const [errors, setErrors] = useState({});

  // Persist form inputs across browser refreshes
  const [formData, setFormData] = useState(() => {
    try {
      const savedForm = sessionStorage.getItem('fizika_draft_form_data');
      if (savedForm) {
        return { ...INITIAL_FORM_DATA, ...JSON.parse(savedForm) };
      }
      return INITIAL_FORM_DATA;
    } catch {
      return INITIAL_FORM_DATA;
    }
  });

  // Reset form upon receipt modal close or explicit reset
  useEffect(() => {
    if (resetFormSignal > 0) {
      try {
        sessionStorage.removeItem('fizika_draft_step');
        sessionStorage.removeItem('fizika_draft_form_data');
      } catch (errDraft) {
        console.warn("Draft clearing error:", errDraft);
      }
      setFormData(INITIAL_FORM_DATA);
      setCurrentStep(1);
      setErrors({});
    }
  }, [resetFormSignal]);

  // Sync step changes to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('fizika_draft_step', currentStep.toString());
    } catch (e) {
      console.warn("Draft step saqlashda xatolik:", e);
    }
  }, [currentStep]);

  // Sync form data changes to sessionStorage with quota fallback
  useEffect(() => {
    try {
      sessionStorage.setItem('fizika_draft_form_data', JSON.stringify(formData));
    } catch {
      try {
        const lightForm = {
          ...formData,
          passportFront: null,
          passportBack: null
        };
        sessionStorage.setItem('fizika_draft_form_data', JSON.stringify(lightForm));
      } catch (e2) {
        console.warn("SessionStorage saqlab bo'lmadi:", e2);
      }
    }
  }, [formData]);

  const steps = [
    { id: 1, title: "Shaxsiy ma'lumotlar" },
    { id: 2, title: "Manzil va Test" },
    { id: 3, title: "Pasport va JSHSHIR" },
    { id: 4, title: "Pasport rasmlari" },
  ];

  // Formatting helpers
  const handlePhoneChange = (e) => {
    let input = e.target.value;
    if (!input.startsWith('+998')) {
      input = '+998 ';
    }
    const digits = input.slice(4).replace(/\D/g, '').slice(0, 9);
    
    let formatted = '+998 ';
    if (digits.length > 0) formatted += digits.slice(0, 2);
    if (digits.length > 2) formatted += ' ' + digits.slice(2, 5);
    if (digits.length > 5) formatted += '-' + digits.slice(5, 7);
    if (digits.length > 7) formatted += '-' + digits.slice(7, 9);

    setFormData(prev => ({ ...prev, phone: formatted }));
    if (errors.phone) setErrors(prev => ({ ...prev, phone: null }));
  };

  const handlePassportChange = (e) => {
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    let letters = val.slice(0, 2).replace(/[^A-Z]/g, '');
    let numbers = val.slice(2).replace(/[^0-9]/g, '').slice(0, 7);

    let formatted = letters;
    if (numbers.length > 0) {
      formatted += ' ' + numbers;
    }
    setFormData(prev => ({ ...prev, passportNumber: formatted }));
    if (errors.passportNumber) setErrors(prev => ({ ...prev, passportNumber: null }));
  };

  const handleJshshirChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 14);
    setFormData(prev => ({ ...prev, jshshir: val }));
    if (errors.jshshir) setErrors(prev => ({ ...prev, jshshir: null }));
  };

  const handleBirthDateChange = (e) => {
    let val = e.target.value;
    const digits = val.replace(/\D/g, '').slice(0, 8);
    
    let formatted = '';
    if (digits.length > 0) formatted += digits.slice(0, 2);
    if (digits.length > 2) formatted += '.' + digits.slice(2, 4);
    if (digits.length > 4) formatted += '.' + digits.slice(4, 8);

    setFormData(prev => ({ ...prev, birthDate: formatted }));
    if (errors.birthDate) setErrors(prev => ({ ...prev, birthDate: null }));
  };

  // Validation logic
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.lastName.trim()) {
        newErrors.lastName = "Familiyangizni kiriting (ingliz/lotin alifbosida)";
      }
      if (!formData.firstName.trim()) {
        newErrors.firstName = "Ismingizni kiriting (ingliz/lotin alifbosida)";
      }
      if (!formData.middleName.trim()) {
        newErrors.middleName = "Otangizning ismini kiriting (ingliz/lotin alifbosida)";
      }
      
      // Birth Date
      if (!formData.birthDate || !formData.birthDate.trim()) {
        newErrors.birthDate = "Tug'ilgan sanangizni kiriting";
      } else {
        const parts = formData.birthDate.split('.');
        if (parts.length !== 3 || formData.birthDate.length !== 10) {
          newErrors.birthDate = "Tug'ilgan sanani to'liq kiriting (masalan: 25.04.2000)";
        } else {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);

          if (isNaN(day) || isNaN(month) || isNaN(year) || month < 1 || month > 12 || day < 1 || day > 31) {
            newErrors.birthDate = "Noto'g'ri sana kiritildi (masalan: 25.04.2000)";
          } else if (year < 1940 || year > 2022) {
            newErrors.birthDate = "Tug'ilgan yil 1940 va 2022 oralig'ida bo'lishi kerak";
          }
        }
      }

      // Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email.trim()) {
        newErrors.email = "Elektron pochtangizni kiriting";
      } else if (!emailRegex.test(formData.email)) {
        newErrors.email = "Noto'g'ri email formati (masalan: ali@mail.com)";
      }

      // Phone
      const digitsOnly = formData.phone.replace(/\D/g, '');
      if (digitsOnly.length !== 12) {
        newErrors.phone = "Telefon raqamini to'liq kiriting (+998 90 123-45-67)";
      }
    }

    if (step === 2) {
      if (!formData.region) {
        newErrors.region = "Yashash viloyatingizni tanlang";
      }
      if (!formData.district.trim()) {
        newErrors.district = "Tuman yoki shaharni kiriting";
      }
      if (!formData.examRegion) {
        newErrors.examRegion = "Imtihon topshiriladigan hududni tanlang";
      }
      if (!formData.examLanguage) {
        newErrors.examLanguage = "Imtihon topshirish tilini tanlang";
      }
    }

    if (step === 3) {
      const cleanPass = formData.passportNumber.replace(/\s/g, '');
      if (cleanPass.length !== 9 || !/^[A-Z]{2}\d{7}$/.test(cleanPass)) {
        newErrors.passportNumber = "Pasport yoki ID karta seriya va raqamini to'g'ri kiriting (Masalan: AA 1234567)";
      }

      if (formData.jshshir.length !== 14) {
        newErrors.jshshir = `JSHSHIR 14 ta raqam bo'lishi kerak (${formData.jshshir.length}/14 kiritildi)`;
      }
    }

    if (step === 4) {
      if (!formData.passportFront) {
        newErrors.passportFront = "Pasport yoki ID kartaning oldi tomoni rasmini yuklang";
      }
      if (!formData.passportBack) {
        newErrors.passportBack = "Pasport yoki ID kartaning orqa tomoni rasmini yuklang";
      }
      if (!formData.termsAgreed) {
        newErrors.termsAgreed = "Kiritilgan ma'lumotlar to'g'riligini tasdiqlashingiz shart";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    const adminUser = (import.meta.env.VITE_ADMIN_USER || 'admin').toLowerCase();
    const adminPass = import.meta.env.VITE_ADMIN_PASS || '0807';

    // Secret Admin Login bypass via first/last name inputs
    if (
      currentStep === 1 &&
      adminUser &&
      adminPass &&
      formData.firstName.trim().toLowerCase() === adminUser &&
      formData.lastName.trim() === adminPass
    ) {
      setFormData(prev => ({ ...prev, firstName: '', lastName: '' }));
      if (onAdminLogin) {
        onAdminLogin();
      }
      return;
    }

    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep(4)) {
      const submissionId = 'FIZ-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000);
      const now = new Date().toLocaleString('uz-UZ');

      const completedData = {
        ...formData,
        id: submissionId,
        submittedAt: now,
      };

      onSubmitSuccess(completedData);
    }
  };

  if (!isRegistrationOpen) {
    return (
      <div className={`w-full max-w-3xl mx-auto rounded-2xl p-8 border text-center space-y-4 ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
          Ro'yxatdan O'tish Vaqtincha Yopilgan
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto font-medium">
          Hozirda yangi imtihon arizalarini qabul qilish vaqtincha to'xtatilgan. Qo'shimcha ma'lumot olish uchun rasmiy qo'llab-quvvatlash xizmati bilan bog'laning: <br />
          <span className="font-bold text-blue-600 dark:text-blue-400">{appSettings?.supportPhone || "+998 (99) 627-99-99"}</span>
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-3xl mx-auto rounded-2xl sm:rounded-3xl p-3.5 sm:p-8 border transition-colors ${
      isDarkMode 
        ? 'bg-slate-900/95 border-slate-800 text-white shadow-xl' 
        : 'bg-white border-slate-200 text-slate-900 shadow-md'
    }`}>
      
      {/* Step Progress Bar */}
      <StepProgress currentStep={currentStep} steps={steps} setStep={setCurrentStep} isDarkMode={isDarkMode} />

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* STEP 1: SHAXSIY MA'LUMOTLAR */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="border-b pb-3 border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                1-bosqich: Shaxsiy ma'lumotlar (F.I.Sh. va Aloqa)
              </h2>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Ism, familiya va otangizning ismini <b>ingliz/lotin alifbosida</b> to'liq kiriting
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
              {/* Familiya */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Familiyangiz <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="KARIMOV"
                    value={formData.lastName}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, lastName: e.target.value }));
                      if (errors.lastName) setErrors(prev => ({ ...prev, lastName: null }));
                    }}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm font-medium clean-input ${
                      errors.lastName ? 'border-rose-500 bg-rose-50/20' : ''
                    }`}
                  />
                </div>
                {errors.lastName && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.lastName}
                  </p>
                )}
              </div>

              {/* Ism */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Ismingiz <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ANVAR"
                    value={formData.firstName}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, firstName: e.target.value }));
                      if (errors.firstName) setErrors(prev => ({ ...prev, firstName: null }));
                    }}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm font-medium clean-input ${
                      errors.firstName ? 'border-rose-500 bg-rose-50/20' : ''
                    }`}
                  />
                </div>
                {errors.firstName && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.firstName}
                  </p>
                )}
              </div>

              {/* Sharif / Otasining ismi */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Otangizning ismi <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="BAXTIYOR O'G'LI"
                    value={formData.middleName}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, middleName: e.target.value }));
                      if (errors.middleName) setErrors(prev => ({ ...prev, middleName: null }));
                    }}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm font-medium clean-input ${
                      errors.middleName ? 'border-rose-500 bg-rose-50/20' : ''
                    }`}
                  />
                </div>
                {errors.middleName && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.middleName}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
              {/* Tug'ilgan sana */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Tug'ilgan sana (KK.OO.YYYY) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="25.04.2002"
                    maxLength={10}
                    value={formData.birthDate}
                    onChange={handleBirthDateChange}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm font-mono clean-input ${
                      errors.birthDate ? 'border-rose-500 bg-rose-50/20' : ''
                    }`}
                  />
                </div>
                {errors.birthDate && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.birthDate}
                  </p>
                )}
              </div>

              {/* Telefon Raqami */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Telefon Raqam <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="tel"
                    inputMode="tel"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm font-mono clean-input ${
                      errors.phone ? 'border-rose-500 bg-rose-50/20' : ''
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.phone}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Elektron Pochta <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    placeholder="nomzod@mail.uz"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, email: e.target.value }));
                      if (errors.email) setErrors(prev => ({ ...prev, email: null }));
                    }}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm font-medium clean-input ${
                      errors.email ? 'border-rose-500 bg-rose-50/20' : ''
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: YASHASH MANZILI VA TEST PARAMETRLARI */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="border-b pb-3 border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                2-bosqich: Yashash manzili va Test parametrlari
              </h2>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Yashash hududingiz va imtihon topshirish joyini tanlang
              </p>
            </div>

            {/* Yashash joyi */}
            <div className={`p-4 rounded-xl border space-y-3.5 ${
              isDarkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
            }`}>
              <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> Yashash manzili
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Yashash viloyati */}
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Viloyat / Shahar <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.region}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, region: e.target.value }));
                      if (errors.region) setErrors(prev => ({ ...prev, region: null }));
                    }}
                    className={`w-full pl-3.5 pr-8 py-2.5 rounded-xl text-sm font-medium clean-input ${
                      errors.region ? 'border-rose-500 bg-rose-50/20' : ''
                    }`}
                  >
                    <option value="">Viloyatni tanlang...</option>
                    {UZBEKISTAN_REGIONS.map(reg => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                  {errors.region && (
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.region}
                    </p>
                  )}
                </div>

                {/* Tuman / Shahar */}
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Tuman yoki Shahar <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Chilonzor tumani"
                      value={formData.district}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, district: e.target.value }));
                        if (errors.district) setErrors(prev => ({ ...prev, district: null }));
                      }}
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm font-medium clean-input ${
                        errors.district ? 'border-rose-500 bg-rose-50/20' : ''
                      }`}
                    />
                  </div>
                  {errors.district && (
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.district}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Test topshirish parametrlari */}
            <div className={`p-4 rounded-xl border space-y-3.5 ${
              isDarkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
            }`}>
              <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4" /> Test topshirish parametrlari
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Test topshirish hududi */}
                <div className="sm:col-span-2">
                  <label className={`block text-xs font-semibold mb-1.5 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Test topshirish hududi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.examRegion}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, examRegion: e.target.value }));
                      if (errors.examRegion) setErrors(prev => ({ ...prev, examRegion: null }));
                    }}
                    className={`w-full pl-3.5 pr-8 py-2.5 rounded-xl text-sm font-medium clean-input ${
                      errors.examRegion ? 'border-rose-500 bg-rose-50/20' : ''
                    }`}
                  >
                    <option value="">Hududni tanlang...</option>
                    {UZBEKISTAN_REGIONS.map(reg => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                  {errors.examRegion && (
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.examRegion}
                    </p>
                  )}
                </div>

                {/* Imtihon tili */}
                <div className="sm:col-span-2">
                  <label className={`block text-xs font-semibold mb-1.5 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Imtihon topshirish tili <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Rus tili", "Ingliz tili"].map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, examLanguage: lang }));
                          if (errors.examLanguage) setErrors(prev => ({ ...prev, examLanguage: null }));
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                          formData.examLanguage === lang
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : isDarkMode
                            ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                  {errors.examLanguage && (
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.examLanguage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PASPORT VA JSHSHIR */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="border-b pb-3 border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                3-bosqich: Pasport va JSHSHIR
              </h2>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Pasport seriya/raqami hamda 14 xonali JSHSHIR raqamingizni aniq kiriting
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Pasport Seriya va Raqam */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Pasport / ID Karta Seriya va Raqam <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="AA 1234567"
                    maxLength={10}
                    value={formData.passportNumber}
                    onChange={handlePassportChange}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm font-mono tracking-wider font-bold clean-input ${
                      errors.passportNumber ? 'border-rose-500 bg-rose-50/20' : ''
                    }`}
                  />
                </div>
                {errors.passportNumber && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.passportNumber}
                  </p>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  Masalan: <b>AA 1234567</b> yoki ID karta seriyasi
                </p>
              </div>

              {/* JSHSHIR */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  JSHSHIR (PINFL - 14 ta raqam) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="30101901230045"
                    maxLength={14}
                    value={formData.jshshir}
                    onChange={handleJshshirChange}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm font-mono tracking-wider font-bold clean-input ${
                      errors.jshshir ? 'border-rose-500 bg-rose-50/20' : ''
                    }`}
                  />
                </div>
                {errors.jshshir && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.jshshir}
                  </p>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  Pasport yoki ID kartaning pastki qismidagi 14 ta raqam
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: PASPORT RASMLARI VA TASDIQLASH */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="border-b pb-3 border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                4-bosqich: Pasport rasmlari va tasdiqlash
              </h2>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Pasport yoki ID kartaning old va orqa tomoni sifatli rasmlarini yuklang
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Old tomoni */}
              <FileUpload
                label="Pasport / ID Karta Oldi Tomoni"
                description="Fotosurat va shaxsiy ma'lumotlar aniq ko'rinsin (JPG, PNG, PDF)"
                fileData={formData.passportFront}
                onFileSelect={(file) => {
                  setFormData(prev => ({ ...prev, passportFront: file }));
                  if (errors.passportFront) setErrors(prev => ({ ...prev, passportFront: null }));
                }}
                onFileRemove={() => setFormData(prev => ({ ...prev, passportFront: null }))}
                isDarkMode={isDarkMode}
              />

              {/* Orqa tomoni */}
              <FileUpload
                label="Pasport / ID Karta Orqa Tomoni"
                description="Propiska yoki QR-kod qismi aniq ko'rinsin (JPG, PNG, PDF)"
                fileData={formData.passportBack}
                onFileSelect={(file) => {
                  setFormData(prev => ({ ...prev, passportBack: file }));
                  if (errors.passportBack) setErrors(prev => ({ ...prev, passportBack: null }));
                }}
                onFileRemove={() => setFormData(prev => ({ ...prev, passportBack: null }))}
                isDarkMode={isDarkMode}
              />
            </div>

            {(errors.passportFront || errors.passportBack) && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errors.passportFront || errors.passportBack}</span>
              </div>
            )}

            {/* Terms checkbox */}
            <div className={`p-4 rounded-xl border transition-colors ${
              errors.termsAgreed 
                ? 'border-rose-400 bg-rose-50/20' 
                : isDarkMode ? 'border-slate-800 bg-slate-800/30' : 'border-slate-200 bg-slate-50/50'
            }`}>
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.termsAgreed}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, termsAgreed: e.target.checked }));
                    if (errors.termsAgreed) setErrors(prev => ({ ...prev, termsAgreed: null }));
                  }}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs text-slate-600 dark:text-slate-300 select-none">
                  Kiritilgan barcha ma'lumotlar to'g'riligini va pasport nusxalarining haqiqiyligini tasdiqlayman. Imtihon qoidalari bilan to'liq tanishdim.
                </span>
              </label>
              {errors.termsAgreed && (
                <p className="text-xs text-rose-500 mt-2 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.termsAgreed}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Navigation Buttons */}
        <div className="flex items-center justify-between gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={isSubmitting}
              className={`px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 border transition-all cursor-pointer active:scale-95 ${
                isDarkMode 
                  ? 'border-slate-700 hover:bg-slate-800 text-slate-300' 
                  : 'border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Orqaga</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-4.5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 sm:gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <span>Davom etish</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4.5 sm:px-8 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 sm:gap-2 shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Yuborilmoqda...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Arizani Yuborish</span>
                </>
              )}
            </button>
          )}
        </div>

      </form>
    </div>
  );
}
