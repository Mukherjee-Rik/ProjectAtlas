# Data Processing Addendum (DPA) — Kafei

**Effective Date**: January 1, 2025  
**Last Updated**: September 4, 2026  
**Official Application**: Kafei ([https://kafei.in](https://kafei.in))  
**Operating Entity**: Antigravity  
**Data Protection Email**: [dpo@kafei.in](mailto:dpo@kafei.in) / [rikmukherjee1999@gmail.com](mailto:rikmukherjee1999@gmail.com)  
**Hotline**: [+91 9903085026](tel:9903085026)  

---

## 1. Introduction & Scope

This Data Processing Addendum ("DPA") supplements the [Kafei Terms of Service](https://kafei.in/terms) between **Antigravity** ("Kafei," "Processor," or "Data Processor") and the restaurant business or subscriber ("Customer," "Controller," or "Data Controller").

This DPA applies to the processing of personal data by Kafei on behalf of the Customer in connection with providing the Kafei restaurant operating system, table QR ordering, KDS, and POS cashier services at **[https://kafei.in](https://kafei.in)**.

This DPA is designed to ensure compliance with:
- **General Data Protection Regulation (GDPR / UK GDPR)**, including Article 28.
- **California Consumer Privacy Act (CCPA / CPRA)**.
- **India Digital Personal Data Protection Act, 2023 (DPDP Act)**.

---

## 2. Definitions & Relationship of the Parties

- **Data Controller / Data Fiduciary**: The Restaurant Tenant who determines the purposes and means of processing customer and guest dining data.
- **Data Processor / Data Processor**: Kafei, which processes personal data on behalf of and under the documented instructions of the Customer.
- **Customer Personal Data**: Any personal data processed by Kafei on behalf of Customer, including restaurant staff profiles, customer phone numbers (for SMS receipts), dining table orders, and billing history.

---

## 3. Details of Data Processing

### 3.1 Subject Matter & Duration
The subject matter is the provision of restaurant floor operations, order processing, and cloud billing. Processing continues for the duration of Customer's active subscription.

### 3.2 Categories of Data Subjects
- Restaurant personnel (owners, managers, chefs, waitstaff, cashiers).
- Restaurant patrons and diner guests placing table QR orders or requesting digital invoices.

### 3.3 Types of Personal Data
- Staff identity: Full names, email addresses, phone numbers, role assignments, and Google OAuth unique IDs.
- Guest dining data: Table numbers, order items, timestamps, bill totals, payment references, and phone numbers (if voluntarily provided for digital SMS receipts).

---

## 4. Processor Obligations

Kafei agrees to:
1. **Process Exclusively on Instructions**: Process Customer Personal Data only on documented instructions from the Customer, including with respect to data transfers.
2. **Confidentiality**: Ensure that all personnel authorized to process Customer Personal Data have committed themselves to strict confidentiality agreements.
3. **Security Measures (TOMs)**: Implement and maintain robust Technical and Organizational Measures as detailed in Section 5.
4. **Sub-processor Governance**: Engage sub-processors only under written contracts imposing equivalent data protection standards.
5. **Assistance with Data Subject Rights**: Provide tools and operational support enabling Customer to fulfill data subject requests (access, rectification, deletion, data export).
6. **Data Return & Deletion**: Upon termination of the Service, delete or return all Customer Personal Data within 30 days, unless applicable statutory law requires retention.

---

## 5. Technical & Organizational Measures (TOMs)

Kafei maintains the following technical and organizational security controls:

- **Transmission Security**: Mandatory TLS 1.3 encryption across all public and internal API endpoints.
- **Data at Rest**: AES-256 encryption across all primary databases, connection pools, and snapshot backups.
- **Logical Tenant Isolation**: Multi-tenant database row-level security and strict NestJS access guards preventing cross-restaurant data leakage.
- **Authentication Safeguards**: Salted password hashing (bcrypt), signed JSON Web Tokens (JWT), and support for Google OAuth single sign-on.
- **Disaster Recovery**: Automated point-in-time recovery and database snapshots to ensure high availability and resilience.

---

## 6. Authorized Sub-processors

Customer provides general authorization for Kafei to engage the following infrastructure sub-processors:

| Sub-processor | Role / Service Provided | Location / Compliance |
| :--- | :--- | :--- |
| **Supabase / PostgreSQL** | Managed Cloud Database & Storage | US / EU / Singapore (SOC 2, ISO 27001) |
| **Railway / Cloudflare** | Application Hosting, Edge CDN & DDoS Defense | Global Edge (SOC 2, PCI DSS) |
| **Google Cloud (Google OAuth)** | Authentication & Identity Verification | Global (ISO 27001, SOC 2/3) |
| **Transactional Gateways** | Payment Processing (Stripe, Razorpay, Cashfree) | PCI-DSS Level 1 Certified |

Kafei will notify Customer of any planned changes to sub-processors via email or in-app dashboard notices at least 14 days prior to onboarding new sub-processors.

---

## 7. Security Incident & Data Breach Notification

In the event of a confirmed security incident or personal data breach affecting Customer Personal Data:
1. Kafei shall notify the Customer without undue delay and in any event within **72 hours** of becoming aware of the breach.
2. The notification shall describe the nature of the breach, affected data categories, estimated number of data subjects, and mitigation steps taken.
3. Kafei shall take immediate reasonable remedial actions to contain and mitigate the incident.

---

## 8. International Data Transfers

Where the processing of personal data involves cross-border transfers outside the EEA, UK, or country of origin, Kafei ensures appropriate safeguards through standard contractual clauses (SCCs) or adequacy decisions recognized by applicable data protection authorities.

---

## 9. Audits & Compliance Verification

Upon reasonable prior written notice (no more than once annually), Kafei shall make available to Customer information necessary to demonstrate compliance with this DPA, such as summary third-party security audit certificates or SOC reports.

---

## 10. Contact & Data Protection Officer

For any inquiries regarding this Data Processing Addendum:

- **Data Protection Officer**: [dpo@kafei.in](mailto:dpo@kafei.in)
- **Primary Review Contact**: [rikmukherjee1999@gmail.com](mailto:rikmukherjee1999@gmail.com)
- **Operations Hotline**: [+91 9903085026](tel:9903085026)
- **Platform**: [https://kafei.in](https://kafei.in)
