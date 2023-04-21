import { HttpStatusCode } from "./HttpStatusCode";
import { StrongResponse } from "./types";

export const strongResponse = <
  T extends StrongResponse<unknown, HttpStatusCode>
>(
  strongResponse: T
): Response => {
  const headers = new Headers(strongResponse?.headers);
  headers.set("content-type", "application/json");

  const { data, ...init } = strongResponse;

  return new Response(
    JSON.stringify({
      status: init.status,
      data,
    }),
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(init as any),
      headers,
    }
  );
};
