import { useLoaderData, useRouteError } from "@remix-run/react";
import { HttpStatusCode } from "./HttpStatusCode";
import { StrongResponse, PickDataAndStatus } from "./types";

export const useStrongLoaderData = <
  T extends StrongResponse<unknown, HttpStatusCode>
>(): PickDataAndStatus<T> => useLoaderData() as unknown as PickDataAndStatus<T>;

export const useStrongRouteError = <
  T extends StrongResponse<unknown, HttpStatusCode>
>(): PickDataAndStatus<T> => useRouteError() as unknown as PickDataAndStatus<T>;
