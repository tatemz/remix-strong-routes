import { DataFunctionArgs } from "@remix-run/server-runtime";
import { NonRedirectStatus, RedirectStatus } from "./HttpStatusCode";
import { StrongLoader, StrongRedirect, StrongResponse } from "./types";
import { Effect } from "effect";

export const strongLoader = <
  Failure extends StrongResponse<unknown, NonRedirectStatus>,
  Success extends StrongResponse<unknown, NonRedirectStatus>,
  Redirect extends StrongRedirect<string, RedirectStatus> = never,
>(
  loaderFn: StrongLoader<Failure, Success, Redirect>,
) => {
  return (args: DataFunctionArgs) => {
    return loaderFn(args, {
      succeed: Effect.succeed,
      redirect: Effect.succeed,
      fail: Effect.fail,
    });
  };
};
