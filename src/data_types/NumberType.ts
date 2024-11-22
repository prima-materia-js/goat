import DataType from './DataType';

abstract class NumberType extends DataType {
  defaultValue: number | null;
  maxValue: number | null;
  minValue: number | null;
  protected _shouldBeNonNull: boolean;

  constructor() {
    super();
    this.defaultValue = null;
    this._shouldBeNonNull = false;
    this.maxValue = null;
    this.minValue = null;
  }

  shouldDefaultTo(value: number | null) {
    this.defaultValue = this._parse(value);
    return this;
  }

  shouldBeNonNull() {
    this._shouldBeNonNull = true;
    return this;
  }

  shouldHaveMinimumValue(value: number) {
    this.minValue = this._parse(value);
    return this;
  }

  shouldHaveMaximumValue(value: number) {
    this.maxValue = this._parse(value);
    return this;
  }

  isValid(value: number | null) {
    if (value == null) {
      return !this._shouldBeNonNull;
    }

    if (isNaN(value)) {
      return false;
    }

    let pValue = this._parse(value);

    if (this.maxValue != null && pValue != null && pValue > this.maxValue) {
      return false;
    }

    if (this.minValue != null && pValue != null && pValue < this.minValue) {
      return false;
    }

    return true;
  }

  getValidatedValue(value: number | null) {
    if (!this.isValid(value)) {
      return this.defaultValue;
    }

    return this._parse(value);
  }

  toString() {
    let summary = [this.getDBType()];
    summary.push(this._shouldBeNonNull ? 'non-null' : 'nullable');
    if (!!this.defaultValue) {
      summary.push('default=' + this.defaultValue);
    }
    if (!!this.minValue) {
      summary.push('min=' + this.minValue);
    }
    if (!!this.maxValue) {
      summary.push('max=' + this.maxValue);
    }

    return summary.join(', ');
  }

  _parse(value: string | number | null): number | null {
    if (value == null) return null;

    return Number(value);
  }
}

export default NumberType;
