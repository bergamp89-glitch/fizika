import React, { useState, useEffect } from 'react';
import { UploadCloud, FileCheck, Trash2, Eye, AlertCircle, FileText, X } from 'lucide-react';

export default function FileUpload({ label, description, fileData, onFileSelect, onFileRemove, isDarkMode, required = true }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Escape tugmasi bilan preview modalni yopish
  useEffect(() => {
    if (!showPreviewModal) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') setShowPreviewModal(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showPreviewModal]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const compressAndProcessImage = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1000;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        // Fill white background to support transparent PNGs without black background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
        const approxSizeMB = ((compressedDataUrl.length * 0.75) / (1024 * 1024)).toFixed(2);

        onFileSelect({
          name: file.name,
          size: approxSizeMB + ' MB',
          type: 'image/jpeg',
          dataUrl: compressedDataUrl,
          fileObj: file
        });
      };
      img.onerror = () => {
        setError("Rasm joylashda xatolik yuz berdi.");
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const validateAndProcessFile = (file) => {
    setError('');
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError("Fayl hajmi 15 MB dan oshmasligi kerak!");
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError("Faqat rasm (JPG, PNG, WEBP) formatidagi fayllar qabul qilinadi!");
      return;
    }

    compressAndProcessImage(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
          isDarkMode ? 'text-slate-300' : 'text-slate-700'
        }`}>
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
        </label>
        {fileData && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <FileCheck className="w-3.5 h-3.5" /> Yuklandi
          </span>
        )}
      </div>

      {!fileData ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer ${
            isDragging
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10'
              : error
              ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-500/10'
              : isDarkMode
              ? 'border-slate-700 bg-slate-800/40 hover:border-blue-500/50 hover:bg-slate-800/70'
              : 'border-slate-300 bg-slate-50/50 hover:border-blue-500 hover:bg-slate-100/60'
          }`}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              error
                ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                : isDarkMode
                ? 'bg-slate-700 text-blue-400'
                : 'bg-blue-50 text-blue-600'
            }`}>
              <UploadCloud className="w-5 h-5" />
            </div>

            <div>
              <p className={`text-xs font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                Faylni tashlang yoki <span className="text-blue-600 dark:text-blue-400 underline">tanlang</span>
              </p>
              <p className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {description || "JPG, PNG, WEBP (Maks. 5 MB)"}
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-2 text-xs text-rose-500 flex items-center justify-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div className={`p-3 sm:p-3.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
          isDarkMode 
            ? 'bg-slate-800/80 border-slate-700' 
            : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center space-x-2.5 sm:space-x-3 overflow-hidden min-w-0 flex-1">
            {fileData.type && fileData.type.startsWith('image/') ? (
              <div 
                onClick={() => setShowPreviewModal(true)}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 cursor-pointer group relative bg-slate-100 dark:bg-slate-900"
              >
                <img 
                  src={fileData.dataUrl} 
                  alt={fileData.name} 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Eye className="w-4 h-4 text-white" />
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
            )}

            <div className="truncate min-w-0 flex-1">
              <h4 className={`text-xs font-bold truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                {fileData.name}
              </h4>
              <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {fileData.size}
              </p>
            </div>
          </div>


          <div className="flex items-center space-x-1 shrink-0">
            {fileData.type && fileData.type.startsWith('image/') && (
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Ko'rish"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onFileRemove}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="O'chirish"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showPreviewModal && fileData && fileData.type.startsWith('image/') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative max-w-2xl w-full bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {label} — {fileData.name}
              </h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-xl p-2">
              <img src={fileData.dataUrl} alt="Passport preview" className="max-w-full max-h-[65vh] object-contain rounded" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

