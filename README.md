# DataNurse – Angular 20 Admin Dashboard

Complete Angular 20 project converted from single-file HTML dashboard.

## Quick Start

```bash
npm install
ng serve
```
Then open: http://localhost:4200

## Project Structure

```
src/app/
├── app.component.*          # Root layout (sidebar + topbar + router-outlet)
├── app.config.ts            # Angular 20 standalone bootstrap config
├── app.routes.ts            # Lazy-loaded routes for all 8 pages
│
├── core/
│   ├── models/
│   │   ├── doctor.model.ts  # Doctor interface
│   │   └── case.model.ts    # Case interface
│   └── services/
│       ├── toast.service.ts # Global toast notifications (Angular signals)
│       └── nav.service.ts   # Page title/breadcrumb management
│
├── shared/components/
│   ├── sidebar/             # Navigation sidebar with RouterLinkActive
│   ├── topbar/              # Top bar with search, notifications, breadcrumb
│   └── toast/               # Toast notification display
│
└── pages/
    ├── dashboard/           # Stats, charts, recent cases, quick actions
    ├── doctors/             # Doctor registry with Add/View/Delete modals
    ├── cases/               # Patient cases with tab filtering
    ├── search/              # Global search page
    ├── reports/             # Analytics with KPIs and charts
    ├── data-management/     # CRUD records, import/export/backup
    ├── profile/             # User profile with personal/security/activity tabs
    └── settings/            # Platform settings with toggle switches
```

## Key Angular 20 Features Used

- **Standalone Components** — No NgModule, all components are standalone
- **Angular Signals** — `signal()`, `computed()` for reactive state
- **New Control Flow** — `@if`, `@for`, `@empty` syntax (no *ngIf/*ngFor)
- **Lazy Loading** — All 8 pages lazy-loaded via `loadComponent`
- **inject()** — Function-based dependency injection
- **RouterLink / RouterLinkActive** — Client-side navigation
