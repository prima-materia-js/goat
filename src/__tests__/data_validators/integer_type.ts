import IntegerType from '../../data_types/IntegerType';

describe('IntegerType', () => {
  test('handles null checks', () => {
    const validator = new IntegerType().shouldBeNonNull();
    expect(validator.isValid(0)).toBe(true);
    expect(validator.isValid(1)).toBe(true);
    expect(validator.isValid(-1)).toBe(true);
    expect(validator.isValid(Number.MAX_SAFE_INTEGER)).toBe(true);
    expect(validator.isValid(Number.MIN_SAFE_INTEGER)).toBe(true);
    expect(validator.isValid(null)).toBe(false);
  });

  test('should check minimum value', () => {
    const validator = new IntegerType().shouldHaveMinimumValue(7);
    expect(validator.isValid(7)).toBe(true);
    expect(validator.isValid(9)).toBe(true);
    expect(validator.isValid(6)).toBe(false);
    expect(validator.isValid(-7)).toBe(false);
  });

  test('should check maximum value', () => {
    const validator = new IntegerType().shouldHaveMaximumValue(10);
    expect(validator.isValid(7)).toBe(true);
    expect(validator.isValid(10)).toBe(true);
    expect(validator.isValid(11)).toBe(false);
    expect(validator.isValid(-7)).toBe(true);
  });

  test('returns default value if invalid', () => {
    const validator = new IntegerType().shouldBeNonNull().shouldDefaultTo(123);
    expect(validator.getValidatedValue(null)).toBe(123);
    expect(validator.getValidatedValue(123)).toBe(123);
    expect(validator.getValidatedValue(456)).toBe(456);
  });

  test('has correct database type', () => {
    const validator = new IntegerType();
    expect(validator.getDBType()).toBe('integer');
  });

  test('has correct GraphQL type', () => {
    const nullableValidator = new IntegerType();
    const nonNullableValidator = new IntegerType().shouldBeNonNull();
    expect(nullableValidator.getGraphQLType()).toBe('Int');
    expect(nonNullableValidator.getGraphQLType()).toBe('Int!');
  });
});
