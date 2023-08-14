type FailureT<T> = { ok: false; value: T };
type SuccessT<T> = { ok: true; value: T };

export type Result<Failure, Success> = FailureT<Failure> | SuccessT<Success>;

export const failure = <L = never, R = never>(value: L): Result<L, R> => ({ ok: false, value });

export const success = <L = never, R = never>(value: R): Result<L, R> => ({ ok: true, value });

export const isFailure = <Failure, Success>(value: Result<Failure, Success>): value is FailureT<Failure> =>
  value.ok === false;

export const isSuccess = <Failure, Success>(value: Result<Failure, Success>): value is SuccessT<Success> =>
  value.ok === true;

export const successValue = <T>(input: SuccessT<T>): T => input.value;
