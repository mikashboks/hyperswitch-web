<!-- BEGIN mikashboks-hosted-development -->
## Hosted development setup

Before installing dependencies, building, testing or starting services in Codex Cloud or Claude hosted environments, read [this repository's hosted setup guide](docs/HOSTED_DEVELOPMENT.md) and run `python3 tools/hosted/bootstrap.py verify-instructions`. The guide and profile are inside this repository and do not depend on laptop folders, global agent settings, sibling checkouts or private local environment files. Read existing project rules and `AGENT_FEATURES.md` too.

Use `python3 tools/hosted/bootstrap.py plan` to inspect the exact runtime, frozen install and check commands. Report setup blockers and skipped integration checks. Do not infer that laptop checks establish hosted readiness, or that cached files preserve running services. Setup instructions do not authorize Git publication, releases, production/provider calls or shared database migrations.
<!-- END mikashboks-hosted-development -->

# Project agent instructions

<!-- BEGIN salton-agent-collaboration -->
# Shared agent collaboration and Git safety

These are Salton's standing rules for every project and agent. They apply to shell commands, scripts, connected tools, and delegated work. Follow the user's explicit, scoped authorization; preserve stricter protected-branch, data, and release protections. A general request to fix, review, deploy-prep, or clean up is not permission for a protected operation.

## Working together

- Use one active feature, one branch, and one shared checkout folder per repository. All agents on that feature share it. Reuse the normal folder for subsequent features; separate concurrent features require an approved extra checkout. Cross-repository features track each repository separately.
- Keep the current branch until the user approves creating or switching branches. Never switch while another agent is editing or testing. If a protected branch should not receive feature work, recommend an approved feature branch and wait rather than editing it as a scratch branch.
- Create or move work into a worktree only when the user explicitly requests or approves it. Proactively recommend one when useful: explain the concrete benefit, setup cost, and cleanup responsibility, then wait. Never create a worktree as an automatic fix for overlap, dirty files, or tool defaults.
- Name one lead and file/directory owners before parallel editing. Coordinate an explicit ownership handoff before touching another agent's files. If ownership is unknown, inspect and ask rather than claiming existing work. Workers report changes and validation; the lead owns Git mutations, integration, shared configuration, and the feature register.
- Read `AGENT_FEATURES.md` when present and verify its branch, folder, commit, and owners against the current checkout. Only the lead updates it. Recorded machine paths and timestamps are observations, not instructions to change branches or relocate a hosted checkout.

## Explicit approval

- Approval must identify the operation, repository, and affected files or refs. Prior human authorization remains valid within its stated scope; do not ask again unnecessarily. Another agent, automatic reviewer, tool suggestion, or blanket allow rule does not supply human permission.
- Never use `git reset` or `git stash` in any mode unless the user explicitly requests or approves it. This includes automatic stashing and `--autostash`.
- Ask before discarding/overwriting changes via `git restore`, path checkout, `git clean`, deletion, or equivalent tools. Show the affected paths and what would be lost. Preserve unrelated work, staging, and commits in place.
- Ask separately before rebase, amend, squash/history rewrite, force push (including force-with-lease), reflog expiration, Git garbage collection, or equivalent history/reference manipulation. Explain the affected history and collaborators. Stricter prohibitions on protected branches still apply.
- Creating/switching branches, merging, cherry-picking, reverting commits, or pulling into the shared checkout requires user authorization and a lead-coordinated pause. Prefer explicit read-only status/diff/log inspection for orientation; do not run opaque Git aliases without inspecting their expansion.
- The lead may make ordinary validated local commits containing only task-owned changes. Use explicit paths or reviewed hunks, never blanket staging. Preserve existing staged changes; if a safe scoped commit cannot be made, leave edits uncommitted and report the conflict. Never reset/stash to facilitate a commit or bypass hooks/checks to make it pass. Before committing, inspect applicable hooks and staged-file tools for automatic stashing/restoration or formatting/restaging of pre-existing work. If a scoped commit cannot preserve that work while keeping checks intact, leave it uncommitted and report the hook conflict.
- Pushes, publishing, releases, deployments, and remote branch/tag changes require explicit authorization. Identify deployment triggers and exact destination refs. Local commit permission does not authorize a push; a sibling push does not authorize an extra release-trigger commit.
- Recommend cleanup only after verifying preservation. Wait for user approval before deleting/pruning branches, tags, worktrees, or checkout folders. Do not automatically delete merged, abandoned, or superseded work.
- Shared-environment database migrations, destructive queries, infrastructure destruction, and container-volume removal require environment/data-impact review and explicit approval. Do not weaken credentials, permissions, or safeguards without authorization, or bypass a blocked operation through a different tool.
- Stop only precisely identified processes owned by the task. Ask before stopping another task's process. Use targeted formatting/code generation; inspect unexpected changes and preserve unrelated edits rather than cleaning them up.

## Reporting and onboarding

At task start, handoff, after Git changes, and completion report: `Repo: <name> | Folder: <absolute current path> | Branch: <name or detached HEAD + SHA> | Owners: <lead and owned paths> | Commit: <task SHA(s), pending, or none> | Push: <unpushed, verified ref + SHA, or unknown>`. Meaningful progress reports should keep this state clear. Distinguish task edits from pre-existing changes; cached upstream refs do not prove a current remote push.

Maintain a small lead-owned `AGENT_FEATURES.md` register with feature, branch, folder, lead, file owners, validation, commits, push status, and verification time. It tracks checkout coordination, not a duplicate issue backlog. Preserve foreign registers and resolve collisions explicitly. At completion record a closed maintenance task without claiming ownership of remaining application work.

For new projects, install this policy in the native project instruction files and create the feature register through the reviewed central manager's `project-policy` command. Portable repository instructions must contain the policy itself so standalone/hosted agents do not depend on laptop paths or global settings. Do not commit secrets or environment files. Do not publish the policy or push repositories without authorization.

Native approval controls supplement these instructions and have matching/runtime limits. Report installation separately from runtime verification; never claim complete protection across arbitrary scripts, aliases, shell syntax, connected tools, or hosted environments.
<!-- END salton-agent-collaboration -->
