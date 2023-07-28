import { DataFunctionArgs } from "@remix-run/server-runtime";
import { NonRedirectStatus, RedirectStatus } from "./HttpStatusCode";
import { StrongAction, StrongRedirect, StrongResponse } from "./types";

export const strongAction =
  <
    Failure extends StrongResponse<unknown, NonRedirectStatus> = never,
    Success extends StrongResponse<unknown, NonRedirectStatus> = never,
    Redirect extends StrongRedirect<string, RedirectStatus> = never,
  >(
    actionFn: StrongAction<Failure, Success, Redirect>,
  ) =>
  (args: DataFunctionArgs) =>
    actionFn(args);
