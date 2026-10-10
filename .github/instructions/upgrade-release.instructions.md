---
description: "Use when completing an AccreditEx upgrade, feature, or bug fix: automatically validate, commit, push, deploy, and verify the release."
applyTo: "**"
---

# Upgrade release preference

The project owner authorizes committing, pushing, and deploying each completed upgrade without asking again. A newer explicit request to pause, review, or avoid deployment overrides this preference.

- Run the relevant tests and production build before releasing. Do not release failed or unverified changes, bypass CI gates, or call unrelated existing failures a successful full validation.
- Inspect the worktree and stage only files belonging to the completed upgrade. Never commit secrets or unrelated work.
- Use a descriptive commit with the Copilot co-author trailer, then push the current authorized branch without force. Production releases target `main`; do not merge or change branches automatically.
- Deploy frontend changes to Firebase Hosting project `accreditex-79c08` using existing authorized credentials. Deploy AI backend changes through the existing Render service `srv-d4d48b49c44c7395gifg`. Do not redeploy an unchanged backend.
- Do not automatically deploy Firestore/Storage rules, indexes, Cloud Functions, database migrations, or billing/infrastructure changes under this frontend/backend release preference.
- If CI already deploys the same commit successfully, do not trigger a duplicate deployment. Otherwise use the existing session deployment tools; this instruction is not unattended CI automation.
- Verify the deployed frontend build or backend commit and relevant live behavior before reporting success. A triggered or in-progress deployment is not a verified release.
- Report the commit, deployment target, validation results, and any blockers. If credentials, permissions, tests, build, push, or deployment fail, stop the release and explain the blocker.
