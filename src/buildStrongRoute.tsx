import { redirect } from "@remix-run/server-runtime";
import { createElement } from "react";
import { NonRedirectStatus, RedirectStatus } from "./HttpStatusCode";
import { useStrongLoaderData, useStrongRouteError } from "./hooks";
import { strongResponse } from "./strongResponse";
import {
  BuildStrongRemixRouteExportsOpts,
  StrongRemixRouteExports,
  StrongResponse,
} from "./types";
import * as E from "fp-ts/Either";

export const buildStrongRoute = <
  LoaderSuccess extends StrongResponse<unknown, NonRedirectStatus> = never,
  ActionSuccess extends StrongResponse<unknown, NonRedirectStatus> = never,
  LoaderFailure extends StrongResponse<unknown, NonRedirectStatus> = never,
  LoaderRedirect extends StrongResponse<string, RedirectStatus> = never,
  ActionFailure extends StrongResponse<unknown, NonRedirectStatus> = never,
  ActionRedirect extends StrongResponse<string, RedirectStatus> = never
>(
  opts: BuildStrongRemixRouteExportsOpts<
    LoaderSuccess,
    ActionSuccess,
    LoaderFailure,
    LoaderRedirect,
    ActionFailure,
    ActionRedirect
  >
): StrongRemixRouteExports<typeof opts> => {
  const { loader, action, Component, ErrorBoundary } = opts;
  const output = {} as StrongRemixRouteExports<typeof opts>;

  if (loader) {
    const isLoaderRedirect = (
      raw: LoaderRedirect | E.Either<LoaderFailure, LoaderSuccess>
    ): raw is LoaderRedirect => {
      return !raw.hasOwnProperty("_tag");
    };

    output["loader"] = async (args) => {
      const result = await loader(args);

      if (isLoaderRedirect(result)) {
        const { data, ...init } = result;
        return redirect(data, init as ResponseInit);
      }

      const handleResult = E.match<LoaderFailure, LoaderSuccess, Response>(
        (err) => {
          throw strongResponse(err);
        },
        (success) => {
          return strongResponse(success);
        }
      );

      return handleResult(result);
    };
  }

  if (action) {
    const isActionRedirect = (
      raw: ActionRedirect | E.Either<ActionFailure, ActionSuccess>
    ): raw is ActionRedirect => {
      return !raw.hasOwnProperty("_tag");
    };

    output["action"] = async (args) => {
      const result = await action(args);

      if (isActionRedirect(result)) {
        const { data, ...init } = result;
        return redirect(data, init as ResponseInit);
      }

      const handleResult = E.match<ActionFailure, ActionSuccess, Response>(
        (err) => {
          throw strongResponse(err);
        },
        (success) => {
          return strongResponse(success);
        }
      );

      return handleResult(result);
    };
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

  return output;
};
