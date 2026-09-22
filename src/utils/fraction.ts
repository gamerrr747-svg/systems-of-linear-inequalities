import { FractionData } from '../types';

export class Fraction {
  readonly n: bigint;
  readonly d: bigint;

  constructor(numerator: bigint | number | string, denominator: bigint | number | string = 1n) {
    let n = BigInt(numerator);
    let d = BigInt(denominator);

    if (d === 0n) {
      throw new Error('Denominator cannot be zero');
    }

    if (d < 0n) {
      n = -n;
      d = -d;
    }

    const g = Fraction.gcd(Fraction.absBigInt(n), d);
    this.n = n / g;
    this.d = d / g;
  }

  static fromData(data: FractionData): Fraction {
    return new Fraction(data.n, data.d);
  }

  toData(): FractionData {
    return { n: this.n, d: this.d };
  }

  private static gcd(a: bigint, b: bigint): bigint {
    while (b !== 0n) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  }

  private static absBigInt(a: bigint): bigint {
    return a < 0n ? -a : a;
  }

  static parse(val: string | number | bigint | Fraction): Fraction {
    if (val instanceof Fraction) return val;
    if (typeof val === 'bigint') return new Fraction(val, 1n);
    if (typeof val === 'number') {
      if (Number.isInteger(val)) return new Fraction(val, 1);
      // convert decimal like 0.5 or -0.25 to fraction
      const str = val.toString();
      if (!str.includes('.')) return new Fraction(val, 1);
      const parts = str.split('.');
      const decimals = parts[1].length;
      const denom = 10n ** BigInt(decimals);
      const num = BigInt(parts[0]) * denom + (val < 0 ? -BigInt(parts[1]) : BigInt(parts[1]));
      return new Fraction(num, denom);
    }
    const trimmed = val.trim();
    if (trimmed.includes('/')) {
      const [nStr, dStr] = trimmed.split('/');
      return new Fraction(nStr.trim(), dStr.trim());
    }
    if (trimmed.includes('.')) {
      return Fraction.parse(parseFloat(trimmed));
    }
    return new Fraction(BigInt(trimmed), 1n);
  }

  static zero(): Fraction {
    return new Fraction(0n, 1n);
  }

  static one(): Fraction {
    return new Fraction(1n, 1n);
  }

  add(other: Fraction | number | bigint): Fraction {
    const o = other instanceof Fraction ? other : new Fraction(other);
    return new Fraction(this.n * o.d + o.n * this.d, this.d * o.d);
  }

  sub(other: Fraction | number | bigint): Fraction {
    const o = other instanceof Fraction ? other : new Fraction(other);
    return new Fraction(this.n * o.d - o.n * this.d, this.d * o.d);
  }

  mul(other: Fraction | number | bigint): Fraction {
    const o = other instanceof Fraction ? other : new Fraction(other);
    return new Fraction(this.n * o.n, this.d * o.d);
  }

  div(other: Fraction | number | bigint): Fraction {
    const o = other instanceof Fraction ? other : new Fraction(other);
    if (o.n === 0n) throw new Error('Division by zero');
    return new Fraction(this.n * o.d, this.d * o.n);
  }

  neg(): Fraction {
    return new Fraction(-this.n, this.d);
  }

  abs(): Fraction {
    return new Fraction(this.n < 0n ? -this.n : this.n, this.d);
  }

  inverse(): Fraction {
    if (this.n === 0n) throw new Error('Cannot invert zero');
    return new Fraction(this.d, this.n);
  }

  isZero(): boolean {
    return this.n === 0n;
  }

  isPositive(): boolean {
    return this.n > 0n;
  }

  isNegative(): boolean {
    return this.n < 0n;
  }

  equals(other: Fraction | number | bigint): boolean {
    const o = other instanceof Fraction ? other : new Fraction(other);
    return this.n === o.n && this.d === o.d;
  }

  compare(other: Fraction | number | bigint): number {
    const o = other instanceof Fraction ? other : new Fraction(other);
    const diff = this.n * o.d - o.n * this.d;
    if (diff > 0n) return 1;
    if (diff < 0n) return -1;
    return 0;
  }

  toNumber(): number {
    return Number(this.n) / Number(this.d);
  }

  toString(): string {
    if (this.d === 1n) return this.n.toString();
    return `${this.n}/${this.d}`;
  }

  toLatex(): string {
    if (this.d === 1n) return this.n.toString();
    if (this.n < 0n) {
      return `-\\frac{${-this.n}}{${this.d}}`;
    }
    return `\\frac{${this.n}}{${this.d}}`;
  }

  // Format as coefficient for variable (e.g., "3x_1", "-x_2", "\\frac{1}{2}x_3")
  toCoeffLatex(varName: string, isFirstTerm: boolean = false): string {
    if (this.isZero()) return '';
    const sign = this.isPositive() ? (isFirstTerm ? '' : '+ ') : (isFirstTerm ? '-' : '- ');
    const absFrac = this.abs();
    
    if (absFrac.equals(1)) {
      return `${sign}${varName}`;
    }
    
    if (absFrac.d === 1n) {
      return `${sign}${absFrac.n}${varName}`;
    }
    
    return `${sign}\\frac{${absFrac.n}}{${absFrac.d}}${varName}`;
  }

  // Format as constant term
  toConstantLatex(isFirstTerm: boolean = false): string {
    if (this.isZero()) return '';
    const sign = this.isPositive() ? (isFirstTerm ? '' : '+ ') : (isFirstTerm ? '-' : '- ');
    const absFrac = this.abs();
    if (absFrac.d === 1n) {
      return `${sign}${absFrac.n}`;
    }
    return `${sign}\\frac{${absFrac.n}}{${absFrac.d}}`;
  }
}
