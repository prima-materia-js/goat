abstract class DataType {
  isVisibleOnGraphQL: boolean;

  constructor() {
    this.isVisibleOnGraphQL = true;
  }

  hideOnGraphQL() {
    this.isVisibleOnGraphQL = false;
    return this;
  }

  abstract isValid(value: any): boolean;

  abstract getValidatedValue(value: any): any;

  abstract getDBType(): string;

  abstract getBaseGraphQLType(): string;

  abstract getGraphQLType(): string;
}

export default DataType;
