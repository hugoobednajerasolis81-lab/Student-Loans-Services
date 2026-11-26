import { renderToString } from "react-dom/server";
import { ServerRouter } from "react-router";

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: Parameters<typeof ServerRouter>[0]["context"]
) {
  const html = renderToString(
    <ServerRouter context={routerContext} url={request.url} />
  );
  responseHeaders.set("Content-Type", "text/html; charset=utf-8");
  return new Response(`<!DOCTYPE html>${html}`, {
    status: responseStatusCode,
    headers: responseHeaders
  });
}
