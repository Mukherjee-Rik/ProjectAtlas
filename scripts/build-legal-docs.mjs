import fs from 'fs';
import path from 'path';

const docsLegalDir = path.resolve('docs/legal');
const rootLegalDir = path.resolve('legal');

fs.mkdirSync(docsLegalDir, { recursive: true });
fs.mkdirSync(rootLegalDir, { recursive: true });

const policies = {
  'Kafei_Privacy_Policy.md': `# Kafei Privacy Policy

**Last Updated:** September 4, 2026  
**Effective Date:** September 4, 2026  
**Entity:** Antigravity ("Kafei", "we", "our", or "us")  
**Application / Brand:** Kafei (including Project Atlas & Kafei Restaurant Operating System)  
**Website:** https://kafei.in

---

## 1. Overview & Commitment to Privacy

Kafei provides enterprise-grade multi-tenant restaurant management, point-of-sale (POS), kitchen display systems (KDS), menu management, contactless QR ordering, inventory tracking, and AI-assisted operational forecasting (collectively, the **"Services"**).

We are deeply committed to safeguarding the privacy and security of our users, including restaurant owners, managers, staff, diners, and partners. This Privacy Policy outlines how Kafei collects, uses, processes, stores, shares, and protects personal data when you use our website, mobile applications, web portals, APIs, and integrated third-party services.

---

## 2. Google API Services & OAuth 2.0 User Data Disclosures

Kafei integrates with Google OAuth 2.0 and Google APIs to provide seamless, secure authentication and optional productivity integrations.

### 2.1 Google User Data We Collect
When you choose to authenticate or connect your Google Account with Kafei, we request access only to the minimal necessary scopes:
- **Email Address (\`.../auth/userinfo.email\`):** Used to uniquely identify your account, send transaction receipts, billing alerts, and system notices.
- **Basic Profile Information (\`.../auth/userinfo.profile\`, \`openid\`):** Used to populate your display name and profile picture across your restaurant workspace and multi-branch environments.

### 2.2 How We Use Google User Data
We use Google user data strictly to:
- Authenticate and securely log you into your Kafei dashboard and assigned restaurant branches.
- Create and maintain your user profile and role-based permissions (e.g., Owner, Manager, Cashier, Waiter, Kitchen Display operator).
- Deliver transactional service communications, system security alerts, and account recovery notices.

### 2.3 Strict Protection & Limitations on Sharing
- **Never Sold or Monetized:** We **never** sell, rent, lease, or monetize Google user data under any circumstances.
- **No Advertising or Profiling:** We **never** share Google user data with third-party advertisers, data brokers, or ad exchanges.
- **No Foundation Model Training:** Google user data is **never** used to train, retrain, fine-tune, or improve generalized Artificial Intelligence (AI) or Machine Learning (ML) models.
- **Strict Access Control:** Access to Google user data within Kafei is restricted strictly to authorized automated systems necessary to execute the Services, with zero unnecessary human access.

### 2.4 Google API Services User Data Policy Compliance (Limited Use Statement)
> **Kafei’s use and transfer to any other app of information received from Google APIs will adhere to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements.**

### 2.5 Revoking Google Account Permissions
You have complete control over your connected Google Account:
1. **In-App Disconnection:** You may disconnect your Google identity under **Account Settings > Security > Connected Accounts**.
2. **Via Google Security Settings:** You can revoke Kafei's access at any time directly through Google’s permission portal at [https://myaccount.google.com/permissions](https://myaccount.google.com/permissions).
3. Revoking access will terminate Kafei's authorization to authenticate via Google immediately without affecting your existing operational restaurant records.

---

## 3. Categories of Information We Collect

In addition to Google OAuth data, Kafei collects information in the following categories:

### 3.1 Information You Provide Directly
- **Account & Registration Data:** Name, email address, password hash, phone number, restaurant business name, branch locations, business tax IDs (GST/VAT).
- **Billing & Payment Information:** Payment card details, billing address, and transaction records processed securely via PCI-DSS compliant payment gateways (e.g., Razorpay, Stripe). We do not store raw card numbers on our servers.
- **Restaurant Operational Data:** Menu items, recipes, ingredient lists, modifier groups, pricing, floor layouts, table configurations, dining area maps, staff profiles, and role assignments.
- **Communications:** Feedback, support tickets, contact form inquiries, and live chat logs.

### 3.2 Guest & Diner Information (Collected on Behalf of Restaurants)
- **Table QR & Online Orders:** Table number, order items, special dietary instructions, order timestamps, and bill settlement details.
- **Optional Guest Contact:** Phone number or email if voluntarily supplied by diners for electronic receipts and order status SMS/WhatsApp updates.

### 3.3 Automatically Collected Information
- **Device & Usage Logs:** IP address, browser type, operating system, device identifiers, session tokens, pages visited, button clicks, and error telemetry.
- **Cookies & Local Storage:** Session tokens (\`localStorage\` JWTs), UI theme preferences, and security cookies (see our [Cookie Policy](Kafei_Cookie_Policy.md)).

---

## 4. Legal Bases for Processing (GDPR / Global Compliance)

If you reside in the European Economic Area (EEA), United Kingdom, or jurisdictions with comparable privacy regulations, we process your personal data under the following legal bases:
1. **Performance of a Contract:** Providing, maintaining, and supporting the Kafei platform per our [Terms of Service](Kafei_Terms_of_Service.md).
2. **Legitimate Interests:** Securing our infrastructure, preventing fraud, improving platform reliability, and providing customer support.
3. **Consent:** For optional marketing communications, non-essential cookies, or explicit third-party integrations.
4. **Legal Compliance:** Complying with applicable tax, financial reporting, and statutory bookkeeping laws.

---

## 5. How We Share and Disclose Information

We share information only under strict safeguards:
- **Sub-processors & Infrastructure Partners:** Trusted cloud providers (e.g., Supabase / PostgreSQL, Railway, AWS, Cloudflare) that maintain ISO 27001 / SOC 2 Type II certifications and comply with our [Data Processing Addendum](Kafei_Data_Processing_Addendum_(DPA).md).
- **Payment Processors:** PCI-DSS Level 1 certified processors to execute subscription payments and dine-in customer billing.
- **Legal Obligations:** When required by valid subpoenas, court orders, or applicable law enforcement directives.
- **Business Transfers:** In the event of a merger, acquisition, or sale of assets, where data protections remain in place.

---

## 6. Data Retention & Permanent Deletion

- **Active Accounts:** We retain your account data and restaurant records for the duration of your active subscription.
- **Account Deletion:** Upon receiving an account deletion request, Kafei permanently wipes or anonymizes all associated personal data, Google OAuth tokens, and restaurant operational records within **30 days**, except where legal retention is required by tax authorities.
- **Data Deletion Requests:** You can initiate data deletion directly inside your workspace settings or by emailing **privacy@kafei.in** or **legal@kafei.in**.

---

## 7. Security Measures

We enforce rigorous technical and organizational measures to protect your information:
- **Encryption in Transit:** All traffic is encrypted using TLS 1.3 / HTTPS.
- **Encryption at Rest:** Sensitive tokens, credentials, and databases are encrypted using industry-standard AES-256.
- **Multi-Tenant Isolation:** Database queries and cache keys are strictly partitioned by tenant ID to prevent cross-account data leakage.
- **Access Controls:** Strict Role-Based Access Control (RBAC) and least-privilege principles enforced for all operational infrastructure.

---

## 8. International Data Transfers

When data is transferred across international borders, Kafei ensures adequate protection through European Commission Standard Contractual Clauses (SCCs), UK International Data Transfer Agreements, and equivalent legal transfer frameworks.

---

## 9. Your Rights & Choices (GDPR, CCPA, CPRA, DPDP)

Depending on your jurisdiction, you have the right to:
- **Access & Portability:** Request a copy of the personal data we hold about you in a structured, machine-readable format.
- **Rectification:** Correct inaccurate or incomplete information.
- **Erasure ("Right to be Forgotten"):** Request permanent deletion of your personal data.
- **Restriction & Objection:** Object to or restrict specific forms of data processing.
- **Withdraw Consent:** Withdraw consent at any time where processing is based on consent.
- **Non-Discrimination:** Exercise your privacy rights without facing discriminatory service penalties.

To exercise any of these rights, contact us at **privacy@kafei.in**.

---

## 10. Children’s Privacy

Kafei is a business-to-business and restaurant operational platform not directed toward individuals under 18 years of age. We do not knowingly collect personal data from children. If we discover that a minor has provided us with personal data, we will immediately purge such data.

---

## 11. Changes to This Privacy Policy

We may update this Privacy Policy periodically to reflect technological updates, regulatory changes, or new platform features. We will notify you of material changes via email or an in-app banner prior to the effective date.

---

## 12. Contact Information & Data Protection Officer (DPO)

For inquiries, data requests, or privacy concerns, please contact our privacy desk:

- **Entity:** Antigravity
- **Email:** privacy@kafei.in / rikmukherjee1999@gmail.com
- **Legal & Compliance:** legal@kafei.in
- **Phone / WhatsApp:** +91 9903085026
- **Headquarters:** Kolkata, WB / Bangalore, KA, India
`,

  'Kafei_Terms_of_Service.md': `# Kafei Terms of Service

**Last Updated:** September 4, 2026  
**Effective Date:** September 4, 2026  
**Entity:** Antigravity ("Kafei", "we", "our", or "us")  
**Application / Service:** Kafei Restaurant Operating System, Project Atlas & Kafei Platform  
**Website:** https://kafei.in

---

## 1. Acceptance of Terms

These Terms of Service (the **"Terms"** or **"Agreement"**) constitute a legally binding agreement between Antigravity and the individual or legal entity (**"Customer"**, **"Subscriber"**, **"you"**, or **"your"**) accessing or using our cloud restaurant operating system, point-of-sale (POS) terminals, Kitchen Display Systems (KDS), waiter portals, table QR ordering, inventory modules, demand forecasting, and artificial intelligence copilots (collectively, the **"Services"**).

By registering an account, integrating via Google OAuth or third-party sign-in, configuring a restaurant branch, or accessing the Services, you acknowledge that you have read, understood, and agreed to be bound by these Terms, our [Privacy Policy](Kafei_Privacy_Policy.md), and our [Acceptable Use Policy](Acceptable_Use_Policy.md). If you are entering into this Agreement on behalf of a company or other legal entity, you represent that you have the authority to bind such entity.

---

## 2. Description of Services & Platform Architecture

Kafei delivers a multi-tenant cloud platform engineered for modern hospitality venues, cafes, multi-outlet dining chains, and quick-service restaurants. Key capabilities include:
- Multi-Branch & Floor Management with dynamic table state synchronization.
- Interactive Kitchen Display System (KDS) and Cashier billing terminals.
- Contactless Table QR dynamic ordering and real-time cooking countdowns.
- Recipe-level inventory deduction and ingredient variance tracking.
- AI-driven operational demand forecasting and business intelligence copilot.
- Role-based access control (RBAC) supporting Owner, Manager, Cashier, Waiter, and Kitchen staff roles.

---

## 3. Account Registration, Security & OAuth Integrations

### 3.1 Eligibility & Account Creation
You must be at least 18 years of age and legally capable of entering into binding contracts. You agree to provide accurate, current, and complete registration details and maintain updated information.

### 3.2 Google OAuth Authentication
Kafei supports Google OAuth 2.0 for streamlined authentication. By authenticating through Google:
- You authorize Kafei to verify your identity and link your verified email address and basic profile info.
- Google user data received is strictly protected under our [Privacy Policy](Kafei_Privacy_Policy.md) and complies with the Google API Services User Data Policy.
- You remain solely responsible for safeguarding your credentials and any actions taken under your account.

### 3.3 Multi-Tenant Workspace Security
Each subscriber account is logically isolated within our database architecture. Subscribers are strictly prohibited from attempting to bypass tenant boundaries or access unauthorized restaurant workspace data.

---

## 4. Free Trial, Subscriptions, Billing & Cancellation

### 4.1 14-Day Free Trial
Kafei offers a 14-day risk-free trial for new accounts without requiring upfront credit card details. At the conclusion of the trial period, continuous access requires selecting an active paid subscription plan.

### 4.2 Subscription Plans & Pricing Tiers
- **Starter Plan:** Designed for single cafes/rooms with up to 20 tables and 5 staff members.
- **Growth Plan:** Multi-branch operations with up to 100 tables, 50 staff members, analytics, and AI copilot.
- **Enterprise Plan:** Unlimited tables, multi-branch cross-outlet inventory rollups, dedicated SLA, and priority engineering support.

### 4.3 Billing Cycles & Payments
Subscription fees are billed in advance on a recurring monthly or annual basis via authorized payment gateways (e.g., Razorpay, Stripe). All fees are exclusive of applicable taxes (e.g., GST/VAT), which will be itemized on your invoices.

### 4.4 Cancellation & Refunds
You may cancel your subscription at any time via your workspace settings. Cancellation takes effect at the end of the current paid billing period. Refund terms, SLA downtime remedies, and billing dispute processes are governed by our [Refund & Cancellation Policy](Kafei_Refund_&_Cancellation_Policy.md).

---

## 5. Intellectual Property & Customer Data Ownership

### 5.1 Customer Data Ownership
The Customer retains 100% ownership, title, and intellectual property rights in and to all proprietary data uploaded or processed through the Services, including restaurant menus, custom recipes, item photographs, pricing, sales records, staff details, and diner transactions (**"Customer Data"**).

### 5.2 Kafei License to Customer Data
Customer grants Kafei a limited, non-exclusive, worldwide license to host, copy, process, and transmit Customer Data solely to the extent necessary to deliver, maintain, secure, and support the Services.

### 5.3 Kafei Intellectual Property
Kafei and its licensors retain all right, title, and interest in and to the Services, including all software code, APIs, user interface designs, logos, trademarks, documentation, and predictive algorithms. You shall not copy, modify, distribute, reverse engineer, decompile, or disassemble any part of the Services.

---

## 6. Artificial Intelligence & Predictive Features

Kafei incorporates machine learning and artificial intelligence capabilities (including integrations with Google Gemini models) for sales forecasting, stock level optimization, and natural language copilot interactions.

- **Advisory Nature:** AI predictions, menu engineering insights, and automated forecasts are advisory tools designed to assist human decision-makers. Kafei does not guarantee 100% predictive accuracy.
- **Customer Oversight:** The Subscriber is solely responsible for validating critical business decisions, menu prices, and inventory procurement orders.
- **No Training on Customer Data:** As outlined in our [AI Usage & Responsible Use Policy](Kafei_AI_Usage_&_Responsible_Use_Policy.md), Kafei does not use your proprietary Customer Data or confidential menu recipes to train generalized foundation models.

---

## 7. Service Availability, Maintenance & Support

### 7.1 Service Level Commitment
Kafei targets a monthly uptime availability of **99.9%** for primary ordering, KDS, and POS services, excluding scheduled maintenance windows.

### 7.2 Scheduled Maintenance
We schedule routine infrastructure upgrades during off-peak hours and provide advance notice through our system status page and dashboard announcements.

### 7.3 Emergency Floor Support
For active service emergencies impacting live floor operations, subscribers have access to 24/7 emergency escalation as detailed in our support desk.

---

## 8. Warranties, Disclaimers & Limitation of Liability

### 8.1 Disclaimer of Warranties
EXCEPT AS EXPRESSLY PROVIDED HEREIN, THE SERVICES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. KAFEI DISCLAIMS ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING WITHOUT LIMITATION WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

### 8.2 Limitation of Liability
TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL KAFEI, ITS DIRECTORS, OFFICERS, EMPLOYEES, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR BUSINESS INTERRUPTION.

KAFEI’S AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT SHALL NOT EXCEED THE TOTAL FEES PAID BY CUSTOMER TO KAFEI IN THE TWELVE (12) MONTHS PRECEDING THE INCIDENT GIVING RISE TO LIABILITY.

---

## 9. Indemnification

### 9.1 By Customer
Customer agrees to defend, indemnify, and hold harmless Kafei and its officers, directors, and employees from and against any third-party claims, liabilities, damages, losses, or expenses arising from: (a) Customer’s breach of this Agreement; (b) Customer Data infringing third-party intellectual property or privacy rights; or (c) violation of applicable food safety, taxation, or consumer protection laws by Customer’s restaurant operations.

### 9.2 By Kafei
Kafei agrees to defend and indemnify Customer against any third-party claim alleging that the core Kafei software infringes a valid patent, copyright, or trademark, provided Customer gives prompt written notice and full cooperation.

---

## 10. Term, Suspension & Termination

### 10.1 Term
This Agreement commences on the date you register or first access the Services and continues until all subscriptions have expired or been terminated.

### 10.2 Suspension for Cause
Kafei reserves the right to immediately suspend access if: (a) your account is in severe payment arrears exceeding 15 days; (b) your use poses a critical security risk to other tenants; or (c) your usage violates our [Acceptable Use Policy](Acceptable_Use_Policy.md).

### 10.3 Effect of Termination & Data Export
Upon termination, your right to access the Services immediately ceases. You may request a complete export of your Customer Data (CSV/JSON) within **30 days** of termination, after which Kafei will permanently delete all Customer Data in accordance with our [Privacy Policy](Kafei_Privacy_Policy.md).

---

## 11. Governing Law & Dispute Resolution

This Agreement shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law principles. Any dispute, controversy, or claim arising out of or relating to this Agreement shall be resolved through binding arbitration in Kolkata / Bangalore, India, conducted in English under the Arbitration and Conciliation Act, 1996.

---

## 12. Miscellaneous Provisions

- **Entire Agreement:** These Terms, together with all referenced policies and DPAs, constitute the complete agreement between the parties.
- **Severability:** If any provision is held unenforceable, the remaining provisions remain in full effect.
- **Force Majeure:** Neither party shall be liable for delays resulting from acts of God, civil commotion, severe telecom/cloud outages, or governmental actions beyond reasonable control.
- **Modifications:** We may modify these Terms with 30 days’ notice for material changes. Continued use of the Services constitutes acceptance.

---

## 13. Contact & Legal Notices

Legal notices under this Agreement must be addressed to:

- **Entity:** Antigravity
- **Email:** legal@kafei.in / rikmukherjee1999@gmail.com
- **Phone:** +91 9903085026
- **Headquarters:** Kolkata, WB / Bangalore, KA, India
`,

  'Kafei_AI_Usage_&_Responsible_Use_Policy.md': `# Kafei AI Usage & Responsible Use Policy

**Last Updated:** September 4, 2026  
**Effective Date:** September 4, 2026  
**Entity:** Antigravity ("Kafei", "we", "our", or "us")  
**Application / Brand:** Kafei (including Project Atlas AI & Demand Forecasting Engine)  
**Website:** https://kafei.in

---

## 1. Purpose and Scope

Kafei integrates cutting-edge Artificial Intelligence (AI) and Machine Learning (ML) technologies—including integrations with Google Gemini models, time-series forecasting algorithms, and natural language copilot assistants—to optimize restaurant kitchen workflows, predict inventory exhaustion, streamline menu engineering, and enhance operational decision-making.

This AI Usage & Responsible Use Policy defines the ethical standards, data protection guarantees, algorithmic transparency, and operational boundaries governing our AI systems.

---

## 2. Core Ethical Principles

### 2.1 Transparency & Explainability
We believe hospitality operators must understand how AI recommendations are formed. Kafei provides contextual rationale for inventory restock alerts, demand surge forecasts, and menu modifier recommendations.

### 2.2 Human-in-the-Loop Oversight
AI in Kafei is strictly designed as an **intelligence amplifier**, not an autonomous replacement for human judgment. Critical operational decisions—including automated purchasing orders, price overrides, staff shifts, and refund authorizations—require explicit human confirmation.

### 2.3 Fairness & Non-Discrimination
Our algorithmic models are engineered to prevent discriminatory outputs based on protected attributes, ensuring equitable service recommendations and fair pricing models.

---

## 3. Customer Data Privacy & AI Model Training Guarantees

### 3.1 Strict Zero-Training Guarantee on Customer Proprietary Data
> **Kafei NEVER uses your confidential recipes, proprietary dish ingredients, business financials, customer records, or Google OAuth account data to train, retrain, fine-tune, or improve publicly accessible or foundational AI models.**

### 3.2 Enterprise API Zero-Data-Retention
When Kafei connects with foundation model providers (such as Google Gemini APIs), all API interactions occur over secure, enterprise-grade endpoints subject to strict zero-data-retention terms where prompts and completions are not logged or used for model training by the provider.

### 3.3 Tenant Isolation in AI Memory
Contextual memory and embeddings used by the Kafei AI Copilot are logically segregated per tenant ID. No restaurant’s data is ever exposed to or accessible by another subscriber.

---

## 4. Specific AI Capabilities & Operational Guidelines

### 4.1 Demand & Sales Forecasting
- **Mechanism:** Evaluates historical POS velocity, seasonal trends, day-of-week patterns, and table turn rates to project daily ingredient demand.
- **Guideline:** Forecasts represent statistical projections. Chefs and kitchen managers should adjust predictions based on local weather, private events, or sudden market shifts.

### 4.2 Recipe & Menu Engineering Copilot
- **Mechanism:** Analyzes margin percentages, ingredient wastage, and dish popularity (Stars, Plowhorses, Puzzles, Dogs) to recommend menu optimizations.
- **Guideline:** Recommendations are advisory. Subscribers retain complete discretion over dish formulations and retail pricing.

### 4.3 Kitchen Load Balancer & Prep Time Predictions
- **Mechanism:** Computes dynamic prep times based on active KDS ticket volume and station workload.
- **Guideline:** Dynamic cooking countdowns visible to diners on table QR screens reflect real-time kitchen state to set accurate guest expectations.

---

## 5. Prohibited AI Uses & Restrictions

Subscribers, operators, and staff are strictly prohibited from using Kafei AI tools to:
- Generate misleading, fraudulent, or deceptive food descriptions or allergen disclosures.
- Implement predatory surge pricing models that violate local consumer protection statutes.
- Automate adverse employment termination decisions without human review.
- Attempt prompt injection attacks, jailbreaks, or extraction of internal system prompts or other tenant data.

---

## 6. Continuous Monitoring, Safety & Feedback

Kafei enforces continuous safety evaluations and automated guardrails to filter hallucinated, toxic, or unsafe outputs. If you observe an erroneous, anomalous, or unexpected AI recommendation, please report it immediately:

- **AI Safety Desk:** ai-safety@kafei.in / support@kafei.in
- **Technical Hotline:** +91 9903085026
`,

  'Acceptable_Use_Policy.md': `# Kafei Acceptable Use Policy (AUP)

**Last Updated:** September 4, 2026  
**Effective Date:** September 4, 2026  
**Entity:** Antigravity ("Kafei", "we", "our", or "us")  
**Application / Brand:** Kafei Restaurant Operating System & API  
**Website:** https://kafei.in

---

## 1. Overview & Purpose

This Acceptable Use Policy (**"AUP"**) governs the acceptable use of Kafei’s restaurant operating systems, POS terminals, Kitchen Display Systems (KDS), waiter portals, table QR ordering pages, APIs, AI copilots, and related services (collectively, the **"Services"**).

This policy applies to all subscribers, restaurant staff, authorized developers, and end-user diners. By accessing or using the Services, you agree to comply with this AUP.

---

## 2. Prohibited System Interference & Security Violations

You may not engage in any activity that compromises the security, stability, or integrity of the Kafei platform, including but not limited to:
- **Unauthorized Access & Tenant Probing:** Attempting to access, modify, or extract data belonging to other restaurant tenants, branches, or accounts.
- **Penetration Testing & Scanning:** Conducting vulnerability scans, penetration testing, fuzzing, or port scans against Kafei infrastructure without prior written authorization from our security team.
- **Denial of Service (DoS/DDoS):** Launching or facilitating attacks that degrade or disrupt service availability.
- **Rate Limit Circumvention:** Bypassing API rate limits, brute-force protections, or authentication safeguards.
- **Reverse Engineering:** Decompiling, reverse engineering, disassembling, or copying source code, internal APIs, or database schemas.

---

## 3. Prohibited Content & Business Practices

You agree not to upload, store, publish, or transmit content or engage in business practices that:
- **Infringe Intellectual Property:** Violate trademarks, copyrights, trade secrets, or proprietary rights of any party.
- **Deceptive or Fraudulent Information:** Publish false pricing, deceptive dish descriptions, or fraudulent allergen or dietary warnings.
- **Unlawful Goods or Services:** Utilize the Services to sell illegal substances, counterfeit items, or illicit products.
- **Harassment & Defamation:** Transmit defamatory, abusive, threatening, obscene, or discriminatory content.
- **Malicious Code:** Distribute viruses, trojans, worms, ransomware, keyloggers, or other malicious software.

---

## 4. Dine-In QR & Table Ordering Integrity

- **QR Code Physical Security:** Restaurants must ensure that tabletop QR standees are authentic and tamper-free. Replacing or overlaying Kafei QR standees with malicious external URLs is strictly prohibited.
- **Order Tampering:** Diners and external users must not inject fraudulent, unauthorized, or automated mock orders into restaurant kitchen display queues.

---

## 5. Communications & Anti-Spam Rules

- **SMS & WhatsApp Order Notifications:** Automated SMS/WhatsApp notifications must be sent exclusively to diners who have explicitly opted in or initiated orders at your venue.
- **No Unsolicited Marketing:** Subscribers may not use guest phone numbers collected during table ordering for mass unsolicited commercial spam without explicit prior consent.

---

## 6. Investigation, Enforcement & Account Suspension

Kafei reserves the right to investigate any suspected breach of this AUP. Upon identifying a violation, Kafei may take immediate enforcement action, including:
1. Issuing a formal warning notice.
2. Immediate temporary suspension of affected branches, APIs, or user credentials.
3. Permanent account termination without refund for severe or malicious breaches.
4. Reporting unlawful activities to relevant law enforcement and regulatory authorities.

---

## 7. Reporting Violations

If you discover a violation of this Acceptable Use Policy, please report it immediately to:
- **Compliance Desk:** abuse@kafei.in / legal@kafei.in
- **Emergency Phone:** +91 9903085026
`,

  'Kafei_Cookie_Policy.md': `# Kafei Cookie Policy

**Last Updated:** September 4, 2026  
**Effective Date:** September 4, 2026  
**Entity:** Antigravity ("Kafei", "we", "our", or "us")  
**Application / Brand:** Kafei (including Project Atlas & Kafei Platform)  
**Website:** https://kafei.in

---

## 1. What Are Cookies and Local Storage?

This Cookie Policy explains how Kafei uses cookies, web beacons, local storage objects (\`localStorage\` and \`sessionStorage\`), and similar browser technologies to ensure our restaurant POS, kitchen display screens, waiter interfaces, and guest ordering portals function reliably and securely.

---

## 2. Categories of Cookies & Storage Technologies We Use

### 2.1 Strictly Necessary Storage (Essential for Service Operation)
These tokens and cookies are strictly required to authenticate users, maintain secure active sessions, enforce multi-tenant separation, and prevent fraudulent requests.
- **\`atlas_access_token\` (Local Storage):** Encrypted JSON Web Token (JWT) used to authenticate API requests between the web client and NestJS backend.
- **\`atlas_auth_user\` (Local Storage):** Basic user session metadata (ID, role, assigned branch) used for client-side route guard authorization.
- **CSRF & Security Cookies:** Anti-tampering tokens that protect forms and API endpoints from Cross-Site Request Forgery attacks.

### 2.2 Functional & Preference Cookies
These cookies remember your personalized interface settings to provide an optimized user experience across devices:
- **\`theme_mode\`:** Remembers whether you prefer Dark Mode (Atlas Dark Mint theme) or Light Mode across POS and KDS screens.
- **\`active_branch_id\`:** Remembers your currently selected restaurant branch to prevent repeated branch selection prompts.
- **\`kds_audio_alert_enabled\`:** Stores kitchen chime audio preferences for incoming order tickets.

### 2.3 Performance & Telemetry Technologies
- **API Latency & Health Heartbeats:** Anonymous telemetry measuring network round-trip times and WebSocket connection stability for live kitchen displays.
- **Error Diagnostics:** Client-side crash logs and rendering error captures to assist our engineering team in resolving software defects.

### 2.4 Third-Party Cookies & Embedded Integrations
- **Google OAuth:** When logging in via Google Sign-In, Google may set session cookies on its domains to verify your Google identity securely.
- **Payment Gateways (Razorpay / Stripe):** When settling subscription bills or processing customer payments, secure PCI-compliant iframe cookies are utilized to authenticate cardholder verification.

---

## 3. No Third-Party Behavioral Ad Tracking

> **Kafei does NOT deploy third-party behavioral advertising cookies, retargeting pixels, or ad exchange tracking scripts on our platform.**

---

## 4. Managing and Disabling Cookies

You have the right to control how cookies are stored on your device:
- **Browser Controls:** You can configure your web browser (Chrome, Firefox, Safari, Edge) to reject or delete cookies.
- **Local Storage Management:** You can clear local storage data via your browser's developer tools or settings.
- **Impact of Disabling:** Because authentication tokens in \`localStorage\` are essential to verify your identity, disabling local storage will prevent you from logging into your Kafei workspace and operating the POS or KDS.

---

## 5. Updates to This Cookie Policy

We may update this Cookie Policy from time to time. Any changes will become effective immediately upon posting to our website.

---

## 6. Contact Us

For questions regarding our use of cookies and local storage technologies, please reach out to:
- **Email:** privacy@kafei.in / support@kafei.in
- **Phone:** +91 9903085026
`,

  'Kafei_Copyright_&_DMCA_Policy.md': `# Kafei Copyright & DMCA Policy

**Last Updated:** September 4, 2026  
**Effective Date:** September 4, 2026  
**Entity:** Antigravity ("Kafei", "we", "our", or "us")  
**Application / Brand:** Kafei Platform & Digital Ordering  
**Website:** https://kafei.in

---

## 1. Compliance with Copyright Laws & DMCA

Kafei respects the intellectual property rights of creators, restaurateurs, photographers, and developers. In accordance with the Digital Millennium Copyright Act (17 U.S.C. § 512) (the **"DMCA"**) and international copyright treaties, Kafei maintains a formal process for responding to notices of alleged copyright infringement.

---

## 2. Designated DMCA Copyright Agent

Notices of claimed copyright infringement must be sent to our Designated Copyright Agent:

- **Attn:** Designated DMCA Copyright Agent
- **Entity:** Antigravity
- **Email:** dmca@kafei.in / legal@kafei.in
- **Phone / WhatsApp:** +91 9903085026
- **Address:** Legal Department, Antigravity, Kolkata, WB / Bangalore, KA, India

---

## 3. Filing a DMCA Notice of Infringement

If you believe that copyrighted material (such as menu imagery, brand graphics, culinary photography, or written descriptions) hosted on the Kafei platform infringes your copyright, please provide our Copyright Agent with a written notice containing:
1. **Physical or Electronic Signature:** Signature of the copyright owner or a person authorized to act on their behalf.
2. **Identification of the Copyrighted Work:** Description of the copyrighted work claimed to have been infringed.
3. **Identification of Infringing Material:** Specific URL, table QR identifier, or description of where the infringing material is located on our platform.
4. **Contact Details:** Your full name, mailing address, telephone number, and email address.
5. **Good Faith Statement:** A statement that you have a good faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law.
6. **Perjury Statement:** A statement made under penalty of perjury that the information provided in your notice is accurate and that you are the copyright owner or authorized to act on the owner's behalf.

---

## 4. Takedown & Counter-Notification Procedure

### 4.1 Notice and Removal
Upon receipt of a valid DMCA notice, Kafei will expeditiously remove or disable access to the infringing material and notify the affected subscriber.

### 4.2 Counter-Notification
If an affected subscriber believes that their material was removed or disabled as a result of mistake or misidentification, they may file a Counter-Notice containing:
- Physical or electronic signature.
- Identification of the material that has been removed and the location where it appeared before removal.
- A statement under penalty of perjury that the subscriber has a good faith belief that the material was removed or disabled as a result of mistake or misidentification.
- The subscriber’s name, address, telephone number, and a statement consenting to the jurisdiction of the federal or local court.

Upon receipt of a valid Counter-Notice, Kafei may restore the material within 10 to 14 business days unless the original complainant files a court action seeking a restraining order.

---

## 5. Strict Repeat Infringer Policy

Kafei enforces a strict repeat infringer policy. Subscribers whose accounts are subject to repeated valid infringement notices will face progressive penalties, culminating in immediate and permanent account termination.
`,

  'Kafei_Data_Processing_Addendum_(DPA).md': `# Kafei Data Processing Addendum (DPA)

**Last Updated:** September 4, 2026  
**Effective Date:** September 4, 2026  
**Entity:** Antigravity ("Processor", "Kafei", "we")  
**Customer:** The Subscriber entity utilizing the Kafei Services ("Controller", "Customer")  
**Website:** https://kafei.in

---

## 1. Scope, Purpose & Relationship of the Parties

This Data Processing Addendum (**"DPA"**) supplements the Kafei [Terms of Service](Kafei_Terms_of_Service.md) and applies to the processing of Personal Data under European Data Protection Laws (including EU GDPR 2016/679, UK GDPR, and the Swiss Federal Act on Data Protection) and global data privacy frameworks.

- **Customer is the Data Controller:** Determines the purposes and means of processing diner and restaurant employee Personal Data.
- **Kafei is the Data Processor:** Processes Personal Data strictly on behalf of and under the documented instructions of the Customer.

---

## 2. Subject Matter & Categories of Data

- **Subject Matter:** Provision of multi-tenant restaurant management, POS, KDS, table QR ordering, inventory tracking, and demand forecasting services.
- **Duration:** The term of the Customer’s subscription agreement plus post-termination deletion windows.
- **Categories of Data Subjects:** Restaurant diners, guests, restaurant staff, cashiers, managers, and system administrators.
- **Types of Personal Data:** Names, email addresses, phone numbers, role assignments, dining timestamps, table numbers, ordered menu items, billing transaction references, and device IP logs.

---

## 3. Obligations of the Processor (Kafei)

### 3.1 Documented Instructions
Kafei shall process Personal Data exclusively in accordance with Customer’s documented instructions, including with respect to data transfers, unless required to do so by applicable law.

### 3.2 Confidentiality
Kafei ensures that all personnel authorized to process Personal Data have committed themselves to strict confidentiality obligations and undergo regular security training.

### 3.3 Technical and Organizational Measures (TOMs)
Kafei implements industry-leading security controls, including:
- TLS 1.3 / HTTPS encryption for all data in transit.
- AES-256 encryption for data at rest and database volumes.
- Multi-tenant logical isolation preventing cross-account access.
- Role-Based Access Control (RBAC) and least privilege principles.
- Regular vulnerability assessments and automated patch management.

---

## 4. Sub-processors

### 4.1 Authorized Sub-processors
Customer grants general authorization for Kafei to engage trusted sub-processors for infrastructure, database hosting, payment processing, and messaging (e.g., Supabase / PostgreSQL, Railway, AWS, Cloudflare, Razorpay/Stripe).

### 4.2 Sub-processor Obligations
Kafei imposes contractual data protection obligations on each sub-processor that are no less protective than those set out in this DPA. Kafei remains fully liable for the performance of its sub-processors.

---

## 5. Data Subject Rights & Regulatory Assistance

Kafei shall assist Customer by appropriate technical and organizational measures in fulfilling Customer’s obligations to respond to Data Subject requests (access, rectification, erasure, restriction, portability) under applicable data protection laws.

---

## 6. Personal Data Breach Notification

In the event of a confirmed Personal Data Breach impacting Customer’s data, Kafei will notify Customer without undue delay (and in any event within **48 hours** of becoming aware of the breach) and provide relevant details to assist Customer in fulfilling mandatory breach notifications.

---

## 7. Data Deletion and Return

Upon termination of the Services, Kafei shall, at Customer's election, delete or return all Personal Data within **30 days**, unless statutory retention laws require continued storage.

---

## 8. International Data Transfers & Standard Contractual Clauses (SCCs)

Where transfers of Personal Data from the EEA, UK, or Switzerland to countries without an adequacy decision occur, the parties incorporate by reference the European Commission's Standard Contractual Clauses (Module 2: Controller-to-Processor).

---

## 9. Inquiries & DPA Contact

For DPA execution inquiries or audit questions:
- **DPO Email:** privacy@kafei.in / dpo@kafei.in
- **Legal Team:** legal@kafei.in
`,

  'Kafei_Refund_&_Cancellation_Policy.md': `# Kafei Refund & Cancellation Policy

**Last Updated:** September 4, 2026  
**Effective Date:** September 4, 2026  
**Entity:** Antigravity ("Kafei", "we", "our", or "us")  
**Application / Service:** Kafei Restaurant Operating System, Project Atlas & Kafei Platform  
**Website:** https://kafei.in

---

## 1. Overview & Commitment to Fairness

At Kafei, we strive to provide transparent, hassle-free subscription services for restaurant operators. This Refund & Cancellation Policy details our subscription billing rules, cancellation procedures, trial periods, and refund eligibility standards.

---

## 2. 14-Day Risk-Free Trial

- **Zero Upfront Payment:** Kafei offers a comprehensive 14-day free trial on our platform without requiring credit card details.
- **Trial Expiration:** At the end of the 14-day period, you may choose to activate a paid subscription plan (Starter, Growth, or Enterprise). If no plan is selected, your account transitions to read-only status with no automatic charges.

---

## 3. Subscription Cancellation Procedure

- **Instant Self-Serve Cancellation:** You may cancel your subscription at any time directly through your workspace by navigating to **Settings > Subscription > Cancel Plan**.
- **No Cancellation Penalties:** We do not charge cancellation fees or early termination penalties.
- **Access Retention:** Upon cancellation, your workspace remains fully operational until the end of your current paid billing period. After this date, your subscription will not renew.

---

## 4. Refund Eligibility & Standards

### 4.1 Annual Subscriptions (7-Day Money-Back Guarantee)
Subscribers who purchase an annual subscription plan are eligible for a full refund if requested within **7 calendar days** of the initial annual purchase date.

### 4.2 Monthly Subscriptions
Monthly subscription fees are billed in advance on a recurring 30-day cycle and are non-refundable once the billing cycle has commenced, except in cases of verified billing errors or major SLA downtime.

### 4.3 Service Level Agreement (SLA) Outage Credits & Refunds
If Kafei fails to meet our **99.9% uptime commitment** in any calendar month due to unscheduled core system outages (affecting POS, KDS, or table QR ordering), affected subscribers are eligible for pro-rated service credits or direct refunds upon request.

### 4.4 Billing Errors & Duplicate Charges
If you believe you have been charged in error or experienced duplicate transactions, notify our billing desk within **30 days**. Confirmed billing errors will be refunded in full immediately.

---

## 5. Non-Refundable Items

The following fees are non-refundable:
- Pro-rated partial month fees once the 7-day initial window has expired.
- Custom tabletop QR acrylic standee hardware manufacturing and shipping costs once produced.
- Dedicated custom engineering, enterprise onboarding, or third-party hardware integration fees.

---

## 6. Refund Processing Timeline

- Approved refunds are processed back to the original method of payment (e.g., credit card, debit card, UPI, net banking).
- Refunds typically reflect on your bank or credit card statement within **5 to 7 business days**, depending on your financial institution.

---

## 7. Contact Billing Support

To request a refund, dispute a charge, or inquire about cancellation:
- **Billing Desk:** billing@kafei.in / support@kafei.in
- **Phone / WhatsApp:** +91 9903085026
- **Support Hours:** Mon – Sun, 9:00 AM – 10:00 PM IST
`,

  'Kafei_Security_Policy.md': `# Kafei Security Policy

**Last Updated:** September 4, 2026  
**Effective Date:** September 4, 2026  
**Entity:** Antigravity ("Kafei", "we", "our", or "us")  
**Application / Brand:** Kafei Platform (Project Atlas Architecture)  
**Website:** https://kafei.in

---

## 1. Information Security Philosophy & Architecture

Security is built into the core of the Kafei architecture. As an enterprise restaurant operating system managing live point-of-sale terminals, kitchen displays, payment transactions, and confidential business metrics, we implement a **Zero-Trust** security model and defense-in-depth engineering principles.

---

## 2. Encryption Standards & Data Protection

### 2.1 Encryption in Transit
- All communications between clients (browsers, tablets, POS terminals, mobile devices) and Kafei servers are encrypted using **Transport Layer Security (TLS 1.3 / HTTPS)**.
- HTTP Strict Transport Security (HSTS) is strictly enforced with preloading enabled to prevent protocol downgrade attacks.

### 2.2 Encryption at Rest
- Sensitive user data, database volumes, automated backups, and OAuth refresh tokens are encrypted at rest using industry-standard **AES-256 (Advanced Encryption Standard)**.
- Database passwords and user authentication secrets are hashed using strong, salted algorithms (Argon2 / bcrypt) with adaptive work factors.

---

## 3. Multi-Tenant Logical Data Isolation

- **Tenant Boundary Enforcement:** All relational database tables and queries incorporate mandatory tenant identifier keys (\`tenantId\` / \`restaurantId\`).
- **Prisma & NestJS Middleware:** Backend database abstraction layers strictly enforce row-level scoping to ensure no user or API call can view or modify another restaurant tenant's data.

---

## 4. Google OAuth 2.0 & Token Security

- **Minimal Scopes:** We request only essential identity scopes (\`openid\`, \`email\`, \`profile\`).
- **Secure Token Storage:** OAuth access tokens and refresh tokens are encrypted at rest and are never logged, serialized into error telemetry, or exposed on client-facing interfaces.
- **Revocation Handlers:** Immediate token invalidation and purge occur upon user disconnection or account deletion.

---

## 5. Infrastructure & Cloud Security

- **Enterprise Cloud Hosting:** Infrastructure is hosted across ISO 27001, SOC 2 Type II, and PCI-DSS Level 1 certified cloud data centers.
- **DDoS Mitigation & Web Application Firewall (WAF):** Real-time protection against distributed denial-of-service (DDoS) attacks, brute-force credential stuffing, and OWASP Top 10 vulnerabilities via Cloudflare edge routing.
- **Automated Daily Backups:** Point-in-time database snapshots are taken daily, encrypted, and replicated across geographically redundant storage regions.

---

## 6. Access Control & Operational Security

- **Role-Based Access Control (RBAC):** Strict operational roles (Owner, Manager, Cashier, Waiter, Kitchen Display operator) restrict feature access on a least-privilege basis.
- **Multi-Factor Authentication (MFA):** Available for administrative and elevated operational accounts.
- **Automated Session Expiry:** Unattended sessions expire automatically to protect tabletop and cashier POS terminals in bustling dining environments.

---

## 7. Vulnerability Management & Responsible Disclosure

We welcome security researchers and ethical hackers to identify and report potential security vulnerabilities.

### 7.1 Responsible Disclosure Guidelines
- Submit vulnerability reports directly to **security@kafei.in**.
- Provide detailed steps to reproduce the issue.
- Allow our security team reasonable time to remediate before public disclosure.
- Do not exploit vulnerabilities to access or modify real customer data or degrade system performance.

### 7.2 Response SLA
- **Acknowledgment:** Within 24 hours.
- **Triage & Assessment:** Within 72 hours.
- **Resolution & Patch Deployment:** Timely remediation prioritized by CVSS severity score.

---

## 8. Incident Response & Business Continuity

Kafei maintains a documented Incident Response Plan:
- **Recovery Point Objective (RPO):** < 1 hour.
- **Recovery Time Objective (RTO):** < 4 hours.
- **Breach Notification:** In the event of an incident impacting customer data, notifications will be delivered within **48 hours** in accordance with our [Data Processing Addendum](Kafei_Data_Processing_Addendum_(DPA).md).

---

## 9. Contact Security Team

For urgent security reports or compliance audits:
- **Security Operations Center:** security@kafei.in / legal@kafei.in
- **Emergency Hotline:** +91 9903085026
`
};

for (const [filename, content] of Object.entries(policies)) {
  fs.writeFileSync(path.join(docsLegalDir, filename), content.trim() + '\n', 'utf8');
  fs.writeFileSync(path.join(rootLegalDir, filename), content.trim() + '\n', 'utf8');
  console.log(`Successfully generated: ${filename}`);
}

console.log('ALL 9 LEGAL POLICIES SUCCESSFULLY CREATED IN docs/legal/ AND legal/');
