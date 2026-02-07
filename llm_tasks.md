# StingJS v1.0 Execution Plan (LLM Tasks)

Last updated: 2026-02-07
Planning horizon: v1.0.0 release

Purpose:
- Convert v1 requirements into executable milestones
- Track done vs remaining work

## 0) Success Metrics

1. Reliability: lifecycle/disposer regressions covered by automated tests.
2. CSP: strict policy fixture and tests with no `unsafe-eval` requirement.
3. DX: quickstart + directive/API docs are complete.
4. Stability: CI and release checks gate shipping.

## 1) Milestone Status

## M0 - Baseline and Guardrails (P0)

Tasks:
- [x] M0-T1: Fix component teardown tracking in runtime startup/observer flow.
- [x] M0-T2: Fix `x-if` disposer scoping so toggle cycles do not leak.
- [x] M0-T3: Make `x-on` arg invocation semantics coherent for loop/item handlers.
- [x] M0-T4: Add targeted regression tests for T1-T3.
- [x] M0-T5: Clarify and standardize `start()` contract.

Acceptance criteria:
- [x] Removing a component root disposes effects/listeners/timers.
- [x] Repeated `x-if` toggles do not leak active effects.
- [x] `x-on` list handler patterns (`remove(i)`) are deterministic and tested.
- [x] New regression tests pass.

## M1 - Directive Contract Hardening

Tasks:
- [x] M1-T1: Write directive behavior matrix.
- [x] M1-T2: Add directive edge-case tests (`null`, nested paths, dynamic removal).
- [x] M1-T3: Define explicit `x-for` v1 guarantees.
- [x] M1-T4: Define explicit `x-model` v1 guarantees.
- [x] M1-T5: Ensure actionable directive warnings/constraints are documented.

Acceptance criteria:
- [x] Each directive has "Supported" / "Not Supported" docs.
- [x] Test suite maps to directive contract rows.
- [x] No undocumented behavior relied upon by fixtures/tests.

## M2 - CSP-First Developer Experience

Tasks:
- [x] M2-T1: Create `docs/csp.md` with strict policy examples.
- [x] M2-T2: Add CSP smoke fixture/page and test coverage.
- [x] M2-T3: Document CSP-safe handler patterns for loops/args.
- [x] M2-T4: Add runnable CSP end-to-end example.

Acceptance criteria:
- [x] Docs include a policy excluding `unsafe-eval`.
- [x] Example fixture runs with same policy locally/CI.
- [x] Runtime does not require expression evaluation.

## M3 - Docs, Packaging, and API Stability

Tasks:
- [x] M3-T1: Expand README with install/quickstart/directive index.
- [x] M3-T2: Add API reference docs.
- [x] M3-T3: Add `CHANGELOG.md` and release policy docs.
- [x] M3-T4: Validate package exports and dist artifacts.
- [x] M3-T5: Add compatibility statement.

Acceptance criteria:
- [x] New users have copy-paste quickstart docs.
- [x] API docs align with exports.
- [x] Changelog + release policy support release notes discipline.

## M4 - Production Hardening and 1.0 Release

Tasks:
- [x] M4-T1: Add CI workflow gates (build/tests/size).
- [x] M4-T2: Add cross-browser Playwright matrix in CI config.
- [x] M4-T3: Add bundle size budget check.
- [x] M4-T4: Add RC process template and triage checklist.
- [ ] M4-T5: Tag and publish `1.0.0`.

Acceptance criteria:
- [ ] CI green on release commit (to verify on remote runner).
- [ ] RC feedback triaged for first release candidate.
- [ ] Tag/publish completed.

## 2) Current Priorities

P0 complete in-repo.

Remaining release execution steps:
1. Run CI on remote runner and verify green matrix.
2. Cut `1.0.0-rc.1` and triage feedback.
3. Bump version/tag/publish `1.0.0`.
