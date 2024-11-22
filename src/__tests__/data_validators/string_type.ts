import StringType from '../../data_types/StringType';

describe('StringType', () => {
  test('returns default value', () => {
    const validator = new StringType().shouldDefaultTo('abc');
    expect(validator.getValidatedValue(null)).toBe('abc');
    expect(validator.getValidatedValue('def')).toBe('def');
    // shouldBeNonEmpty is not set here, so empty strings should be accepted
    expect(validator.getValidatedValue('')).toBe('');
  });

  test('handles empty strings', () => {
    const validator = new StringType().shouldBeNonEmpty();
    expect(validator.isValid('')).toBe(false);
    expect(validator.isValid(null)).toBe(false);
    expect(validator.isValid('abc')).toBe(true);
  });

  test('handles null values', () => {
    const validator = new StringType().shouldBeNonNull();
    expect(validator.isValid(null)).toBe(false);
    expect(validator.isValid('')).toBe(true);
    expect(validator.isValid('abc')).toBe(true);
  });

  test('handles max length check', () => {
    const validator = new StringType().shouldHaveMaxLength(5);
    expect(validator.isValid(null)).toBe(true);
    expect(validator.isValid('')).toBe(true);
    expect(validator.isValid('abc')).toBe(true);
    expect(validator.isValid('abcdef')).toBe(false);
  });

  test('truncates if value exceeds max length and truncate flag is set', () => {
    const validator = new StringType().shouldHaveMaxLength(5, true);
    expect(validator.getValidatedValue('abc')).toBe('abc');
    expect(validator.getValidatedValue('abcde')).toBe('abcde');
    expect(validator.getValidatedValue('abcdef')).toBe('abcde');
  });

  test('has correct database type', () => {
    const validator = new StringType();
    expect(validator.getDBType()).toBe('string');
  });

  test('has correct GraphQL type', () => {
    const nullableValidator = new StringType();
    const nonNullableValidator = new StringType().shouldBeNonNull();
    expect(nullableValidator.getGraphQLType()).toBe('String');
    expect(nonNullableValidator.getGraphQLType()).toBe('String!');
  });
});
