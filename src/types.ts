import { MetaFunction } from "@remix-run/react";
import {
  RouteComponent,
  ErrorBoundaryComponent,
} from "@remix-run/react/dist/routeModules";
import {
  ActionFunctionArgs,
  ActionFunction,
  LoaderFunctionArgs,
  LoaderFunction,
} from "@remix-run/server-runtime";
import { Effect, Either } from "effect";
import { ComponentType } from "react";
import {
  HttpStatusCode,
  NonRedirectStatus,
  RedirectStatus,
} from "./HttpStatusCode";

export interface _StrongResponse<T, S extends HttpStatusCode>
  extends ResponseInit {
  data: T;
  status: S;
}

export type StrongResponse<T, S extends NonRedirectStatus> = _StrongResponse<
  T,
  S
>;

export type StrongRedirect<T, S extends RedirectStatus> = _StrongResponse<T, S>;

export type PickDataAndStatus<T> = T extends StrongResponse<
  unknown,
  NonRedirectStatus
>
  ? { data: T["data"]; status: T["status"] }
  : NonNullable<unknown>;

export type StrongCallbacks<
  Failure extends StrongResponse<unknown, NonRedirectStatus> = never,
  Success extends StrongResponse<unknown, NonRedirectStatus> = never,
  Redirect extends StrongRedirect<string, RedirectStatus> = never,
> = {
  fail: (failure: Failure) => Effect.Effect<never, Failure, Success | Redirect>;
  succeed: (
    success: Success
  ) => Effect.Effect<never, Failure, Success | Redirect>;
  redirect: (
    redirect: Redirect
  ) => Effect.Effect<never, Failure, Success | Redirect>;
};

export type StrongLoader<
  Failure extends StrongResponse<unknown, NonRedirectStatus> = never,
  Success extends StrongResponse<unknown, NonRedirectStatus> = never,
  Redirect extends StrongRedirect<string, RedirectStatus> = never,
> = (
  args: LoaderFunctionArgs
) => Promise<Either.Either<Failure, Success | Redirect>>;

export type StrongAction<
  Failure extends StrongResponse<unknown, NonRedirectStatus> = never,
  Success extends StrongResponse<unknown, NonRedirectStatus> = never,
  Redirect extends StrongRedirect<string, RedirectStatus> = never,
> = (
  args: ActionFunctionArgs
) => Promise<Either.Either<Failure, Success | Redirect>>;

export type StrongLoaderWithCallbacks<
  Failure extends StrongResponse<unknown, NonRedirectStatus> = never,
  Success extends StrongResponse<unknown, NonRedirectStatus> = never,
  Redirect extends StrongRedirect<string, RedirectStatus> = never,
> = (
  args: LoaderFunctionArgs,
  callbacks: StrongCallbacks<Failure, Success, Redirect>
) => Promise<Either.Either<Failure, Success | Redirect>>;

export type StrongActionWithCallbacks<
  Failure extends StrongResponse<unknown, NonRedirectStatus> = never,
  Success extends StrongResponse<unknown, NonRedirectStatus> = never,
  Redirect extends StrongRedirect<string, RedirectStatus> = never,
> = (
  args: ActionFunctionArgs,
  callbacks: StrongCallbacks<Failure, Success, Redirect>
) => Promise<Either.Either<Failure, Success | Redirect>>;

export type StrongComponent<
  Success extends StrongResponse<unknown, NonRedirectStatus>,
> = ComponentType<PickDataAndStatus<Success>>;

export type StrongErrorBoundary<
  Failure extends StrongResponse<unknown, NonRedirectStatus>,
> = ComponentType<PickDataAndStatus<Failure>>;

export type BuildStrongRemixRouteExportsOpts<
  LoaderSuccess extends StrongResponse<unknown, NonRedirectStatus> = never,
  ActionSuccess extends StrongResponse<unknown, NonRedirectStatus> = never,
  LoaderFailure extends StrongResponse<unknown, NonRedirectStatus> = never,
  LoaderRedirect extends StrongRedirect<string, RedirectStatus> = never,
  ActionFailure extends StrongResponse<unknown, NonRedirectStatus> = never,
  ActionRedirect extends StrongRedirect<string, RedirectStatus> = never,
  RouteId extends string = string,
> = {
  routeId: RouteId;
  loader?: StrongLoader<LoaderFailure, LoaderSuccess, LoaderRedirect>;
  action?: StrongAction<ActionFailure, ActionSuccess, ActionRedirect>;
  Component?: StrongComponent<LoaderSuccess>;
  ErrorBoundary?: StrongErrorBoundary<LoaderFailure | ActionFailure>;
};

export type StrongRemixRouteExports<
  T,
  LoaderSuccess extends StrongResponse<unknown, NonRedirectStatus>,
> = {
  [K in keyof T]: K extends "loader"
    ? LoaderFunction
    : K extends "action"
    ? ActionFunction
    : K extends "Component"
    ? RouteComponent
    : K extends "ErrorBoundary"
    ? ErrorBoundaryComponent
    : K extends "meta"
    ? MetaFunction
    : K extends "routeId"
    ? T[K]
    : never;
} & {
  useRouteLoaderData: () => PickDataAndStatus<LoaderSuccess>;
};
