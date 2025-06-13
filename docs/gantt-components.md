# Gantt Chart Components Documentation

## Overview

The Gantt chart implementation consists of several interconnected components that work together to create an interactive project timeline visualization. The system supports both daily and weekly views with Persian (Jalali) calendar integration and RTL text direction.

## Architecture

### Main Components

1. **`Gantt.tsx`** - Main container component
2. **`GanttTimeline`** - Timeline header with dates
3. **`GanttTaskList`** - Left sidebar with task information
4. **`GanttTaskBar`** - Individual task bars in the chart
5. **`TodayIndicator`** - Visual indicator for current date

### Key Dependencies

- **`jalali-moment`** - Persian calendar support
- **`@/lib/types`** - Type definitions for GanttTask, GanttConfig, TimelineView
- **`@/lib/gantt-utils`** - Utility functions for calculations
- **`@/components/ui/*`** - UI components (Card, Select, etc.)

## Core Types

```typescript
interface GanttTask {
  id: string;
  // ... other task properties
}

interface GanttConfig {
  view: TimelineView;
  startDate: Date;
  endDate: Date;
  cellWidth: number;
  rowHeight: number;
  // ... other config properties
}

type TimelineView = "daily" | "weekly";
```

## Main Gantt Component

### Props

- `tasks: GanttTask[]` - Array of tasks to display
- `className?: string` - Optional CSS classes

### State Management

- `view: TimelineView` - Controls daily/weekly timeline view
- Uses `useMemo` for performance optimization of config and timeline calculations

### Layout Structure

```
┌─────────────────────────────────────────┐
│ Card Header (Title + View Selector)     │
├─────────────────┬───────────────────────┤
│ GanttTaskList   │ Chart Area            │
│ (Task info)     │ ├─ GanttTimeline      │
│                 │ ├─ Background Grid    │
│                 │ ├─ GanttTaskBar(s)    │
│                 │ └─ TodayIndicator     │
└─────────────────┴───────────────────────┘
```

## Key Features

### 1. Responsive Timeline Views

**Daily View:**

- Each column represents one day
- Higher granularity for detailed project tracking
- Better for short-term project visualization

**Weekly View:**

- Each column represents one week
- Compressed view for longer projects
- Today indicator shows precise day within week

### 2. Persian Calendar Integration

- Uses `jalali-moment` for accurate Persian date handling
- RTL text direction support with `style={{ direction: "rtl" }}`
- Consistent date comparisons across components

### 3. Dynamic Sizing

```javascript
const config: GanttConfig = useMemo(() => {
  const dimensions = calculateGanttDimensions(tasks, view);
  return {
    view,
    ...dimensions,
  };
}, [tasks, view]);
```

- Chart width calculated as: `timelineDates.length * config.cellWidth`
- Chart height calculated as: `tasks.length * config.rowHeight`
- Minimum height of 200px for usability

### 4. Background Grid System

The component creates a visual grid using absolutely positioned divs:

**Vertical Lines (Time divisions):**

```javascript
{
  timelineDates.map((_, index) => (
    <div
      key={index}
      className="absolute top-0 bottom-0 border-l border-gray-100"
      style={{
        left: `${index * config.cellWidth}px`,
        width: "1px",
      }}
    />
  ));
}
```

**Horizontal Lines (Task separators):**

```javascript
{
  tasks.map((_, index) => (
    <div
      key={index}
      className="absolute left-0 right-0 border-b border-gray-100"
      style={{
        top: `${index * config.rowHeight}px`,
        height: "1px",
      }}
    />
  ));
}
```

## TodayIndicator Component

### Purpose

Provides visual reference for current date within the timeline.

### Positioning Logic

**Daily View:**

1. Find today's index in timeline dates using Jalali comparison
2. Position at center of today's column: `todayIndex * cellWidth + cellWidth / 2`

**Weekly View:**

1. Find which week contains today
2. Calculate day position within the week
3. Position using: `weekIndex * cellWidth + dayInWeek * (cellWidth / 7)`

### Visual Elements

- Vertical red line (`w-px h-full bg-red-500 opacity-70`)
- Red dot at top (`w-2 h-2 bg-red-500 rounded-full`)
- Positioned from right edge using `right` CSS property
- High z-index (`z-10`) to appear above task bars

## Performance Optimizations

1. **Memoized Calculations:**

   - `config` object memoized with `useMemo`
   - `timelineDates` array memoized
   - Dependencies properly declared

2. **Efficient Rendering:**

   - Background grid elements use minimal DOM structure
   - Task bars rendered as separate components for isolation

3. **Scrollable Chart Area:**
   - `overflow-x-auto` on chart container
   - Fixed-width task list, flexible chart area

## Styling & Theming

### CSS Classes Used

- **Layout:** `flex`, `overflow-hidden`, `relative`, `absolute`
- **Spacing:** `p-0`, `gap-2`, `border`
- **Colors:** `bg-white`, `border-gray-100`, `border-gray-200`
- **Today Indicator:** `bg-red-500`, `opacity-70`

### RTL Support

- Main title has `direction: "rtl"` for Persian text
- Layout uses `flex` with proper ordering for RTL compatibility

## Integration Points

### Required Utilities

- `calculateGanttDimensions(tasks, view)` - Must return config dimensions
- `generateTimelineDates(startDate, endDate, view)` - Must return date array

### Child Components

- `GanttTimeline` - Receives `config` prop
- `GanttTaskList` - Receives `tasks` and `config` props
- `GanttTaskBar` - Receives `task`, `config`, and `index` props

## Usage Example

```jsx
import Gantt from "@/components/Gantt";

function ProjectView({ projectTasks }) {
  return (
    <div className="container mx-auto p-4">
      <Gantt tasks={projectTasks} className="shadow-lg" />
    </div>
  );
}
```

## Future Enhancement Opportunities

1. **Drag & Drop:** Task bars could be made draggable to update dates
2. **Zoom Levels:** Additional timeline views (monthly, quarterly)
3. **Task Dependencies:** Visual arrows showing task relationships
4. **Progress Indicators:** Task completion percentage visualization
5. **Resource Management:** Color coding by team member or resource
6. **Export Features:** PDF/PNG export functionality
