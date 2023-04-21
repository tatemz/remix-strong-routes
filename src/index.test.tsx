/* eslint-disable @typescript-eslint/no-explicit-any */
import "isomorphic-fetch";
import React from "react";
import { unstable_createRemixStub } from "@remix-run/testing";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HttpStatusCode } from "./HttpStatusCode";
import { buildStrongRoute } from "./buildStrongRoute";
import { strongResponse } from "./strongResponse";
import {
  StrongResponse,
  LoaderErrorable,
  LoaderFailureComponent,
  LoaderSuccessComponent,
} from "./types";

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

describe("buildRemixRouteExports", () => {
  type FooResponse = StrongResponse<"Foo", HttpStatusCode.OK>;
  type BarResponse = StrongResponse<
    "Bar",
    HttpStatusCode.INTERNAL_SERVER_ERROR
  >;

  type LoaderSuccessResponse = FooResponse;
  type LoaderFailureResponse = BarResponse;

  type LoaderResponse = LoaderErrorable<
    LoaderSuccessResponse,
    LoaderFailureResponse
  >;

  const successResponse: LoaderSuccessResponse = {
    data: "Foo",
    status: HttpStatusCode.OK,
  };

  const failureResponse: LoaderFailureResponse = {
    data: "Bar",
    status: HttpStatusCode.INTERNAL_SERVER_ERROR,
  };

  const loaderSuccess: LoaderSuccessComponent<LoaderSuccessResponse> = (
    props
  ) => {
    return <pre data-testid="success">{JSON.stringify(props, null, 2)}</pre>;
  };

  const loaderFailure: LoaderFailureComponent<LoaderFailureResponse> = (
    props
  ) => {
    return <pre data-testid="failure">{JSON.stringify(props, null, 2)}</pre>;
  };

  const successLoaderRoute = buildStrongRoute<LoaderResponse>({
    loader: async () => {
      return [successResponse, null];
    },
    action: undefined,
    loaderSuccess,
    loaderFailure,
  });

  const failureLoaderRoute = buildStrongRoute<LoaderResponse>({
    loader: async () => {
      return [null, failureResponse];
    },
    action: undefined,
    loaderSuccess,
    loaderFailure,
  });

  describe("loader", () => {
    describe("when the loader succeeds", () => {
      it("should return a strongResponse using the error tuple", async () => {
        const result = await successLoaderRoute.loader({} as any);
        const expected = strongResponse(successResponse);
        const expectedBody = await expected.json();

        expect(result.status).toStrictEqual(expected.status);
        expect(result.statusText).toStrictEqual(expected.statusText);
        expect(result.headers).toStrictEqual(expected.headers);
        await expect(result.json()).resolves.toStrictEqual(expectedBody);
      });
    });

    describe("when the loader fails", () => {
      it("should throw a strongResponse using the error tuple", async () => {
        const result: Response = await new Promise((resolve, reject) => {
          failureLoaderRoute
            .loader({} as any)
            .then(reject)
            .catch(resolve);
        });
        const expected = strongResponse(failureResponse);
        const expectedBody = await expected.json();

        expect(result.status).toStrictEqual(expected.status);
        expect(result.statusText).toStrictEqual(expected.statusText);
        expect(result.headers).toStrictEqual(expected.headers);
        await expect(result.json()).resolves.toStrictEqual(expectedBody);
      });
    });
  });

  describe("loaderSuccess", () => {
    it("should load and render strongly typed data", async () => {
      const RemixStub = unstable_createRemixStub([
        {
          path: "/",
          index: true,
          element: <successLoaderRoute.default />,
          loader: successLoaderRoute.loader as any,
        },
      ]);

      const { findByTestId } = render(<RemixStub />);
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

  describe("loaderFailure", () => {
    it("should load and render strongly typed data for error boundaries", async () => {
      const RemixStub = unstable_createRemixStub([
        {
          path: "/",
          index: true,
          element: <failureLoaderRoute.default />,
          errorElement: failureLoaderRoute.ErrorBoundary ? (
            <failureLoaderRoute.ErrorBoundary />
          ) : (
            <></>
          ),
          hasErrorBoundary: true,
          loader: failureLoaderRoute.loader as any,
        },
      ]);

      const { findByTestId } = render(<RemixStub />);
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
  });
});
