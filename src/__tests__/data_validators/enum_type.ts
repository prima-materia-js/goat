import EnumType from '../../data_types/EnumType';

describe('EnumType', () => {
  let validator: EnumType;
  let options = ['Option A', 'Option B', 'Option C'];

  beforeEach(() => {
    validator = new EnumType().shouldBeOneOf(options);
  });

  test('accepts valid values', () => {
    options.forEach((option) => {
      expect(validator.isValid(option)).toBe(true);
    });
  });

  test('returns valid values', () => {
    options.forEach((option) => {
      expect(validator.getValidatedValue(option)).toBe(option);
    });
  });

  test('rejects invalid values', () => {
    expect(validator.isValid('Option D')).toBe(false);
    expect(validator.getValidatedValue('Option D')).toBeNull();
  });

  test('handles null validation', () => {
    expect(validator.isValid(null)).toBe(true);

    validator = validator.shouldBeNonNull();
    expect(validator.isValid(null)).toBe(false);
  });

  test('returns default value', () => {
    validator = validator.shouldBeNonNull().shouldDefaultTo('Option A');
    expect(validator.getValidatedValue(null)).toBe('Option A');
  });

  test('has correct database type', () => {
    expect(validator.getDBType()).toBe('string');
  });

  test('has correct GraphQL type', () => {
    const nullableValidator = new EnumType();
    const nonNullableValidator = new EnumType().shouldBeNonNull();
    expect(nullableValidator.getGraphQLType()).toBe('String');
    expect(nullableValidator.getGraphQLType('ExampleEnum')).toBe('ExampleEnum');
    expect(nonNullableValidator.getGraphQLType('ExampleEnum')).toBe(
      'ExampleEnum!'
    );
  });
});
