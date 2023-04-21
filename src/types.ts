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

export type LoaderErrorable<
  T extends StrongResponse<unknown, HttpStatusCode>,
  E extends StrongResponse<unknown, HttpStatusCode>
> = [E] extends [never] ? [T, null] : Errorable<T, E>;

export type RouteErrorableSuccess<
  T extends LoaderErrorable<
    StrongResponse<unknown, HttpStatusCode>,
    StrongResponse<unknown, HttpStatusCode> | never
  >
> = Exclude<T[0], null>;

export type RouteErrorableFailure<
  T extends LoaderErrorable<
    StrongResponse<unknown, HttpStatusCode>,
    StrongResponse<unknown, HttpStatusCode> | never
  >
> = Exclude<T[1], null>;

export type StrongLoader<
  T extends LoaderErrorable<
    StrongResponse<unknown, HttpStatusCode>,
    StrongResponse<unknown, HttpStatusCode> | never
  >
> = (args: DataFunctionArgs) => Promise<T>;

export type StrongAction<T extends StrongResponse<unknown, HttpStatusCode>> = (
  args: DataFunctionArgs
) => Promise<T>;

export type LoaderSuccessComponent<
  T extends StrongResponse<unknown, HttpStatusCode>,
  TT extends PickDataAndStatus<T> = PickDataAndStatus<T>
> = (props: TT) => JSX.Element;

export type LoaderFailureComponent<
  T extends StrongResponse<unknown, HttpStatusCode>
> = (props: PickDataAndStatus<T>) => JSX.Element;

export type BuildRemixRouteExportsOpts<
  LoaderResponse extends LoaderErrorable<
    StrongResponse<unknown, HttpStatusCode>,
    StrongResponse<unknown, HttpStatusCode> | never
  >,
  ActionResponse extends StrongResponse<unknown, HttpStatusCode>
> = {
  loaderSuccess: LoaderSuccessComponent<RouteErrorableSuccess<LoaderResponse>>;
  loaderFailure: LoaderFailureComponent<RouteErrorableFailure<LoaderResponse>>;
  action: [ActionResponse] extends [never]
    ? undefined
    : StrongAction<ActionResponse>;
  loader: StrongLoader<LoaderResponse>;
  meta?: MetaFunction;
};

export type RemixRouteExports = {
  default: RouteComponent;
  action: ActionFunction | undefined;
  loader: LoaderFunction;
  meta: MetaFunction | undefined;
  ErrorBoundary: V2_ErrorBoundaryComponent | undefined;
};
