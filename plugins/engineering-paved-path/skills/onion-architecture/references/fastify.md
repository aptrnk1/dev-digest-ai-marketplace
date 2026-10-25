# Fastify as the inbound adapter

Fastify (or any HTTP framework) is a delivery mechanism. A route translates
HTTP into a use-case call and the result back into HTTP — nothing else. If you
deleted the framework and drove the service from a CLI or a job, no business
rule should be lost.

## What a handler does (and only this)

1. Validate input — declaratively, via the route `schema` (`params`, `body`,
   `querystring`, `response`), e.g. with `fastify-type-provider-zod` or JSON
   Schema. Don't call `Schema.parse(req.body)` inside the handler.
2. Resolve request context — e.g. `getContext(app.container, req)` →
   `{ tenantId, userId }`.
3. Call **one** service method with plain typed arguments (not `req`).
4. Map the outcome — status code (`reply.status(201)`), `undefined` → 404,
   domain error → HTTP error (module `toHttpError`).
5. Return the DTO (serialized by the `response` schema when declared).

Smell: a handler longer than ~15 lines, any `if` about business state, any
direct DB access, any loop that persists things → move it into the service.

## Plugins, encapsulation, registration

- Each module is one Fastify plugin (`modules/<m>/routes.ts`) — encapsulation
  gives a natural per-module boundary (Fastify docs: *Encapsulation*).
- Register modules the way the project already does (static list or
  `@fastify/autoload`); don't mix both.
- Build the service **once per plugin** (`const service = createXService(app.container)`),
  not per request.
- Cross-cutting HTTP concerns (CORS, helmet, rate limit, error handler,
  validator/serializer compilers) are configured where the app is built, not in
  modules.

## DI with a container

- `app.decorate('container', container)` makes the composition root available
  as `app.container`.
- Only `routes.ts` and `compose.ts` read it. Services get narrow deps.
- Tests swap implementations through container overrides
  (`buildApp({ overrides })`) — the reason services must not `new` their own
  adapters.
- Don't add per-module `app.decorate(...)` for services; keep wiring in one
  place (Seemann, *Composition Root*).

## Errors

- One global `setErrorHandler` renders a single error shape
  (e.g. `{ error: { code, message, details } }`): validation → 400/422, known
  HTTP errors → their status, everything else → 500.
- New code: domain/application errors carry a `code` only; the route maps them
  to HTTP errors (see `layers-and-placement.md` → `http-errors.ts`).
  Status codes are an HTTP concern.
- Don't `try/catch` just to log-and-rethrow; let the global handler do it.

## Jobs and SSE are inbound adapters too

- A job handler parses/casts the payload and calls a service method — same
  thinness as a route. Register it from `routes.ts` / `compose.ts`.
- SSE/WebSocket: the route subscribes and streams; the service publishes
  domain events through a port (e.g. `RunEvents.publish`), not by importing
  the transport plugin.

## Testing the adapter

`app.inject({ method, url, payload })` exercises routing, validation,
serialization and error mapping without a port (Fastify docs: *Testing*).
Use fake adapters via container overrides. Business branches are tested at
the service level, not through HTTP.
