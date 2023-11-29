/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Form, Outlet } from "@remix-run/react";
import {
  ActionFunction,
  ActionFunctionArgs,
  DataFunctionArgs,
  LoaderFunction,
} from "@remix-run/server-runtime";
import { createRemixStub } from "@remix-run/testing";
import { act, cleanup, render, screen } from "@testing-library/react";
import "isomorphic-fetch";
import { afterEach, assert, describe, expect, it } from "vitest";
import {
  HttpStatusCode,
  StrongComponent,
  StrongErrorBoundary,
  StrongRedirect,
  StrongResponse,
  buildStrongRoute,
  strongAction,
  strongLoader,
} from "./";
import { strongResponse } from "./strongResponse";
import { StrongMeta } from "./types";

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
  type BazResponse = StrongResponse<"Baz", HttpStatusCode.ACCEPTED>;

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

  const loader = strongLoader<
    BarResponse,
    FooResponse | BazResponse,
    RedirectResponse
  >(async ({ request }, { fail, succeed, redirect }) => {
    const url = new URL(request.url);
    if (url.searchParams.has("fail")) {
      return fail(barResponse);
    }

    if (url.searchParams.has("succeed")) {
      return succeed(fooResponse);
    }

    return redirect(redirectResponse);
  });

  const action = strongAction<
    BarResponse,
    FooResponse | BazResponse,
    RedirectResponse
  >(async ({ request }, { fail, succeed, redirect }) => {
    const url = new URL(request.url);
    if (url.searchParams.has("fail")) {
      return fail(barResponse);
    }

    if (url.searchParams.has("succeed")) {
      return succeed(fooResponse);
    }

    return redirect(redirectResponse);
  });

  const meta: StrongMeta<FooResponse | BazResponse> = ({ data }) => {
    if (data) {
      console.log(data.data);
    }

    return [];
  };

  const Component: StrongComponent<FooResponse | BazResponse> = (props) => {
    if (props.status === HttpStatusCode.ACCEPTED) return null;

    console.log(props.data); // Should narrow to "Foo"

    return (
      <>
        <Form method="post" data-testid="form">
          <button type="submit">Go</button>
        </Form>
        <pre data-testid="success">{JSON.stringify(props, null, 2)}</pre>
        <Outlet />
      </>
    );
  };

  const ErrorBoundary: StrongErrorBoundary<BarResponse> = (props) => {
    return <pre data-testid="failure">{JSON.stringify(props, null, 2)}</pre>;
  };

  const route1 = buildStrongRoute({
    routeId: "root",
    Component,
    ErrorBoundary,
    loader,
    action,
    meta,
  });

  // TODO - add test cases for routeWithoutAction
  buildStrongRoute({
    routeId: "foo",
    Component,
    ErrorBoundary,
    loader,
  });

  // TODO - add test cases for routeWithoutLoaderOrAction
  buildStrongRoute({
    routeId: "foo",
    Component: () => <></>,
    ErrorBoundary: () => <></>,
  });

  // TODO - add test cases for routeWithoutLoader
  buildStrongRoute({
    routeId: "foo",
    Component: () => <></>,
    ErrorBoundary: () => <></>,
  });

  afterEach(cleanup);
  describe("loader", () => {
    describe("when the loader succeeds", () => {
      it("should return a strongResponse using the error tuple", async () => {
        const request = new Request("http://localhost?succeed");
        const result = await (route1.loader as LoaderFunction)({
          request,
        } as DataFunctionArgs);
        const expected = strongResponse(fooResponse);
        const expectedBody = await expected.json();

        assert(result instanceof Response);
        expect(result.status).toStrictEqual(expected.status);
        expect(result.statusText).toStrictEqual(expected.statusText);
        expect(result.headers).toStrictEqual(expected.headers);
        await expect(result.json()).resolves.toStrictEqual(expectedBody);
      });
    });

    describe("when the loader fails", () => {
      it("should throw a strongResponse using the error tuple", async () => {
        const request = new Request("http://localhost?fail");
        const result = await new Promise((resolve, reject) => {
          const p = (route1.loader as LoaderFunction)({
            request,
          } as DataFunctionArgs) as Promise<unknown>;

          return p.then(reject).catch((e: Response) => {
            resolve(e);
          });
        });

        const expected = strongResponse(barResponse);
        const expectedBody = await expected.json();

        assert(result instanceof Response);
        expect(result.status).toStrictEqual(expected.status);
        expect(result.statusText).toStrictEqual(expected.statusText);
        expect(result.headers).toStrictEqual(expected.headers);
        await expect(result.json()).resolves.toStrictEqual(expectedBody);
      });
    });

    describe("when the loader redirects", () => {
      it("should return a redirect response", async () => {
        const request = new Request("http://localhost");
        const result = await (route1.loader as LoaderFunction)({
          request,
        } as DataFunctionArgs);

        const expected = new Response(null, {
          status: redirectResponse.status,
          headers: new Headers({
            Location: "/",
          }),
        });

        assert(result instanceof Response);
        expect(result.status).toStrictEqual(expected.status);
        expect(result.statusText).toStrictEqual(expected.statusText);
        expect(result.headers).toStrictEqual(expected.headers);
      });
    });
  });

  describe("action", () => {
    describe("when the action succeeds", () => {
      it("should return a strongResponse using the error tuple", async () => {
        const request = new Request("http://localhost?succeed");
        const result = await (route1.action as ActionFunction)({
          request,
        } as DataFunctionArgs);
        const expected = strongResponse(fooResponse);
        const expectedBody = await expected.json();

        assert(result instanceof Response);
        expect(result.status).toStrictEqual(expected.status);
        expect(result.statusText).toStrictEqual(expected.statusText);
        expect(result.headers).toStrictEqual(expected.headers);
        await expect(result.json()).resolves.toStrictEqual(expectedBody);
      });
    });

    describe("when the action fails", () => {
      it("should throw a strongResponse using the error tuple", async () => {
        const request = new Request("http://localhost?fail");
        const result = await new Promise((resolve, reject) => {
          const p = (route1.action as ActionFunction)({
            request,
          } as ActionFunctionArgs) as Promise<unknown>;

          return p.then(reject).catch(resolve);
        });

        const expected = strongResponse(barResponse);
        const expectedBody = await expected.json();

        assert(result instanceof Response);
        expect(result.status).toStrictEqual(expected.status);
        expect(result.statusText).toStrictEqual(expected.statusText);
        expect(result.headers).toStrictEqual(expected.headers);
        await expect(result.json()).resolves.toStrictEqual(expectedBody);
      });
    });

    describe("when the action redirects", () => {
      it("should return a redirect response", async () => {
        const request = new Request("http://localhost/");
        const result = await (route1.action as ActionFunction)({
          request,
        } as DataFunctionArgs);

        const expected = new Response(null, {
          status: redirectResponse.status,
          headers: new Headers({
            Location: "/",
          }),
        });

        assert(result instanceof Response);
        expect(result.status).toStrictEqual(expected.status);
        expect(result.statusText).toStrictEqual(expected.statusText);
        expect(result.headers).toStrictEqual(expected.headers);
      });
    });
  });

  describe("Component", () => {
    it("should load and render strongly typed data", async () => {
      const RemixStub = createRemixStub([
        {
          path: "/",
          id: route1.routeId,
          loader: route1.loader,
          action: route1.action,
          Component: route1.Component,
          ErrorBoundary: route1.ErrorBoundary,
        },
      ]);

      render(
        <RemixStub initialEntries={[{ pathname: "/", search: "?succeed" }]} />
      );
      const element = await screen.findByTestId("success");
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

    it("should be able to call parent loaders", async () => {
      const route2 = buildStrongRoute({
        routeId: "/",
        Component: () => {
          const route1Data = route1.useRouteLoaderData();

          return (
            <pre data-testid="childSuccess">
              {JSON.stringify(route1Data, null, 2)}
            </pre>
          );
        },
      });

      const RemixStub = createRemixStub([
        {
          id: route1.routeId,
          loader: route1.loader,
          action: route1.action,
          Component: route1.Component,
          ErrorBoundary: route1.ErrorBoundary,
          children: [
            {
              path: "/",
              index: true,
              loader: route2.loader as any,
              action: route2.action as any,
              Component: route2.Component,
              ErrorBoundary: route2.ErrorBoundary,
            },
          ],
        },
      ]);

      render(
        <RemixStub initialEntries={[{ pathname: "/", search: "?succeed" }]} />
      );

      const route1Data = await screen.findByTestId("success");
      expect(route1Data).toMatchInlineSnapshot(`
        <pre
          data-testid="success"
        >
          {
          "status": 200,
          "data": "Foo"
        }
        </pre>
      `);

      const route2Data = await screen.findByTestId("childSuccess");
      expect(route2Data).toMatchInlineSnapshot(`
        <pre
          data-testid="childSuccess"
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
      const RemixStub = createRemixStub([
        {
          path: "/",
          id: route1.routeId,
          loader: route1.loader,
          action: route1.action,
          Component: route1.Component,
          ErrorBoundary: route1.ErrorBoundary,
        },
      ]);

      render(
        <RemixStub initialEntries={[{ pathname: "/", search: "?fail" }]} />
      );
      const element = await screen.findByTestId("failure");

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
      const RemixStub = createRemixStub([
        {
          path: "/",
          id: route1.routeId,
          loader: route1.loader,
          action: route1.action,
          Component: route1.Component,
          ErrorBoundary: route1.ErrorBoundary,
        },
      ]);

      const { container } = render(
        <RemixStub initialEntries={[{ pathname: "/", search: "?succeed" }]} />
      );
      const element = (await screen.findByTestId("form")) as HTMLFormElement;

      act(() => element.submit());

      expect(container).toMatchInlineSnapshot(`
        <div>
          <form
            action="/?index&fail"
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
        </div>
      `);
    });
  });

  describe("meta", () => {
    it("should return a empty aray", async () => {
      const res = (route1 as any).meta({ data: {} } as any);
      expect(res).toStrictEqual([]);
    });
  });
});
