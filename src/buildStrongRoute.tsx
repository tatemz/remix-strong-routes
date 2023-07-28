import { useRouteLoaderData } from "@remix-run/react";
import { DataFunctionArgs, redirect } from "@remix-run/server-runtime";
import { Effect, Exit, pipe } from "effect";
import { createElement } from "react";
import {
  HttpStatusCode,
  NonRedirectStatus,
  RedirectStatus,
} from "./HttpStatusCode";
import { useStrongLoaderData, useStrongRouteError } from "./hooks";
import { strongResponse } from "./strongResponse";
import {
  BrandedDataFunction,
  BuildStrongRemixRouteExportsOpts,
  PickDataAndStatus,
  StrongRedirect,
  StrongRemixRouteExports,
  StrongResponse,
} from "./types";

const isRedirectStatus = (status: HttpStatusCode): status is RedirectStatus =>
  status >= HttpStatusCode.MULTIPLE_CHOICES &&
  status <= HttpStatusCode.PERMANENT_REDIRECT;

const isStrongResponseRedirect = (
  raw:
    | StrongResponse<unknown, NonRedirectStatus>
    | StrongRedirect<string, RedirectStatus>,
): raw is StrongRedirect<string, RedirectStatus> =>
  isRedirectStatus(raw.status);

const handleSuccessForRemix = <
  T extends
    | StrongResponse<unknown, NonRedirectStatus>
    | StrongRedirect<string, RedirectStatus>,
>(
  response: T,
) => {
  if (isStrongResponseRedirect(response)) {
    const { data, ...init } = response;
    return redirect(data, init as ResponseInit);
  }

  return strongResponse(response);
};

const handleDataFunctionForRemix = async <
  Success extends StrongResponse<unknown, NonRedirectStatus> = never,
  Failure extends StrongResponse<unknown, NonRedirectStatus> = never,
  Redirect extends StrongRedirect<string, RedirectStatus> = never,
>(
  dataFunction: BrandedDataFunction<Failure, Success, Redirect>,
  args: DataFunctionArgs,
) => {
  const resultEffect = (await dataFunction(args)) as Effect.Effect<
    never,
    Failure,
    Success | Redirect
  >;

  const finalEffect = pipe(
    resultEffect,
    Effect.mapError(strongResponse),
    Effect.map(handleSuccessForRemix),
  );

  const exit = Effect.runSyncExit(finalEffect);

  return returnOrThrowExitFailure(exit);
};

const returnOrThrowExitFailure = (exit: Exit.Exit<Response, Response>) =>
  Exit.match(exit, {
    onFailure: (err) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      throw (err as any).error;
    },
    onSuccess: (data) => data,
  });

export const buildStrongRoute = <
  LoaderSuccess extends StrongResponse<unknown, NonRedirectStatus> = never,
  ActionSuccess extends StrongResponse<unknown, NonRedirectStatus> = never,
  LoaderFailure extends StrongResponse<unknown, NonRedirectStatus> = never,
  LoaderRedirect extends StrongRedirect<string, RedirectStatus> = never,
  ActionFailure extends StrongResponse<unknown, NonRedirectStatus> = never,
  ActionRedirect extends StrongRedirect<string, RedirectStatus> = never,
>(
  opts: BuildStrongRemixRouteExportsOpts<
    LoaderSuccess,
    ActionSuccess,
    LoaderFailure,
    LoaderRedirect,
    ActionFailure,
    ActionRedirect
  >,
): StrongRemixRouteExports<typeof opts, Exclude<LoaderSuccess, never>> => {
  const { loader, action, Component, ErrorBoundary } = opts;
  const output = {} as StrongRemixRouteExports<typeof opts, LoaderSuccess>;

  if (loader) {
    output["loader"] = async (args) => handleDataFunctionForRemix(loader, args);
  }

  if (action) {
    output["action"] = async (args) => handleDataFunctionForRemix(action, args);
  }

  if (Component) {
    output["Component"] = () => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const data = useStrongLoaderData<LoaderSuccess>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return createElement(Component, data as any);
    };
  }

  if (ErrorBoundary) {
    output["ErrorBoundary"] = () => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const data = useStrongRouteError<LoaderFailure>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return createElement(ErrorBoundary, data as any);
    };
  }

  output["useRouteLoaderData"] = () =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useRouteLoaderData(opts.routeId) as PickDataAndStatus<LoaderSuccess>;
  output["routeId"] = opts.routeId;

  return output;
};
