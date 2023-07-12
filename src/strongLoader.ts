import { DataFunctionArgs } from "@remix-run/server-runtime";
import { NonRedirectStatus, RedirectStatus } from "./HttpStatusCode";
import { StrongLoader, StrongResponse } from "./types";
import * as E from "fp-ts/Either";

export const strongLoader = <
  Failure extends StrongResponse<unknown, NonRedirectStatus>,
  Success extends StrongResponse<unknown, NonRedirectStatus>,
  Redirect extends StrongResponse<string, RedirectStatus> = never
>(
  loaderFn: StrongLoader<Failure, Success, Redirect>
) => {
  return (args: DataFunctionArgs) => {
    return loaderFn(args, E.right, E.left);
  };
};
