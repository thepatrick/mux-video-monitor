export const notUndefined = <T>(input: T | undefined): input is T => {
  return input !== undefined;
};
