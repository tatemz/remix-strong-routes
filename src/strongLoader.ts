import { DataFunctionArgs, LoaderFunction } from "@remix-run/server-runtime";
import { NonRedirectStatus, RedirectStatus } from "./HttpStatusCode";
import { StrongLoader, StrongRedirect, StrongResponse } from "./types";

export const strongLoader =
  <
    Failure extends StrongResponse<unknown, NonRedirectStatus>,
    Success extends StrongResponse<unknown, NonRedirectStatus>,
    Redirect extends StrongRedirect<string, RedirectStatus> = never,
  >(
    loaderFn: StrongLoader<Failure, Success, Redirect>,
  ): LoaderFunction =>
  (args: DataFunctionArgs) =>
    loaderFn(args);
