import DataType from './DataType';

class EnumType extends DataType {
  options: string[];
  defaultValue: string | null;
  private _shouldBeNonNull: boolean;

  constructor() {
    super();
    this.options = [];
    this._shouldBeNonNull = false;
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

  shouldBeOneOf(options: string[]) {
    this.options = options;
    return this;
  }

  isValid(value: string | null) {
    if (value == null) {
      return !this._shouldBeNonNull;
    }

    if (this.options.indexOf(value) === -1) {
      return false;
    }

    return true;
  }

  getValidatedValue(value: string | null) {
    if (!this.isValid(value)) {
      return this.defaultValue;
    }

    return value;
  }

  getDBType() {
    return 'string';
  }

  getBaseGraphQLType(name?: string) {
    return name ?? 'String';
  }

  getGraphQLType(name?: string): string {
    return `${this.getBaseGraphQLType(name)}${
      this._shouldBeNonNull ? '!' : ''
    }`;
  }

  getGraphQLEnumDefinition(name: string) {
    return (
      `  enum ${name[0].toUpperCase()}${name.slice(1)} {\n` +
      `    ${this.options.join('\n    ')}\n` +
      `  }`
    );
  }

  toString() {
    let summary = ['enum'];
    summary.push(this._shouldBeNonNull ? 'non-null' : 'nullable');
    if (!!this.defaultValue) {
      summary.push('default=' + this.defaultValue);
    }
    summary.push(`options=${this.options.join('|')}`);

    return summary.join(', ');
  }
}

export default EnumType;
