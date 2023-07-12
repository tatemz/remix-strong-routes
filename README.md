# Remix Strong Routes

> Worry-free Remix routes with Typescript 💪

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Usage](#usage)
  - [A note about the `Errorable` type](#a-note-about-the--errorable--type)
  - [Returning Data inside `loader` and `action`](#returning-data-inside--loader--and--action-)
  - [Uncaught Errors](#uncaught-errors)
  - [Define Types](#define-types)
  - [Define Loader](#define-loader)
  - [Define Action](#define-action)
  - [Define Route Component](#define-route-component)
  - [Define Error Boundary](#define-error-boundary)
  - [Configure & Export Route](#configure---export-route)
- [Contributing](#contributing)
- [License](#license)

## Background

Remix loaders and actions have generally good typescript support, but this project aims to ensure the data types passed around Remix routes are strongly typed. There are three things that can happen in a Remix `loader` or `action`:

- Success
- Failure
- Redirects

This library exposes a tiny `buildStrongRoute` function that adds a small amount of validation logic to Remix's default routing behavior. The good part about this library, is that you do not have to use `buildStrongRoute` everywhere - you can opt in or out of its behavior per route.

## Install

```sh
npm install remix-strong-routes
```

## Usage

### Returning Data inside `loader` and `action`

There are 3 possible options when returning data in a `StrongLoader` or `StrongAction`

- Send data to your component with the `toComponent` callback
- Send data to your error boundary with the `toErrorBoundary` callback.
- Return a `StrongRedirect` object (this will perform an HTTP redirect)

### Uncaught Errors

If your strong route `loader` or `action` calls `toErrorBoundary`, but was not built with a `StrongErrorBoundary`, the error will bubble up to the Remix root error boundary.

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
import { strongLoader, toSuccess, toError } from "remix-strong-routes";

const loader = strongLoader<BarResponse, FooResponse, RedirectToLogin>(
  async ({ context, request, params }, toComponent, toErrorBoundary) => {
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
      return toComponent(fooResponse);
    } catch (e) {
      // Build a typesafe response object
      const barResponse: BarResponse = {
        data: "Bar",
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
      };

      // Return a type safe error tuple indicating failure
      return toErrorBoundary(barResponse);
    }
  }
);
```

### Define Action

```ts
import { strongAction } from "remix-strong-routes";

const action = strongAction<BarResponse, FooResponse, RedirectToLogin>(
  async ({ context, request, params }, toComponent, toErrorBoundary) => {
    // ... Same as the loader
  }
);
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
