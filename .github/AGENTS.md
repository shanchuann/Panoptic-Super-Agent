# AGENTS.md — Panoptic Super repository automation

The maintained workflow is [workflows/ci.yml](workflows/ci.yml): pull requests, main pushes, and manual runs on GitHub-hosted Windows with native PowerShell. Keep its runtime aligned with package.json and its permissions limited to repository content reads.

Run frozen dependency installation, typecheck, the complete build, and the owning brand/icon tests before merging. Local gates remain available independently of the hosted workflow.

Reviews, labels, and Issue status are maintained through this repository's GitHub interface. Do not recreate upstream approval Apps, Project mutations, self-hosted runner routing, Cloudflare preview publication, or GitLab publication as incidental maintenance. New publication automation needs this project's destinations and credentials.

Keep the [Issue and PR conventions](issue-management/README.md) and [.ome/CI-POLICY.md](../.ome/CI-POLICY.md) aligned with the actual workflow. Product packages, SDKs, local packaging, and optional integrations are independent of this repository automation.
