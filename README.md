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
  HttpStatusCode,
  StrongErrorable,
} from "remix-strong-routes";

// Define a success response type
type FooResponse = StrongResponse<"foo", HttpStatusCode.OK>;

// Define an error response type
type BarResponse = StrongResponse<"foo", HttpStatusCode.INTERNAL_SERVER_ERROR>;

// Define a loader response union
type LoaderResponse = LoaderErrorable<FooResponse, BarResponse>;
```

### Define Loader

```ts
import { StrongLoader } from "remix-strong-routes";

const strongLoader: StrongLoader<LoaderResponse> = async ({
  context,
  request,
  params,
}) => {
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
    // Build error data
    const barData = "bar" as const;

    // Build a typesafe response object
    const barResponse: BarResponse = {
      data: barData,
      status: HttpStatusCode.INTERNAL_SERVER_ERROR,
    };

    // Return a type safe error tuple indicating failure
    return [null, barData];
  }
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
  action: undefined,
  loaderSuccess: strongComponent,
  loaderFailure: strongErrorBoundary,
});

// Export parts
export const action = route.action;
export const loader = route.loader;
export const ErrorBoundary = route.ErrorBoundary;
export default route.default;
```

## Contributing

PRs accepted.

## License

MIT
