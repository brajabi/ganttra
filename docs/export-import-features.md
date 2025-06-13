# Export/Import Features

This document describes the export and import functionality added to the Gantt chart application.

## Features Overview

### 1. JSON Export/Import

- **Purpose**: Save complete project data including tasks, groups, and project information
- **Use Case**: Data backup, sharing projects, migration between environments
- **Format**: Structured JSON with versioning support

### 2. Markdown Export

- **Purpose**: Generate human-readable project documentation
- **Use Case**: Reporting, documentation, sharing with stakeholders
- **Format**: Markdown with Persian (Jalali) date formatting

## Available Operations

### Export Options (Project Page)

#### JSON Export

- **Location**: Project detail page header
- **Button**: "JSON خروجی" (JSON Export)
- **Output**: Downloads a `.json` file containing:
  - Project metadata (name, description, dates)
  - All tasks with start/end dates, colors, progress
  - All groups with organization structure
  - Export timestamp and version

#### Markdown Export

- **Location**: Project detail page header
- **Button**: "Markdown خروجی" (Markdown Export)
- **Output**: Downloads a `.md` file containing:
  - Project title and description
  - Tasks organized by groups (if any)
  - Ungrouped tasks in separate section
  - Each task formatted as: `- **Task Name** (start-date - end-date)`
  - Project summary statistics

### Import Options

#### JSON Import (Project Page)

- **Location**: Main homepage in quick actions
- **Button**: "وارد کردن پروژه" (Import Project)
- **Input**: Accepts `.json` files exported from the application
- **Behavior**:
  - Validates file format
  - Creates new project with imported data
  - Navigates to imported project automatically

#### JSON Import (Within Project)

- **Location**: Project detail page header
- **Button**: "JSON وارد کردن" (Import JSON)
- **Input**: Accepts `.json` files
- **Behavior**:
  - Imports data into current workspace
  - Overwrites current project data

## Technical Implementation

### File Structure

```
lib/
├── export-utils.ts     # Export/import utility functions
├── store.ts           # Updated with import functionality
└── types.ts          # Existing type definitions

app/
├── page.tsx          # Main page with import button
└── project/[id]/page.tsx  # Project page with export/import buttons
```

### Data Format (JSON Export)

```json
{
  "project": {
    "id": "project-id",
    "name": "Project Name",
    "description": "Optional description",
    "createdAt": "ISO-date",
    "updatedAt": "ISO-date"
  },
  "tasks": [
    {
      "id": "task-id",
      "title": "Task Title",
      "startDate": "ISO-date",
      "endDate": "ISO-date",
      "progress": 0,
      "color": "#hex-color",
      "projectId": "project-id",
      "groupId": "optional-group-id"
    }
  ],
  "groups": [
    {
      "id": "group-id",
      "title": "Group Title",
      "projectId": "project-id",
      "color": "#hex-color",
      "isExpanded": true,
      "createdAt": "ISO-date"
    }
  ],
  "exportDate": "ISO-date",
  "version": "1.0.0"
}
```

### Error Handling

- File format validation
- Persian error messages for user feedback
- Graceful handling of corrupted files
- Progress indication during import/export

## User Interface

### Persian/RTL Support

- All buttons and labels in Persian
- Right-to-left layout support
- Jalali calendar formatting in exports

### Button Placement

- **Main Page**: Import button in quick actions section
- **Project Page**: Export/import buttons grouped with print button
- File input hidden with custom button styling

### User Feedback

- Success alerts in Persian
- Error messages with helpful context
- Loading states during operations

## Usage Examples

### Creating a Backup

1. Open project detail page
2. Click "JSON خروجی" button
3. File downloads automatically with safe filename

### Sharing Project Documentation

1. Open project with tasks
2. Click "Markdown خروجی" button
3. Share downloaded `.md` file with stakeholders

### Restoring from Backup

1. Go to homepage
2. Click "وارد کردن پروژه" button
3. Select previously exported `.json` file
4. Project loads automatically

## Security Considerations

- File type validation (`.json` only for imports)
- Client-side processing (no server upload)
- Safe filename generation
- Input sanitization for imported data

## Future Enhancements

- Bulk export of multiple projects
- CSV export format
- PDF export with Gantt chart visualization
- Import from other project management tools
