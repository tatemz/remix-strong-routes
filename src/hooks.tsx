import { useLoaderData, useRouteError } from "@remix-run/react";
import { NonRedirectStatus } from "./HttpStatusCode";
import { PickDataAndStatus, StrongResponse } from "./types";

export const useStrongLoaderData = <
  T extends StrongResponse<unknown, NonRedirectStatus>,
>(): PickDataAndStatus<T> => useLoaderData() as PickDataAndStatus<T>;

export const useStrongRouteError = <
  T extends StrongResponse<unknown, NonRedirectStatus>,
>(): PickDataAndStatus<T> => useRouteError() as PickDataAndStatus<T>;
