import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, CreditCard, Key, ArrowRight, ArrowLeft, Check, AlertCircle, Loader2, XCircle } from 'lucide-react';
import StepProgress from './StepProgress';
import FileUpload from './FileUpload';

const INITIAL_FORM_DATA = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '+998 ',
  birthDate: '',
  passportNumber: '',
  jshshir: '',
  examLanguage: 'English',
  examModule: 'GRE General Test',
  passportFront: null,
  passportBack: null,
  termsAgreed: false,
};

export default function RegistrationForm({ onSubmitSuccess, onAdminLogin, isDarkMode, isSubmitting = false, appSettings, resetFormSignal = 0 }) {
  const isRegistrationOpen = appSettings?.registrationOpen ?? true;

  // Persist step across browser refreshes
  const [currentStep, setCurrentStep] = useState(() => {
    try {
      const savedStep = sessionStorage.getItem('ic3_draft_step');
      return savedStep ? Math.min(Math.max(parseInt(savedStep, 10), 1), 4) : 1;
    } catch {
      return 1;
    }
  });

  const [errors, setErrors] = useState({});

  // Persist form inputs across browser refreshes
  const [formData, setFormData] = useState(() => {
    try {
      const savedForm = sessionStorage.getItem('ic3_draft_form_data');
      if (savedForm) {
        return { ...INITIAL_FORM_DATA, ...JSON.parse(savedForm) };
      }
      return INITIAL_FORM_DATA;
    } catch {
      return INITIAL_FORM_DATA;
    }
  });

  // Listen to resetFormSignal to reset form to step 1 upon closing receipt modal
  useEffect(() => {
    if (resetFormSignal > 0) {
      try {
        sessionStorage.removeItem('ic3_draft_step');
        sessionStorage.removeItem('ic3_draft_form_data');
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
      sessionStorage.setItem('ic3_draft_step', currentStep.toString());
    } catch (e) {
      console.warn("Draft step saqlashda xatolik:", e);
    }
  }, [currentStep]);

  // Sync form data changes to sessionStorage with quota fallback
  useEffect(() => {
    try {
      sessionStorage.setItem('ic3_draft_form_data', JSON.stringify(formData));
    } catch {
      try {
        const lightForm = {
          ...formData,
          passportFront: formData.passportFront ? { name: formData.passportFront.name, size: formData.passportFront.size, type: formData.passportFront.type } : null,
          passportBack: formData.passportBack ? { name: formData.passportBack.name, size: formData.passportBack.size, type: formData.passportBack.type } : null,
        };
        sessionStorage.setItem('ic3_draft_form_data', JSON.stringify(lightForm));
      } catch (err) {
        console.warn("Draft data saqlashda xatolik:", err);
      }
    }
  }, [formData]);

  const steps = [
    { id: 1, title: "Shaxsiy ma'lumotlar" },
    { id: 2, title: "Hujjat va JSHSHIR" },
    { id: 3, title: "Imtihon tili" },
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
      if (!formData.firstName.trim()) newErrors.firstName = "Ismingizni kiriting";
      if (!formData.lastName.trim()) newErrors.lastName = "Familiyangizni kiriting";
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email.trim()) {
        newErrors.email = "Elektron pochtangizni kiriting";
      } else if (!emailRegex.test(formData.email)) {
        newErrors.email = "Noto'g'ri email formati (masalan: ali@mail.com)";
      }

      const digitsOnly = formData.phone.replace(/\D/g, '');
      if (digitsOnly.length !== 12) {
        newErrors.phone = "Telefon raqamini to'liq kiriting (+998 90 123-45-67)";
      }
    }

    if (step === 2) {
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
          } else if (year < 1940 || year > 2020) {
            newErrors.birthDate = "Tug'ilgan yil 1940 va 2020 oralig'ida bo'lishi kerak";
          } else {
            const dateObj = new Date(year, month - 1, day);
            if (
              dateObj.getFullYear() !== year ||
              dateObj.getMonth() !== month - 1 ||
              dateObj.getDate() !== day
            ) {
              newErrors.birthDate = "Noto'g'ri sana kiritildi (masalan: 25.04.2000)";
            }
          }
        }
      }

      const cleanPass = formData.passportNumber.replace(/\s/g, '');
      if (cleanPass.length !== 9 || !/^[A-Z]{2}\d{7}$/.test(cleanPass)) {
        newErrors.passportNumber = "Pasport seriya va raqami noto'g'ri (Masalan: AA 1234567)";
      }

      if (formData.jshshir.length !== 14) {
        newErrors.jshshir = `JSHSHIR 14 ta raqam bo'lishi kerak (${formData.jshshir.length}/14 kiritildi)`;
      }
    }

    if (step === 3) {
      if (!formData.examLanguage) {
        newErrors.examLanguage = "Imtihon topshirish tilini tanlang";
      }
    }

    if (step === 4) {
      if (!formData.passportFront) {
        newErrors.passportFront = "Pasport oldi rasmini yuklang";
      }
      if (!formData.passportBack) {
        newErrors.passportBack = "Pasport orqa rasmini yuklang";
      }
      if (!formData.termsAgreed) {
        newErrors.termsAgreed = "Ma'lumotlar to'g'riligini tasdiqlashingiz shart";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    const adminUser = (import.meta.env.VITE_ADMIN_USER || 'admin').toLowerCase();
    const adminPass = import.meta.env.VITE_ADMIN_PASS || '0807';

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
      const submissionId = 'GRE-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000);
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
    <div className={`w-full max-w-3xl mx-auto rounded-2xl p-4 sm:p-8 border transition-colors ${
      isDarkMode 
        ? 'bg-slate-900 border-slate-800' 
        : 'bg-white border-slate-200 shadow-xs'
    }`}>
      
      {/* Step Navigation Bar */}
      <StepProgress currentStep={currentStep} steps={steps} setStep={setCurrentStep} isDarkMode={isDarkMode} />

      <form onSubmit={handleSubmit} className="space-y-6">

        
        {/* STEP 1: SHAXSIY MA'LUMOTLAR */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="border-b pb-3 border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                1-bosqich: Shaxsiy ma'lumotlar
              </h2>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Ism, familiya va aloqa ma'lumotlaringizni to'g'ri kiriting
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Ism */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Ism <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Jasur"
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

              {/* Familiya */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Familiya <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rahimov"
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

              {/* Telefon Raqam */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Telefon Raqam <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="+998 90 123-45-67"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl font-mono text-sm font-medium clean-input ${
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
            </div>
          </div>
        )}

        {/* STEP 2: HUJJAT VA JSHSHIR */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="border-b pb-3 border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                2-bosqich: Pasport va JSHSHIR
              </h2>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Pasport seriyasi va 14 xonali JSHSHIR kodingizni kiriting
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Tug'ilgan sana */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Tug'ilgan Sana <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="25.04.2000"
                    maxLength={10}
                    value={formData.birthDate}
                    onChange={handleBirthDateChange}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl font-mono text-sm font-medium clean-input ${
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

              {/* Pasport Raqami */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Pasport Seriya va Raqam <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="AA 1234567"
                    maxLength={10}
                    value={formData.passportNumber}
                    onChange={handlePassportChange}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl font-mono text-sm font-bold tracking-wider uppercase clean-input ${
                      errors.passportNumber ? 'border-rose-500 bg-rose-50/20' : ''
                    }`}
                  />
                </div>
                {errors.passportNumber && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.passportNumber}
                  </p>
                )}
              </div>

              {/* JSHSHIR */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                  <label className={`block text-xs font-semibold uppercase tracking-wider ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    JSHSHIR (14 xonali shaxsiy kod) <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-xs font-mono ${
                    formData.jshshir.length === 14 
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
                      : isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    {formData.jshshir.length} / 14
                  </span>
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="31204981230045"
                    maxLength={14}
                    value={formData.jshshir}
                    onChange={handleJshshirChange}
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl font-mono text-sm font-bold tracking-widest clean-input ${
                      errors.jshshir ? 'border-rose-500 bg-rose-50/20' : ''
                    }`}
                  />
                  {formData.jshshir.length === 14 && (
                    <Check className="w-4 h-4 absolute right-3.5 top-3 text-emerald-500 stroke-[3]" />
                  )}
                </div>
                {errors.jshshir ? (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.jshshir}
                  </p>
                ) : (
                  <p className={`text-[11px] mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                    JSHSHIR — pasport yoki ID-kartaning pastki qismidagi 14 xonali raqam
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: GRE IMTIHON TURI VA TILI */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b pb-3 border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                3-bosqich: GRE Imtihon Yo'nalishi va Tili
              </h2>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Topshirmoqchi bo'lgan GRE imtihon turi hamda topshirish tilini tanlang
              </p>
            </div>

            {/* GRE Test Type Selection */}
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2.5 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                GRE Imtihon Yo'nalishi (Test Type) <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* GRE General Test */}
                <div
                  onClick={() => setFormData(prev => ({ ...prev, examModule: 'GRE General Test' }))}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start space-x-3.5 ${
                    formData.examModule === 'GRE General Test'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/20 ring-1 ring-blue-600'
                      : isDarkMode
                      ? 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                    🎓
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-bold text-sm ${
                        formData.examModule === 'GRE General Test'
                          ? 'text-blue-900 dark:text-blue-300'
                          : 'text-slate-900 dark:text-white'
                      }`}>
                        GRE General Test
                      </h3>
                      {formData.examModule === 'GRE General Test' && (
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 stroke-[3] shrink-0" />
                      )}
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${
                      formData.examModule === 'GRE General Test'
                        ? 'text-blue-700 dark:text-blue-300'
                        : isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      Verbal Reasoning, Quantitative Reasoning, Analytical Writing
                    </p>
                  </div>
                </div>

                {/* GRE Subject Test */}
                <div
                  onClick={() => setFormData(prev => ({ ...prev, examModule: 'GRE Subject Test' }))}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start space-x-3.5 ${
                    formData.examModule === 'GRE Subject Test'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/20 ring-1 ring-blue-600'
                      : isDarkMode
                      ? 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                    🔬
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-bold text-sm ${
                        formData.examModule === 'GRE Subject Test'
                          ? 'text-blue-900 dark:text-blue-300'
                          : 'text-slate-900 dark:text-white'
                      }`}>
                        GRE Subject Test
                      </h3>
                      {formData.examModule === 'GRE Subject Test' && (
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 stroke-[3] shrink-0" />
                      )}
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${
                      formData.examModule === 'GRE Subject Test'
                        ? 'text-blue-700 dark:text-blue-300'
                        : isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      Ixtisoslashgan fanlar (Mathematics, Physics, Psychology)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Language Selection */}
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2.5 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Imtihon Topshirish Tili <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* English option */}
                <div
                  onClick={() => setFormData(prev => ({ ...prev, examLanguage: 'English' }))}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center space-x-3.5 ${
                    formData.examLanguage === 'English'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/20 ring-1 ring-blue-600'
                      : isDarkMode
                      ? 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="text-2xl">🇬🇧</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-bold text-sm ${
                        formData.examLanguage === 'English'
                          ? 'text-blue-900 dark:text-blue-300'
                          : 'text-slate-900 dark:text-white'
                      }`}>
                        English
                      </h3>
                      {formData.examLanguage === 'English' && (
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 stroke-[3]" />
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${
                      formData.examLanguage === 'English'
                        ? 'text-blue-700 dark:text-blue-300'
                        : isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      Standard international GRE format
                    </p>
                  </div>
                </div>

                {/* Russian option */}
                <div
                  onClick={() => setFormData(prev => ({ ...prev, examLanguage: 'Russian' }))}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center space-x-3.5 ${
                    formData.examLanguage === 'Russian'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/20 ring-1 ring-blue-600'
                      : isDarkMode
                      ? 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="text-2xl">🇷🇺</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-bold text-sm ${
                        formData.examLanguage === 'Russian'
                          ? 'text-blue-900 dark:text-blue-300'
                          : 'text-slate-900 dark:text-white'
                      }`}>
                        Russian
                      </h3>
                      {formData.examLanguage === 'Russian' && (
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 stroke-[3]" />
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${
                      formData.examLanguage === 'Russian'
                        ? 'text-blue-700 dark:text-blue-300'
                        : isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      Экзамен / инструкции на русском языке
                    </p>
                  </div>
                </div>
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
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Pasportingiz rasmlarini yuklang va ma'lumotlarni tasdiqlang
              </p>
            </div>

            <FileUpload
              label="Pasport Oldi Tarafi Rasmi (Suratli tomoni)"
              description="Surat va pasport ma'lumotlari aniq ko'rinsin (JPG, PNG, WEBP, PDF)"
              fileData={formData.passportFront}
              onFileSelect={(data) => {
                setFormData(prev => ({ ...prev, passportFront: data }));
                if (errors.passportFront) setErrors(prev => ({ ...prev, passportFront: null }));
              }}
              onFileRemove={() => setFormData(prev => ({ ...prev, passportFront: null }))}
              isDarkMode={isDarkMode}
              required={true}
            />
            {errors.passportFront && (
              <p className="text-xs text-rose-500 flex items-center gap-1 font-medium -mt-3">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.passportFront}
              </p>
            )}

            <FileUpload
              label="Pasport Orqa Tarafi Rasmi (JSHSHIR / Propiska tomoni)"
              description="Pasportning orqa sahifasi yoki ID-karta orqasi"
              fileData={formData.passportBack}
              onFileSelect={(data) => {
                setFormData(prev => ({ ...prev, passportBack: data }));
                if (errors.passportBack) setErrors(prev => ({ ...prev, passportBack: null }));
              }}
              onFileRemove={() => setFormData(prev => ({ ...prev, passportBack: null }))}
              isDarkMode={isDarkMode}
              required={true}
            />
            {errors.passportBack && (
              <p className="text-xs text-rose-500 flex items-center gap-1 font-medium -mt-3">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.passportBack}
              </p>
            )}

            {/* Summary Review */}
            <div className={`p-4 rounded-xl border ${
              isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-100/80 border-slate-200'
            }`}>
              <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider mb-2.5">
                Kiritilgan Ma'lumotlar Xulosasi:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                <div>
                  <span className="text-slate-600 dark:text-slate-400 block font-medium">F.I.SH:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formData.lastName} {formData.firstName}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400 block font-medium">Email:</span>
                  <span className="font-bold text-slate-900 dark:text-white truncate block">{formData.email}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400 block font-medium">Telefon:</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">{formData.phone}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400 block font-medium">Pasport:</span>
                  <span className="font-bold font-mono text-blue-700 dark:text-blue-400">{formData.passportNumber}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400 block font-medium">JSHSHIR:</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">{formData.jshshir}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400 block font-medium">GRE Yo'nalishi:</span>
                  <span className="font-bold text-blue-700 dark:text-blue-400">{formData.examModule}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400 block font-medium">Imtihon Tili:</span>
                  <span className="font-bold text-blue-700 dark:text-blue-400">{formData.examLanguage}</span>
                </div>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start space-x-2.5 pt-1">
              <input
                type="checkbox"
                id="termsAgreed"
                checked={formData.termsAgreed}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, termsAgreed: e.target.checked }));
                  if (errors.termsAgreed) setErrors(prev => ({ ...prev, termsAgreed: null }));
                }}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="termsAgreed" className={`text-xs font-medium cursor-pointer leading-relaxed ${
                isDarkMode ? 'text-slate-200' : 'text-slate-800'
              }`}>
                Kiritilgan shaxsiy ma'lumotlar hamda yuklangan pasport rasmlari haqiqiyligini tasdiqlayman.
              </label>
            </div>
            {errors.termsAgreed && (
              <p className="text-xs text-rose-500 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.termsAgreed}
              </p>
            )}
          </div>
        )}


        {/* NAVIGATION BUTTONS */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 border transition-colors ${
                isDarkMode
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4" /> Orqaga
            </button>
          ) : <div />}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>Keyingi bosqich</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs ${
                isSubmitting
                  ? 'bg-emerald-700 text-slate-200 cursor-not-allowed opacity-80'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Yuborilmoqda...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Registratsiyani Yakunlash</span>
                </>
              )}
            </button>
          )}

        </div>
      </form>
    </div>
  );
}


