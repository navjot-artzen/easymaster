# 🛍️ Shopify App - Eparts master App-Year Make Model

Eparts master – Year Make Model Search App for Shopify
"Supercharge your Shopify store with advanced vehicle-based product search!"

This is a boilerplate template for building a **Shopify Embedded App** using **Next.js App Router** and **TypeScript**. It includes authentication, GraphQL integration, webhook handling, and transactional email support using modern tools and libraries.

# 🛠️ What is Eparts master?
Eparts master App is a powerful Shopify Embedded App that allows customers to search for products based on Year, Make, and Model — ideal for:

Automotive Parts
Vehicle Accessories
Electronics
Tools & Industrial Products
Any niche with product compatibility requirements


# 🔍 Key Features
- Year/Make/Model Filtering
Let your customers quickly find compatible products based on their vehicle specs.

- Lightning-Fast Search
Search products by Make, Model, or both with blazing fast speed and accuracy.

- Custom YMM Mapping
Associate individual products with specific combinations of YMM.

- Tags
Store and manage compatibility data using Shopify or tags for maximum flexibility.

- UX
Seamless experience across desktop and mobile using Shopify Polaris + Tailwind CSS.

- Easy Setup
No coding required. Connect, map, and go live in minutes.

# 💡 Example Use Cases
"2020 Toyota Corolla Brake Pads" – Only show compatible SKUs.

"2018 Ford F150 Headlights" – Filter instantly by model and year.

"Search by Make" – Browse all Honda-compatible products.

"Search by Model" – Find accessories for Jeep Wrangler.

---

## 🚀 Tech stack

- ✅ **Next.js App Router** with server components
- ✅ **Prisma** for DB schema and migrations
- ✅ **Apollo Client** for Shopify GraphQL APIs
- ✅ **Shopify App Bridge v4** for secure frontend API access
- ✅ **Shopify API Library** for OAuth and session handling
- ✅ **Polaris React** for consistent Shopify UI
- ✅ **Tailwind CSS** for styling
- ✅ **Docker** for PostgreSQL setup
- ✅ **GraphQL Codegen** for type-safe operations
- ✅ **Webhooks**:
  - `APP_UNINSTALLED`: Cleans up user sessions/data

---

## 🧱 Stack Overview

| Tool           | Purpose                            |
|----------------|------------------------------------|
| Next.js        | App Router + Server Components     |
| React + Polaris| Shopify-compatible UI components   |
| Prisma         | DB access & migrations             |
| Apollo Client  | Shopify GraphQL queries/mutations  |
| Shopify API    | OAuth + session management         |
| App Bridge v4  | Secure rendering & API comms       |
| Tailwind CSS   | Utility-first styling              |
| Docker         | container setup         |
| Database       | MongoDB container setup         |

---

## 📦 Installation

Clone & setup your app using Shopify CLI:

```bash
git clone  https://github.com/jchandan001/epartsmaster-app
```
```bash
npm install
```

## Getting Started

# Local Development
Use Shopify CLI to link your partner app and start your local server:

```bash
npm run dev
```

# Docker Setup
Spin up a local Postgres instance using Docker:

```bash
docker-compose up
npm run migrate
npm run db push
```

# GraphQL Codegen
Generate type-safe operations from your GraphQL queries and mutations:

```bash
npm run graphql-codegen
```

# Deployment (Vercel)
Steps to deploy on Vercel:

Create your app on the Shopify Partners dashboard.

Deploy your project to Vercel.

Set the following environment variables in Vercel:

SHOPIFY_API_KEY
SHOPIFY_API_SECRET
SCOPES
HOST
DATABASE_URL


# 📬 Need Help?
Shopify Dev Docs
Issues & Support
Let me know if you'd like:
A React YMM component for your app’s frontend.
A Shopify metafields structure to store YMM data per product.
A liquid snippet to display YMM data in the product page.
