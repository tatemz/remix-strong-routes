import { HttpStatusCode } from "./HttpStatusCode";
import {
  LoaderErrorable,
  StrongResponse,
  BuildRemixRouteExportsOpts,
  RemixRouteExports,
  RouteErrorableSuccess,
  RouteErrorableFailure,
} from "./types";
import { strongResponse } from "./strongResponse";
import { useStrongLoaderData, useStrongRouteError } from "./hooks";
import { createElement } from "react";

export const buildStrongRoute = <
  LoaderResponse extends LoaderErrorable<
    StrongResponse<unknown, HttpStatusCode>,
    StrongResponse<unknown, HttpStatusCode>
  >,
  ActionResponse extends StrongResponse<unknown, HttpStatusCode> = never
>(
  opts: BuildRemixRouteExportsOpts<LoaderResponse, ActionResponse>
): RemixRouteExports => ({
  default: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const data = useStrongLoaderData<RouteErrorableSuccess<LoaderResponse>>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createElement(opts.loaderSuccess, data as any);
  },
  loader: async (args) => {
    const [data, err] = await opts.loader(args);
    if (err) throw strongResponse(err);
    return strongResponse(data);
  },
  action: opts.action
    ? async (args) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (opts.action as any)(args);
      }
    : undefined,
  meta: opts.meta,
  ErrorBoundary: opts.loaderFailure
    ? () => {
        const data =
          useStrongRouteError<RouteErrorableFailure<LoaderResponse>>();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return createElement(opts.loaderFailure, data as any);
      }
    : undefined,
});
