import BooleanType from '../../data_types/BooleanType';

describe('BooleanType', () => {
  test('returns default value', () => {
    const validator = new BooleanType().shouldDefaultTo(true);
    expect(validator.getValidatedValue(null)).toBe(true);
    expect(validator.getValidatedValue(true)).toBe(true);
    expect(validator.getValidatedValue(false)).toBe(false);
  });

  test('allows null values by default', () => {
    const validator = new BooleanType();
    expect(validator.isValid(null)).toBe(true);
    expect(validator.isValid(true)).toBe(true);
    expect(validator.isValid(false)).toBe(true);
  });

  test('disallows null values if shouldBeNonNull is set', () => {
    const validator = new BooleanType().shouldBeNonNull();
    expect(validator.isValid(null)).toBe(false);
    expect(validator.isValid(true)).toBe(true);
    expect(validator.isValid(false)).toBe(true);
  });

  test('has correct database type', () => {
    const validator = new BooleanType();
    expect(validator.getDBType()).toBe('boolean');
  });

  test('has correct GraphQL type', () => {
    const nullableValidator = new BooleanType();
    const nonNullableValidator = new BooleanType().shouldBeNonNull();
    expect(nullableValidator.getGraphQLType()).toBe('Boolean');
    expect(nonNullableValidator.getGraphQLType()).toBe('Boolean!');
  });
});
