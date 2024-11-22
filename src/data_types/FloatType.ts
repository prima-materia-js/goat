import NumberType from './NumberType';

class FloatType extends NumberType {
  getBaseGraphQLType() {
    return 'Float';
  }

  getGraphQLType() {
    return `${this.getBaseGraphQLType()}${this._shouldBeNonNull ? '!' : ''}`;
  }

  getDBType() {
    return 'float';
  }
}

export default FloatType;
