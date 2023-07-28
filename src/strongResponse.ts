import { HttpStatusCode } from "./HttpStatusCode";
import { _StrongResponse } from "./types";

export const strongResponse = <
  T extends _StrongResponse<unknown, HttpStatusCode>,
>(
  strongResponse: T,
): Response => {
  const { data, headers: _headers, ...init } = strongResponse;

  const headers = new Headers(_headers);
  headers.set("content-type", "application/json");

  return new Response(
    JSON.stringify({
      status: init.status,
      data,
    }),
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(init as any),
      headers,
    },
  );
};
