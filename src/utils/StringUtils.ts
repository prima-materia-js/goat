export const convertToUnderscore = (input: string): string => {
  return input.toLowerCase().replace(/\s+/g, '_');
};
