import { DataFunctionArgs, json, redirect } from "@remix-run/server-runtime";
import { createElement } from "react";
import {
  HttpStatusCode,
  NonRedirectStatus,
  RedirectStatus,
} from "./HttpStatusCode";
import { useStrongLoaderData, useStrongRouteError } from "./hooks";
import { strongResponse } from "./strongResponse";
import {
  BuildStrongRemixRouteExportsOpts,
  StrongAction,
  StrongLoader,
  StrongRedirect,
  StrongRemixRouteExports,
  StrongResponse,
} from "./types";
import { Effect, pipe, Exit } from "effect";
import { useRouteLoaderData } from "@remix-run/react";

const isRedirectStatus = (status: HttpStatusCode): status is RedirectStatus =>
  status >= HttpStatusCode.MULTIPLE_CHOICES &&
  status <= HttpStatusCode.PERMANENT_REDIRECT;

const isStrongResponseRedirect = (
  raw:
    | StrongResponse<unknown, NonRedirectStatus>
    | StrongRedirect<string, RedirectStatus>
): raw is StrongRedirect<string, RedirectStatus> =>
  isRedirectStatus(raw.status);

const handleSuccessForRemix = <
  T extends
    | StrongResponse<unknown, NonRedirectStatus>
    | StrongRedirect<string, RedirectStatus>
>(
  response: T
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
  Redirect extends StrongRedirect<string, RedirectStatus> = never
>(
  dataFunction:
    | StrongLoader<Success, Failure, Redirect>
    | StrongAction<Success, Failure, Redirect>,
  args: DataFunctionArgs
) => {
  const resultEffect = await dataFunction(args, {
    succeed: Effect.succeed,
    redirect: Effect.succeed,
    fail: Effect.fail,
  });
  const finalEffect = pipe(
    resultEffect,
    Effect.mapError(strongResponse),
    Effect.map(handleSuccessForRemix)
  );

  const exit = Effect.runSyncExit(finalEffect);

  return returnOrThrowExitFailure(exit);
};

const returnOrThrowExitFailure = (exit: Exit.Exit<Response, Response>) =>
  Exit.match(exit, {
    onFailure: (err) => {
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
  ActionRedirect extends StrongRedirect<string, RedirectStatus> = never
>(
  opts: BuildStrongRemixRouteExportsOpts<
    LoaderSuccess,
    ActionSuccess,
    LoaderFailure,
    LoaderRedirect,
    ActionFailure,
    ActionRedirect
  >
): StrongRemixRouteExports<typeof opts, Exclude<LoaderSuccess, never>> => {
  const { loader, action, Component, ErrorBoundary } = opts;
  const output = {} as StrongRemixRouteExports<typeof opts>;

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
      return createElement(Component, data as any);
    };
  }

  if (ErrorBoundary) {
    output["ErrorBoundary"] = () => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const data = useStrongRouteError<LoaderFailure>();
      return createElement(ErrorBoundary, data as any);
    };
  }

  output["useRouteLoaderData"] = () => useRouteLoaderData(opts.routeId) as any;
  output["routeId"] = opts.routeId;

  return output;
};
