# FIT File Merger

A browser-based tool for merging multiple FIT files from fitness devices (Garmin, Polar, Suunto) into a single file, with all processing done client-side for zero server costs and maximum privacy.

**Experience Qualities**:
1. **Effortless** - Upload files, merge instantly, download the result without complexity
2. **Trustworthy** - All processing happens in the browser, no data leaves the user's device
3. **Professional** - Clean interface that respects the user's time and technical files

**Complexity Level**: Light Application (multiple features with basic state)
This is a focused tool with file upload, parsing, merging logic, and download capabilities. It requires state management for uploaded files and merge configuration but doesn't need multiple views or complex workflows.

## Essential Features

### File Upload Zone
- **Functionality**: Drag-and-drop or click-to-browse file upload accepting multiple .fit files
- **Purpose**: Primary entry point for users to add FIT files they want to merge
- **Trigger**: User drags files onto the drop zone or clicks the upload button
- **Progression**: Idle state → Hover state (drag over) → Processing → Files added to list with metadata display
- **Success criteria**: Files are parsed successfully, metadata displayed (activity type, duration, date), errors shown for invalid files

### File List Management
- **Functionality**: Display uploaded files with key metadata, allow reordering and removal
- **Purpose**: Give users visibility and control over which files will be merged and in what order
- **Trigger**: Files successfully uploaded
- **Progression**: Files listed → User can drag to reorder → Click remove icon → File removed from list
- **Success criteria**: File order persists, metadata is accurate, removing files updates the merge preview

### Merge Configuration
- **Functionality**: Options for how to merge files (chronological order, preserve all data points, handle overlaps)
- **Purpose**: Give users control over merge behavior for different use cases
- **Trigger**: At least 2 files uploaded
- **Progression**: Default settings applied → User adjusts options → Preview updates → Merge button enabled
- **Success criteria**: Settings clearly explained, preview shows result file properties, merge respects selected options

### Merge & Download
- **Functionality**: Merge files according to configuration and download the result
- **Purpose**: Core value delivery - produce the merged FIT file
- **Trigger**: User clicks "Merge & Download" button
- **Progression**: Button clicked → Processing indicator → File generated → Browser download triggered → Success message
- **Success criteria**: Merged file is valid, opens in fitness apps, contains all data from source files, download completes successfully

## Edge Case Handling

- **No files uploaded** - Show empty state with clear instructions and visual cues for upload action
- **Single file uploaded** - Disable merge button, show message that at least 2 files are required
- **Invalid file format** - Display error message per file, allow user to remove and try again
- **Corrupted FIT data** - Show parsing errors with file name, allow partial merge of valid files
- **Very large files** - Show processing indicator, handle memory efficiently with streaming where possible
- **Duplicate files** - Detect and warn user, allow them to proceed or remove duplicates

## Design Direction

The design should evoke confidence and technical precision while remaining approachable. It should feel like a professional developer tool that respects the user's technical workflow - clean, efficient, and distraction-free. The interface should communicate data integrity and reliability through structured layouts and clear visual feedback.

## Color Selection

A technical, focused palette with high contrast for clarity and data-oriented feel.

- **Primary Color**: Deep indigo `oklch(0.35 0.15 265)` - Communicates technical precision and reliability, used for primary actions
- **Secondary Colors**: Slate gray `oklch(0.45 0.02 250)` for secondary UI elements; Cool gray `oklch(0.65 0.01 250)` for supporting text
- **Accent Color**: Electric cyan `oklch(0.75 0.15 195)` - High-tech feel for active states, progress indicators, and success feedback
- **Foreground/Background Pairings**: 
  - Primary (Deep Indigo): White text `oklch(0.98 0 0)` - Ratio 7.8:1 ✓
  - Accent (Electric Cyan): Deep slate `oklch(0.15 0.02 250)` - Ratio 8.2:1 ✓
  - Background (Soft white `oklch(0.98 0 0)`): Dark text `oklch(0.15 0.02 250)` - Ratio 15.1:1 ✓
  - Muted (Light gray `oklch(0.92 0.01 250)`): Medium text `oklch(0.45 0.02 250)` - Ratio 4.9:1 ✓

## Font Selection

Typography should communicate technical precision while remaining highly readable for both headers and data displays.

**Primary Font**: Space Grotesk - A geometric sans-serif with technical character that works well for both UI text and data display

- **Typographic Hierarchy**:
  - H1 (Page Title): Space Grotesk Bold/32px/tight letter-spacing (-0.02em)
  - H2 (Section Headers): Space Grotesk Semibold/20px/normal letter-spacing
  - Body (UI Text): Space Grotesk Regular/16px/normal letter-spacing
  - Small (Metadata): Space Grotesk Regular/14px/slightly wide letter-spacing (0.01em)
  - Buttons: Space Grotesk Medium/16px/normal letter-spacing

## Animations

Animations should reinforce successful actions and provide clarity during processing states, with purposeful feedback that feels responsive rather than decorative.

- **File upload**: Smooth fade-in and slide-up for each file added to the list (200ms ease-out)
- **Drag reordering**: Follow cursor with slight elevation shadow, smooth position transitions when dropped (300ms spring)
- **Processing states**: Pulsing indicator for parsing/merging operations, shimmer effect on loading states
- **Success feedback**: Quick scale-up pulse (150ms) on successful merge, followed by gentle fade-in of download prompt
- **Error states**: Subtle shake animation (250ms) for invalid files, red highlight fade-in

## Component Selection

- **Components**:
  - `Card` - For file list items showing metadata with hover states
  - `Button` - Primary merge action, secondary remove/upload actions
  - `Progress` - Visual feedback during file processing
  - `Alert` - Error messages and informational notices
  - `Badge` - Activity type indicators, file status labels
  - `Separator` - Visual division between upload zone and file list
  - `Tooltip` - Contextual help for merge options
  - `Switch` - Toggle merge options
  
- **Customizations**:
  - Custom drag-and-drop zone with dashed border and animated hover state
  - Custom file list item with drag handle, metadata grid, and remove action
  - Custom merge configuration panel with clear option descriptions
  
- **States**:
  - Upload zone: Default (dashed border) → Drag over (solid border, accent background) → Uploading (progress bar)
  - File cards: Default → Hover (elevated shadow) → Dragging (opacity 0.7, follow cursor)
  - Merge button: Disabled (muted) → Enabled (primary) → Loading (spinner) → Success (checkmark pulse)
  - Remove buttons: Ghost (transparent) → Hover (red background)
  
- **Icon Selection**:
  - `UploadSimple` - Upload action
  - `FilePlus` - Add more files
  - `Trash` - Remove file
  - `DotsSixVertical` - Drag handle
  - `DownloadSimple` - Download merged file
  - `CheckCircle` - Success state
  - `Warning` - Error state
  - `Clock` - Duration metadata
  - `CalendarBlank` - Date metadata
  
- **Spacing**:
  - Page padding: `p-6` on mobile, `p-8` on desktop
  - Card spacing: `gap-4` for internal elements, `space-y-3` for file list
  - Button padding: `px-6 py-3` for primary, `px-4 py-2` for secondary
  - Section margins: `mt-8` between major sections
  
- **Mobile**:
  - Stack upload zone and file list vertically
  - Full-width cards with reduced padding
  - Larger touch targets for drag handles (48px minimum)
  - Simplified metadata display (2-column grid instead of 4)
  - Fixed merge button at bottom of screen when files are ready
