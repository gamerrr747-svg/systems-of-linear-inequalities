import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './components/LanguageContext';
import { Header } from './components/Header';
import { ProblemInput } from './components/ProblemInput';
import { StepCard } from './components/StepCard';
import { BackwardSubstitution } from './components/BackwardSubstitution';
import { TEXTBOOK_PROBLEMS } from './data/textbookProblems';
import { LinearInequality, SolverResult } from './types';
import { createInequality, solveFourierMotzkin, formatSystemLatex } from './utils/fourierMotzkin';
import { Fraction } from './utils/fraction';
import { Copy, Check, FileDown, ArrowDownCircle, BookOpen } from 'lucide-react';

function SolverDashboard() {
  const { language, t } = useLanguage();

  // Current problem inequalities & variable order
  const [currentInequalities, setCurrentInequalities] = useState<LinearInequality[]>([]);
  const [currentOrder, setCurrentOrder] = useState<number[] | undefined>(undefined);
  const [solverResult, setSolverResult] = useState<SolverResult | null>(null);
  const [copiedLatex, setCopiedLatex] = useState(false);

  // Initialize with Example 1 on load
  useEffect(() => {
    const ex1 = TEXTBOOK_PROBLEMS[0];
    const ineqs = ex1.inequalities.map((item, idx) => {
      const cDict: { [v: number]: Fraction } = {};
      item.coeffs.forEach((val, vIdx) => {
        if (val !== 0) cDict[vIdx + 1] = new Fraction(val);
      });
      return createInequality(cDict, new Fraction(item.constant), `init-${idx + 1}`);
    });

    setCurrentInequalities(ineqs);
    setCurrentOrder(ex1.defaultOrder);
    const res = solveFourierMotzkin(ineqs, ex1.defaultOrder);
    setSolverResult(res);
  }, []);

  const handleSolve = (inequalities: LinearInequality[], order?: number[]) => {
    setCurrentInequalities(inequalities);
    setCurrentOrder(order);
    const res = solveFourierMotzkin(inequalities, order);
    setSolverResult(res);
  };

  const handleCopyLatex = () => {
    if (!solverResult) return;

    let text = `% Fourier-Motzkin Elimination\n`;
    text += `% Initial System\n\\[\n${formatSystemLatex(currentInequalities)}\n\\]\n\n`;

    solverResult.eliminationSteps.forEach((s) => {
      text += `% Step ${s.stepNumber}: Eliminate x_${s.targetVar}\n`;
      text += `Equivalent system:\n\\[\n${s.isolatedSystemLatex}\n\\]\n`;
      text += `Companion system:\n\\[\n${s.companionSimplifiedLatex}\n\\]\n\n`;
    });

    if (solverResult.isConsistent && solverResult.particularSolution) {
      text += `% Particular Solution:\n`;
      const solTerms = Object.keys(solverResult.particularSolution)
        .map(Number)
        .sort((a, b) => a - b)
        .map((v) => `x_{${v}} = ${Fraction.fromData(solverResult.particularSolution![v]).toLatex()}`);
      text += `\\[ (${solTerms.join(', ')}) \\]\n`;
    }

    navigator.clipboard.writeText(text);
    setCopiedLatex(true);
    setTimeout(() => setCopiedLatex(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 font-sans antialiased text-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Top Header & Theory Modal */}
        <Header />

        {/* Problem Selection & Configuration */}
        <ProblemInput onSolve={handleSolve} />

        {/* Results Container */}
        {solverResult && (
          <main className="space-y-6">
            {/* Steps Header & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  {t.stepByStepSolution}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-medium">
                  {solverResult.eliminationSteps.length} {language === 'kz' ? 'кезең' : language === 'ru' ? 'этапов' : 'steps'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLatex}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                >
                  {copiedLatex ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedLatex ? t.copiedLatex : t.exportLatex}</span>
                </button>
              </div>
            </div>

            {/* Step-by-step cards */}
            <div className="space-y-6">
              {solverResult.eliminationSteps.map((step) => (
                <StepCard
                  key={step.stepNumber}
                  step={step}
                  totalSteps={solverResult.eliminationSteps.length}
                />
              ))}
            </div>

            {/* Backward Substitution & Consistency / Boundedness Check */}
            <BackwardSubstitution
              solverResult={solverResult}
              originalInequalities={currentInequalities}
            />
          </main>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <SolverDashboard />
    </LanguageProvider>
  );
}
