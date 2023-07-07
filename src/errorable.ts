export type ErrorableSuccess<T> = [T, null];

export type ErrorableError<E> = [null, E];

export type Errorable<T, E = unknown> = ErrorableSuccess<T> | ErrorableError<E>;

export const isSuccess = <T, E>(
  errorable: Errorable<T, E>
): errorable is ErrorableSuccess<T> => errorable[1] === null;

export const isError = <T, E>(
  errorable: Errorable<T, E>
): errorable is ErrorableError<E> => errorable[0] === null;

export type ToSuccessFn<T, E> = (value: T) => Errorable<T, E>;

export const toSuccess = <T, E>(value: T): Errorable<T, E> => [value, null];

export type ToErrorFn<T, E> = (error: E) => Errorable<T, E>;

export const toError = <T, E>(error: E): Errorable<T, E> => [null, error];

export type ErrorableFnError<
  F extends
    | ((...args: any[]) => Promise<Errorable<unknown, Error>>)
    | ((...args: any[]) => Errorable<unknown, Error>)
> = Exclude<Awaited<ReturnType<F>>[1], null>;
