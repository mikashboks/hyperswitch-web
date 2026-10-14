# Hosted development: hyperswitch-web

Prepared for Codex Cloud and Claude hosted environments on 14 October 2026. This is a repository-owned setup plan; fresh hosted runtime validation is pending. The selected published base is `main` at `78f310c3a62beefaba224e7a25e1e8031adcd06b`. The proposed setup ref is `codex/hosted-setup-2026-10-14`. The environment must use a revision that contains this guide and the setup scripts.

## Instructions and startup

Codex discovers root `AGENTS.md`; Claude discovers root `CLAUDE.md`. Both files point here. Preserve their existing project instructions and Git safety policy. Do not expect the laptop's root/group instructions, global skills, credentials, dependencies or background processes to appear in a hosted clone.

```sh
python3 tools/hosted/bootstrap.py verify-instructions
python3 tools/hosted/bootstrap.py plan
python3 tools/hosted/bootstrap.py install
python3 tools/hosted/bootstrap.py check
```

Set `MKB_HOSTED=true` in the hosted environment variables. Installation and checks require Linux. The wrapper selects the specified Node patch release, downloading an official archive and checking its published SHA-256 when the image's Node differs. Other required tools must be provisioned in the platform environment before installation. Each repository retains its independent dependency graph. Installs preserve checked-in manifests and locks and skip unreviewed package lifecycle scripts; selected required generation steps are explicit in `tools/hosted/profile.json`.

Required tools/runtime: **Node 22.22.3**. Python bootstrap requires Python 3.11 or newer. Project Python virtual environments can use a different version as specified in the profile.

## Platform configuration

For Codex Cloud, use `python3 tools/hosted/bootstrap.py install` as the setup command and the same command as maintenance so manifest/lock changes refresh dependencies. Keep agent networking restricted to the registries needed by the task. Setup-only registry secrets must not be copied to source, logs or persistent credential files. A resumed cache must recheck dependencies and start required development services again.

For Claude hosted environments, provision required system/runtime tools in the environment's setup script. The repository `.claude/settings.json` adds a `SessionStart` hook with a 1200-second timeout. The hook exits immediately in local sessions and invokes the same frozen installer only when `CLAUDE_CODE_REMOTE=true`. Existing hooks and permission settings are retained. Multi-repository cloud sessions may not load repository hooks; explicitly run this repository's setup command in that case. Filesystem caching does not preserve databases or background processes.

## Checks

- From `.`: `npm exec --no -- rescript`
- From `.`: `npm run build`

These checks cover only their stated target. They do not establish payment, identity, wallet, biometric, SMS, Odoo, WordPress or tenant integrations. Record the actual hosted revision, tool versions, commands, exit statuses and skipped checks in the maintenance register. Do not run a migration, seed or provider request until its development environment and intended data changes are authorized.

## Additional setup requirements

- No install blocker identified from the local manifests; a fresh hosted install still must be verified.

- The published gitlink, not shared-code main, is the required revision. The laptop-specific Webpack launcher is separate.
- Setup initializes only the declared shared-code dependency at its checked-in gitlink; it does not use --remote, change the parent branch or run the postinstall that changes Git hooks and installs an unlocked demo app.

## Configuration and services

Use environment-specific development credentials through platform controls. Do not upload the laptop's `.env`, emulator credential, SDK configuration, database data, `node_modules` or virtual environments. Consult native example configuration and service documentation, confirm loopback or isolated development endpoints, and provision only the services required by the task. If those services or credentials are absent, report the dependency instead of substituting a production endpoint.

On the grouped laptop workspace, use the shared `tools/local-dev/README.md` guide when it exists. A repository's `docs/LOCAL_DEVELOPMENT.md` may include a laptop snapshot; it does not provision this Linux environment. Hosted setup instructions above remain usable without sibling paths.

Official platform references: [Codex environments](https://learn.chatgpt.com/docs/environments/cloud-environment), [Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [Claude cloud environments](https://code.claude.com/docs/en/cloud-environments), [Claude project instructions](https://code.claude.com/docs/en/memory).
