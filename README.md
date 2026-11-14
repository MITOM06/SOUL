# SOUL — Stories Online, Unified Library

A digital library for **e-books and podcasts** with subscriptions: readers browse and buy titles,
read in the browser, listen to podcasts, and pick up where they left off. An admin console runs
the catalogue, members, orders, payments and reports.

**Stack:** Laravel 10 (REST API, Sanctum, spatie/laravel-permission, DomPDF) · Next.js 15 +
React 19 + TypeScript + Tailwind CSS · MySQL

**Demo video:** https://tinyurl.com/4nrtwy8h

---

## Features

**Readers**
- Catalogue of e-books and podcasts — categories, trending ("hot"), detail pages
- In-browser e-book reader (PDF.js) and podcast player
- *Continue* — resume a book or episode where you stopped
- Favourites, personal library of purchased titles, notifications
- Cart → order → checkout, payment history
- Subscription plans with upgrade and plan-specific inclusions

**Admin**
- Dashboard with charts (Chart.js)
- Manage books, podcasts and their files, users, subscriptions, orders and payments
- Roles and permissions (spatie/laravel-permission), reports

## Repository layout

```
Developments/
├── backend/     Laravel 10 REST API (app/, routes/api.php, database/migrations + seeders)
└── frontend/    Next.js 15 App Router (src/app/…, src/components, src/lib)
Documentations/
├── 01. Project Docs/   Design document, installation guide, user guide, slides
└── 02. Video/          Demo video link
```

## Running locally

**Backend** — PHP 8.1+, Composer, MySQL:

```bash
cd Developments/backend
composer install
# create .env with DB_DATABASE, DB_USERNAME, DB_PASSWORD (Laravel defaults otherwise)
php artisan key:generate
php artisan migrate --seed   # schema + demo catalogue, users, orders
php artisan serve            # http://127.0.0.1:8000
```

**Frontend** — Node 20+:

```bash
cd Developments/frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api" > .env.local
npm run dev                  # http://localhost:3000
```

Payments run in test mode (`stripe_test` and similar providers) — no real charges.
Step-by-step setup: [Installation Guide](Documentations/01.%20Project%20Docs/Installation+Guide.pdf).

## Documentation

- [Design document](Documentations/01.%20Project%20Docs/) — synopsis, design reviews, test document, task sheet
- [User guide](Documentations/01.%20Project%20Docs/UserGuide.pdf)

## Team

Built in 2025 as the semester II project at Aptech (batch T2.2410.E0, group 02), supervised by
Lê Thanh Nhân.

- **Trần Phúc Khang** ([@MITOM06](https://github.com/MITOM06))
- **Mai Thanh Đạt**
- **Nguyễn Kim Minh**
