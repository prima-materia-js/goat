import DataType from './DataType';

class DateTimeType extends DataType {
  defaultValue: Date | null;
  private _shouldBeNonNull: boolean;

  constructor() {
    super();
    this.defaultValue = null;
    this._shouldBeNonNull = false;
  }

  shouldDefaultTo(value: Date) {
    if (value.constructor.name === 'Date') {
      this.defaultValue = value;
    }

    return this;
  }

  shouldBeNonNull() {
    this._shouldBeNonNull = true;
    return this;
  }

  isValid(value: Date | null) {
    if (value == null) {
      return !this._shouldBeNonNull;
    }

    if (value.constructor.name !== 'Date') {
      return false;
    }

    return true;
  }

  getValidatedValue(value: Date | null) {
    if (!this.isValid(value)) {
      return this.defaultValue;
    }

    if (this.defaultValue !== null && (value === null || value === undefined)) {
      return this.defaultValue;
    }

    return value;
  }

  getDBType() {
    return 'timestamp';
  }

  getBaseGraphQLType() {
    return 'String';
  }

  getGraphQLType() {
    return `${this.getBaseGraphQLType()}${this._shouldBeNonNull ? '!' : ''}`;
  }

  toString() {
    let summary = ['datetime'];
    summary.push(this._shouldBeNonNull ? 'non-null' : 'nullable');
    if (!!this.defaultValue) {
      summary.push('default=' + this.defaultValue);
    }

    return summary.join(', ');
  }
}

export default DateTimeType;
