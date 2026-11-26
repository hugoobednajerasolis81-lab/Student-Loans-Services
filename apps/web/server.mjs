import express from "express";
import { createRequestHandler } from "@react-router/express";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(here, "public");
const clientBuild = resolve(here, "build/client");
const port = Number(process.env.PORT || 3000);

const build = await import("./build/server/index.js");
const app = express();
app.disable("x-powered-by");

app.get("/healthz", (_request, response) => {
  response.setHeader("Cache-Control", "no-store");
  response.json({ ok: true, service: "student-loans-solutions-web" });
});

app.get("/", (_request, response) => {
  response.sendFile(resolve(publicDir, "index.html"));
});

// Keep old bookmarks working, but send visitors into the real application.
app.get("/advisor.html", (_request, response) => response.redirect(302, "/login"));
app.get("/document-preparation.html", (_request, response) => response.redirect(302, "/document-preparation"));

app.use(express.static(clientBuild, {
  index: false,
  maxAge: process.env.NODE_ENV === "production" ? "1h" : 0,
  immutable: false
}));
app.use(express.static(publicDir, { index: false, maxAge: 0 }));
app.use(createRequestHandler({ build, mode: process.env.NODE_ENV }));

app.listen(port, "0.0.0.0", () => {
  console.log(`Student Loans Solutions application listening on port ${port}`);
});
