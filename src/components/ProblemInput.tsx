import React, { useState } from 'react';
import { TEXTBOOK_PROBLEMS } from '../data/textbookProblems';
import { LinearInequality, TextbookProblem } from '../types';
import { createInequality, parseInequalitiesText } from '../utils/fourierMotzkin';
import { Fraction } from '../utils/fraction';
import { useLanguage } from './LanguageContext';
import {
  BookOpen,
  Table,
  FileText,
  Plus,
  Trash2,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ListOrdered,
} from 'lucide-react';

interface ProblemInputProps {
  onSolve: (inequalities: LinearInequality[], order?: number[]) => void;
}

export const ProblemInput: React.FC<ProblemInputProps> = ({ onSolve }) => {
  const { language, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'textbook' | 'matrix' | 'text'>('textbook');
  const [selectedProblemId, setSelectedProblemId] = useState<string>('example-1');

  // Matrix editor state
  const [matrixNumVars, setMatrixNumVars] = useState<number>(3);
  const [matrixRows, setMatrixRows] = useState<
    { coeffs: { [v: number]: string }; constant: string }[]
  >([
    { coeffs: { 1: '2', 2: '2', 3: '3' }, constant: '-1' },
    { coeffs: { 1: '1', 2: '-1', 3: '0' }, constant: '2' },
    { coeffs: { 1: '-1', 2: '2', 3: '-1' }, constant: '0' },
    { coeffs: { 1: '0', 2: '-8', 3: '1' }, constant: '-2' },
  ]);

  // Text editor state
  const [rawText, setRawText] = useState<string>(
    `2x1 + 2x2 + 3x3 - 1 >= 0\nx1 - x2 + 2 >= 0\n-x1 + 2x2 - x3 >= 0\n-8x2 + x3 - 2 >= 0`
  );

  // Elimination order override state
  const [customOrderStr, setCustomOrderStr] = useState<string>('1, 3, 2');
  const [useCustomOrder, setUseCustomOrder] = useState<boolean>(true);

  // Select a textbook problem
  const handleSelectTextbook = (p: TextbookProblem) => {
    setSelectedProblemId(p.id);

    // Populate matrix rows
    const rows = p.inequalities.map((item) => {
      const coeffsObj: { [v: number]: string } = {};
      item.coeffs.forEach((c, cIdx) => {
        coeffsObj[cIdx + 1] = c.toString();
      });
      return {
        coeffs: coeffsObj,
        constant: item.constant.toString(),
      };
    });
    setMatrixNumVars(p.numVars);
    setMatrixRows(rows);

    // Populate text
    const textLines = p.inequalities.map((item) => {
      const parts: string[] = [];
      item.coeffs.forEach((c, cIdx) => {
        if (c !== 0) {
          const sign = c > 0 ? (parts.length === 0 ? '' : '+ ') : (parts.length === 0 ? '-' : '- ');
          const val = Math.abs(c) === 1 ? '' : Math.abs(c).toString();
          parts.push(`${sign}${val}x${cIdx + 1}`);
        }
      });
      if (item.constant !== 0 || parts.length === 0) {
        const sign = item.constant > 0 ? (parts.length === 0 ? '' : '+ ') : (parts.length === 0 ? '-' : '- ');
        parts.push(`${sign}${Math.abs(item.constant)}`);
      }
      return `${parts.join(' ')} >= 0`;
    });
    setRawText(textLines.join('\n'));

    // Set order if provided
    if (p.defaultOrder) {
      setCustomOrderStr(p.defaultOrder.join(', '));
      setUseCustomOrder(true);
    } else {
      const defaultNatural = Array.from({ length: p.numVars }, (_, i) => i + 1);
      setCustomOrderStr(defaultNatural.join(', '));
      setUseCustomOrder(false);
    }

    // Auto solve on preset click
    solveFromProblem(p);
  };

  const solveFromProblem = (p: TextbookProblem) => {
    const ineqs = p.inequalities.map((item, idx) => {
      const cDict: { [v: number]: Fraction } = {};
      item.coeffs.forEach((val, vIdx) => {
        if (val !== 0) cDict[vIdx + 1] = new Fraction(val);
      });
      return createInequality(cDict, new Fraction(item.constant), `textbook-${idx + 1}`);
    });

    const order = p.defaultOrder;
    onSolve(ineqs, order);
  };

  const handleSolve = () => {
    let ineqs: LinearInequality[] = [];

    if (activeTab === 'textbook') {
      const p = TEXTBOOK_PROBLEMS.find((pr) => pr.id === selectedProblemId) || TEXTBOOK_PROBLEMS[0];
      solveFromProblem(p);
      return;
    }

    if (activeTab === 'text') {
      const parsed = parseInequalitiesText(rawText);
      ineqs = parsed.inequalities;
    } else {
      // Matrix tab
      ineqs = matrixRows.map((row, rIdx) => {
        const cDict: { [v: number]: Fraction } = {};
        for (let v = 1; v <= matrixNumVars; v++) {
          const valStr = (row.coeffs[v] || '0').trim();
          try {
            const frac = Fraction.parse(valStr || '0');
            if (!frac.isZero()) cDict[v] = frac;
          } catch {
            // default to 0
          }
        }
        let constFrac = Fraction.zero();
        try {
          constFrac = Fraction.parse(row.constant.trim() || '0');
        } catch {
          // default 0
        }
        return createInequality(cDict, constFrac, `matrix-${rIdx + 1}`);
      });
    }

    let parsedOrder: number[] | undefined = undefined;
    if (useCustomOrder && customOrderStr.trim()) {
      parsedOrder = customOrderStr
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));
    }

    onSolve(ineqs, parsedOrder);
  };

  const addMatrixRow = () => {
    const newCoeffs: { [v: number]: string } = {};
    for (let v = 1; v <= matrixNumVars; v++) {
      newCoeffs[v] = '0';
    }
    setMatrixRows([...matrixRows, { coeffs: newCoeffs, constant: '0' }]);
  };

  const removeMatrixRow = (index: number) => {
    if (matrixRows.length <= 1) return;
    setMatrixRows(matrixRows.filter((_, i) => i !== index));
  };

  const handleMatrixNumVarsChange = (delta: number) => {
    const nextVal = Math.max(1, Math.min(8, matrixNumVars + delta));
    if (nextVal === matrixNumVars) return;

    setMatrixNumVars(nextVal);
    // Update order placeholder
    const natural = Array.from({ length: nextVal }, (_, i) => i + 1);
    setCustomOrderStr(natural.join(', '));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-7 mb-6">
      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
        <div className="flex rounded-xl bg-slate-100/90 p-1">
          <button
            onClick={() => setActiveTab('textbook')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'textbook'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t.selectProblem}</span>
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'matrix'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>{t.matrixInput}</span>
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'text'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t.textInput}</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{language === 'kz' ? 'Оқулықтағы 1–17 есептер дайын' : language === 'ru' ? 'Все примеры 1–17 из книги готовы' : 'Examples 1–17 preloaded'}</span>
        </div>
      </div>

      {/* Tab 1: Textbook Presets */}
      {activeTab === 'textbook' && (
        <div className="space-y-4">
          {/* Textbook Examples (1, 2, 3) */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              {t.textbookExamples}
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {TEXTBOOK_PROBLEMS.filter((p) => p.isExample).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectTextbook(p)}
                  className={`p-3.5 rounded-xl border text-left transition relative flex flex-col justify-between ${
                    selectedProblemId === p.id
                      ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-indigo-900">
                        {language === 'kz' ? p.titleKz : p.titleRu}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                        {p.numVars} {language === 'kz' ? 'айнымалы' : 'перем.'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {language === 'kz' ? p.descriptionKz : p.descriptionRu}
                    </p>
                  </div>
                  {p.defaultOrder && (
                    <div className="mt-2 text-[10px] text-indigo-600 font-medium">
                      Реті: {p.defaultOrder.map((v) => `x_${v}`).join(' → ')}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Textbook Exercises (4 to 17) */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              {t.textbookExercises}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {TEXTBOOK_PROBLEMS.filter((p) => !p.isExample).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectTextbook(p)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                    selectedProblemId === p.id
                      ? 'border-indigo-500 bg-indigo-600 text-white shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  №{p.number} ({p.numVars} вар.)
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Matrix Input */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <span className="text-xs font-medium text-slate-700">
              {language === 'kz' ? 'Айнымалылар саны:' : 'Количество переменных:'}{' '}
              <strong className="text-indigo-600">{matrixNumVars}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleMatrixNumVarsChange(-1)}
                disabled={matrixNumVars <= 1}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 disabled:opacity-40 hover:bg-slate-100"
              >
                -1 {t.removeVariable}
              </button>
              <button
                onClick={() => handleMatrixNumVarsChange(1)}
                disabled={matrixNumVars >= 8}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 disabled:opacity-40 hover:bg-slate-100"
              >
                +1 {t.addVariable}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-medium">
                  <th className="p-2 text-left w-8">#</th>
                  {Array.from({ length: matrixNumVars }, (_, i) => i + 1).map((v) => (
                    <th key={v} className="p-2 text-center font-serif">
                      x_{v}
                    </th>
                  ))}
                  <th className="p-2 text-center">
                    {language === 'kz' ? 'Бос мүше (c)' : 'Свободный член (c)'}
                  </th>
                  <th className="p-2 text-center w-12">≥ 0</th>
                  <th className="p-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody>
                {matrixRows.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-2 text-slate-400 font-mono">({rIdx + 1})</td>
                    {Array.from({ length: matrixNumVars }, (_, i) => i + 1).map((v) => (
                      <td key={v} className="p-1 text-center">
                        <input
                          type="text"
                          value={row.coeffs[v] ?? '0'}
                          onChange={(e) => {
                            const newRows = [...matrixRows];
                            newRows[rIdx].coeffs = {
                              ...newRows[rIdx].coeffs,
                              [v]: e.target.value,
                            };
                            setMatrixRows(newRows);
                          }}
                          className="w-16 px-2 py-1.5 text-center font-mono text-xs border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          placeholder="0"
                        />
                      </td>
                    ))}
                    <td className="p-1 text-center">
                      <input
                        type="text"
                        value={row.constant}
                        onChange={(e) => {
                          const newRows = [...matrixRows];
                          newRows[rIdx].constant = e.target.value;
                          setMatrixRows(newRows);
                        }}
                        className="w-16 px-2 py-1.5 text-center font-mono text-xs border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2 text-center text-slate-600 font-serif">≥ 0</td>
                    <td className="p-1 text-center">
                      <button
                        onClick={() => removeMatrixRow(rIdx)}
                        disabled={matrixRows.length <= 1}
                        className="p-1 text-slate-400 hover:text-rose-500 disabled:opacity-30"
                        title={t.removeInequality}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-start">
            <button
              onClick={addMatrixRow}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 font-medium hover:bg-slate-50 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addInequality}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Text Input */}
      {activeTab === 'text' && (
        <div className="space-y-3">
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={5}
            placeholder={t.inputPlaceholder}
            className="w-full font-mono text-xs p-3.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none leading-relaxed bg-slate-50/50"
          />
          <p className="text-[11px] text-slate-500">
            {language === 'kz'
              ? 'Формат: әр жолда бір теңсіздік (мысалы, 2x1 + 3x2 - 1 >= 0 немесе x1 - x2 <= 2).'
              : 'Формат: по одному неравенству на строку (например, 2x1 + 3x2 - 1 >= 0 или x1 - x2 <= 2).'}
          </p>
        </div>
      )}

      {/* Elimination Sequence Configuration */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-indigo-600 shrink-0" />
          <div>
            <span className="text-xs font-semibold text-slate-800 block">
              {t.eliminationOrder}:
            </span>
            <span className="text-[11px] text-slate-500">
              {t.eliminationOrderHelp}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customOrderStr}
            onChange={(e) => {
              setCustomOrderStr(e.target.value);
              setUseCustomOrder(true);
            }}
            placeholder="e.g. 1, 3, 2"
            className="w-28 px-2.5 py-1 text-xs font-mono border border-slate-200 rounded-lg text-center focus:border-indigo-500 focus:outline-none"
          />
          <button
            onClick={handleSolve}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition active:scale-98"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{t.solveButton}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
