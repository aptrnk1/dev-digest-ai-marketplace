# Enforcement — dependency-cruiser (optional)

Rules that live only in prose erode. If the project wants the layer rules
checked mechanically, dependency-cruiser is a good fit (eslint-plugin-boundaries
is an alternative). When the project already has such a check, it is ground
truth for import direction — run it before and after a change.

## Typical setup

| Piece | Example |
|-------|---------|
| Config with `forbidden` rules | `.dependency-cruiser.cjs` next to the backend `package.json` |
| Baseline of legacy violations | `.dependency-cruiser-known-violations.json` |
| Check command | `depcruise src --config .dependency-cruiser.cjs --ignore-known --output-type err` (often exposed as an `arch:check` script) |
| Baseline command | `depcruise-baseline src --config .dependency-cruiser.cjs` |
| CI | a step in the backend typecheck/lint job |

## Example rules

| Rule | Forbids | Skill rule |
|------|---------|------------|
| `domain-is-pure` | `domain.ts`/`domain/**` → DB, ORM, HTTP framework, validation library, SDKs, adapters, other modules (own `constants.ts`/`types.ts` OK) | 1, 6 |
| `domain-contracts-type-only` | domain → runtime import of shared contracts (type-only OK) | 6 |
| `ports-are-pure` | `ports.ts` → DB, HTTP framework, SDKs, adapters, container | 1 |
| `service-no-infrastructure` | `service.ts`/`*.service.ts` → DB, ORM, HTTP framework, SDKs, `adapters/` | 1, 4, 10 |
| `service-no-container` | service → the container module (even `import type`) | 2 |
| `service-no-concrete-repository` | service → repository/mapper files | 2, 4 |
| `orm-only-in-repositories` | any module file except repository/mappers → ORM, DB schema | 4 |
| `framework-only-in-routes` | any module file except `routes.ts`, `_shared/` → HTTP framework packages | 5 |
| `no-cross-module-internals` | module A → module B's repository/service/routes/compose | 11 |
| `adapters-know-no-modules` | `adapters/**` → modules, container | 10 |
| `modules-no-concrete-adapters` | module files (except `compose.ts`/`index.ts`) → `adapters/**` (test fakes OK) | 10 |

File-role detection is usually **by file name** (`service.ts`, `routes.ts`,
`repository.ts`, `*.repo.ts`, `mappers.ts`, `ports.ts`, `domain.ts`,
`compose.ts`) — follow the naming in the module template or the rules can't
see your layers. With `tsPreCompilationDeps: true`, type-only imports count.

## Reading a failure

```
error service-no-container: src/modules/notes/service.ts → src/platform/container.ts
```

Fix the dependency, don't silence it: inject the dep through the constructor
and wire it in `compose.ts`. Give each rule a `comment` that says what to do
instead. `--output-type text` or `dot` helps to see the graph.

## Baseline policy

- Re-baseline only **after you removed legacy violations** (to shrink the
  file) — commit the smaller baseline in the same change as the fix.
- Never re-baseline to make a new violation pass. A reviewer should reject a
  change where the known-violations file grows.
- Baseline entries can contain resolved package paths with versions. After
  bumping such a dependency, old violations may reappear as "new" —
  re-baseline in the bump change, verifying the count did not grow.
- To see everything, including baselined: run the check without `--ignore-known`.

## Changing the rules

Tighten freely; loosening a rule needs a reason in the change description and a
matching edit to the project's architecture doc. Rules reference:
dependency-cruiser `doc/rules-reference.md`.
