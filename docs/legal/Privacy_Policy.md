# Privacy Policy — Kafei

**Effective Date**: January 1, 2025  
**Last Updated**: September 4, 2026  
**Official Application**: Kafei (accessible at [https://kafei.in](https://kafei.in))  
**Operating Entity**: Antigravity  
**Contact Email**: [privacy@kafei.in](mailto:privacy@kafei.in) / [rikmukherjee1999@gmail.com](mailto:rikmukherjee1999@gmail.com)  
**Support Hotline**: [+91 9903085026](tel:9903085026)  
**Registered Address**: Kolkata, West Bengal & Bangalore, Karnataka, India  

---

## 1. Introduction

Welcome to **Kafei** ("we," "our," "us," or the "Platform"), accessible at **[https://kafei.in](https://kafei.in)**. Kafei is an enterprise restaurant operating system, floor management, Kitchen Display System (KDS), Table QR ordering, and cashier point-of-sale (POS) software platform.

We respect your privacy and are committed to protecting personal data. This Privacy Policy outlines our practices regarding the collection, use, disclosure, transfer, storage, and retention of personal information collected through our web applications, APIs, mobile interfaces, table QR ordering portals, and integrated third-party identity services including Google OAuth.

Please read this Privacy Policy carefully. By accessing or using Kafei, you acknowledge that you have read, understood, and agree to the collection and use of your information in accordance with this policy.

---

## 2. Google OAuth API Data Handling & Limited Use Disclosure

Kafei enables users (restaurant owners, managers, floor staff, cashiers, kitchen staff, and administrators) to authenticate and create accounts quickly using **Google Sign-In (Google OAuth 2.0)**. 

### 2.1 Google User Data We Access
When you choose to authenticate via Google OAuth, we request only the following minimum necessary scopes:
- **`openid`**: To verify your authenticated identity.
- **`https://www.googleapis.com/auth/userinfo.email` (`email`)**: To access your primary Google account email address.
- **`https://www.googleapis.com/auth/userinfo.profile` (`profile`)**: To access basic profile information including your display name, given name, family name, and profile picture URL.

We **do not** request access to your Google Drive, Gmail messages, Google Calendar, Google Contacts, or any other sensitive or restricted Google APIs outside of basic authentication.

### 2.2 Purpose of Processing Google User Data
We use the information obtained through Google OAuth strictly for:
1. Authenticating your identity and providing seamless single sign-on (SSO) into your restaurant workspace.
2. Creating and associating your Kafei user profile (name, email, profile avatar).
3. Assigning and verifying role-based access control (RBAC) across restaurant branches, kitchens, and cashier terminals.
4. Sending essential transactional notices (e.g., account security alerts, shift handovers, and billing invoices).

### 2.3 Google API Limited Use Compliance
> **Mandatory Disclosure**:  
> **Kafei's use and transfer to any other app of information received from Google APIs will adhere to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements.**

Specifically:
- **No Advertising or Data Brokering**: We do not sell, rent, trade, or transfer Google user data to third-party data brokers, advertising networks, or analytics aggregators.
- **No Generalized AI/ML Model Training**: We do not use Google user data to train, retrain, or fine-tune generalized artificial intelligence (AI) or machine learning (ML) foundation models without your explicit affirmative consent.
- **Human Access Restrictions**: No human employees or contractors are permitted to read your personal Google data unless: (a) you have provided explicit permission to resolve a specific customer support ticket; (b) it is required for security investigations or software debugging in an isolated test environment; or (c) it is strictly required by applicable law.

---

## 3. Information We Collect

### 3.1 Information You Provide Directly
- **Account Registration**: Full name, business email address, phone number, restaurant/brand name, branch addresses, and password hash (when not using Google OAuth).
- **Restaurant Operational Data**: Dining room configurations, table identifiers, menu items, prices, dietary preferences, recipe inventory, tax rates (GST/VAT), and thermal printer configurations.
- **Billing & Subscription Details**: Payment contact details, business tax ID (e.g., GSTIN), billing address, and transaction metadata. (Credit card numbers and payment instruments are processed securely by PCI-DSS compliant payment gateways).
- **Support Inquiries**: Communications, feedback, support tickets, and chat messages submitted to our operations team.

### 3.2 Information Collected Automatically
- **Guest Table Orders**: When restaurant patrons scan a table QR code at `kafei.in`, we collect anonymous session identifiers, table numbers, cart selections, and order timestamps. Guests are **not** required to install an app or create an account to order.
- **Device & Log Data**: IP addresses, browser types, operating system versions, access times, HTTP request headers, and error telemetry to maintain system availability and performance.
- **Session Tokens & Cookies**: Encrypted JSON Web Tokens (JWT) stored in browser storage (`kafei_access_token`) to maintain authenticated sessions.

---

## 4. How We Use Your Information

We process personal data solely for legitimate business and operational purposes:
1. **Service Delivery**: Providing table QR menus, live Kitchen Display System (KDS) feeds, waiter order management, and cashier billing.
2. **Account Management**: Managing multi-tenant tenant workspaces, branch permissions, and role delegations.
3. **Operational Notifications**: Sending real-time kitchen alerts, low stock warnings, and daily revenue reconciliation summaries.
4. **Security & Fraud Prevention**: Detecting unauthorized access, preventing malicious scrapers, enforcing rate limits, and securing tenant data boundaries.
5. **Legal & Tax Compliance**: Maintaining fiscal invoice logs and tax records as required by applicable commercial laws.

---

## 5. Data Storage, Security & Retention

### 5.1 Security Architecture
We maintain technical and organizational measures (TOMs) designed to secure your data against accidental or unlawful destruction, loss, alteration, or unauthorized disclosure:
- **Encryption in Transit**: All communications between your browser/device and our servers are encrypted using modern Transport Layer Security (TLS 1.3 / HTTPS).
- **Encryption at Rest**: Databases and backup snapshots are encrypted using AES-256.
- **Access Controls & Isolation**: Multi-tenant database row-level security and strict NestJS access guards ensure no restaurant can access another restaurant's data.
- **Credential Protection**: Passwords are saved exclusively as salted hashes (bcrypt/argon2). JWT tokens are signed with cryptographic secrets and regularly rotated.

### 5.2 Data Retention
We retain personal information only for as long as your restaurant account remains active, or as necessary to fulfill the purposes described in this policy, satisfy legal/tax requirements, or resolve disputes.

---

## 6. How to Delete Your Account and Revoke Google OAuth Access

You retain complete control over your personal data:

### 6.1 Revoking Google OAuth Access
You can revoke Kafei's access to your Google account at any time via your Google Account settings:
1. Visit [https://myaccount.google.com/permissions](https://myaccount.google.com/permissions).
2. Select **Kafei** under "Third-party apps with account access."
3. Click **Remove Access**.

### 6.2 Requesting Complete Data Deletion
To permanently delete your user account, restaurant records, or any associated data:
- **In-App**: Navigate to `Dashboard > Settings > Account > Delete Account`.
- **Email Request**: Send an email to [privacy@kafei.in](mailto:privacy@kafei.in) or [rikmukherjee1999@gmail.com](mailto:rikmukherjee1999@gmail.com) with the subject line *"Data Deletion Request"*.
- We will verify your identity and process the complete purge of your personal data from active databases within **30 days**, subject to statutory recordkeeping requirements.

---

## 7. Third-Party Service Providers & Sub-processors

We engage reputable third-party infrastructure providers to operate Kafei:
- **Cloud Hosting & Infrastructure**: Supabase / PostgreSQL, Railway / Cloudflare (Enterprise grade, SOC 2 compliant).
- **Authentication**: Google Identity Services (Google OAuth 2.0).
- **Transactional Communications**: Secure transactional email and SMS dispatch providers.
- **Payment Processors**: PCI-DSS Level 1 certified payment gateways (Stripe, Razorpay, Cashfree).

All sub-processors are bound by strict data protection agreements ensuring they process data only under our instructions and in compliance with this Privacy Policy.

---

## 8. International Compliance (GDPR, CCPA/CPRA, DPDP Act)

- **European Union & UK (GDPR / UK GDPR)**: You have the right to access, rectify, port, erase, or restrict the processing of your personal data, and to lodge a complaint with a supervisory authority.
- **California (CCPA / CPRA)**: California residents have the right to know what personal information is collected, request deletion, and opt out of any sale of personal information. *Kafei does not sell your personal information.*
- **India (Digital Personal Data Protection Act, 2023)**: We process digital personal data in accordance with statutory consent principles, right to correction, and right to grievance redressal.

---

## 9. Children's Privacy

Kafei is a commercial business operating system intended for restaurant operators and adults. We do not knowingly collect personal information from children under the age of 16. If we become aware that a child under 16 has provided us with personal data, we will immediately delete such information.

---

## 10. Changes to This Privacy Policy

We may update this Privacy Policy periodically to reflect technological improvements, legal requirements, or operational changes. When updates occur, we will update the "Last Updated" date at the top of this document. Material changes will be communicated via in-app banner or email notice.

---

## 11. Contact & Grievance Officer

If you have questions, feedback, or wish to exercise your data privacy rights, please contact our Data Protection and Compliance Desk:

- **Company**: Antigravity
- **Privacy Email**: [privacy@kafei.in](mailto:privacy@kafei.in)
- **Primary Review Contact**: [rikmukherjee1999@gmail.com](mailto:rikmukherjee1999@gmail.com)
- **Direct Phone / WhatsApp**: [+91 9903085026](tel:9903085026)
- **Official Website**: [https://kafei.in](https://kafei.in)
