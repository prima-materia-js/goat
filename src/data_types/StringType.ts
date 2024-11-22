import DataType from './DataType';

class StringType extends DataType {
  private _shouldBeNonNull: boolean;
  private _shouldBeNonEmpty: boolean;
  private _shouldAutoTruncate: boolean;
  maxLength: number | null;
  defaultValue: string | null;

  constructor() {
    super();
    this._shouldBeNonNull = false;
    this._shouldBeNonEmpty = false;
    this._shouldAutoTruncate = false;
    this.maxLength = null;
    this.defaultValue = null;
  }

  shouldDefaultTo(value: string) {
    this.defaultValue = value;
    return this;
  }

  shouldBeNonNull() {
    this._shouldBeNonNull = true;
    return this;
  }

  shouldBeNonEmpty() {
    this._shouldBeNonEmpty = true;
    return this;
  }

  shouldHaveMaxLength(length: number, truncate: boolean = false) {
    if (isNaN(length)) {
      console.log('GOAT: Max length specified is not valid: ' + length);
      return this;
    }

    this.maxLength = Number(length);
    this._shouldAutoTruncate = truncate;
    return this;
  }

  isValid(value: string | null) {
    if ((this._shouldBeNonNull || this.defaultValue != null) && value == null) {
      return false;
    }

    if (this._shouldBeNonEmpty && (value ?? '').trim() === '') {
      return false;
    }

    if (!!this.maxLength && (value ?? '').length > this.maxLength) {
      return false;
    }

    return true;
  }

  getValidatedValue(value: string | null) {
    if (this.isValid(value)) {
      return value;
    }

    if (
      this.maxLength != null &&
      value != null &&
      value.length > this.maxLength &&
      this._shouldAutoTruncate
    ) {
      return value.substring(0, this.maxLength);
    }

    if (this.defaultValue != null) {
      return this.defaultValue;
    }

    if (this._shouldBeNonNull) {
      return '';
    }

    return null;
  }

  getDBType() {
    return 'string';
  }

  getBaseGraphQLType() {
    return 'String';
  }

  getGraphQLType() {
    return `${this.getBaseGraphQLType()}${this._shouldBeNonNull ? '!' : ''}`;
  }

  toString() {
    let summary = ['string'];
    summary.push(this._shouldBeNonNull ? 'non-null' : 'nullable');
    if (!!this.defaultValue) {
      summary.push('default=' + this.defaultValue);
    }
    if (!!this._shouldBeNonEmpty) {
      summary.push('non-empty');
    }
    if (!!this.maxLength) {
      summary.push('max-length=' + this.maxLength);
    }

    return summary.join(', ');
  }
}

export default StringType;
