import NumberType from './NumberType';

class IntegerType extends NumberType {
  getBaseGraphQLType() {
    return 'Int';
  }

  getGraphQLType() {
    return `${this.getBaseGraphQLType()}${this._shouldBeNonNull ? '!' : ''}`;
  }

  getDBType() {
    return 'integer';
  }
}

export default IntegerType;
