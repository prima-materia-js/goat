import FloatType from '../../data_types/FloatType';

describe('FloatType', () => {
  test('handles null checks', () => {
    const validator = new FloatType().shouldBeNonNull();
    expect(validator.isValid(0)).toBe(true);
    expect(validator.isValid(1.01)).toBe(true);
    expect(validator.isValid(-1.99)).toBe(true);
    expect(validator.isValid(null)).toBe(false);
  });

  test('should check minimum value', () => {
    const validator = new FloatType().shouldHaveMinimumValue(7);
    expect(validator.isValid(7.1)).toBe(true);
    expect(validator.isValid(9.1)).toBe(true);
    expect(validator.isValid(6.5)).toBe(false);
    expect(validator.isValid(6.9)).toBe(false);
    expect(validator.isValid(-7)).toBe(false);
  });

  test('should check maximum value', () => {
    const validator = new FloatType().shouldHaveMaximumValue(10);
    expect(validator.isValid(7.5)).toBe(true);
    expect(validator.isValid(10.0)).toBe(true);
    expect(validator.isValid(11.1)).toBe(false);
  });

  test('returns default value if invalid', () => {
    const validator = new FloatType().shouldBeNonNull().shouldDefaultTo(123.45);
    expect(validator.getValidatedValue(null)).toBe(123.45);
    expect(validator.getValidatedValue(123.0)).toBe(123.0);
    expect(validator.getValidatedValue(45.6)).toBe(45.6);
  });

  test('has correct database type', () => {
    const validator = new FloatType();
    expect(validator.getDBType()).toBe('float');
  });

  test('has correct GraphQL type', () => {
    const nullableValidator = new FloatType();
    const nonNullableValidator = new FloatType().shouldBeNonNull();
    expect(nullableValidator.getGraphQLType()).toBe('Float');
    expect(nonNullableValidator.getGraphQLType()).toBe('Float!');
  });
});
