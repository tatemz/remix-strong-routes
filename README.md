# Remix Strong Routes

> Worry-free Remix routes with Typescript 💪

## Install

```sh
npm install remix-strong-routes
```

## Usage

### Define Types

```ts
import {
  StrongResponse,
  StrongRedirect,
  HttpStatusCode,
} from "remix-strong-routes";

type FooResponse = StrongResponse<"Foo", HttpStatusCode.OK>;

type BarResponse = StrongResponse<"Bar", HttpStatusCode.INTERNAL_SERVER_ERROR>;

type RedirectToLogin = StrongRedirect<
  "/login",
  HttpStatusCode.MOVED_PERMANENTLY
>;
```

### Define Loader

```ts
import { StrongLoader } from "remix-strong-routes";

const strongLoader: StrongLoader<
  FooResponse,
  BarResponse,
  RedirectToLogin
> = async ({ context, request, params }) => {
  // Try to validate a session
  if (await isUserLoggedIn(request)) {
    // Return a redirect object
    const redirectToLogin: RedirectToLogin = {
      data: "/login",
      status: HttpStatusCode.MOVED_PERMANENTLY,
    };
    return redirectToLogin;
  }

  try {
    // Try to load some data
    const fooData = await getFooData();

    // Build a typesafe response object
    const fooResponse: FooResponse = {
      data: fooData,
      status: HttpStatusCode.OK,
    };

    // Return a type safe error tuple indicating success
    return [fooResponse, null];
  } catch (e) {
    // Build a typesafe response object
    const barResponse: BarResponse = {
      data: "Bar",
      status: HttpStatusCode.INTERNAL_SERVER_ERROR,
    };

    // Return a type safe error tuple indicating failure
    return [null, barData];
  }
};
```

### Define Action

```ts
import { StrongAction } from "remix-strong-routes";

const strongAction: StrongAction<FooResponse, RedirectToLogin> = async ({
  context,
  request,
  params,
}) => {
  // Try to validate a session
  if (await isUserLoggedIn(request)) {
    // Return a redirect object
    const redirectToLogin: RedirectToLogin = {
      data: "/login",
      status: HttpStatusCode.MOVED_PERMANENTLY,
    };
    return redirectToLogin;
  }

  // Return a typesafe response object
  const fooResponse: FooResponse = {
    data: fooData,
    status: HttpStatusCode.OK,
  };
  return fooResponse;
};
```

### Define Route Component

```tsx
import { StrongComponent } from "remix-strong-routes";

const strongComponent: StrongComponent<FooResponse> = ({ status, data }) => {
  return (
    <ul>
      <li>Status: {status}</li>
      <li>Data: {data}</li>
    </ul>
  );
};
```

### Define Error Boundary

```tsx
import { StrongErrorBoundary } from "remix-strong-routes";

const strongErrorBoundary: StrongErrorBoundary<BarResponse> = ({
  status,
  data,
}) => {
  return (
    <ul>
      <li>Status: {status}</li>
      <li>Data: {data}</li>
    </ul>
  );
};
```

### Configure & Export Route

```tsx
import { buildStrongRoute } from "remix-strong-routes";

// Build strongly typed route exports
const route = buildStrongRoute<LoaderResponse>({
  loader: strongLoader,
  action: strongAction,
  Component: strongComponent,
  ErrorBoundary: strongErrorBoundary,
});

// Export parts
export const action = route.action;
export const loader = route.loader;
export const ErrorBoundary = route.ErrorBoundary;
export default route.Component;
```

## Contributing

PRs accepted.

## License

MIT
