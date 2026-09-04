# Cookie Policy — Kafei

**Effective Date**: January 1, 2025  
**Last Updated**: September 4, 2026  
**Official Application**: Kafei ([https://kafei.in](https://kafei.in))  
**Operating Entity**: Antigravity  
**Contact Email**: [privacy@kafei.in](mailto:privacy@kafei.in) / [rikmukherjee1999@gmail.com](mailto:rikmukherjee1999@gmail.com)  
**Hotline**: [+91 9903085026](tel:9903085026)  

---

## 1. What Are Cookies and Local Storage?

Cookies and web browser local storage (`localStorage` and `sessionStorage`) are small data files or key-value entries placed on your device (computer, tablet, or smartphone) when you visit websites or web applications. 

They are widely used to ensure web applications function securely, remember your logged-in state across page navigation, store your workspace preferences, and maintain dining table carts.

---

## 2. How Kafei Uses Cookies & Browser Storage

Kafei utilizes browser storage strictly for functional, security, and authentication purposes. **We do not use intrusive third-party cross-site advertising trackers or sell your browsing history.**

### 2.1 Essential & Strictly Necessary Storage
These tokens are required for the fundamental operation and security of the Kafei platform:

| Key / Token Name | Storage Type | Purpose & Description | Expiration |
| :--- | :--- | :--- | :--- |
| `kafei_access_token` | LocalStorage / Secure Cookie | Cryptographically signed JSON Web Token (JWT) maintaining your authenticated session. | Up to 7 Days or Logout |
| `kafei_auth_user` | LocalStorage | Cached user profile information (User ID, Name, Email, Role) for instant UI rendering. | Session |
| `kafei_current_tenant` | LocalStorage | Active restaurant business / enterprise workspace identifier. | Persistent |
| `kafei_current_restaurant` | LocalStorage | Active restaurant property identifier. | Persistent |
| `kafei_current_branch` | LocalStorage | Active floor branch identifier (e.g., Main Hall, Rooftop). | Persistent |
| `kafei_table_session` | SessionStorage | Anonymous active dining cart for guests scanning a table QR code. | Tab / Session Close |

### 2.2 Preference & UI Storage
| Key / Token Name | Storage Type | Purpose & Description | Expiration |
| :--- | :--- | :--- | :--- |
| `kafei-theme` | LocalStorage | Stores your chosen UI color mode (`dark`, `light`, or `system`). | 1 Year |

### 2.3 Third-Party Identity & Security Storage
When logging in via Google Sign-In, Google Identity Services may set cookies such as `g_state` to coordinate the Google OAuth credential selection. These cookies are governed by [Google's Privacy Policy](https://policies.google.com/privacy).

---

## 3. Diner Guest Privacy on Table QR Ordering

When restaurant patrons scan a table QR code to view menus and place orders at `kafei.in`:
- **No Third-Party Advertising Cookies**: Guests are not tracked across other websites.
- **No App Installation Required**: Ordering functions in any standard mobile browser.
- **Ephemeral Session Data**: Guest cart items and table selections remain tied only to the active browser session and are cleared upon order completion.

---

## 4. How to Manage and Disable Cookies

You can control, block, or delete cookies and browser storage through your web browser settings:

- **Google Chrome**: `Settings > Privacy and security > Third-party cookies`.
- **Apple Safari**: `Preferences > Privacy > Block all cookies` (or `Manage Website Data`).
- **Mozilla Firefox**: `Settings > Privacy & Security > Cookies and Site Data`.
- **Microsoft Edge**: `Settings > Cookies and site permissions > Manage and delete cookies`.

*Note: Disabling essential local storage or cookies will prevent you from signing in to your Kafei account or managing restaurant operations.*

---

## 5. Contact Us

If you have questions about our use of cookies or local storage, please reach out to:

- **Data Privacy Desk**: [privacy@kafei.in](mailto:privacy@kafei.in)
- **Primary Review Contact**: [rikmukherjee1999@gmail.com](mailto:rikmukherjee1999@gmail.com)
- **Operations Hotline**: [+91 9903085026](tel:9903085026)
- **Website**: [https://kafei.in](https://kafei.in)
