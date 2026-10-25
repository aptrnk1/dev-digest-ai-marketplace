---
name: next-best-practices
description: "Next.js App Router best practices: server/client component boundaries, data fetching and caching, async request APIs, Server Actions, route handlers, file conventions, metadata, streaming, images and fonts. Use when writing, reviewing, or refactoring code in a Next.js app (app/ directory), or when deciding where a piece of UI, data access, or mutation belongs."
---

# Next.js Best Practices (App Router)

Rules for apps built on the App Router (`app/`). Pair with
`engineering-paved-path:react-best-practices` for component-level rules.

**Check the version first.** Read `next` in `package.json` before applying a rule.
APIs changed between majors: request APIs became async in 15, `fetch` stopped being
cached by default in 15, and 16 renamed `middleware.ts` to `proxy.ts` and added
`"use cache"`. When a rule below is version-specific, it says so. If the installed
version ships its own docs (`node_modules/next/dist/docs/`) or a generated
`AGENTS.md`, those win over this skill.

## Severity Levels

- **CRITICAL**: leaks data or secrets, breaks rendering, or produces wrong data
- **HIGH**: hurts performance, caching, or bundle size noticeably
- **MEDIUM**: hurts maintainability or consistency

---

## Server and Client Boundaries (CRITICAL)

- Components in `app/` are Server Components by default. Add `"use client"` only to
  the component that needs state, effects, event handlers, or browser APIs.
- Push `"use client"` to the leaves. A client `layout` or `page` turns its whole
  subtree into client code and ships it to the browser.
- Props that cross from server to client must be serializable: plain objects,
  arrays, primitives, `Date`, `Map`, `Set`, promises, and Server Actions. Never class
  instances or ordinary functions.
- Pass Server Components into Client Components as `children` or other slot props
  instead of importing them inside a client file.
- Mark modules that touch secrets, the database, or internal services with
  `import "server-only"` so an accidental client import fails the build.
- Only `NEXT_PUBLIC_*` env vars reach the browser, and they are inlined at build
  time. Anything else is server-only. Never prefix a secret with `NEXT_PUBLIC_`.

## Data Fetching (CRITICAL)

- Fetch data in Server Components, close to where it is used. Don't fetch in a
  `useEffect` when the server can do it.
- Don't call your own route handlers (`/api/...`) from Server Components. Call the
  underlying function or service directly.
- Start independent requests in parallel (`Promise.all`, or start promises before
  awaiting) to avoid waterfalls.
- Deduplicate repeated reads within one request with React `cache()` around the
  data function, rather than prop-drilling the result.
- Check authorization in the data layer, next to the query, not only in a layout or
  in `proxy`/`middleware`. Layouts don't re-run on every navigation, and a page can
  be reached without its parent layout's check running again.
- Return only the fields the UI needs (a DTO), not whole database rows, when the
  data crosses into a Client Component.

## Caching and Revalidation (HIGH)

- Know the default for your version. In 15+ `fetch` is not cached unless you opt in
  (`cache: "force-cache"` or `next: { revalidate: n }`). In 14 it was cached by
  default.
- On 16 with `cacheComponents` enabled, mark cacheable functions or components with
  `"use cache"` and set their lifetime with `cacheLife` and `cacheTag`.
- Tag cached data (`next: { tags: [...] }` or `cacheTag`) and invalidate it after a
  mutation with `revalidateTag` / `updateTag`, or use `revalidatePath` for a route.
- Reading `cookies()`, `headers()`, `searchParams`, or an uncached fetch makes the
  route dynamic. Keep these reads inside the smallest component that needs them,
  wrapped in `<Suspense>`, so the rest of the page can stay static.
- Use `generateStaticParams` for dynamic segments whose values are known at build
  time.

## Async Request APIs (CRITICAL, 15+)

- `params`, `searchParams`, `cookies()`, `headers()`, and `draftMode()` return
  promises. Await them in Server Components; in Client Components unwrap with
  React `use()`.
- Type page props accordingly, e.g. `params: Promise<{ id: string }>`.
- Validate `params` and `searchParams` like any user input before using them.

## Mutations and Server Actions (CRITICAL)

- Define Server Actions with `"use server"` in a separate module, or inline in a
  Server Component.
- Treat every Server Action as a public HTTP endpoint: validate the input with a
  schema, authenticate, and authorize inside the action. Hiding the button is not
  access control.
- After a successful mutation, revalidate the affected tags or paths, then
  `redirect()` if needed. `redirect()` throws, so call it outside `try/catch`.
- Return typed results for expected errors (validation, conflict) and show them with
  `useActionState`. Throw only for unexpected failures, which go to `error.tsx`.
- Use `useFormStatus` or `useTransition` for pending states. Use `useOptimistic` for
  optimistic UI.

## Route Handlers (HIGH)

- `app/**/route.ts` is for external consumers: webhooks, public APIs, file
  downloads, OAuth callbacks. Internal UI data goes through Server Components and
  Server Actions.
- A `route.ts` and a `page.tsx` cannot live in the same segment.
- Validate the body and query, check auth, and return explicit status codes.
- Verify webhook signatures before parsing the payload.

## File Conventions (MEDIUM)

- `layout.tsx` holds shared UI and persists across navigations. Don't put
  per-request logic there that must re-run on every page.
- `loading.tsx` wraps the segment in a Suspense boundary. Prefer explicit
  `<Suspense>` around slow parts when only one part is slow.
- `error.tsx` must be a Client Component. It catches errors of its segment's
  children, not of the layout in the same segment; use `global-error.tsx` for the
  root layout.
- Use `notFound()` with `not-found.tsx` for missing resources instead of rendering
  an empty page with status 200.
- Route groups `(group)` organize folders without changing the URL. Private folders
  `_folder` are excluded from routing.
- Request interception lives in `proxy.ts` on 16 (`middleware.ts` before 16). Keep
  it fast: redirects, rewrites, headers, coarse auth gates. No database queries.

## Metadata and SEO (MEDIUM)

- Export `metadata` or `generateMetadata` from layouts and pages instead of writing
  `<head>` tags by hand.
- `generateMetadata` and the page can share fetched data through the same cached
  data function, so the data is not fetched twice.
- Add `sitemap.ts`, `robots.ts`, and `opengraph-image.tsx` with the file conventions
  where the app needs them.

## Streaming and Suspense (HIGH)

- Wrap slow, independent parts in `<Suspense fallback={...}>` so the shell renders
  first.
- Keep fallbacks the same size as the content they replace to avoid layout shift.
- Don't wrap the whole page in one boundary; that brings back the waterfall.

## Assets: Images, Fonts, Scripts (HIGH)

- Use `next/image` with explicit `width`/`height` or `fill` plus a sized parent.
  Set `priority` (or `preload` on 16) only on the above-the-fold image. Configure
  `images.remotePatterns` narrowly.
- Load fonts with `next/font` in a layout and expose them as CSS variables. Don't
  load fonts from a `<link>` to a font CDN.
- Load third-party scripts with `next/script` and the right `strategy`.
- Use `next/link` for internal navigation so routes are prefetched.

## Hydration Errors (HIGH)

Server HTML and the first client render must match. Common causes:

- `Date.now()`, `Math.random()`, or locale-dependent formatting during render
- reading `window`, `localStorage`, or `navigator` during render
- invalid HTML nesting (`<div>` inside `<p>`, nested `<a>`)
- browser extensions changing the DOM (not your bug)

Fix by moving browser-only values into `useEffect`, rendering them only on the
client, or passing a server-computed value as a prop. Use
`suppressHydrationWarning` only for a single known-different value, such as a
timestamp.

## Review Checklist

- [ ] `"use client"` is at the leaves; no client layout without a reason
- [ ] No secret or server-only module reachable from a client file (`server-only` used)
- [ ] Data fetched on the server, in parallel, with auth checked next to the query
- [ ] Caching behavior is explicit for the installed version; mutations revalidate
- [ ] Request APIs are awaited (15+); params and search params validated
- [ ] Every Server Action validates input and checks authorization
- [ ] Route handlers only for external consumers; webhooks verify signatures
- [ ] `error.tsx` is a client component; `notFound()` used for missing data
- [ ] Images sized, fonts via `next/font`, no hydration-unsafe values in render

## Sources

- Next.js documentation: <https://nextjs.org/docs/app>
- React Server Components: <https://react.dev/reference/rsc/server-components>
- Next.js security guide, "How to think about security in Next.js":
  <https://nextjs.org/blog/security-nextjs-server-components-actions>
