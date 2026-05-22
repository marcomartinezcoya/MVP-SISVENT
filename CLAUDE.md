# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: Next.js Version Warning

This project uses **Next.js 16** — APIs, conventions, and file structure may differ from training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Commands

```bash
npm run dev       # Start development server (localhost:3000)
npm run build     # Production build
npm run start     # Production server
npm run lint      # ESLint check
```

There are no automated tests. Environment requires a `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Architecture

**SISVENT** is an inventory management system for a Peruvian business. Stack: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Supabase (PostgreSQL).

### Module layout

Each business domain follows this pattern:
```
app/[module]/
  page.tsx          # Server component — fetches initial data, renders module component
  actions.ts        # Server actions — all Supabase queries for this module

components/modules/[module]/
  [Module]Module.tsx        # Client component — orchestrates the full page UI
  [Module]Table.tsx         # Data table with search/filter
  [Module]FormModal.tsx     # Create/edit form inside Modal
  [Module]Stats.tsx         # Metric cards (where applicable)
```

Modules: `dashboard`, `productos`, `clientes`, `proveedores`, `compras`, `ventas`, `movimientos`.

### Server actions

All data access goes through `actions.ts` server actions. They return `ActionResult<T>`:
```ts
{ data: T | null; error: string | null }
```
Never call Supabase directly from client components — use server actions or API routes.

Two Supabase client factories:
- `lib/supabase/client.ts` — `supabaseBrowser` singleton for client-side (file uploads, etc.)
- `lib/supabase/server.ts` — `createServerClient()` factory called fresh in each server action

### Types

All domain types live in `lib/types/`. Key shapes:
- `Producto` — SKU (PROD-NNNN), price_compra, price_venta, stock_actual, stock_minimo
- `Cliente` — discriminated by `tipo: 'empresa' | 'persona'`
- `Compra` / `Venta` — status enums, linked to supplier/client + line items
- `Movimiento` — `tipo: 'ENTRADA' | 'SALIDA' | 'TRANSFERENCIA' | 'AJUSTE'`

### UI conventions

- Dark theme using Material Design 3 CSS custom properties defined in `app/globals.css`
- Icons: Material Symbols Outlined (loaded via Google Fonts, used as `<span className="material-symbols-outlined">`)
- Modals: wrap `components/ui/Modal.tsx` for all CRUD forms
- Currency: always use `lib/utils/currency.ts` to format amounts as `S/ X,XXX.XX`

### Exports

- Excel: `app/api/productos/export/` — API route using `xlsx`
- PDF: `jspdf` + `jspdf-autotable` (configured as `serverExternalPackages` in `next.config.ts`)

### Image domains

Remote images are allowed from Google, Unsplash, and Supabase CDN (configured in `next.config.ts`).
