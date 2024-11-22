import DataType from './DataType';

class BooleanType extends DataType {
  defaultValue: boolean | null;
  private _shouldBeNonNull: boolean;

  constructor() {
    super();
    this.defaultValue = null;
    this._shouldBeNonNull = false;
  }

  shouldDefaultTo(value: boolean | null) {
    this.defaultValue = value;
    return this;
  }

  shouldBeNonNull() {
    this._shouldBeNonNull = true;
    return this;
  }

  isValid(value: boolean | null) {
    if (
      this._shouldBeNonNull === true &&
      (value === null || value === undefined)
    ) {
      return false;
    }

    return true;
  }

  getValidatedValue(value: boolean | null): boolean | null {
    if (!this.isValid(value)) {
      return this.defaultValue;
    }

    if (this.defaultValue !== null && (value === null || value === undefined)) {
      return this.defaultValue;
    }

    return value;
  }

  getDBType() {
    return 'boolean';
  }

  getBaseGraphQLType() {
    return 'Boolean';
  }

  getGraphQLType() {
    return `${this.getBaseGraphQLType()}${this._shouldBeNonNull ? '!' : ''}`;
  }

  toString() {
    let summary = ['boolean'];
    summary.push(this._shouldBeNonNull ? 'non-null' : 'nullable');
    if (!!this.defaultValue) {
      summary.push('default=' + this.defaultValue);
    }

    return summary.join(', ');
  }
}

export default BooleanType;
