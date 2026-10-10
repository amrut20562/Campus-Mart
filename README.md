# CampusMart AI — Phase 1 Prototype

> **A Student-Centric Circular E-Commerce Marketplace Platform**  
> *CampusMart AI: A Multi-Agent AI Framework for Intelligent Student-Centric Circular E-Commerce*

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%7C_Auth_%7C_RLS-3ecf8e.svg)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Vitest-52%2B_Tests_Passing-green.svg)](https://vitest.dev/)

---

## 📖 Project Overview

**CampusMart** is a web-based circular economy platform built specifically for college and university campuses. Students often face high costs for essential academic resources (textbooks, scientific calculators, laptops, lab coats, drafting tools) while graduating seniors frequently discard or struggle to sell usable items. Generic e-commerce marketplaces lack campus relevance, trust verification, and simple peer-to-peer exchange models.

**Phase 1** establishes the robust, non-AI marketplace foundation:
- Direct student-to-student buying, selling, and item exchange.
- Secure authentication and role-based access control (Student vs Admin).
- Relational data architecture on Supabase with PostgreSQL Row Level Security (RLS).
- Comprehensive search, category classification, multi-criteria filtering, and sorting.
- Transaction intent tracking (Expressions of Interest for buy/exchange) without payment intermediary friction.

The subsequent **Phase 2** builds upon this foundation to introduce intelligent multi-agent AI systems (Price Intelligence, Smart Listing Assistant, Recommendation Engine, and Fraud/Trust Scoring).

---

## ✨ Key Features

### 🛒 Marketplace Discovery & Exploration
- **Hero Search:** Instant keyword search across titles and descriptions.
- **7 Campus Categories:** Database-driven categories: *Textbooks*, *Electronics*, *Stationery*, *Furniture*, *Lab Equipment*, *Sports*, and *Other*.
- **Multi-Parametric Filter Bar:** Filter simultaneously by category, condition (*New*, *Like New*, *Good*, *Fair*, *Poor*), price range (Min/Max in ₹ INR), and availability status (*Available*, *Reserved*, *Sold*).
- **Numeric Price Sorting:** Sort listings by newest first, price ascending, or price descending.
- **Live Campus Statistics:** Dynamic counter showing active listings, products sold, registered students, and active categories.

### 📦 Listing Management
- **Publish Listings:** Upload product photos with title, description, condition, item age in months, price, location tag, and transaction mode (*Sell*, *Exchange*, *Either*).
- **Edit & Lifecycle Controls:** Sellers can update item details or transition status between **Available**, **Reserved**, and **Sold**.
- **Public Asset & Storage Support:** Integrated with Supabase Storage and fallback image handlers for local assets.

### 🤝 Student Interactions & Intent Tracking
- **Expressions of Interest:** Buyers can submit **Buy** or **Exchange** requests with contact notes.
- **Dedicated Requests Hub:** Track outgoing requests ("Sent") and incoming inquiries from other students ("Received") with instant **Accept** or **Reject** actions.
- **Favourites & Wishlists:** Authenticated students can save products for quick reference in their `/saved` collection.
- **Safety Reporting:** Students can report inappropriate or misleading listings with classified violation reasons (*Misleading Information*, *Prohibited Item*, *Suspected Scam*, etc.).

### 🛡️ Administration & Moderation
- **Role-Based Access Control (RBAC):** Protected `/admin` dashboard restricted via database roles.
- **Product Moderation:** Admins can inspect all listings, hide inappropriate items from the public feed (`is_hidden`), or unhide resolved items.
- **Report Review Pipeline:** Admins can transition reports through *Open* → *Under Review* → *Resolved* / *Dismissed*.

### 🔍 Developer & Visual Feedback
- **Agentation Toolbar:** Integrated global visual feedback tool across all application routes for capturing structured DOM notes for AI coding agents and human reviewers.
- **Phase 2 Modal:** Interactive roadmap modal detailing upcoming multi-agent AI capabilities.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + TypeScript |
| **Build Tooling** | Vite 8 + HMR |
| **Styling & Design System** | Tailwind CSS v4 (Editorial Gallery aesthetic, Electric Cobalt accents) |
| **Routing** | React Router v7 |
| **State & Server Cache** | TanStack Query v5 (React Query) |
| **Forms & Validation** | React Hook Form + Zod v4 |
| **Backend & Database** | Supabase (PostgreSQL 15, GoTrue Auth, Storage) |
| **Security & Authorization** | PostgreSQL Row Level Security (RLS) + Database Triggers |
| **Unit & Integration Testing** | Vitest v5 + React Testing Library + jsdom |
| **Linting & Code Quality** | Oxlint |
| **Visual Feedback** | Agentation |

---

## 🚀 Quick Start: Cloning & Running Locally

Follow these step-by-step instructions to get the application running on your local machine.

### Prerequisites

Ensure you have the following installed:
- [Git](https://git-scm.com/) (v2.30 or higher)
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended, e.g., LTS v20 / v22)
- [npm](https://www.npmjs.com/) (bundled with Node.js)

---

### Step 1: Clone the Repository

Clone the project from GitHub:

```bash
git clone https://github.com/amrut20562/Campus-Mart.git
```

Navigate into the project directory:

```bash
cd Campus-Mart
```

---

### Step 2: Install Dependencies

Install all required npm dependencies:

```bash
npm install
```

---

### Step 3: Configure Environment Variables

Create your local `.env` configuration file from the template:

```bash
# On Linux / macOS / Git Bash:
cp .env.example .env

# On Windows PowerShell:
Copy-Item .env.example .env
```

Open `.env` in your text editor and provide your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-or-publishable-key
```

> ⚠️ **Important Security Note:**  
> Never include your `SUPABASE_SERVICE_ROLE_KEY` in the frontend `.env` file. Only the public anon key (`VITE_SUPABASE_PUBLISHABLE_KEY`) is safe to run in browser client code.

---

### Step 4: Database Setup (Supabase)

If you are setting up a fresh Supabase project:

1. Open your project on the [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor** tab.
3. Open and execute the schema migration file:
   - Located at: [`supabase/migrations/20241001000000_initial_schema.sql`](supabase/migrations/20241001000000_initial_schema.sql)
4. Next, execute the seed data file to populate default campus categories:
   - Located at: [`supabase/seed.sql`](supabase/seed.sql)
5. Under **Storage**, ensure a public bucket named `product-images` is created if you intend to store uploaded photos directly in Supabase Storage.

#### Creating an Admin Account (Optional)
To grant an account administrator privileges:
```sql
-- Replace <user-uuid> with the user's UUID from auth.users
INSERT INTO public.user_roles (user_id, role)
VALUES ('<user-uuid>', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

---

### Step 5: Start the Development Server

Start Vite's development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

The terminal will display the local development URL (typically):

```
  VITE v8.3.4  ready in 240 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open your browser and navigate to **`http://localhost:5173`**.

---

## 🧪 Testing & Validation

CampusMart includes an automated test suite covering unit logic, component rendering, schema validation, route protection, and acceptance scenarios from the Phase 1 test plan (`07-TESTING-DEMO.md`).

### Run Automated Tests

Execute all Vitest test suites:

```bash
npm test
```

To run tests in interactive watch mode during development:

```bash
npm run test:watch
```

### Production Build Validation

Verify TypeScript types and compile the optimized production bundle:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

### Code Quality & Linting

Run the ultra-fast Oxlint linter:

```bash
npm run lint
```

---

## 📁 Project Directory Structure

```
Campus-Mart/
├── public/                       # Static public assets (SVGs, product demo images)
│   ├── images/
│   │   ├── lenovo-laptop.png
│   │   └── python-textbook.png
│   ├── favicon.svg
│   └── placeholder-product.svg
├── src/
│   ├── app/                      # Application core setup
│   │   ├── queryClient.ts        # TanStack Query client configuration
│   │   └── router.tsx             # React Router v7 routes & layout mapping
│   ├── components/               # Shared reusable UI components
│   │   ├── feedback/             # Toast context & notification UI
│   │   └── layout/               # AppShell, Navbar, and Phase 2 modal
│   ├── features/                 # Domain-driven feature modules
│   │   ├── auth/                 # AuthProvider, ProtectedRoute, role guards
│   │   ├── favourites/           # Favourite toggle button & queries
│   │   ├── products/             # Product image utilities & storage helpers
│   │   ├── reports/              # Listing report dialog & submission
│   │   └── requests/             # Expression of interest modal
│   ├── lib/                      # Utilities, constants, and Supabase client
│   │   ├── constants.ts          # Condition, status, and sort options
│   │   ├── formatters.ts         # Currency (INR), date, and badge classes
│   │   ├── queryKeys.ts          # Cache key factories
│   │   └── supabase.ts           # Supabase client initialization
│   ├── pages/                    # Route page components
│   │   ├── AdminPage.tsx         # Admin dashboard (users, products, reports)
│   │   ├── EditListingPage.tsx   # Edit listing & lifecycle state
│   │   ├── HomePage.tsx          # Homepage feed, search, and category filter
│   │   ├── LoginPage.tsx         # Student login
│   │   ├── MyListingsPage.tsx    # Seller's active and past listings
│   │   ├── NotFoundPage.tsx      # 404 page
│   │   ├── ProductDetailPage.tsx # Listing details, seller profile, request modal
│   │   ├── ProfilePage.tsx       # Student profile & college details
│   │   ├── RegisterPage.tsx      # New student account registration
│   │   ├── RequestsPage.tsx      # Sent & Received buyer requests
│   │   ├── SavedPage.tsx         # User's bookmarked listings
│   │   └── SellPage.tsx          # Create new product listing form
│   ├── schemas/                  # Zod validation schemas
│   │   └── index.ts              # Listing, registration, and filter schemas
│   ├── tests/                    # Vitest & Testing Library test suites
│   │   ├── Phase2Modal.test.tsx
│   │   ├── ProductCard.test.tsx
│   │   ├── ProtectedRoute.test.tsx
│   │   ├── criticalScenarios.test.ts # T01-T22 & RLS acceptance tests
│   │   ├── formatters.test.ts
│   │   ├── productUtils.test.ts
│   │   ├── schemas.test.ts
│   │   └── setup.ts
│   ├── types/                    # TypeScript type definitions
│   │   └── database.types.ts     # Supabase tables, views, and enum types
│   ├── index.css                 # Global Tailwind CSS styles and theme variables
│   └── main.tsx                  # React DOM root entrypoint
├── supabase/
│   ├── migrations/               # PostgreSQL schema migrations with RLS policies
│   └── seed.sql                  # Seed data for categories & demo data
├── .env.example                  # Environment variable reference
├── .gitignore                    # Git ignore specifications
├── package.json                  # Dependencies and scripts
└── vite.config.ts                # Vite build configuration
```

---

## 🔮 Phase 2 Roadmap: AI Multi-Agent Modules

Phase 1 provides the high-fidelity circular marketplace platform. Phase 2 introduces:

1. **AI Multi-Agent Orchestrator:** Intelligent coordinator delegating specialized tasks across agents.
2. **Fair Price Intelligence Agent:** Price recommendations based on category, age, wear condition, and historical sales data.
3. **Smart Listing Assistant:** Image recognition and generative text to auto-populate titles, categories, and descriptions.
4. **Personalized Recommendation Engine:** Hybrid collaborative and content-based recommendations tailored to each student's major and semester.
5. **Automated Fraud & Trust Scoring:** Real-time risk assessment analyzing listing anomalies, duplicate posts, and suspicious behavior.
6. **Secure Campus Chat:** In-app real-time messaging between prospective buyers and sellers.

---

## 📄 License

This project is developed as an academic and prototype platform for intelligent campus circular commerce. All rights reserved.
