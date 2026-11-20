# Local setup for hyperswitch-web

Relevant launch profile or command: **payment-web**.

The shared [launch guide](../../../tools/local-dev/README.md) is the current source in the grouped laptop workspace, whose root is `/Users/saltonmassally/Projects/MiKashBoks`. Commands below are run from that root unless explicitly noted. Verify the guide/helper exists before using it. If this repository is cloned independently or hosted, the sibling guide and helpers may be absent: follow native repository scripts, provide that environment's configuration separately, and report any missing dependencies. Do not relocate the checkout to match the laptop layout.

The following is a documentation snapshot for agents working only inside this repository. It contains no environment values, private credentials or generated dependencies. Local emulator availability must be checked at runtime. Update this snapshot when the shared setup changes.

---

# MiKashBoks local development

Prepared on 14 October 2026. The existing checkout branches and application edits are retained.

## Start

From the MiKashBoks root:

```sh
python3 tools/local-dev/infra.py start
python3 tools/local-dev/run.py list
python3 tools/local-dev/run.py merchant-api
```

Each application runs in the foreground. Use a separate terminal for each profile; stop it with Ctrl+C. `infra.py stop` stops only the named setup containers and verified emulator/adapter processes. It does not delete containers or volumes.

| Profile | Local URL |
| --- | --- |
| `merchant-api` | http://127.0.0.1:18080/health |
| `merchant-portal` | http://127.0.0.1:13000/ |
| `storefront` | http://127.0.0.1:18081/health |
| `events-api` | http://127.0.0.1:13001/readyz |
| `events-mobile` | http://127.0.0.1:18083/status |
| `careers-api` | http://127.0.0.1:18082/health |
| `careers-mobile` | http://127.0.0.1:18084/status |
| `payment-web` | http://127.0.0.1:19050/ |

## Libraries

Android SDK debug build:

```sh
sh tools/local-dev/build-android-sdk.sh
```

The AAR is `payments/hyperswitch-sdk-android/app/build/outputs/aar/app-debug.aar`. Its exact upstream Client Core is a dependency cache in `tools/runtime/hyperswitch-client-core-0b69d0b8`, paired to the existing SDK commit. The SDK remains in its single normal checkout. Local Gradle settings supply the external parent path. Publishing scripts were not run.

MoMo uses its existing Yarn lockfile:

```sh
cd payments/momoapi-node
mise exec node@22.22.3 -- yarn install --frozen-lockfile --ignore-scripts
mise exec node@22.22.3 -- npm run compile
mise exec node@22.22.3 -- npm test
```

The test runner selects the appropriate Node TypeScript-loader option automatically and retains ts-node typechecking. All 68 tests pass on Node 22.22.3 and Node 24.21.0.

## Data and configuration

Firestore uses port 18085, Redis 16379, Storage adapter 19198/backend 19199, and fake-only Kannel 21300/21313. Application configuration files are ignored by Git and private. The local Firebase credential is generated solely for emulator initialization; it is unregistered and has a loopback token URL. Do not use these configurations for hosted or production services.

Events demo data was seeded into project `demo-mkb-events`, network `tenant-demo`. Reseed only this local project with:

```sh
python3 tools/local-dev/seed-events.py
```

The seed helper refuses a non-local emulator or different project. Firestore is ephemeral across emulator restarts.

For Android emulators/devices using the loopback API URLs, reverse only the relevant local port:

```sh
adb reverse tcp:13001 tcp:13001
adb reverse tcp:18082 tcp:18082
```

## Verification and remaining limitations

All launch profiles, both Android JavaScript bundles, the payment Web SDK bundle and Android debug AAR were checked. Events demo listings, Storefront product listings, and local emulator SDK writes/reads passed. Startup checks do not establish every business integration.

- Storefront `npm run build` and `npm run build:function` pass after compiler fixes. The local launcher still initializes Firebase before Typesaurus operations and uses tsx for development.
- MoMo `npm test` passes all 68 tests without manual Node flags, and `npm run compile` passes. The tests use mocked requests; real MTN services were not called.
- MoMo uses its maintained `yarn.lock`; its npm lockfile remains stale. Careers orchestrator `package-lock.json` is synchronized with blurhash/sharp and all platform-specific optional dependencies; standard `npm ci` and the backend build pass. Existing locked package versions were retained, and a local Sharp image conversion passed.
- Careers reserves http://127.0.0.1:19082 for development WordPress. Hyperswitch backend and real payment/tenant/SMS providers are not connected by this local setup.
- Local launch profiles use emulator-only settings. Storage uses a loopback compatibility adapter. The generated Firebase credential is unregistered and cannot authorize real cloud resources.
- All application test processes were stopped. Redis, Firestore, local Storage (plus adapter), and fake-SMSC Kannel remain running.
- Latest policy files are installed locally through central project-policy; native approval enforcement and hosted discovery were not tested. No commits, pushes or deployments occurred.

Dependency revisions and image digests are recorded in `dependencies.lock.json`.

## Agent discovery

The MiKashBoks root and the payments, commerce, portals and messaging groups link to this guide from their native agent instruction files. Each of the eight prepared repositories links to `docs/LOCAL_DEVELOPMENT.md` from `AGENTS.md`, `CLAUDE.md` and `GEMINI.md`. These repository notes include a setup snapshot and their relevant profiles or build commands, so an agent opened directly in one repo can find the instructions.

Prefer this shared guide when it exists; keep the eight repository snapshots synchronized after setup changes. A standalone or hosted clone may not have the sibling helpers or private local configuration. Use native build scripts and configure that environment separately. Installed instruction files and working links were verified locally; hosted discovery and filesystem permissions are separate.
