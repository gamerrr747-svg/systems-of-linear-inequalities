import React, { useState } from 'react';
import { useLanguage, Language } from './LanguageContext';
import { BookOpenText, HelpCircle, X, ChevronRight } from 'lucide-react';
import { MathView } from './MathView';

export const Header: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [showTheory, setShowTheory] = useState(false);

  return (
    <header className="mb-8">
      {/* Top navigation row */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-serif font-bold text-lg shadow-sm shadow-indigo-200">
            FM
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {t.appName}
            </h1>
            <p className="text-xs text-slate-500 font-normal">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theory button */}
          <button
            onClick={() => setShowTheory(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-lg transition"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{t.theoryTitle}</span>
          </button>

          {/* Language selector */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {(['kz', 'ru', 'en'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition uppercase ${
                  language === lang
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Theory modal */}
      {showTheory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpenText className="w-5 h-5 text-indigo-600" />
                <span>{t.theoryTitle}</span>
              </h2>
              <button
                onClick={() => setShowTheory(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <p>
                {language === 'kz'
                  ? 'Фурье-Моцкин әдісі (ілеспе жүйелер әдісі) — сызықтық теңсіздіктер жүйелерін шешуге және олардың үйлесімділігін тексеруге арналған фундаменталды алгоритм.'
                  : language === 'ru'
                  ? 'Метод исключения переменных Фурье — Моцкина (метод сопутствующих систем) — фундаментальный алгоритм для исследования совместности, ограниченности и нахождения частных решений систем линейных неравенств.'
                  : 'The Fourier-Motzkin elimination method (companion systems method) is a fundamental algorithm for investigating the consistency, boundedness, and finding particular solutions to systems of linear inequalities.'}
              </p>

              <div className="bg-indigo-50/60 rounded-xl p-4 border border-indigo-100">
                <h4 className="font-semibold text-indigo-950 mb-1">
                  {language === 'kz' ? 'Алгоритм қадамдары:' : language === 'ru' ? 'Шаги алгоритма:' : 'Algorithm steps:'}
                </h4>
                <ol className="list-decimal pl-4 space-y-1.5 text-xs text-indigo-900">
                  <li>
                    {language === 'kz'
                      ? 'Айнымалыны оқшаулау: Теңсіздіктерді P(x) ≥ x_k және x_k ≥ P(x) түріндегі мәндес жүйеге келтіру.'
                      : language === 'ru'
                      ? 'Изоляция переменной: Приведение системы к виду P(x) ≥ x_k и x_k ≥ P(x).'
                      : 'Isolate variable: Rewrite inequalities into P(x) ≥ x_k and x_k ≥ P(x).'}
                  </li>
                  <li>
                    {language === 'kz'
                      ? 'Ілеспе жүйе құру: Әр жоғарғы шекті әр төменгі шектен кем емес деп алып, x_k айнымалысын шығарып тастау.'
                      : language === 'ru'
                      ? 'Сопутствующая система: Попарное сопоставление верхних и нижних границ P_верх ≥ P_низ.'
                      : 'Companion system: Pair every upper bound with every lower bound: P_upper ≥ P_lower.'}
                  </li>
                  <li>
                    {language === 'kz'
                      ? 'Қайшылықты тексеру: Егер -5/2 ≥ -2 (яғни -1/2 ≥ 0) сияқты қайшылық алынса, жүйе үйлесімсіз.'
                      : language === 'ru'
                      ? 'Проверка совместности: Если получено противоречие вроде -5/2 ≥ -2, система несовместна.'
                      : 'Check consistency: If a numerical contradiction occurs, system is inconsistent.'}
                  </li>
                  <li>
                    {language === 'kz'
                      ? 'Кері жүріс: Соңғы айнымалының аралығынан мән таңдап, алдыңғы жүйелерге қою арқылы дербес шешімді табу.'
                      : language === 'ru'
                      ? 'Обратный ход: Выбор точки из допустимого интервала и последовательная подстановка в предыдущие системы для нахождения частного решения.'
                      : 'Backward substitution: Select a value in the allowable interval and substitute back.'}
                  </li>
                </ol>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-1">
                  {language === 'kz' ? 'Оқулық анықтамасы (Шектелгендік):' : 'Определение из учебника (Ограниченность):'}
                </h4>
                <p className="text-xs text-slate-600 italic">
                  «По определению множество M векторов из ℝⁿ называется ограниченным, если существует такое число C, что координаты всех векторов из M по абсолютной величине не превосходят C: (x₁, ..., xₙ) ∈ M ⇒ |x₁| ≤ C, ..., |xₙ| ≤ C.»
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowTheory(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
              >
                {language === 'kz' ? 'Түсінікті' : language === 'ru' ? 'Понятно' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
