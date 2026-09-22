import React, { useState } from 'react';
import { EliminationStep } from '../types';
import { MathView } from './MathView';
import { useLanguage } from './LanguageContext';
import { ChevronDown, ChevronUp, AlertTriangle, ArrowRight, Layers } from 'lucide-react';

interface StepCardProps {
  step: EliminationStep;
  totalSteps: number;
}

export const StepCard: React.FC<StepCardProps> = ({ step, totalSteps }) => {
  const { language, t } = useLanguage();
  const [showPairDetails, setShowPairDetails] = useState(false);

  return (
    <div
      id={`step-card-${step.stepNumber}`}
      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-7 mb-6 transition-all hover:shadow-md"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-sm border border-indigo-100">
            {step.stepNumber}
          </span>
          <div>
            <h3 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
              <span>{t.step} {step.stepNumber}:</span>
              <span className="text-indigo-600 font-serif">
                x_{step.targetVar}
              </span>
              <span className="text-slate-600 font-normal text-sm">
                ({language === 'kz' ? `x_${step.targetVar} айнымалысын жою` : language === 'ru' ? `исключение переменной x_${step.targetVar}` : `eliminating variable x_${step.targetVar}`})
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'kz'
                ? `Жүйе ${step.systemNumber} → мәндес жүйе ${step.isolatedSystemNumber} → ілеспе жүйе ${step.companionSystemNumber}`
                : language === 'ru'
                ? `Система ${step.systemNumber} → равносильная ${step.isolatedSystemNumber} → сопутствующая ${step.companionSystemNumber}`
                : `System ${step.systemNumber} → equivalent ${step.isolatedSystemNumber} → companion ${step.companionSystemNumber}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
            {step.companionPairs.length} {language === 'kz' ? 'жұп түзілді' : language === 'ru' ? 'пар неравенств' : 'pairs formed'}
          </span>
        </div>
      </div>

      {/* Part 1: Initial system at this stage */}
      <div className="mb-6">
        <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          <span>{t.initialSystem} {step.systemNumber}:</span>
        </div>
        <div className="bg-slate-50/70 border border-slate-200/60 rounded-xl p-4 flex justify-center items-center">
          <MathView math={step.inputSystemLatex} displayMode />
        </div>
      </div>

      {/* Part 2: Equivalent system (rewritten to isolate target variable) */}
      <div className="mb-6">
        <p className="text-sm text-slate-700 mb-2">
          {language === 'kz' && (
            <span>
              Бұл жүйеден <strong>x_{step.targetVar}</strong> айнымалысын оқшаулайтын мәндес жүйеге көшеміз (әр теңсіздік{' '}
              <span className="font-serif">P(x) ≥ x_{step.targetVar}</span> немесе{' '}
              <span className="font-serif">x_{step.targetVar} ≥ P(x)</span> түрінде жазылады):
            </span>
          )}
          {language === 'ru' && (
            <span>
              Переходим от данной системы к равносильной, в которой каждое неравенство имеет вид{' '}
              <span className="font-serif">P(x) ≥ x_{step.targetVar}</span> или{' '}
              <span className="font-serif">x_{step.targetVar} ≥ P(x)</span> (или вовсе не содержит x_{step.targetVar}):
            </span>
          )}
          {language === 'en' && (
            <span>
              Rewrite into an equivalent system where each inequality is of the form{' '}
              <span className="font-serif">P(x) ≥ x_{step.targetVar}</span> or{' '}
              <span className="font-serif">x_{step.targetVar} ≥ P(x)</span>:
            </span>
          )}
        </p>

        <div className="bg-amber-50/40 border border-amber-200/50 rounded-xl p-4 flex flex-col items-center">
          <span className="text-xs text-amber-800/80 font-medium mb-1">
            {t.equivalentSystem} {step.isolatedSystemNumber}:
          </span>
          <MathView math={step.isolatedSystemLatex} displayMode />
        </div>
      </div>

      {/* Part 3: Companion system (combining upper and lower bounds) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-slate-700">
            {language === 'kz' && (
              <span>
                Осы жүйеден <strong>x_{step.targetVar}</strong> айнымалысын «жою» (шығарып тастау) арқылы{' '}
                <strong>ілеспе жүйені (сопутствующая система)</strong> аламыз:
              </span>
            )}
            {language === 'ru' && (
              <span>
                Из этой системы «исключением» <strong>x_{step.targetVar}</strong> получаем сопутствующую систему:
              </span>
            )}
            {language === 'en' && (
              <span>
                By eliminating <strong>x_{step.targetVar}</strong>, we construct the companion system:
              </span>
            )}
          </p>

          {step.companionPairs.length > 0 && (
            <button
              onClick={() => setShowPairDetails(!showPairDetails)}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium bg-indigo-50/60 px-2.5 py-1 rounded-lg transition"
            >
              <span>{showPairDetails ? (language === 'kz' ? 'Жұптарды жасыру' : 'Скрыть пары') : (language === 'kz' ? 'Жұптарды көрсету' : 'Показать пары')}</span>
              {showPairDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Detailed pairs breakdown (collapsible) */}
        {showPairDetails && (
          <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <p className="text-xs font-semibold text-slate-600 mb-1">
              {t.formedPairs} (Upper Bound ≥ Lower Bound):
            </p>
            {step.companionPairs.map((pair, pIdx) => (
              <div
                key={pIdx}
                className="text-xs font-mono bg-white p-2 rounded-lg border border-slate-200/80 flex flex-wrap items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">#{pIdx + 1}:</span>
                  <MathView math={pair.rawComparisonLatex} />
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <ArrowRight className="w-3 h-3" />
                  <MathView math={pair.simplifiedLatex} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Simplified Companion System */}
        <div className="bg-emerald-50/40 border border-emerald-200/60 rounded-xl p-4 flex flex-col items-center">
          <span className="text-xs text-emerald-800 font-medium mb-1">
            {t.simplifiedCompanionSystem} {step.companionSystemNumber}:
          </span>
          <MathView math={step.companionSimplifiedLatex} displayMode />
        </div>
      </div>

      {/* Contradiction alert if found */}
      {step.contradictionFound && step.contradictionReason && (
        <div className="mt-4 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-900">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm text-rose-900">
              {t.contradiction}
            </h4>
            <div className="my-2 bg-white/80 border border-rose-200 rounded-lg p-2 inline-block">
              <MathView math={step.contradictionReason.latex} />
            </div>
            <p className="text-xs text-rose-800 leading-relaxed">
              {language === 'kz'
                ? step.contradictionReason.textKz
                : language === 'ru'
                ? step.contradictionReason.textRu
                : step.contradictionReason.textEn}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
