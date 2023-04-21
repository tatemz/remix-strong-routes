import { V2_ErrorBoundaryComponent } from "@remix-run/react/dist/routeModules";
import { HttpStatusCode } from "./HttpStatusCode";
import {
  ActionFunction,
  DataFunctionArgs,
  LoaderFunction,
  MetaFunction,
  RouteComponent,
} from "@remix-run/server-runtime";

export interface StrongResponse<T, S extends HttpStatusCode>
  extends ResponseInit {
  data: T;
  status: S;
}

export type PickDataAndStatus<
  T extends StrongResponse<unknown, HttpStatusCode>
> = T extends any ? { data: T["data"]; status: T["status"] } : never; // eslint-disable-line @typescript-eslint/no-explicit-any

type Errorable<T, E> = [T, null] | [null, E];

export type StrongErrorable<
  T extends StrongResponse<unknown, HttpStatusCode>,
  E extends StrongResponse<unknown, HttpStatusCode>
> = [E] extends [never] ? [T, null] : Errorable<T, E>;

export type RouteErrorableSuccess<
  T extends StrongErrorable<
    StrongResponse<unknown, HttpStatusCode>,
    StrongResponse<unknown, HttpStatusCode> | never
  >
> = Exclude<T[0], null>;

export type RouteErrorableFailure<
  T extends StrongErrorable<
    StrongResponse<unknown, HttpStatusCode>,
    StrongResponse<unknown, HttpStatusCode> | never
  >
> = Exclude<T[1], null>;

export type StrongLoader<
  T extends StrongErrorable<
    StrongResponse<unknown, HttpStatusCode>,
    StrongResponse<unknown, HttpStatusCode> | never
  >
> = (args: DataFunctionArgs) => Promise<T>;

export type StrongAction<T extends StrongResponse<unknown, HttpStatusCode>> = (
  args: DataFunctionArgs
) => Promise<T>;

export type StrongComponent<
  T extends StrongResponse<unknown, HttpStatusCode>,
  TT extends PickDataAndStatus<T> = PickDataAndStatus<T>
> = (props: TT) => JSX.Element;

export type StrongErrorBoundary<
  T extends StrongResponse<unknown, HttpStatusCode>
> = (props: PickDataAndStatus<T>) => JSX.Element;

export type BuildStrongRemixRouteExportsOpts<
  LoaderResponse extends StrongErrorable<
    StrongResponse<unknown, HttpStatusCode>,
    StrongResponse<unknown, HttpStatusCode> | never
  >,
  ActionResponse extends StrongResponse<unknown, HttpStatusCode>
> = {
  loaderSuccess: StrongComponent<RouteErrorableSuccess<LoaderResponse>>;
  loaderFailure: StrongErrorBoundary<RouteErrorableFailure<LoaderResponse>>;
  action: [ActionResponse] extends [never]
    ? undefined
    : StrongAction<ActionResponse>;
  loader: StrongLoader<LoaderResponse>;
  meta?: MetaFunction;
};

export type StrongRemixRouteExports = {
  default: RouteComponent;
  action: ActionFunction | undefined;
  loader: LoaderFunction;
  meta: MetaFunction | undefined;
  ErrorBoundary: V2_ErrorBoundaryComponent | undefined;
};
