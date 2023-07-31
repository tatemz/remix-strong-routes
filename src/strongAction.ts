import { DataFunctionArgs } from "@remix-run/server-runtime";
import { Either } from "effect";
import { NonRedirectStatus, RedirectStatus } from "./HttpStatusCode";
import {
  StrongAction,
  StrongActionWithCallbacks,
  StrongRedirect,
  StrongResponse,
} from "./types";

export const strongAction =
  <
    Failure extends StrongResponse<unknown, NonRedirectStatus> = never,
    Success extends StrongResponse<unknown, NonRedirectStatus> = never,
    Redirect extends StrongRedirect<string, RedirectStatus> = never,
  >(
    actionFn: StrongActionWithCallbacks<Failure, Success, Redirect>,
  ): StrongAction<Failure, Success, Redirect> =>
  (args: DataFunctionArgs) =>
    actionFn(args, {
      fail: Either.left,
      succeed: Either.right,
      redirect: Either.right,
    });
