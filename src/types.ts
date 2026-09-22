export interface FractionData {
  n: bigint;
  d: bigint;
}

export interface LinearInequality {
  id: string;
  // coefficients for x1, x2, ..., xn (1-indexed mapping or array 0..n-1)
  coeffs: { [varIndex: number]: FractionData };
  // constant term c in: sum(a_i * x_i) + c >= 0
  constant: FractionData;
  label?: string; // e.g. "(1)", "(2)"
}

export interface IsolatedInequality {
  type: 'upper' | 'lower' | 'independent';
  targetVar: number;
  // If upper: P(x) >= x_k  (coeffs and constant of P(x))
  // If lower: x_k >= P(x)  (coeffs and constant of P(x))
  // If independent: sum(a_i * x_i) + c >= 0
  expression: {
    coeffs: { [varIndex: number]: FractionData };
    constant: FractionData;
  };
  originalIndex: number;
  latex: string;
}

export interface CompanionPair {
  upperIndex: number;
  lowerIndex: number;
  upperExprLatex: string;
  lowerExprLatex: string;
  rawComparisonLatex: string; // "P_upper >= P_lower"
  simplifiedInequality: LinearInequality;
  simplifiedLatex: string;
  isContradiction?: boolean;
}

export interface EliminationStep {
  stepNumber: number;
  targetVar: number;
  systemNumber: string; // e.g., "(1)", "(2)"
  inputInequalities: LinearInequality[];
  inputSystemLatex: string;
  
  // Isolated system: P >= x_k, x_k >= P, independent
  isolatedSystemNumber: string;
  isolatedUpper: IsolatedInequality[];
  isolatedLower: IsolatedInequality[];
  isolatedIndependent: IsolatedInequality[];
  isolatedSystemLatex: string;
  
  // Companion pairs formed
  companionPairs: CompanionPair[];
  companionSystemNumber: string;
  
  // Simplified companion system
  companionSimplifiedInequalities: LinearInequality[];
  companionSimplifiedLatex: string;
  
  contradictionFound: boolean;
  contradictionReason?: {
    latex: string;
    textRu: string;
    textKz: string;
    textEn: string;
  };
}

export interface VariableInterval {
  varIndex: number;
  lowerBound: FractionData | null; // null means -infinity
  upperBound: FractionData | null; // null means +infinity
  isSinglePoint: boolean;
  chosenValue?: FractionData;
  substitutionLatex?: string;
}

export interface SubstitutionStep {
  varIndex: number;
  systemRefNumber: string;
  boundsCalculations: {
    boundType: 'upper' | 'lower';
    originInequalityIndex: number;
    substitutedExpressionLatex: string;
    computedValue: FractionData;
  }[];
  resultingIntervalLatex: string;
  selectedVal: FractionData;
  isExactSinglePoint: boolean;
}

export interface SolverResult {
  isConsistent: boolean;
  isBounded: boolean;
  eliminationSteps: EliminationStep[];
  contradictionStep?: EliminationStep;
  finalSystemLatex: string;
  backwardSteps: SubstitutionStep[];
  particularSolution?: { [varIndex: number]: FractionData };
  boundednessReason: {
    ru: string;
    kz: string;
    en: string;
  };
  consistencyReason: {
    ru: string;
    kz: string;
    en: string;
  };
}

export interface TextbookProblem {
  id: string;
  number: number;
  titleRu: string;
  titleKz: string;
  isExample: boolean;
  pageNumber: number;
  numVars: number;
  defaultOrder?: number[];
  inequalities: {
    coeffs: number[];
    constant: number;
  }[];
  descriptionRu?: string;
  descriptionKz?: string;
}
