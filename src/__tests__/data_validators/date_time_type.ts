import DateTimeType from '../../data_types/DateTimeType';

describe('DateTimeType', () => {
  test('handles null checks', () => {
    let validator = new DateTimeType();
    let date = new Date();

    expect(validator.isValid(null)).toBe(true);
    expect(validator.isValid(date)).toBe(true);

    validator = validator.shouldBeNonNull();
    expect(validator.isValid(null)).toBe(false);
    expect(validator.isValid(date)).toBe(true);
  });

  test('returns default values', () => {
    let validator = new DateTimeType();
    let defaultValue = new Date(new Date().getTime() - 5000000000);
    let date = new Date();

    expect(validator.getValidatedValue(null)).toBe(null);
    expect(validator.getValidatedValue(date)).toBe(date);

    validator = validator.shouldBeNonNull().shouldDefaultTo(defaultValue);
    expect(validator.getValidatedValue(null)).toBe(defaultValue);
    expect(validator.getValidatedValue(date)).toBe(date);
  });

  test('has correct database type', () => {
    const validator = new DateTimeType();
    expect(validator.getDBType()).toBe('timestamp');
  });

  test('has correct GraphQL type', () => {
    const nullableValidator = new DateTimeType();
    const nonNullableValidator = new DateTimeType().shouldBeNonNull();
    expect(nullableValidator.getGraphQLType()).toBe('String');
    expect(nonNullableValidator.getGraphQLType()).toBe('String!');
  });
});
