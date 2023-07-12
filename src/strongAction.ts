import { DataFunctionArgs } from "@remix-run/server-runtime";
import { NonRedirectStatus, RedirectStatus } from "./HttpStatusCode";
import { StrongAction, StrongResponse } from "./types";
import * as E from "fp-ts/Either";

export const strongAction = <
  Failure extends StrongResponse<unknown, NonRedirectStatus>,
  Success extends StrongResponse<unknown, NonRedirectStatus>,
  Redirect extends StrongResponse<string, RedirectStatus> = never
>(
  actionFn: StrongAction<Failure, Success, Redirect>
) => {
  return (args: DataFunctionArgs) => {
    return actionFn(args, E.right, E.left);
  };
};
