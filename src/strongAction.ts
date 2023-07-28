import { DataFunctionArgs } from "@remix-run/server-runtime";
import { NonRedirectStatus, RedirectStatus } from "./HttpStatusCode";
import {
  BrandedDataFunction,
  StrongAction,
  StrongRedirect,
  StrongResponse,
} from "./types";
import { Effect } from "effect";

export const strongAction =
  <
    Failure extends StrongResponse<unknown, NonRedirectStatus> = never,
    Success extends StrongResponse<unknown, NonRedirectStatus> = never,
    Redirect extends StrongRedirect<string, RedirectStatus> = never,
  >(
    actionFn: StrongAction<Failure, Success, Redirect>,
  ): BrandedDataFunction<Failure, Success, Redirect> =>
  (args: DataFunctionArgs) =>
    actionFn(args, {
      fail: Effect.fail,
      succeed: Effect.succeed,
      redirect: Effect.succeed,
    });
