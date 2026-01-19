# Build Screen from Layout Spec

Build a complete screen/page from layout specifications using generated components.

## Usage

```
/build-screen <screen-name> [--path <output-path>]
```

## Arguments

- `screen-name` (required): Name of layout from `specs/layouts.md` (Dashboard, Login, Analytics)
- `--path` (optional): Output path (default: auto-detect app router location)

## Prerequisites

- Design system must be installed (`/install-design-system`)
- Components should be generated (`/gen-component --all`)

## Process

1. **Load layout specification**
   - Read from `design-system/specs/layouts.md`
   - Get structure, sections, component placement

2. **Identify required components**
   - Parse layout sections
   - Map to generated components from `src/components/ui/`

3. **Generate page code**
   - Create React page component
   - Import generated UI components
   - Build layout structure matching spec
   - Use design tokens for spacing/styling

4. **Generate mock data**
   - Create sample data for KPI cards, tables, charts
   - Output to `src/lib/mock-data.ts`

5. **Output**
   - Write page to `src/app/[screen]/page.tsx` (Next.js App Router)
   - Or `src/pages/[screen].tsx` (Pages Router / other frameworks)

## Available Screens

From `specs/layouts.md`:

| Screen | Description |
|--------|-------------|
| Dashboard | Main dashboard with KPIs, tabs, charts, data table |
| Analytics | Data visualization focused layout |
| Login | Authentication/login form layout |

## Generated Code Structure

```tsx
// src/app/dashboard/page.tsx
import { Sidebar, Header, KPICard, TabList, ChartCard, DataTable } from '@/components/ui';
import { dashboardData, kpiData, tableData } from '@/lib/mock-data';

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen" style={{ gap: 'var(--spacing-2-5)' }}>
      {/* Sidebar - 258px fixed */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col" style={{ gap: 'var(--spacing-6)' }}>
        {/* Header - 84px */}
        <Header title="Dashboard" />

        {/* KPI Cards Row - 150px */}
        <section className="flex" style={{ gap: 'var(--spacing-6)' }}>
          {kpiData.map((kpi) => (
            <KPICard key={kpi.id} {...kpi} />
          ))}
        </section>

        {/* Tab Navigation */}
        <TabList
          tabs={['Overview', 'Revenue', 'Pipeline', 'Team', 'Product']}
          defaultTab="Overview"
        />

        {/* Charts Section */}
        <section className="grid grid-cols-2" style={{ gap: 'var(--spacing-6)' }}>
          <ChartCard title="Revenue Trend" />
          <ChartCard title="Pipeline Status" />
        </section>

        {/* Data Table */}
        <DataTable data={tableData} />
      </main>
    </div>
  );
}
```

## Example

```
/build-screen Dashboard

Loading layout specification...
✓ Found Dashboard in specs/layouts.md

Layout structure:
- Sidebar (258px fixed)
- Content area:
  - Header (84px)
  - KPI Cards Row (150px, 4-5 cards)
  - Tab Navigation (36px)
  - Charts Section (396px)
  - Data Table (flexible)

Required components:
✓ Sidebar - found in src/components/ui/
✓ Header - found in src/components/ui/
✓ KPICard - found in src/components/ui/
✓ TabList - found in src/components/ui/
✓ ChartCard - found in src/components/ui/
✓ DataTable - found in src/components/ui/

Generating page...
✓ Created src/app/dashboard/page.tsx
✓ Updated src/lib/mock-data.ts

Dashboard page created!

To view:
1. Run `npm run dev`
2. Navigate to http://localhost:3000/dashboard

The page matches the layout specification exactly:
- Sidebar + Content structure
- Correct spacing (--spacing-6 between sections)
- All components use design tokens
```

## Options

### Preview only
```
/build-screen Dashboard --preview
```
Shows generated code without creating files

### With routing
```
/build-screen Dashboard --with-routing
```
Also updates navigation/routing files

### Minimal (no mock data)
```
/build-screen Login --minimal
```
Generates page without mock data

## Notes

- Uses generated components from `/gen-component`
- All styling uses design tokens
- Mock data is clearly separated for easy replacement
- Responsive considerations from layout spec are included
- Page structure matches spec exactly
