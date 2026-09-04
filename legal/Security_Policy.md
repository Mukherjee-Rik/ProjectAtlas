# Security Policy & Vulnerability Disclosure — Kafei

**Effective Date**: January 1, 2025  
**Last Updated**: September 4, 2026  
**Official Application**: Kafei ([https://kafei.in](https://kafei.in))  
**Operating Entity**: Antigravity  
**Security Desk**: [security@kafei.in](mailto:security@kafei.in) / [rikmukherjee1999@gmail.com](mailto:rikmukherjee1999@gmail.com)  
**Emergency Hotline**: [+91 9903085026](tel:9903085026)  

---

## 1. Security Philosophy & Principles

At **Kafei** ([https://kafei.in](https://kafei.in)), safeguarding restaurant operational data, customer payment transactions, and dining floor availability is paramount. We implement defense-in-depth architecture spanning identity verification, multi-tenant isolation, continuous vulnerability management, and encrypted data pipelines.

---

## 2. Infrastructure & Application Security

### 2.1 Encryption Standards
- **Data in Transit**: Mandatory HTTPS with Transport Layer Security (TLS 1.3) and HTTP Strict Transport Security (HSTS) across all web properties and API endpoints.
- **Data at Rest**: Primary PostgreSQL databases, file storage, and snapshot backups are encrypted using industry-standard **AES-256**.
- **Credential Storage**: Passwords are never stored in plaintext; they are secured using cryptographically salted hashing algorithms (bcrypt/argon2). Session tokens use signed JSON Web Tokens (JWT) with automated rotation.

### 2.2 Multi-Tenant Logical Isolation
- Every database query and API operation is enforced by strict tenant guards (`TenantAccessGuard`, `RestaurantAccessGuard`, `BranchAccessGuard`) and database Row-Level Security (RLS).
- Cross-tenant data access is strictly blocked at the application and database layers.

### 2.3 Edge Defense & DDoS Mitigation
- Integrated with enterprise Edge CDN and Web Application Firewall (WAF) services to block automated scrapers, malicious bots, Layer 7 DDoS attacks, and SQL injection/XSS payloads.

### 2.4 Google OAuth Security
- Integration with Google Identity Services (OAuth 2.0) adheres strictly to the Google API Services User Data Policy, ensuring tokens are exchanged securely over encrypted channels and never logged in plain text.

---

## 3. High Availability, Backups & Disaster Recovery

- **Redundant Cloud Hosting**: Hosted on resilient cloud infrastructure with automated health probes (`/health/live`, `/health/ready`).
- **Database Snapshots**: Automated continuous relational snapshots ensure fast recovery with near-zero data loss in the event of hardware or regional failure.
- **Failover SLA**: 99.9% operational availability target for active dining service.

---

## 4. Vulnerability Disclosure Program (VDP) & Safe Harbor

We value the contributions of independent security researchers and ethical hackers who help keep Kafei and our restaurant community secure.

### 4.1 Safe Harbor Commitment
If you conduct vulnerability research in good faith and in compliance with this policy:
- We will consider your research authorized and will not initiate legal action against you.
- We will work collaboratively with you to understand and remediate the issue promptly.

### 4.2 Research Guidelines
- **Do Not Impact Live Operations**: Do not disrupt dining operations, kitchen dockets, or payment settlement for live restaurants.
- **No Data Exfiltration**: Only view the minimum necessary data to demonstrate a proof of concept. Do not download, modify, or disclose other tenants' private data.
- **No Social Engineering or DoS**: Do not perform phishing, physical attacks, or Denial of Service (DoS/DDoS) attacks against our systems or employees.
- **Coordinate Disclosure**: Provide us a reasonable period (at least 30 days) to remediate the vulnerability before public disclosure.

### 4.3 Scope
- **In Scope**: `https://kafei.in`, `*.kafei.in`, and core backend REST/Websocket APIs.
- **Out of Scope**: Third-party payment gateways, physical restaurant hardware, or social engineering.

---

## 5. How to Report a Vulnerability

If you discover a potential security flaw, please email our security team with:
1. A clear description of the vulnerability and its potential impact.
2. Step-by-step reproduction steps or a minimal Proof of Concept (PoC).
3. Affected endpoints, parameters, or screen captures.

### Response Time SLAs:
- **Initial Acknowledgment**: Within **24 hours**.
- **Triage & Validation**: Within **72 hours**.
- **Remediation & Fix**: Prioritized based on severity (Critical: < 48 hours; High: < 7 days).

---

## 6. Security Contact Information

- **Security Desk**: [security@kafei.in](mailto:security@kafei.in)
- **Direct Review Contact**: [rikmukherjee1999@gmail.com](mailto:rikmukherjee1999@gmail.com)
- **Incident Hotline**: [+91 9903085026](tel:9903085026)
- **Official Portal**: [https://kafei.in](https://kafei.in)
