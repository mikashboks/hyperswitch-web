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

## Runtime support before deployment

- Before choosing or releasing a managed runtime, verify the hosting provider's current support schedule and test the application with the exact supported runtime and dependency lockfiles. A local Node upgrade or an engines field change does not prove the serving runtime was upgraded; verify its deployed configuration and startup after an authorized release.
- Google Cloud reminder, verified 15 October 2026: Node.js 20 Cloud Run functions are scheduled for decommission on **30 October 2026**. Upgrade affected functions to a currently supported runtime after compatibility checks and review. Node.js 22 is the smallest supported upgrade from Node.js 20 on the same google-22 stack; recheck the current schedule before choosing it. Source: https://docs.cloud.google.com/functions/docs/runtime-support.
- This date applies to Google Cloud's managed function runtime, not AWS Lambda or every local Node installation. Check each provider separately. This reminder does not authorize upgrading unrelated services, changing dependencies, pushing, deploying or altering customer data; existing scoped approval and release gates remain in force.

## Future local Docker tests

- Before creating a new local Docker integration-test environment on the configured Colima host, use the shared `local-test-launcher` skill and `mkb-test status`, then a reviewed `mkb-test check PLAN.json` / `mkb-test run PLAN.json`. The reviewed provider-fee native adapter may instead use the same shared admission/lifecycle API documented by that skill; this exception does not allow arbitrary host runners. This applies to future runs; do not interrupt already-running work to retrofit the launcher.
- Keep the shared admission limits, read-only source mounts, new disposable fixtures, bounded logs/memory/runtime, and preserved evidence. A blocked launch is a reason to pause that run, not permission to bypass the launcher, lower limits, prune Docker, remove databases, or stop another task.
- Existing containers/volumes, code, databases, chat history and saved test evidence are excluded from launcher cleanup. Do not silently change a preserve-all runner or attach existing database storage. Coordinate adapters with the existing file owner. Direct Docker/build commands and old runners are not technically intercepted; if a suite cannot use the launcher, report that gap before creating more environments.

## Agent test cleanup

- Every new disposable test run must own a unique run ID and record the exact container, network and volume IDs it creates. Never adopt an existing environment or use a shared container name. Preserve running environments; maintenance must not stop or restart Docker, Colima or another task's services.
- Export required logs, test results and database evidence before cleanup. Successful runs remove their own stopped containers, newly created disposable volumes and empty networks in a finally/EXIT path. Verify IDs and ownership immediately before removal; use no global prune or forced removal. Cleanup failure is a reported incomplete run, not a passing closeout.
- Use bounded tmpfs for disposable database storage when recovery tests do not require a volume. Keep only bounded failure diagnostics: the shared launcher retains failures for 48 hours with its existing caps; report the run ID and explicit reap command. A deliberate retention exception needs a reason, owner and expiry. Historical evidence and existing databases remain outside automatic cleanup.
- Reuse preloaded test images. Do not build a new image per test case or use unbounded timestamp tags. Builds need a reviewed need and a disk/cache check before starting; exceeding the shared 20 GiB cache admission ceiling blocks new work until reviewed maintenance. Never prune shared images/cache or change daemon GC settings as an incidental test cleanup.
- At task closeout report evidence path, cleanup outcome and any retained resources with expiry. Legacy runners must be adapted before their next use; documented direct Docker examples do not waive the launcher requirement. Reload existing agent sessions after instruction updates.

## Reporting and onboarding

At task start, handoff, after Git changes, and completion report: `Repo: <name> | Folder: <absolute current path> | Branch: <name or detached HEAD + SHA> | Owners: <lead and owned paths> | Commit: <task SHA(s), pending, or none> | Push: <unpushed, verified ref + SHA, or unknown>`. Meaningful progress reports should keep this state clear. Distinguish task edits from pre-existing changes; cached upstream refs do not prove a current remote push.

Maintain a small lead-owned `AGENT_FEATURES.md` register with feature, branch, folder, lead, file owners, validation, commits, push status, and verification time. It tracks checkout coordination, not a duplicate issue backlog. Preserve foreign registers and resolve collisions explicitly. At completion record a closed maintenance task without claiming ownership of remaining application work.

For new projects, install this policy in the native project instruction files and create the feature register through the reviewed central manager's `project-policy` command. Portable repository instructions must contain the policy itself so standalone/hosted agents do not depend on laptop paths or global settings. Do not commit secrets or environment files. Do not publish the policy or push repositories without authorization.

Native approval controls supplement these instructions and have matching/runtime limits. Report installation separately from runtime verification; never claim complete protection across arbitrary scripts, aliases, shell syntax, connected tools, or hosted environments.
<!-- END salton-agent-collaboration -->
