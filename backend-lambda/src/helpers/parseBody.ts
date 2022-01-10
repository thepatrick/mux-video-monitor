import { failure, Result, success } from "./result";

export const parseBody = <T>(
  body: string | undefined,
  validator: (possible: unknown) => possible is T,
): Result<Error, T> => {
  if (body === undefined) {
    return failure(new Error('Body does not conform to validator'));
  }

  try {
    const parsed = JSON.parse(body) as unknown;

    if (!validator(parsed)) {
      return failure(new Error('Body does not conform to validator'));
    }

    return success(parsed);
  } catch (err) {
    console.log('Failed to parse body', err);

    return failure(new Error('Body does not conform to validator'));
  }
};