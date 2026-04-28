import { Elysia } from "elysia";

const app = new Elysia()
  .get("/", () => ({ ok: true, service: "crux-api" }))
  .get("/health", () => ({ status: "ok" }))
  .listen(process.env.PORT ?? 3000);

console.log(
  `Elysia at http://${app.server?.hostname}:${app.server?.port}`,
);
