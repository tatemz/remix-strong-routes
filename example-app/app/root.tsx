import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction } from "@remix-run/node";

import stylesheet from "~/tailwind.css";
import { RootRoute } from "./strong-routes/RootRoute";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export const loader = RootRoute.loader;
export const meta = RootRoute.meta;

export default RootRoute.Component;
