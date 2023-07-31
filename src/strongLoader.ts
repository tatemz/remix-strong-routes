import { DataFunctionArgs } from "@remix-run/server-runtime";
import { Either } from "effect";
import { NonRedirectStatus, RedirectStatus } from "./HttpStatusCode";
import {
  StrongLoader,
  StrongLoaderWithCallbacks,
  StrongRedirect,
  StrongResponse,
} from "./types";

export const strongLoader =
  <
    Failure extends StrongResponse<unknown, NonRedirectStatus>,
    Success extends StrongResponse<unknown, NonRedirectStatus>,
    Redirect extends StrongRedirect<string, RedirectStatus> = never,
  >(
    loaderFn: StrongLoaderWithCallbacks<Failure, Success, Redirect>,
  ): StrongLoader<Failure, Success, Redirect> =>
  (args: DataFunctionArgs) =>
    loaderFn(args, {
      fail: Either.left,
      succeed: Either.right,
      redirect: Either.right,
    });
