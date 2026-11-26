# Security policy

## Supported versions

This project is pre-1.0. Security fixes are maintained only on the **`master`
branch**. Older commits, release tags, other branches, and downstream forks do not
receive separate backports. Applications built from the template must review and
apply relevant upstream fixes themselves.

## Report a vulnerability privately

Use **GitHub Private Vulnerability Reporting**:

[Submit a private vulnerability report](https://github.com/gabrielmaialva33/adonis-web-kit/security/advisories/new)

Do not disclose vulnerabilities, exploit details, secrets, or customer data in
public issues, pull requests, or comments. This is the designated security contact
channel; no email contact is provided. GitHub private reporting must be enabled
for the form to accept reports. If the form is unavailable, request that
maintainers enable it without publishing vulnerability details.

Report suspected authentication bypass, token replay/revocation failures,
cross-tenant access, privilege escalation, unsafe file handling, secret exposure,
injection, or other exploitable behavior in the template or its dependencies.
A dependency advisory is useful when you can explain the affected path here.
For ordinary bugs without security impact, use the bug report issue form.

Include, when available:

- Affected commit/tag and whether the issue reproduces on current `master`.
- Node/pnpm versions, database and storage driver, and relevant configuration with
  all secret values removed.
- A minimal reproduction or proof of concept using synthetic data, with the
  expected and actual behavior.
- Impact, required privileges, tenant relationships, and affected endpoints/files.
- Suggested mitigation or fix, if you have one.

Test only systems and accounts you own or have permission to assess. Do not
access another tenant's real data or send real credentials as evidence.

## Response and coordinated disclosure

Maintainers aim to acknowledge reports within **seven calendar days**, subject to
availability. This is a best-effort target, not an SLA or a guaranteed fix deadline.
If there is no reply after that period, follow up in the same private report.
Investigation and remediation time depend on severity and reproducibility;
maintainers will discuss updates, mitigations, and disclosure timing in that
thread. Please coordinate public disclosure until a fix or mitigation is available.
Reporter attribution will be discussed before publication.

## Security properties to preserve

- **Authentication:** access JWTs validate issuer, audience, and token type. Opaque
  refresh tokens are stored as hashes and rotated transactionally. Credential
  generations invalidate earlier JWTs and refresh tokens after password changes;
  replay of a rotated refresh revokes the compromised current generation.
- **CSRF:** state-changing API requests authenticated by the JWT cookie require a
  CSRF token. The frontend sends `X-XSRF-TOKEN`; explicit bearer authentication
  does not rely on an ambient cookie.
- **Tenant storage:** files are private. Downloads require authentication,
  `files.read`, active tenant membership, and a tenant-scoped file lookup. Knowing
  a file URL is not sufficient authorization.
- **Hierarchical RBAC:** non-ROOT actors can delegate only lower roles and cannot
  mutate equal/higher privileged accounts. Permission assignment requires ROOT.
  Temporary grants expire even when permissions are cached.

These are implemented controls, not a guarantee that every downstream application
is secure. Deployment still requires HTTPS, private bucket policies, independent
production secrets, updates, and correct tenant checks in new modules. Existing
public cloud objects are not made private retroactively by changing this template's
storage configuration. Never use example credentials in production.

Community conduct incidents use the same private GitHub channel as described in
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md); label those reports "Code of Conduct".
