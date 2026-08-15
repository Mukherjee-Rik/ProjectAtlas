# 🍽️ Project Atlas — Non-Developer User Manual & Visual Frontend Guide

> **A friendly, step-by-step guide to using Project Atlas across every screen.**  
> *No coding or technical knowledge required.*

---

## 🌟 Who Is This Guide For?

This guide walks you through the daily operations of Project Atlas, broken down by your real-world role:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ 👑 RESTAURANT   │    │ 📱 CUSTOMER /   │    │ 🍳 KITCHEN      │
│    OWNER        │    │    DINER        │    │    CHEF         │
│  Setup, Menus,  │    │  Scan QR, Cart, │    │  Live KDS Prep  │
│  Sales & AI     │    │  Order & Pay    │    │  Timers & Notes │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
┌────────┴────────┐    ┌────────┴────────┐    ┌────────┴────────┐
│ 🛎️ WAITER /     │    │ 💵 CASHIER /    │    │ 🛡️ PLATFORM     │
│    FLOOR STAFF  │    │    BILLING      │    │    SUPER ADMIN  │
│  Deliver Food,  │    │  Final Bill,    │    │  All Restos,    │
│  Table Calls    │    │  Cash / UPI POS │    │  Support Desk   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 📑 Quick Navigation

1. [👑 Flow 1: Restaurant Owner (Setup, Menu & Dashboard)](#1--flow-1-restaurant-owner-flow)
2. [📱 Flow 2: Customer / Diner (Scan QR & Order at Table)](#2--flow-2-customer--diner-flow)
3. [🍳 Flow 3: Kitchen Chef (Live Kitchen Display System - KDS)](#3--flow-3-kitchen-chef-flow)
4. [🛎️ Flow 4: Floor Waiter (Deliveries & Table Calls)](#4--flow-4-floor-waiter-flow)
5. [💵 Flow 5: Cashier (Billing & Payment Settlements)](#5--flow-5-cashier--pos-flow)
6. [🛡️ Flow 6: Platform Super Admin (Support Desk & All Restaurants)](#6--flow-6-platform-super-admin-flow)
7. [💡 Common Questions & Troubleshooting](#7--common-questions--troubleshooting)

---

## 1. 👑 Flow 1: Restaurant Owner Flow

### Step 1.1: Sign Up & Register Your Restaurant
1. Open the Atlas website and click **"Create Free Account"** (or go to `/signup`).
2. Fill in your details:
   - **Restaurant Name**: e.g., *"Spice Symphony Bistro"*
   - **Your Name**: e.g., *"Rahul Sharma"*
   - **Email & Password**
3. Click **"Get Started"**. Atlas automatically creates your restaurant space and logs you in.

---

### Step 1.2: The 6-Step Fast Onboarding Wizard (`/onboarding`)
When you log in for the first time, Atlas guides you through 6 simple steps:

```
[1. Profile] ➔ [2. Floor & Tables] ➔ [3. Table QRs] ➔ [4. Menu Items] ➔ [5. Invite Staff] ➔ [6. Launch!]
```

* **Step 1 — Profile**: Choose your restaurant concept (e.g. *Cafe, Fine Dining, Fast Casual*) and verify your currency (₹ INR).
* **Step 2 — Floor Plan**: Enter your dining areas (e.g. *Main Courtyard*, *AC Hall*, *Rooftop*) and how many tables you have (e.g. *10 tables*).
* **Step 3 — QR Generation**: Atlas instantly generates a unique QR code for every table. You can print these as stickers or table standees!
* **Step 4 — Add Your First Dishes**: Create categories (e.g. *Starters, Main Course, Drinks*) and add your best dishes with photos and prices.
* **Step 5 — Invite Your Staff**: Enter emails for your Chef, Waiters, and Cashier so they get their own login.
* **Step 6 — Go Live!**: Click **"✨ Launch Restaurant Live"** to open your live dashboard.

---

### Step 1.3: Managing Your Menu (`/menus`)
To add, edit, or remove items at any time:
1. Click **"Menus"** in the sidebar.
2. Click **"+ Add Category"** (e.g., *Biryanis*, *Desserts*, *Beverages*).
3. Under any category, click **"+ Add Item"**:
   - Enter **Dish Name** (e.g., *Truffle Dum Biryani*)
   - Enter **Price** (e.g., *₹450*)
   - Select **Dietary Tag** (*Veg 🟢, Non-Veg 🔴, Vegan 🌱*)
   - Toggle **In Stock / Out of Stock** with one click if ingredients run out!

---

### Step 1.4: The Live Command Dashboard (`/dashboard`)
Your main screen shows you what is happening right now in your restaurant:
* **Today's Gross Sales**: Real-time counter of total revenue (₹).
* **Completed Orders**: How many customers have been served today.
* **Active Tables**: See which tables currently have diners eating.
* **Peak Hour Heatmap**: Tells you when your restaurant is busiest (e.g. 1 PM–3 PM lunch, 8 PM–10 PM dinner).
* **Top Selling Dishes**: Highlights which dishes make you the most profit.

---

### Step 1.5: Asking the AI Restaurant Assistant
Need insights without digging through reports?
1. Click the **"AI Copilot"** tab in your dashboard.
2. Type any question in plain English, such as:
   - *"What was our best-selling starter this week?"*
   - *"How much revenue did we make last Friday evening?"*
   - *"Which dishes haven't been ordered in the last 3 days?"*
3. Atlas AI scans your real orders and answers in 2 seconds with actionable advice!

---

## 2. 📱 Flow 2: Customer / Diner Flow (At the Table)

*Guests don't need to download any app or create an account!*

```
[1. Scan Table QR] ➔ [2. Browse Menu] ➔ [3. Add to Cart] ➔ [4. Place Order] ➔ [5. Track & Call Waiter]
```

### Step 2.1: Scan QR Code on Table
1. Diner sits at **Table 04** and opens their phone camera.
2. Scans the QR stand on the table.
3. Mobile browser instantly opens the live digital menu for Table 04.

---

### Step 2.2: Browse Menu & Select Items
1. Diners see high-quality photos, descriptions, and dietary badges (Veg / Non-Veg).
2. Tap on a dish to pick options (e.g., *Spicy Level*, *Extra Cheese*).
3. Add special notes: *"Please make it less spicy for children"*.
4. Tap **"Add to Cart"**.

---

### Step 2.3: Shared Table Cart & Place Order
1. Tap the **"Cart"** button at the bottom.
2. Diners at the same table can see the combined order.
3. Tap **"Submit Table Order"**.
4. Screen shows order confirmation: **Order #AT-000001** with live status:
   - 🟡 **Pending** (Received by kitchen)
   - 🔵 **Cooking in Kitchen**
   - 🟢 **Ready / On its Way**

---

### Step 2.4: Call Waiter or Ask for Bill from Phone
While eating, the customer has 3 quick-touch buttons:
* 🛎️ **Call Waiter** (Staff gets an alert on their phone/tablet)
* 💧 **Water Refill**
* 🧾 **Request Bill**

---

## 3. 🍳 Flow 3: Kitchen Chef Flow (KDS Screen)

*Designed for high-speed kitchen tablets or wall-mounted touchscreens.*

```
┌─────────────────────────┐    ┌─────────────────────────┐    ┌─────────────────────────┐
│     🟡 NEW ORDERS       │    │     🔵 PREPARING        │    │     🟢 READY FOR PICKUP │
│  Table 04 - 2x Biryani  │ ➔  │  Chef clicked:          │ ➔  │  Chef clicked:          │
│  "Less spicy" (Timer 0m)│    │  [Start Cooking] (3m)   │    │  [Ready] -> Waiter Notified
└─────────────────────────┘    └─────────────────────────┘    └─────────────────────────┘
```

### Step 3.1: New Order Arrives
1. Chef keeps the **Kitchen Screen** (`/kitchen`) open.
2. When a guest submits an order, an **audio chime** plays and a new ticket card appears under **"New Orders"**.
3. The card clearly shows:
   - **Table Number** (e.g., *Table 04*)
   - **Dish Names & Quantities** (e.g., *2x Truffle Biryani, 1x Butter Naan*)
   - **Special Chef Notes** highlighted in yellow (e.g., *⚠️ Less spicy*).
   - **Timer**: Starts counting up (0:01, 0:02...) so the kitchen knows how long the guest has been waiting.

---

### Step 3.2: Cooking the Food
1. When the cook starts making the dish, they tap **"Start Cooking"**.
2. Ticket moves to the **"Preparing"** column.

---

### Step 3.3: Food is Ready to Serve
1. When food is plated and hot on the counter, the chef taps **"Ready for Pickup"**.
2. Ticket turns green.
3. Floor staff/waiters instantly receive a notification: *"Table 04 food is ready!"*

---

## 4. 🛎️ Flow 4: Floor Waiter Flow

*Used on mobile phones or handheld tablets while moving between tables.*

### Step 4.1: Live Table Overview (`/waiter`)
1. Waiter opens the **Waiter Screen** on their phone.
2. Color-coded table map shows:
   - ⚪ **Grey**: Empty table
   - 🔵 **Blue**: Table occupied & ordering
   - 🟢 **Green Pulsing**: Food ready in kitchen for delivery!
   - 🔴 **Red Ring**: Customer tapped *"Call Waiter"* or *"Water Refill"*.

---

### Step 4.2: Delivering Food
1. When kitchen marks an order **Ready**, waiter goes to kitchen counter.
2. Picks up dishes for **Table 04**.
3. Delivers food to diners and taps **"Mark as Served"** on their screen.

---

### Step 4.3: Manual Order Taking (For Walk-in Diners)
If an elderly customer doesn't want to scan a QR code:
1. Waiter selects **Table 04** on their screen.
2. Taps dishes to add them manually.
3. Taps **"Send to Kitchen"**. The kitchen screen receives it immediately!

---

## 5. 💵 Flow 5: Cashier & Billing Flow (POS Desk)

*Used at the front desk or billing counter.*

```
[1. Select Table 04] ➔ [2. Review Bill & Taxes] ➔ [3. Choose Payment Method] ➔ [4. Print Receipt / Complete]
```

### Step 5.1: Opening Table Bill (`/cashier`)
1. Customer is ready to leave and requests their final bill.
2. Cashier clicks **Table 04** on the cashier screen.
3. The screen shows all ordered items, quantity, subtotal, and automatic tax calculation (e.g., 5% GST / CGST + SGST).

---

### Step 5.2: Applying Discounts (Optional)
* Cashier can enter discount percentage (e.g. *10% Happy Hour*) or custom coupon code.

---

### Step 5.3: Collecting Payment
Cashier selects the payment method:
* 💵 **Cash**: Enter amount tendered; system displays exact change to return.
* 📱 **UPI QR**: Dynamic QR code displays on screen or printed receipt for instant phone scanning.
* 💳 **Card / POS Terminal**: Settle via external card swipe machine.

---

### Step 5.4: Settle & Free Up Table
1. Click **"Complete Settlement"**.
2. Digital receipt is generated and thermal printer prints final bill.
3. Table 04 automatically turns back to **Vacant (Grey)**, ready for the next customer!

---

## 6. 🛡️ Flow 6: Platform Super Admin Flow (`/platform-admin`)

*Used by the Atlas Platform Management team to manage all restaurants and system health.*

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ATLAS GLOBAL PLATFORM ADMIN DESK                       │
├───────────────────┬───────────────────┬───────────────────┬─────────────────┤
│  🏢 All Rests (43)│  💳 Subscriptions │  🆘 Support Desk  │  📡 System Health│
└───────────────────┴───────────────────┴───────────────────┴─────────────────┘
```

### 1. Global Overview Tab
* View total restaurants signed up, total diners ordering across the network, and system uptime.

### 2. Support & Incident Desk
* When restaurant owners file a ticket (e.g. *"Need help connecting thermal printer"*), it appears here with a reference code (e.g., `ATLAS-0FB5`).
* Platform admin types a resolution note and clicks **"Resolve Ticket"**.
* The restaurant owner is immediately notified in their dashboard!

### 3. Subscription & Feature Management
* Manage restaurant plan tiers (*Free Trial, Growth, Multi-Branch Enterprise*).
* Upgrade quotas (e.g. allowing 50 tables or multiple branch locations).

---

## 7. 💡 Common Questions & Troubleshooting

### Q1: What happens if the internet goes down for 2 minutes?
> **Answer**: Atlas automatically queues kitchen actions and syncs everything the moment connection is restored. No orders or sales data are lost.

### Q2: Can a customer order from home by saving the QR link?
> **Answer**: No. Atlas table QR codes use secure dynamic session tokens that expire once the table bill is settled.

### Q3: How do I change a dish price on a busy night?
> **Answer**: Go to **Menus** > Click the dish > Edit price > Click **Save**. The price updates on all customer phones instantly without reloading!

### Q4: How do I get help if something doesn't work?
> **Answer**: Click **"Support"** in your sidebar > Click **"+ Create Ticket"**. Our engineering team will respond directly to your screen.

---

*Project Atlas v1.0 • Built for effortless restaurant management.*
