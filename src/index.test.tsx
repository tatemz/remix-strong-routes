import {
  ActionFunction,
  DataFunctionArgs,
  LoaderFunction,
} from "@remix-run/server-runtime";
import { unstable_createRemixStub } from "@remix-run/testing";
import { act, render } from "@testing-library/react";
import "isomorphic-fetch";
import { ComponentType } from "react";
import { describe, expect, it } from "vitest";
import {
  HttpStatusCode,
  StrongComponent,
  StrongErrorBoundary,
  StrongRedirect,
  StrongResponse,
  buildStrongRoute,
} from "./";
import { strongResponse } from "./strongResponse";
import { Form } from "@remix-run/react";
import { strongLoader } from "./strongLoader";
import { strongAction } from "./strongAction";

describe("strongResponse", () => {
  it("should create and format a response with a data object and status code", async () => {
    const headers = new Headers({ foo: "bar" });
    const statusText = "Success";
    const data = { fizz: "buzz" } as const;

    const expectedHeaders = new Headers(headers);
    expectedHeaders.set("content-type", "application/json");
    const expectedBody = {
      status: HttpStatusCode.OK,
      data,
    };
    const expected = new Response(JSON.stringify(expectedBody), {
      headers: expectedHeaders,
      status: HttpStatusCode.OK,
      statusText,
    });

    const strongResponseObject: StrongResponse<typeof data, HttpStatusCode.OK> =
      {
        data,
        status: HttpStatusCode.OK,
        statusText,
        headers,
      };
    const result = strongResponse(strongResponseObject);

    expect(result.status).toStrictEqual(expected.status);
    expect(result.statusText).toStrictEqual(expected.statusText);
    expect(result.headers).toStrictEqual(expected.headers);
    await expect(result.json()).resolves.toStrictEqual(expectedBody);
  });
});

describe("buildStrongRoute", () => {
  type FooResponse = StrongResponse<"Foo", HttpStatusCode.OK>;

  type BarResponse = StrongResponse<
    "Bar",
    HttpStatusCode.INTERNAL_SERVER_ERROR
  >;

  type RedirectResponse = StrongRedirect<"/", HttpStatusCode.MOVED_PERMANENTLY>;

  const fooResponse: FooResponse = {
    data: "Foo",
    status: HttpStatusCode.OK,
  };

  const barResponse: BarResponse = {
    data: "Bar",
    status: HttpStatusCode.INTERNAL_SERVER_ERROR,
  };

  const redirectResponse: RedirectResponse = {
    data: "/",
    status: HttpStatusCode.MOVED_PERMANENTLY,
  };

  const loader = strongLoader<BarResponse, FooResponse, RedirectResponse>(
    async ({ request }, toComponent, toErrorBoundary) => {
      const url = new URL(request.url);
      if (url.pathname === "/bar") {
        return toErrorBoundary(barResponse);
      }

      if (url.pathname === "/foo") {
        return toComponent(fooResponse);
      }

      return redirectResponse;
    }
  );

  const action = strongAction<BarResponse, FooResponse, RedirectResponse>(
    async ({ request }, toComponent, toErrorBoundary) => {
      const url = new URL(request.url);
      if (url.pathname === "/bar") {
        return toErrorBoundary(barResponse);
      }

      if (url.pathname === "/foo") {
        return toComponent(fooResponse);
      }

      return redirectResponse;
    }
  );

  const Component: StrongComponent<FooResponse> = (props) => {
    return (
      <>
        <Form method="post" data-testid="form">
          <button type="submit">Go</button>
        </Form>
        <pre data-testid="success">{JSON.stringify(props, null, 2)}</pre>;
      </>
    );
  };

  const ErrorBoundary: StrongErrorBoundary<BarResponse> = (props) => {
    return <pre data-testid="failure">{JSON.stringify(props, null, 2)}</pre>;
  };

  const route = buildStrongRoute({
    Component,
    ErrorBoundary,
    loader,
    action,
  });

  // TODO - add test cases for routeWithoutAction
  buildStrongRoute({
    Component,
    ErrorBoundary,
    loader,
  });

  // TODO - add test cases for routeWithoutLoaderOrAction
  buildStrongRoute({
    Component: () => <></>,
    ErrorBoundary: () => <></>,
  });

  // TODO - add test cases for routeWithoutLoader
  buildStrongRoute({
    Component,
    ErrorBoundary,
    loader,
  });

  describe("loader", () => {
    describe("when the loader succeeds", () => {
      it("should return a strongResponse using the error tuple", async () => {
        const request = new Request("http://test.com/foo");
        const result = await (route.loader as LoaderFunction)({
          request,
        } as DataFunctionArgs);
        const expected = strongResponse(fooResponse);
        const expectedBody = await expected.json();

        expect(result.status).toStrictEqual(expected.status);
        expect(result.statusText).toStrictEqual(expected.statusText);
        expect(result.headers).toStrictEqual(expected.headers);
        await expect(result.json()).resolves.toStrictEqual(expectedBody);
      });
    });

    describe("when the loader fails", () => {
      it("should throw a strongResponse using the error tuple", async () => {
        const request = new Request("http://test.com/bar");
        const result: Response = await new Promise((resolve, reject) => {
          (route.loader as LoaderFunction)({ request } as DataFunctionArgs)
            .then(reject)
            .catch(resolve);
        });

        const expected = strongResponse(barResponse);
        const expectedBody = await expected.json();

        expect(result.status).toStrictEqual(expected.status);
        expect(result.statusText).toStrictEqual(expected.statusText);
        expect(result.headers).toStrictEqual(expected.headers);
        await expect(result.json()).resolves.toStrictEqual(expectedBody);
      });
    });

    describe("when the loader redirects", () => {
      it("should return a redirect response", async () => {
        const request = new Request("http://test.com/");
        const result = await (route.loader as LoaderFunction)({
          request,
        } as DataFunctionArgs);

        const expected = new Response(null, {
          status: redirectResponse.status,
          headers: new Headers({
            Location: "/",
          }),
        });

        expect(result.status).toStrictEqual(expected.status);
        expect(result.statusText).toStrictEqual(expected.statusText);
        expect(result.headers).toStrictEqual(expected.headers);
      });
    });
  });

  describe("action", () => {
    describe("when the action succeeds", () => {
      it("should return a strongResponse using the error tuple", async () => {
        const request = new Request("http://test.com/foo");
        const result = await (route.action as ActionFunction)({
          request,
        } as DataFunctionArgs);
        const expected = strongResponse(fooResponse);
        const expectedBody = await expected.json();

        expect(result.status).toStrictEqual(expected.status);
        expect(result.statusText).toStrictEqual(expected.statusText);
        expect(result.headers).toStrictEqual(expected.headers);
        await expect(result.json()).resolves.toStrictEqual(expectedBody);
      });
    });

    describe("when the action fails", () => {
      it("should throw a strongResponse using the error tuple", async () => {
        const request = new Request("http://test.com/bar");
        const result: Response = await new Promise((resolve, reject) => {
          (route.action as ActionFunction)({ request } as DataFunctionArgs)
            .then(reject)
            .catch(resolve);
        });

        const expected = strongResponse(barResponse);
        const expectedBody = await expected.json();

        expect(result.status).toStrictEqual(expected.status);
        expect(result.statusText).toStrictEqual(expected.statusText);
        expect(result.headers).toStrictEqual(expected.headers);
        await expect(result.json()).resolves.toStrictEqual(expectedBody);
      });
    });

    describe("when the action redirects", () => {
      it("should return a redirect response", async () => {
        const request = new Request("http://test.com/");
        const result = await (route.action as ActionFunction)({
          request,
        } as DataFunctionArgs);

        const expected = new Response(null, {
          status: redirectResponse.status,
          headers: new Headers({
            Location: "/",
          }),
        });

        expect(result.status).toStrictEqual(expected.status);
        expect(result.statusText).toStrictEqual(expected.statusText);
        expect(result.headers).toStrictEqual(expected.headers);
      });
    });
  });

  describe("Component", () => {
    it("should load and render strongly typed data", async () => {
      const TestComponent = route.Component as ComponentType;
      const RemixStub = unstable_createRemixStub([
        {
          path: "/foo",
          index: true,
          element: <TestComponent />,
          loader: route.loader as any,
        },
      ]);

      const { findByTestId } = render(<RemixStub initialEntries={["/foo"]} />);
      const element = await findByTestId("success");
      expect(element).toMatchInlineSnapshot(`
        <pre
          data-testid="success"
        >
          {
          "status": 200,
          "data": "Foo"
        }
        </pre>
      `);
    });
  });

  describe("ErrorBoundary", () => {
    it("should load and render strongly typed data for error boundaries", async () => {
      const TestComponent = route.Component as ComponentType;
      const TestErrorBoundary = route.ErrorBoundary as ComponentType;
      const RemixStub = unstable_createRemixStub([
        {
          path: "/bar",
          index: true,
          element: <TestComponent />,
          errorElement: <TestErrorBoundary />,
          hasErrorBoundary: true,
          loader: route.loader as any,
        },
      ]);

      const { findByTestId } = render(<RemixStub initialEntries={["/bar"]} />);
      const element = await findByTestId("failure");

      expect(element).toMatchInlineSnapshot(`
        <pre
          data-testid="failure"
        >
          {
          "status": 500,
          "statusText": "",
          "internal": false,
          "data": {
            "status": 500,
            "data": "Bar"
          }
        }
        </pre>
      `);
    });

    // TODO - Learn how remix actions handle failure
    it.skip("should render error boundary for failed actions", async () => {
      const TestComponent = route.Component as ComponentType;
      const TestErrorBoundary = route.ErrorBoundary as ComponentType;
      const RemixStub = unstable_createRemixStub([
        {
          path: "/foo",
          index: true,
          element: <TestComponent />,
          errorElement: <TestErrorBoundary />,
          hasErrorBoundary: true,
          loader: () => null,
          action: route.action as any,
        },
      ]);

      const { container, findByTestId } = render(
        <RemixStub initialEntries={["/foo"]} />
      );
      const element = (await findByTestId("form")) as HTMLFormElement;

      act(() => element.submit());

      expect(container).toMatchInlineSnapshot(`
        <div>
          <form
            action="/foo?index"
            data-testid="form"
            method="post"
          >
            <button
              type="submit"
            >
              Go
            </button>
          </form>
          <pre
            data-testid="success"
          >
            {}
          </pre>
          ;
        </div>
      `);
    });
  });
});
