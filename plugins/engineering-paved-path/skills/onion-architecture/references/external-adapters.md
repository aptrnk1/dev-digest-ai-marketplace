# External systems: LLM, VCS, payments, email, search

Every external system is reached through a **port** the application owns and
an **adapter** in `adapters/<system>/` that implements it. This is the
original Hexagonal idea (Cockburn): the app doesn't know whether it talks to
a real provider, a mock, or a test fake.

## Typical map

| Port (interface) | Declared in | Adapters | Composition root accessor |
|------------------|-------------|----------|---------------------------|
| `LLMProvider` | shared ports | `adapters/llm/{openai,anthropic}.ts` | `await container.llm(id)` |
| `VcsClient` (GitHub, GitLab) | shared ports | `adapters/vcs/octokit.ts` | `await container.vcs()` |
| `PaymentGateway` | `modules/billing/ports.ts` | `adapters/payments/stripe.ts` | `container.payments` |
| `Mailer` | shared ports | `adapters/mail/smtp.ts` | `container.mailer` |
| `SecretsProvider` | shared ports | `adapters/secrets/env.ts`, `…/vault.ts` | `container.secrets` |

Keep one place with fakes/mocks for all of them (e.g. `adapters/mocks.ts` or
`test/fakes/`).

## Rules

1. **Modules import ports, never concretions** (`modules-no-concrete-adapters`).
   Only the composition root (and `compose.ts`) construct adapters.
2. **Adapters don't import modules or the container** (`adapters-know-no-modules`).
   If an adapter needs a constant from a module, the constant belongs on the
   port's side (a neutral constants file).
3. **Anti-corruption mapping in the adapter.** Map SDK responses to port types
   inside the adapter; no SDK types leak into services. Wrap SDK failures in a
   port-level error there.
4. **Secrets are resolved in the composition root or the adapter**, through
   whatever secret store the project uses — never in services, the DB or git.
5. **Pure helpers are not adapters.** Pure transforms (a diff parser, a
   tokenizer) can be used by modules, but then they belong in a neutral place
   (`modules/_shared/`, a library package), not under `adapters/`.
6. **Ports shared across packages or modules** live in one shared place. A
   port used by one module lives in that module's `ports.ts`.
7. **Security-critical wrappers stay in one place.** Prompt-injection guards,
   output grounding, signature verification and similar defences live inside
   the adapter or a dedicated library — never re-implemented or weakened in a
   module.
8. **Resilience at the edge.** Retries/timeouts/backoff/concurrency limits wrap
   adapter calls; the service decides what a failure *means* (degrade, fail
   the operation, skip).

## Adding a new external system — steps

1. Write the port from the use case's point of view (`ports.ts` or shared ports).
2. Implement `adapters/<system>/<impl>.ts` with SDK → port mapping.
3. Add a fake/mock for tests.
4. Add a lazy getter (and a test override hook) to the composition root;
   resolve any key via the secret store there.
5. Inject into the service from `compose.ts`.
6. Unit-test the service with the fake; test the adapter with a recorded or
   local fake, never a live paid API in CI.
