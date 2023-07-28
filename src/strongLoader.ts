import { DataFunctionArgs } from "@remix-run/server-runtime";
import { NonRedirectStatus, RedirectStatus } from "./HttpStatusCode";
import {
  BrandedDataFunction,
  StrongLoader,
  StrongRedirect,
  StrongResponse,
} from "./types";
import { Effect } from "effect";

export const strongLoader =
  <
    Failure extends StrongResponse<unknown, NonRedirectStatus>,
    Success extends StrongResponse<unknown, NonRedirectStatus>,
    Redirect extends StrongRedirect<string, RedirectStatus> = never,
  >(
    loaderFn: StrongLoader<Failure, Success, Redirect>,
  ): BrandedDataFunction<Failure, Success, Redirect> =>
  (args: DataFunctionArgs) =>
    loaderFn(args, {
      fail: Effect.fail,
      succeed: Effect.succeed,
      redirect: Effect.succeed,
    });
