# Release Policy

## Versioning

StingJS follows SemVer:
- `MAJOR`: breaking API/behavior changes
- `MINOR`: backwards-compatible features
- `PATCH`: backwards-compatible fixes

## Branch/PR Expectations

Every feature/fix PR should include:
- implementation changes
- test coverage
- docs updates (if user-facing behavior/API changes)

## Pre-Release Gates

Before any release tag:
1. `npm ci`
2. `npm run build`
3. `npm run test:all`
4. `npm run size:check`
5. changelog entry reviewed

## Release Checklist

1. Verify `stingjs.md` definition of done is satisfied.
2. Update `CHANGELOG.md` with release notes.
3. Bump `package.json` version.
4. Create release commit.
5. Tag release (`vX.Y.Z`).
6. Publish package and GitHub release notes.

## RC Cycle

For major releases, ship at least one RC:
- `X.Y.Z-rc.1`
- Collect issues and triage
- Promote to stable once blockers are resolved
