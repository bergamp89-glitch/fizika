import React from 'react';
import { Check } from 'lucide-react';

export default function StepProgress({ currentStep, steps, setStep, isDarkMode }) {
  const currentStepObj = steps.find(s => s.id === currentStep) || steps[0];

  return (
    <div className="w-full mb-5 sm:mb-8">
      {/* Mobile Step Badge (< 640px) */}
      <div className="sm:hidden mb-3 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 shadow-2xs">
          <span>{currentStep}-bosqich:</span>
          <span className="text-slate-900 dark:text-white">{currentStepObj.title}</span>
          <span className="text-slate-400 font-normal">({steps.length} dan {currentStep})</span>
        </span>
      </div>

      <div className="flex items-center justify-between relative max-w-2xl mx-auto px-2 sm:px-4">
        {/* Background Connecting Line */}
        <div className={`absolute left-6 right-6 sm:left-10 sm:right-10 top-4 sm:top-5 -translate-y-1/2 h-0.5 z-0 ${
          isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
        }`}>
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Step Nodes */}
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center flex-1">
              <button
                type="button"
                onClick={() => {
                  if (stepNumber <= currentStep) {
                    setStep(stepNumber);
                  }
                }}
                disabled={stepNumber > currentStep}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-200 shrink-0 ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isCurrent
                    ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-sm scale-105'
                    : isDarkMode
                    ? 'bg-slate-900 text-slate-400 border border-slate-700'
                    : 'bg-white text-slate-600 border border-slate-300'
                } ${stepNumber <= currentStep ? 'cursor-pointer hover:opacity-90 active:scale-95' : 'cursor-not-allowed'}`}
                aria-label={`${stepNumber}-bosqich: ${step.title}`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[2.5]" />
                ) : (
                  <span>{stepNumber}</span>
                )}
              </button>

              {/* Step Title for Tablet/Desktop */}
              <div className="hidden sm:block mt-2 text-center px-1 w-full">
                <span className={`text-xs font-semibold block leading-tight max-w-[120px] mx-auto ${
                  isCurrent 
                    ? 'text-blue-600 dark:text-blue-400 font-bold' 
                    : isCompleted 
                    ? 'text-slate-800 dark:text-slate-200' 
                    : isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {step.title}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
