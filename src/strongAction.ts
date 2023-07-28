import { DataFunctionArgs } from "@remix-run/server-runtime";
import { NonRedirectStatus, RedirectStatus } from "./HttpStatusCode";
import { StrongAction, StrongRedirect, StrongResponse } from "./types";
import { Effect } from "effect";

export const strongAction = <
  Failure extends StrongResponse<unknown, NonRedirectStatus> = never,
  Success extends StrongResponse<unknown, NonRedirectStatus> = never,
  Redirect extends StrongRedirect<string, RedirectStatus> = never
>(
  actionFn: StrongAction<Failure, Success, Redirect>
) => {
  return (args: DataFunctionArgs) => {
    return actionFn(args, {
      succeed: Effect.succeed,
      redirect: Effect.succeed,
      fail: Effect.fail,
    });
  };
};
