import React, { useState } from 'react';
import { SolverResult, LinearInequality } from '../types';
import { MathView } from './MathView';
import { useLanguage } from './LanguageContext';
import { Fraction } from '../utils/fraction';
import { CheckCircle2, XCircle, ArrowLeft, ShieldCheck, Sparkles, SlidersHorizontal } from 'lucide-react';

interface BackwardSubstitutionProps {
  solverResult: SolverResult;
  originalInequalities: LinearInequality[];
}

export const BackwardSubstitution: React.FC<BackwardSubstitutionProps> = ({
  solverResult,
  originalInequalities,
}) => {
  const { language, t } = useLanguage();
  const { isConsistent, isBounded, backwardSteps, particularSolution, consistencyReason, boundednessReason } =
    solverResult;

  // Custom user override for particular solution values if they want to experiment
  const [userSolution, setUserSolution] = useState<{ [v: number]: string }>(() => {
    const init: { [v: number]: string } = {};
    if (particularSolution) {
      for (const k in particularSolution) {
        init[Number(k)] = Fraction.fromData(particularSolution[k]).toString();
      }
    }
    return init;
  });

  // Verify solution against original inequalities
  const verificationResults = React.useMemo(() => {
    if (!particularSolution) return [];

    return originalInequalities.map((ineq, idx) => {
      let sum = Fraction.fromData(ineq.constant);
      const substitutedTerms: string[] = [];

      for (const v in ineq.coeffs) {
        const coeff = Fraction.fromData(ineq.coeffs[v]);
        if (coeff.isZero()) continue;

        // Try user solution first, fallback to particular solution
        let valFrac = Fraction.zero();
        try {
          const userStr = userSolution[Number(v)];
          valFrac = userStr ? Fraction.parse(userStr) : Fraction.fromData(particularSolution[Number(v)]);
        } catch {
          valFrac = Fraction.fromData(particularSolution[Number(v)]);
        }

        const product = coeff.mul(valFrac);
        sum = sum.add(product);

        const coeffLatex = coeff.abs().equals(1) ? '' : coeff.abs().toLatex() + ' \\cdot ';
        const sign = coeff.isPositive() ? (substitutedTerms.length === 0 ? '' : '+ ') : (substitutedTerms.length === 0 ? '-' : '- ');
        substitutedTerms.push(`${sign}${coeffLatex}(${valFrac.toLatex()})`);
      }

      const c = Fraction.fromData(ineq.constant);
      if (!c.isZero() || substitutedTerms.length === 0) {
        substitutedTerms.push(c.toConstantLatex(substitutedTerms.length === 0));
      }

      const holds = sum.compare(0) >= 0;
      return {
        index: idx + 1,
        evalString: `${substitutedTerms.join(' ')} = ${sum.toLatex()}`,
        sum,
        holds,
      };
    });
  }, [originalInequalities, particularSolution, userSolution]);

  const allHold = verificationResults.length > 0 && verificationResults.every((r) => r.holds);

  if (!isConsistent) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 sm:p-7 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <XCircle className="w-7 h-7 text-rose-600 shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-rose-950">
              {t.inconsistent}
            </h3>
            <p className="text-xs text-rose-700 mt-0.5">
              {language === 'kz'
                ? consistencyReason.kz
                : language === 'ru'
                ? consistencyReason.ru
                : consistencyReason.en}
            </p>
          </div>
        </div>
        <p className="text-sm text-rose-800 leading-relaxed bg-white/70 rounded-xl p-4 border border-rose-200/80">
          {language === 'kz'
            ? 'Шешімі: Бастапқы теңсіздіктер жүйесі қайшылықты болғандықтан, шешімдер жиыны бос жиын: M = ∅.'
            : language === 'ru'
            ? 'Следовательно, исходная система неравенств несовместна. Множество решений пусто: M = ∅.'
            : 'Therefore, the initial system of inequalities is inconsistent. The solution set is empty: M = ∅.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-7 mb-6">
      {/* Top Banner: Consistent & Boundedness status */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t.consistent}
            </span>
            <span
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                isBounded
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isBounded ? t.bounded : t.unbounded}
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {t.backwardSubstitution} & {t.particularSolution}
          </h3>
        </div>

        {particularSolution && (
          <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl px-4 py-2 text-right">
            <span className="text-xs text-indigo-700 block font-medium">
              {t.finalParticularSolution}:
            </span>
            <span className="font-serif font-semibold text-slate-800 text-base">
              ({Object.keys(particularSolution)
                .map(Number)
                .sort((a, b) => a - b)
                .map((v) => `x_{${v}} = ${Fraction.fromData(particularSolution[v]).toLatex()}`)
                .join(', ')})
            </span>
          </div>
        )}
      </div>

      {/* Boundedness explanation */}
      <div className="mb-6 bg-slate-50 border border-slate-200/80 rounded-xl p-4">
        <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>{t.boundednessCheck}:</span>
        </h4>
        <p className="text-sm text-slate-700 leading-relaxed">
          {language === 'kz'
            ? boundednessReason.kz
            : language === 'ru'
            ? boundednessReason.ru
            : boundednessReason.en}
        </p>
      </div>

      {/* Step by step backward substitution */}
      <div className="space-y-4 mb-6">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4 text-indigo-600" />
          <span>{t.backwardSubstitution} (оқулықтағыдай әр айнымалыны табу жолы):</span>
        </h4>

        {backwardSteps.map((bStep, bIdx) => (
          <div
            key={bIdx}
            className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                  {bIdx + 1}
                </span>
                <span className="font-semibold text-slate-800 text-sm">
                  {language === 'kz'
                    ? `x_${bStep.varIndex} айнымалысының шектерін анықтау (${bStep.systemRefNumber} жүйесіне қою):`
                    : language === 'ru'
                    ? `Определение границ для x_${bStep.varIndex} (подстановка в систему ${bStep.systemRefNumber}):`
                    : `Finding bounds for x_${bStep.varIndex} (substituting into ${bStep.systemRefNumber}):`}
                </span>
              </div>

              <span className="text-xs bg-indigo-50 text-indigo-700 font-medium px-2 py-0.5 rounded-md">
                {t.chosenValue}: <span className="font-serif font-bold">x_{bStep.varIndex} = {Fraction.fromData(bStep.selectedVal).toLatex()}</span>
              </span>
            </div>

            {/* Substituted expressions */}
            <div className="space-y-1.5 mb-3 bg-white p-3 rounded-lg border border-slate-200/60">
              {bStep.boundsCalculations.map((bc, bcIdx) => (
                <div key={bcIdx} className="text-xs text-slate-600 flex items-center gap-2">
                  <span className="w-16 font-medium text-slate-400">
                    {bc.boundType === 'upper'
                      ? (language === 'kz' ? 'Жоғарғы шек:' : 'Верхняя:')
                      : (language === 'kz' ? 'Төменгі шек:' : 'Нижняя:')}
                  </span>
                  <MathView math={bc.substitutedExpressionLatex} />
                </div>
              ))}
            </div>

            {/* Resulting interval */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/60">
              <div className="text-xs text-slate-700">
                <span className="font-medium text-slate-500 mr-2">{t.validInterval}:</span>
                <MathView math={bStep.resultingIntervalLatex} />
              </div>

              {/* Editable input to test custom particular points */}
              <div className="flex items-center gap-2 text-xs">
                <label className="text-slate-500 flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                  <span>x_{bStep.varIndex}:</span>
                </label>
                <input
                  type="text"
                  value={userSolution[bStep.varIndex] ?? Fraction.fromData(bStep.selectedVal).toString()}
                  onChange={(e) =>
                    setUserSolution({
                      ...userSolution,
                      [bStep.varIndex]: e.target.value,
                    })
                  }
                  className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-center font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. -1/8"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Verification table */}
      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-600 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{t.verificationTitle}</span>
          </h4>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              allHold
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {allHold ? t.verificationPassed : t.verificationFailed}
          </span>
        </div>

        <div className="space-y-2">
          {verificationResults.map((vRes) => (
            <div
              key={vRes.index}
              className={`p-2.5 rounded-lg border text-xs flex flex-wrap items-center justify-between gap-2 ${
                vRes.holds
                  ? 'bg-white border-slate-200/80'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-400">({vRes.index})</span>
                <MathView math={vRes.evalString} />
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                {vRes.holds ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ≥ 0 ✓
                  </span>
                ) : (
                  <span className="text-rose-700 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> &lt; 0 ✗
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
