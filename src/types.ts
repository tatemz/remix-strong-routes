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
import { Errorable, ToErrorFn, ToSuccessFn } from "./errorable";

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
  Success extends StrongResponse<unknown, NonRedirectStatus>,
  Failure extends StrongResponse<unknown, NonRedirectStatus>,
  Redirect extends StrongResponse<string, RedirectStatus> = never
> = (
  args: DataFunctionArgs,
  toComponent?: ToSuccessFn<Success, Failure>,
  toErrorBoundary?: ToErrorFn<Success, Failure>
) => [Redirect] extends never
  ? Promise<Errorable<Success, Failure>>
  : Promise<Redirect | Errorable<Success, Failure>>;

export type StrongAction<
  Success extends StrongResponse<unknown, NonRedirectStatus>,
  Failure extends StrongResponse<unknown, NonRedirectStatus>,
  Redirect extends StrongResponse<string, RedirectStatus> = never
> = StrongLoader<Success, Failure, Redirect>;

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
  loader?: StrongLoader<LoaderSuccess, LoaderFailure, LoaderRedirect>;
  action?: StrongAction<ActionSuccess, ActionFailure, ActionRedirect>;
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
