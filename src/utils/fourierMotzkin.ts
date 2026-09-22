import {
  FractionData,
  LinearInequality,
  IsolatedInequality,
  CompanionPair,
  EliminationStep,
  SubstitutionStep,
  SolverResult,
} from '../types';
import { Fraction } from './fraction';

export function createInequality(
  coeffs: { [varIndex: number]: Fraction | number | bigint | FractionData },
  constant: Fraction | number | bigint | FractionData,
  id: string = Math.random().toString(36).substring(2, 9),
  label?: string
): LinearInequality {
  const cData: { [v: number]: FractionData } = {};
  for (const k in coeffs) {
    const vIdx = parseInt(k, 10);
    const val = coeffs[k];
    const frac = val instanceof Fraction ? val : (typeof val === 'object' && 'n' in val ? Fraction.fromData(val) : Fraction.parse(val));
    if (!frac.isZero()) {
      cData[vIdx] = frac.toData();
    }
  }
  const constFrac = constant instanceof Fraction
    ? constant
    : (typeof constant === 'object' && 'n' in constant ? Fraction.fromData(constant) : Fraction.parse(constant));

  return {
    id,
    coeffs: cData,
    constant: constFrac.toData(),
    label,
  };
}

export function formatInequalityLatex(ineq: LinearInequality, allVars?: number[]): string {
  const varIndices = allVars || Object.keys(ineq.coeffs).map(Number).sort((a, b) => a - b);
  let terms: string[] = [];

  for (const v of varIndices) {
    const coeffData = ineq.coeffs[v];
    if (!coeffData) continue;
    const frac = Fraction.fromData(coeffData);
    if (frac.isZero()) continue;
    const term = frac.toCoeffLatex(`x_{${v}}`, terms.length === 0);
    terms.push(term);
  }

  const cFrac = Fraction.fromData(ineq.constant);
  if (!cFrac.isZero() || terms.length === 0) {
    const cTerm = cFrac.toConstantLatex(terms.length === 0);
    if (cTerm) terms.push(cTerm);
  }

  if (terms.length === 0) {
    terms.push('0');
  }

  return `${terms.join(' ')} \\ge 0`;
}

export function formatSystemLatex(inequalities: LinearInequality[], allVars?: number[]): string {
  if (inequalities.length === 0) return '0 \\ge 0';
  const lines = inequalities.map((ineq) => formatInequalityLatex(ineq, allVars));
  return `\\begin{cases}\n${lines.join(' \\\\\n')}\n\\end{cases}`;
}

export function formatExpressionLatex(
  coeffs: { [v: number]: FractionData },
  constant: FractionData
): string {
  const vars = Object.keys(coeffs).map(Number).sort((a, b) => a - b);
  const terms: string[] = [];

  for (const v of vars) {
    const f = Fraction.fromData(coeffs[v]);
    if (f.isZero()) continue;
    terms.push(f.toCoeffLatex(`x_{${v}}`, terms.length === 0));
  }

  const c = Fraction.fromData(constant);
  if (!c.isZero() || terms.length === 0) {
    const ct = c.toConstantLatex(terms.length === 0);
    if (ct) terms.push(ct);
  }

  return terms.join(' ') || '0';
}

/**
 * Parses user text into linear inequalities
 * Supported formats:
 * 2x1 + 2x2 + 3x3 - 1 >= 0
 * x_1 - x_2 + 2 >= 0
 * -x1 + 2x2 <= 3
 */
export function parseInequalitiesText(text: string): { inequalities: LinearInequality[]; numVars: number } {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#') && !l.startsWith('//'));

  const inequalities: LinearInequality[] = [];
  let maxVar = 1;

  lines.forEach((line, idx) => {
    // clean up commas, semicolons at end, and equation numbering like (1)
    const cleaned = line.replace(/\([0-9]+\)$/, '').replace(/[,;]$/, '').trim();
    
    let relation = '>=';
    let leftSide = cleaned;
    let rightSide = '0';

    if (cleaned.includes('>=')) {
      const parts = cleaned.split('>=');
      leftSide = parts[0];
      rightSide = parts[1] || '0';
      relation = '>=';
    } else if (cleaned.includes('≥')) {
      const parts = cleaned.split('≥');
      leftSide = parts[0];
      rightSide = parts[1] || '0';
      relation = '>=';
    } else if (cleaned.includes('<=')) {
      const parts = cleaned.split('<=');
      leftSide = parts[0];
      rightSide = parts[1] || '0';
      relation = '<=';
    } else if (cleaned.includes('≤')) {
      const parts = cleaned.split('≤');
      leftSide = parts[0];
      rightSide = parts[1] || '0';
      relation = '<=';
    } else if (cleaned.includes('>')) {
      const parts = cleaned.split('>');
      leftSide = parts[0];
      rightSide = parts[1] || '0';
      relation = '>=';
    } else if (cleaned.includes('<')) {
      const parts = cleaned.split('<');
      leftSide = parts[0];
      rightSide = parts[1] || '0';
      relation = '<=';
    }

    // Move right side to left side: leftSide - (rightSide) >= 0 (or <= 0)
    // If <= 0, multiply entire expression by -1 to get >= 0
    const leftParsed = parseExpressionTerms(leftSide);
    const rightParsed = parseExpressionTerms(rightSide);

    // Combine left - right
    const combinedCoeffs: { [v: number]: Fraction } = {};
    const allV = new Set([...Object.keys(leftParsed.coeffs), ...Object.keys(rightParsed.coeffs)].map(Number));
    
    for (const v of allV) {
      const l = leftParsed.coeffs[v] || Fraction.zero();
      const r = rightParsed.coeffs[v] || Fraction.zero();
      const diff = l.sub(r);
      if (!diff.isZero()) {
        combinedCoeffs[v] = diff;
        if (v > maxVar) maxVar = v;
      }
    }

    let combinedConst = leftParsed.constant.sub(rightParsed.constant);

    // If relation was <= 0, flip all signs to >= 0
    if (relation === '<=') {
      for (const v in combinedCoeffs) {
        combinedCoeffs[v] = combinedCoeffs[v].neg();
      }
      combinedConst = combinedConst.neg();
    }

    inequalities.push(createInequality(combinedCoeffs, combinedConst, `ineq-${idx + 1}`));
  });

  return { inequalities, numVars: maxVar };
}

function parseExpressionTerms(exprStr: string): { coeffs: { [v: number]: Fraction }; constant: Fraction } {
  const coeffs: { [v: number]: Fraction } = {};
  let constant = Fraction.zero();

  // Normalize: replace '-' with ' + -', remove spaces, handle 'x_1' or 'x1'
  let s = exprStr.replace(/\s+/g, '');
  // add leading + if not starting with - or +
  if (!s.startsWith('+') && !s.startsWith('-')) {
    s = '+' + s;
  }
  // tokenize by + or -
  const tokens = s.match(/[+-][^+-]+/g) || [];

  for (const tok of tokens) {
    const sign = tok[0] === '-' ? -1 : 1;
    const body = tok.substring(1);
    if (!body) continue;

    // Check if contains variable x or x_
    const xMatch = body.match(/^(.*?)x(?:_?(\d+))?$/i);
    if (xMatch) {
      const coeffPart = xMatch[1];
      const varIndexPart = xMatch[2];
      const varIdx = varIndexPart ? parseInt(varIndexPart, 10) : 1;

      let fracVal = Fraction.one();
      if (coeffPart) {
        fracVal = Fraction.parse(coeffPart);
      }
      if (sign === -1) {
        fracVal = fracVal.neg();
      }

      const existing = coeffs[varIdx] || Fraction.zero();
      coeffs[varIdx] = existing.add(fracVal);
    } else {
      // Constant term
      let cFrac = Fraction.parse(body);
      if (sign === -1) cFrac = cFrac.neg();
      constant = constant.add(cFrac);
    }
  }

  return { coeffs, constant };
}

/**
 * Solves a system of linear inequalities using the Fourier-Motzkin elimination method
 * with step-by-step trace matching the textbook examples.
 */
export function solveFourierMotzkin(
  initialInequalities: LinearInequality[],
  variableOrder?: number[]
): SolverResult {
  if (initialInequalities.length === 0) {
    return {
      isConsistent: true,
      isBounded: true,
      eliminationSteps: [],
      finalSystemLatex: '0 \\ge 0',
      backwardSteps: [],
      particularSolution: {},
      boundednessReason: {
        ru: 'Система тривиальна (пустая).',
        kz: 'Жүйе бос (тривиалды).',
        en: 'The system is trivial (empty).',
      },
      consistencyReason: {
        ru: 'Система совместна.',
        kz: 'Жүйе үйлесімді.',
        en: 'The system is consistent.',
      },
    };
  }

  // Determine all variables involved
  const allVarSet = new Set<number>();
  for (const ineq of initialInequalities) {
    for (const v in ineq.coeffs) {
      if (!Fraction.fromData(ineq.coeffs[v]).isZero()) {
        allVarSet.add(Number(v));
      }
    }
  }

  const allVars = Array.from(allVarSet).sort((a, b) => a - b);
  if (allVars.length === 0) allVars.push(1);

  // Elimination order: default natural order, or custom order
  const order = variableOrder && variableOrder.length > 0
    ? variableOrder.filter((v) => allVars.includes(v))
    : [...allVars];

  // If order didn't include some vars, append them
  for (const v of allVars) {
    if (!order.includes(v)) order.push(v);
  }

  const eliminationSteps: EliminationStep[] = [];
  let currentSystem = [...initialInequalities];
  let isConsistent = true;
  let contradictionStep: EliminationStep | undefined = undefined;

  // We eliminate variables one by one until 1 or 0 variable left, or contradiction found
  // Variables to eliminate: all except possibly the last one (or all of them)
  const varsToEliminate = order.slice(0, order.length - 1);

  let systemCounter = 1;

  for (let sIdx = 0; sIdx < varsToEliminate.length; sIdx++) {
    const targetVar = varsToEliminate[sIdx];
    const systemNum = `(${systemCounter})`;
    const isolatedSystemNum = `(${systemCounter + 1})`;

    const isolatedUpper: IsolatedInequality[] = [];
    const isolatedLower: IsolatedInequality[] = [];
    const isolatedIndependent: IsolatedInequality[] = [];

    // Isolate targetVar in each inequality
    // Inequality: a_k * x_k + sum_{j != k} a_j * x_j + c >= 0
    for (let i = 0; i < currentSystem.length; i++) {
      const ineq = currentSystem[i];
      const coeffData = ineq.coeffs[targetVar];
      const a_k = coeffData ? Fraction.fromData(coeffData) : Fraction.zero();

      if (a_k.isZero()) {
        // Independent of targetVar
        isolatedIndependent.push({
          type: 'independent',
          targetVar,
          expression: {
            coeffs: ineq.coeffs,
            constant: ineq.constant,
          },
          originalIndex: i,
          latex: formatInequalityLatex(ineq),
        });
      } else if (a_k.isNegative()) {
        // Upper bound on x_k:
        // a_k * x_k + P(x) >= 0 where a_k < 0
        // -|a_k| * x_k >= -P(x) => x_k <= P(x) / |a_k|
        // Or in textbook: P(x) / |a_k| >= x_k
        // Let P(x) = sum_{j != k} a_j * x_j + c
        // Then x_k <= P(x) / (-a_k), so (P(x) / (-a_k)) >= x_k
        const divisor = a_k.neg(); // positive number -a_k
        const pCoeffs: { [v: number]: FractionData } = {};
        for (const v in ineq.coeffs) {
          const vNum = Number(v);
          if (vNum === targetVar) continue;
          const val = Fraction.fromData(ineq.coeffs[vNum]).div(divisor);
          if (!val.isZero()) pCoeffs[vNum] = val.toData();
        }
        const pConst = Fraction.fromData(ineq.constant).div(divisor).toData();

        const pExprLatex = formatExpressionLatex(pCoeffs, pConst);
        const upperLatex = `${pExprLatex} \\ge x_{${targetVar}}`;

        isolatedUpper.push({
          type: 'upper',
          targetVar,
          expression: { coeffs: pCoeffs, constant: pConst },
          originalIndex: i,
          latex: upperLatex,
        });
      } else {
        // Lower bound on x_k:
        // a_k * x_k + P(x) >= 0 where a_k > 0
        // a_k * x_k >= -P(x) => x_k >= -P(x) / a_k
        const divisor = a_k; // positive
        const pCoeffs: { [v: number]: FractionData } = {};
        for (const v in ineq.coeffs) {
          const vNum = Number(v);
          if (vNum === targetVar) continue;
          const val = Fraction.fromData(ineq.coeffs[vNum]).neg().div(divisor);
          if (!val.isZero()) pCoeffs[vNum] = val.toData();
        }
        const pConst = Fraction.fromData(ineq.constant).neg().div(divisor).toData();

        const pExprLatex = formatExpressionLatex(pCoeffs, pConst);
        const lowerLatex = `x_{${targetVar}} \\ge ${pExprLatex}`;

        isolatedLower.push({
          type: 'lower',
          targetVar,
          expression: { coeffs: pCoeffs, constant: pConst },
          originalIndex: i,
          latex: lowerLatex,
        });
      }
    }

    // Build isolated system LaTeX: first upper bounds (P >= x_k), then lower bounds (x_k >= P), then independent
    const isolatedLines: string[] = [
      ...isolatedUpper.map((u) => u.latex),
      ...isolatedLower.map((l) => l.latex),
      ...isolatedIndependent.map((ind) => ind.latex),
    ];
    const isolatedSystemLatex = `\\begin{cases}\n${isolatedLines.join(' \\\\\n')}\n\\end{cases}`;

    // Form companion system:
    // Every upper bound >= every lower bound: P_upper >= P_lower <=> P_upper - P_lower >= 0
    const companionPairs: CompanionPair[] = [];
    const nextInequalities: LinearInequality[] = [];

    for (let u = 0; u < isolatedUpper.length; u++) {
      const up = isolatedUpper[u];
      for (let l = 0; l < isolatedLower.length; l++) {
        const lo = isolatedLower[l];
        
        // P_upper >= P_lower
        // P_upper - P_lower >= 0
        const upExprLatex = formatExpressionLatex(up.expression.coeffs, up.expression.constant);
        const loExprLatex = formatExpressionLatex(lo.expression.coeffs, lo.expression.constant);
        const rawComparison = `${upExprLatex} \\ge ${loExprLatex}`;

        // Compute difference: P_upper - P_lower
        const diffCoeffs: { [v: number]: Fraction } = {};
        const combinedVars = new Set([
          ...Object.keys(up.expression.coeffs).map(Number),
          ...Object.keys(lo.expression.coeffs).map(Number),
        ]);

        for (const v of combinedVars) {
          const upVal = up.expression.coeffs[v] ? Fraction.fromData(up.expression.coeffs[v]) : Fraction.zero();
          const loVal = lo.expression.coeffs[v] ? Fraction.fromData(lo.expression.coeffs[v]) : Fraction.zero();
          const d = upVal.sub(loVal);
          if (!d.isZero()) {
            diffCoeffs[v] = d;
          }
        }

        const upC = Fraction.fromData(up.expression.constant);
        const loC = Fraction.fromData(lo.expression.constant);
        const diffConst = upC.sub(loC);

        const simplifiedIneq = createInequality(diffCoeffs, diffConst, `pair-${u}-${l}`);
        const simplifiedLatex = formatInequalityLatex(simplifiedIneq);

        // Check if this pair directly gives a numerical contradiction: e.g. 0*x + c >= 0 with c < 0
        const isAllZeroCoeffs = Object.keys(simplifiedIneq.coeffs).length === 0;
        const isContradiction = isAllZeroCoeffs && Fraction.fromData(simplifiedIneq.constant).isNegative();

        companionPairs.push({
          upperIndex: u,
          lowerIndex: l,
          upperExprLatex: upExprLatex,
          lowerExprLatex: loExprLatex,
          rawComparisonLatex: rawComparison,
          simplifiedInequality: simplifiedIneq,
          simplifiedLatex,
          isContradiction,
        });

        nextInequalities.push(simplifiedIneq);
      }
    }

    // Also include independent inequalities in the companion system
    for (const ind of isolatedIndependent) {
      nextInequalities.push(createInequality(ind.expression.coeffs, ind.expression.constant, `ind-${ind.originalIndex}`));
    }

    // Simplify the companion system: remove duplicates and remove trivial tautologies (0 >= 0 or c >= 0 with c >= 0)
    // But preserve contradictions!
    const filteredNext: LinearInequality[] = [];
    let stepContradiction = false;
    let contradictionLatex = '';

    for (const ineq of nextInequalities) {
      const isAllZero = Object.keys(ineq.coeffs).length === 0;
      const cVal = Fraction.fromData(ineq.constant);

      if (isAllZero) {
        if (cVal.isNegative()) {
          stepContradiction = true;
          contradictionLatex = `${cVal.toLatex()} \\ge 0`;
          filteredNext.push(ineq);
        }
        // if cVal >= 0, it's 0 >= 0 or 2 >= 0, a tautology, ignore
      } else {
        // check if duplicate or scalar multiple
        const isDup = filteredNext.some((existing) => areInequalitiesEquivalent(existing, ineq));
        if (!isDup) {
          filteredNext.push(ineq);
        }
      }
    }

    const companionSimplifiedLatex = formatSystemLatex(filteredNext);

    const step: EliminationStep = {
      stepNumber: sIdx + 1,
      targetVar,
      systemNumber: systemNum,
      inputInequalities: currentSystem,
      inputSystemLatex: formatSystemLatex(currentSystem),
      isolatedSystemNumber: isolatedSystemNum,
      isolatedUpper,
      isolatedLower,
      isolatedIndependent,
      isolatedSystemLatex,
      companionPairs,
      companionSystemNumber: `(${systemCounter + 2})`,
      companionSimplifiedInequalities: filteredNext,
      companionSimplifiedLatex,
      contradictionFound: stepContradiction,
      contradictionReason: stepContradiction
        ? {
            latex: contradictionLatex,
            textRu: `Получено противоречивое неравенство: ${contradictionLatex}. Следовательно, исходная система несовместна.`,
            textKz: `Қайшылықты теңсіздік алынды: ${contradictionLatex}. Демек, бастапқы жүйе үйлесімсіз (шешімі жоқ).`,
            textEn: `A contradictory inequality was obtained: ${contradictionLatex}. Therefore, the system is inconsistent.`,
          }
        : undefined,
    };

    eliminationSteps.push(step);

    if (stepContradiction) {
      isConsistent = false;
      contradictionStep = step;
      break;
    }

    currentSystem = filteredNext;
    systemCounter += 2;
  }

  // Analyze the final remaining system of inequalities
  const lastVar = order[order.length - 1];
  let isBounded = true;
  let finalSystemLatex = formatSystemLatex(currentSystem);

  // Check if final system has any contradictions
  for (const ineq of currentSystem) {
    const isAllZero = Object.keys(ineq.coeffs).length === 0;
    if (isAllZero && Fraction.fromData(ineq.constant).isNegative()) {
      isConsistent = false;
    }
  }

  // Boundedness and particular solution calculation
  const backwardSteps: SubstitutionStep[] = [];
  const particularSolution: { [v: number]: FractionData } = {};

  if (isConsistent) {
    // Determine bounds on the last variable
    let lastVarLower: Fraction | null = null;
    let lastVarUpper: Fraction | null = null;

    for (const ineq of currentSystem) {
      const coeffData = ineq.coeffs[lastVar];
      const a = coeffData ? Fraction.fromData(coeffData) : Fraction.zero();
      const c = Fraction.fromData(ineq.constant);

      if (!a.isZero()) {
        // a * x + c >= 0
        if (a.isPositive()) {
          // x >= -c / a (lower bound)
          const bound = c.neg().div(a);
          if (lastVarLower === null || bound.compare(lastVarLower) > 0) {
            lastVarLower = bound;
          }
        } else {
          // a < 0: -|a| * x >= -c => x <= -c / a = c / |a| (upper bound)
          const bound = c.neg().div(a);
          if (lastVarUpper === null || bound.compare(lastVarUpper) < 0) {
            lastVarUpper = bound;
          }
        }
      }
    }

    // Check consistency of bounds on the last variable
    if (lastVarLower !== null && lastVarUpper !== null && lastVarLower.compare(lastVarUpper) > 0) {
      isConsistent = false;
    } else {
      // Choose particular value for last variable
      let chosenVal: Fraction;
      if (lastVarLower !== null && lastVarUpper !== null) {
        if (lastVarLower.equals(lastVarUpper)) {
          chosenVal = lastVarLower;
        } else {
          // If 0 is in [lastVarLower, lastVarUpper], prefer 0 or an integer
          if (lastVarLower.compare(0) <= 0 && lastVarUpper.compare(0) >= 0) {
            // Pick a simple integer if exists, else midpoint
            chosenVal = pickSimpleValueBetween(lastVarLower, lastVarUpper);
          } else {
            chosenVal = pickSimpleValueBetween(lastVarLower, lastVarUpper);
          }
        }
      } else if (lastVarLower !== null) {
        // Unbounded above: [lower, +inf)
        isBounded = false;
        // pick integer >= lower
        const ceilVal = Math.ceil(lastVarLower.toNumber());
        chosenVal = new Fraction(BigInt(ceilVal), 1n);
      } else if (lastVarUpper !== null) {
        // Unbounded below: (-inf, upper]
        isBounded = false;
        const floorVal = Math.floor(lastVarUpper.toNumber());
        chosenVal = new Fraction(BigInt(floorVal), 1n);
      } else {
        // Completely unconstrained
        isBounded = false;
        chosenVal = Fraction.zero();
      }

      particularSolution[lastVar] = chosenVal.toData();

      // Backward substitution through eliminated variables in reverse order
      for (let sIdx = eliminationSteps.length - 1; sIdx >= 0; sIdx--) {
        const step = eliminationSteps[sIdx];
        const vTarget = step.targetVar;

        // Calculate all bounds for vTarget by substituting known values into isolatedUpper and isolatedLower
        let lowerBound: Fraction | null = null;
        let upperBound: Fraction | null = null;
        const boundsCalculations: SubstitutionStep['boundsCalculations'] = [];

        // Upper bounds: P(x) >= x_target
        for (let uIdx = 0; uIdx < step.isolatedUpper.length; uIdx++) {
          const u = step.isolatedUpper[uIdx];
          const val = evaluateExpression(u.expression.coeffs, u.expression.constant, particularSolution);
          const exprLatex = formatSubstitutedExpression(u.expression.coeffs, u.expression.constant, particularSolution);
          
          boundsCalculations.push({
            boundType: 'upper',
            originInequalityIndex: u.originalIndex,
            substitutedExpressionLatex: `${exprLatex} = ${val.toLatex()}`,
            computedValue: val.toData(),
          });

          if (upperBound === null || val.compare(upperBound) < 0) {
            upperBound = val;
          }
        }

        // Lower bounds: x_target >= P(x)
        for (let lIdx = 0; lIdx < step.isolatedLower.length; lIdx++) {
          const l = step.isolatedLower[lIdx];
          const val = evaluateExpression(l.expression.coeffs, l.expression.constant, particularSolution);
          const exprLatex = formatSubstitutedExpression(l.expression.coeffs, l.expression.constant, particularSolution);

          boundsCalculations.push({
            boundType: 'lower',
            originInequalityIndex: l.originalIndex,
            substitutedExpressionLatex: `${exprLatex} = ${val.toLatex()}`,
            computedValue: val.toData(),
          });

          if (lowerBound === null || val.compare(lowerBound) > 0) {
            lowerBound = val;
          }
        }

        // Check if bounded for this variable
        if (lowerBound === null || upperBound === null) {
          isBounded = false;
        }

        // Choose value for vTarget
        let chosenTarget: Fraction;
        let isExact = false;

        if (lowerBound !== null && upperBound !== null) {
          if (lowerBound.equals(upperBound)) {
            chosenTarget = lowerBound;
            isExact = true;
          } else {
            chosenTarget = pickSimpleValueBetween(lowerBound, upperBound);
          }
        } else if (lowerBound !== null) {
          chosenTarget = lowerBound;
        } else if (upperBound !== null) {
          chosenTarget = upperBound;
        } else {
          chosenTarget = Fraction.zero();
        }

        particularSolution[vTarget] = chosenTarget.toData();

        let resultingInterval = '';
        if (lowerBound !== null && upperBound !== null) {
          if (lowerBound.equals(upperBound)) {
            resultingInterval = `x_{${vTarget}} = ${lowerBound.toLatex()}`;
          } else {
            resultingInterval = `${upperBound.toLatex()} \\ge x_{${vTarget}} \\ge ${lowerBound.toLatex()}`;
          }
        } else if (lowerBound !== null) {
          resultingInterval = `x_{${vTarget}} \\ge ${lowerBound.toLatex()}`;
        } else if (upperBound !== null) {
          resultingInterval = `${upperBound.toLatex()} \\ge x_{${vTarget}}`;
        } else {
          resultingInterval = `x_{${vTarget}} \\in (-\\infty, +\\infty)`;
        }

        backwardSteps.push({
          varIndex: vTarget,
          systemRefNumber: step.isolatedSystemNumber,
          boundsCalculations,
          resultingIntervalLatex: resultingInterval,
          selectedVal: chosenTarget.toData(),
          isExactSinglePoint: isExact,
        });
      }
    }
  }

  // Generate clear explanations for consistency and boundedness
  let ruBoundedReason = '';
  let kzBoundedReason = '';
  let enBoundedReason = '';

  if (!isConsistent) {
    ruBoundedReason = 'Поскольку система несовместна, множество решений пусто.';
    kzBoundedReason = 'Жүйе үйлесімсіз болғандықтан, шешімдер жиыны бос.';
    enBoundedReason = 'Since the system is inconsistent, the solution set is empty.';
  } else if (isBounded) {
    ruBoundedReason = 'Множество решений системы ограничено, так как все переменные замкнуты в конечных интервалах верхних и нижних границ.';
    kzBoundedReason = 'Жүйенің барлық айнымалылары жоғарғы және төменгі ақырлы шектермен шектелгендіктен, шешімдер жиыны шектелген.';
    enBoundedReason = 'The solution set is bounded because all variables are constrained by finite upper and lower bounds.';
  } else {
    ruBoundedReason = 'Множество решений системы неограничено, так как переменные могут принимать сколь угодно большие значения (отсутствует верхняя или нижняя граница).';
    kzBoundedReason = 'Шешімдер жиыны шектелмеген, себебі кейбір айнымалылар шексіз үлкен мәндерді қабылдай алады (жоғарғы немесе төменгі шектеу жоқ).';
    enBoundedReason = 'The solution set is unbounded because variables can take arbitrarily large values without violating the constraints.';
  }

  const ruConsistentReason = isConsistent
    ? 'Система совместна: сопутствующие системы не содержат противоречий и имеют допустимые решения.'
    : 'Система несовместна: в процессе исключения получено противоречивое неравенство.';
  const kzConsistentReason = isConsistent
    ? 'Жүйе үйлесімді: ілеспе жүйелерде қайшылық жоқ және мүмкін шешімдері бар.'
    : 'Жүйе үйлесімсіз (қайшылықты): айнымалыларды жою барысында қайшылықты теңсіздік анықталды.';
  const enConsistentReason = isConsistent
    ? 'The system is consistent: companion systems contain no contradictions and have admissible solutions.'
    : 'The system is inconsistent: a contradiction was obtained during elimination.';

  return {
    isConsistent,
    isBounded,
    eliminationSteps,
    contradictionStep,
    finalSystemLatex,
    backwardSteps,
    particularSolution: isConsistent ? particularSolution : undefined,
    boundednessReason: { ru: ruBoundedReason, kz: kzBoundedReason, en: enBoundedReason },
    consistencyReason: { ru: ruConsistentReason, kz: kzConsistentReason, en: enConsistentReason },
  };
}

function evaluateExpression(
  coeffs: { [v: number]: FractionData },
  constant: FractionData,
  values: { [v: number]: FractionData }
): Fraction {
  let sum = Fraction.fromData(constant);
  for (const v in coeffs) {
    const coeff = Fraction.fromData(coeffs[v]);
    const valData = values[v];
    if (valData) {
      const val = Fraction.fromData(valData);
      sum = sum.add(coeff.mul(val));
    }
  }
  return sum;
}

function formatSubstitutedExpression(
  coeffs: { [v: number]: FractionData },
  constant: FractionData,
  values: { [v: number]: FractionData }
): string {
  const vars = Object.keys(coeffs).map(Number).sort((a, b) => a - b);
  const terms: string[] = [];

  for (const v of vars) {
    const coeff = Fraction.fromData(coeffs[v]);
    if (coeff.isZero()) continue;
    const valData = values[v];
    const valStr = valData ? Fraction.fromData(valData).toLatex() : `x_{${v}}`;
    
    const coeffSign = coeff.isPositive() ? (terms.length === 0 ? '' : '+ ') : (terms.length === 0 ? '-' : '- ');
    const absCoeff = coeff.abs();
    
    let coeffStr = '';
    if (!absCoeff.equals(1)) {
      coeffStr = absCoeff.toLatex() + ' \\cdot ';
    }
    terms.push(`${coeffSign}${coeffStr}(${valStr})`);
  }

  const c = Fraction.fromData(constant);
  if (!c.isZero() || terms.length === 0) {
    const cTerm = c.toConstantLatex(terms.length === 0);
    if (cTerm) terms.push(cTerm);
  }

  return terms.join(' ') || '0';
}

function areInequalitiesEquivalent(a: LinearInequality, b: LinearInequality): boolean {
  // Check if a and b have same non-zero variables
  const aVars = Object.keys(a.coeffs).map(Number).filter((v) => !Fraction.fromData(a.coeffs[v]).isZero());
  const bVars = Object.keys(b.coeffs).map(Number).filter((v) => !Fraction.fromData(b.coeffs[v]).isZero());
  if (aVars.length !== bVars.length) return false;
  for (const v of aVars) {
    if (!bVars.includes(v)) return false;
  }

  if (aVars.length === 0) {
    // Compare constants sign
    const aC = Fraction.fromData(a.constant);
    const bC = Fraction.fromData(b.constant);
    return (aC.isPositive() && bC.isPositive()) || (aC.isNegative() && bC.isNegative()) || (aC.isZero() && bC.isZero());
  }

  // Check scalar multiple: lambda = b.coeffs[v0] / a.coeffs[v0]
  const v0 = aVars[0];
  const aCoeff0 = Fraction.fromData(a.coeffs[v0]);
  const bCoeff0 = Fraction.fromData(b.coeffs[v0]);
  const lambda = bCoeff0.div(aCoeff0);

  // Must be positive scalar multiple for inequality direction to remain >= 0
  if (!lambda.isPositive()) return false;

  for (const v of aVars) {
    const aVal = Fraction.fromData(a.coeffs[v]);
    const bVal = Fraction.fromData(b.coeffs[v]);
    if (!aVal.mul(lambda).equals(bVal)) return false;
  }

  const aConst = Fraction.fromData(a.constant);
  const bConst = Fraction.fromData(b.constant);
  return aConst.mul(lambda).equals(bConst);
}

function pickSimpleValueBetween(lo: Fraction, hi: Fraction): Fraction {
  // If 0 is in [lo, hi], pick 0
  if (lo.compare(0) <= 0 && hi.compare(0) >= 0) {
    return Fraction.zero();
  }

  // Check if any integer is between lo and hi
  const minInt = Math.ceil(lo.toNumber());
  const maxInt = Math.floor(hi.toNumber());
  if (minInt <= maxInt) {
    return new Fraction(BigInt(minInt), 1n);
  }

  // Pick midpoint
  return lo.add(hi).div(new Fraction(2n, 1n));
}
