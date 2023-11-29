import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import {
  HttpStatusCode,
  StrongComponent,
  StrongMeta,
  StrongResponse,
  buildStrongRoute,
  strongLoader,
} from "remix-strong-routes";

import { getUser } from "~/session.server";

interface RootRouteLoaderSuccessData {
  user: Awaited<ReturnType<typeof getUser>>;
}

type RootRouteLoaderSuccess = StrongResponse<
  RootRouteLoaderSuccessData,
  HttpStatusCode.OK
>;

const loader = strongLoader<never, RootRouteLoaderSuccess>(
  async (args, { succeed }) => {
    const user = await getUser(args.request);

    return succeed({
      data: {
        user,
      },
      status: HttpStatusCode.OK,
    });
  },
);

const Component: StrongComponent<RootRouteLoaderSuccess> = () => {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
};

const meta: StrongMeta<RootRouteLoaderSuccess> = (args) => {
  console.log(args.data?.data);
  return [{ title: "Very cool app | Remix" }];
};

export const RootRoute = buildStrongRoute({
  routeId: "root",
  loader,
  meta,
  Component,
});
