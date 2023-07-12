import { V2_ErrorBoundaryComponent } from "@remix-run/react/dist/routeModules";
import {
  ActionFunction,
  DataFunctionArgs,
  LoaderFunction,
  MetaFunction,
  RouteComponent,
} from "@remix-run/server-runtime";
import { ComponentType } from "react";
import {
  HttpStatusCode,
  NonRedirectStatus,
  RedirectStatus,
} from "./HttpStatusCode";
import * as E from "fp-ts/Either";

export interface StrongResponse<T, S extends HttpStatusCode>
  extends ResponseInit {
  data: T;
  status: S;
}

export type StrongRedirect<
  T extends string,
  S extends RedirectStatus
> = StrongResponse<T, S>;

export type PickDataAndStatus<T> = T extends StrongResponse<
  unknown,
  HttpStatusCode
>
  ? { data: T["data"]; status: T["status"] }
  : never; // eslint-disable-line @typescript-eslint/no-explicit-any

export type StrongLoader<
  Failure extends StrongResponse<unknown, NonRedirectStatus>,
  Success extends StrongResponse<unknown, NonRedirectStatus>,
  Redirect extends StrongResponse<string, RedirectStatus> = never
> = (
  args: DataFunctionArgs,
  toComponent: <E, A>(a: A) => E.Either<E, A>,
  toErrorBoundary: <E, A>(e: E) => E.Either<E, A>
) => [Redirect] extends never
  ? Promise<E.Either<Failure, Success>>
  : Promise<Redirect | E.Either<Failure, Success>>;

export type StrongAction<
  Failure extends StrongResponse<unknown, NonRedirectStatus>,
  Success extends StrongResponse<unknown, NonRedirectStatus>,
  Redirect extends StrongResponse<string, RedirectStatus> = never
> = StrongLoader<Failure, Success, Redirect>;

export type StrongComponent<Success> = ComponentType<
  PickDataAndStatus<Success>
>;

export type StrongErrorBoundary<
  Failure extends StrongResponse<unknown, NonRedirectStatus>,
  Props extends PickDataAndStatus<Failure> = PickDataAndStatus<Failure>
> = ComponentType<Props>;

export type BuildStrongRemixRouteExportsOpts<
  LoaderSuccess extends StrongResponse<unknown, NonRedirectStatus> = never,
  ActionSuccess extends StrongResponse<unknown, NonRedirectStatus> = never,
  LoaderFailure extends StrongResponse<unknown, NonRedirectStatus> = never,
  LoaderRedirect extends StrongResponse<string, RedirectStatus> = never,
  ActionFailure extends StrongResponse<unknown, NonRedirectStatus> = never,
  ActionRedirect extends StrongResponse<string, RedirectStatus> = never
> = {
  Component?: StrongComponent<Exclude<LoaderSuccess, never>>;
  ErrorBoundary?: StrongErrorBoundary<
    Exclude<LoaderFailure | ActionFailure, never>
  >;
  loader?: (
    args: DataFunctionArgs
  ) => ReturnType<StrongLoader<LoaderFailure, LoaderSuccess, LoaderRedirect>>;
  action?: (
    args: DataFunctionArgs
  ) => ReturnType<StrongAction<ActionFailure, ActionSuccess, ActionRedirect>>;
  meta?: MetaFunction;
};

export type StrongRemixRouteExports<T> = {
  [K in keyof T]: K extends "loader"
    ? LoaderFunction
    : K extends "action"
    ? ActionFunction
    : K extends "Component"
    ? RouteComponent
    : K extends "ErrorBoundary"
    ? V2_ErrorBoundaryComponent
    : never;
};
