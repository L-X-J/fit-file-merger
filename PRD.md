# FIT File Merger

A browser-based tool for merging multiple FIT files from fitness devices (Garmin, Polar, Suunto) into a single file, with all processing done client-side for zero server costs and maximum privacy.

**Experience Qualities**:
1. **Fluid and Intuitive** - Apple-inspired interactions with smooth animations and effortless flow from step to step
2. **Refined and Minimal** - Clean, spacious design with subtle depth and purposeful use of color
3. **Trustworthy** - All processing happens in the browser, no data leaves the user's device

**Complexity Level**: Light Application (multiple features with basic state)
This is a focused tool with file upload, parsing, merging logic, and download capabilities presented in a 3-step guided workflow. It requires state management for uploaded files and merge configuration with smooth transitions between states.

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

The design should evoke Apple's signature minimalism and attention to detail - clean, spacious, and refined. Every interaction should feel smooth and intentional with fluid animations and subtle depth. The interface should inspire confidence through its polish and simplicity, making technical file operations feel elegant and approachable.

## Color Selection

An Apple-inspired palette with soft neutrals and a vibrant primary for a refined, modern feel.

- **Primary Color**: Vivid blue `oklch(0.45 0.20 255)` - Apple's signature blue, used for primary actions and active states
- **Secondary Colors**: Ultra-light gray `oklch(0.96 0.005 250)` for secondary surfaces and subtle backgrounds
- **Background**: Near-white `oklch(0.99 0 0)` - Clean, spacious canvas that lets content breathe
- **Foreground/Background Pairings**: 
  - Primary (Vivid Blue): White text `oklch(1 0 0)` - Ratio 8.5:1 ✓
  - Background (Near-white): Dark text `oklch(0.18 0 0)` - Ratio 16.2:1 ✓
  - Muted (Light gray): Medium text `oklch(0.52 0.01 250)` - Ratio 5.1:1 ✓
  - Card surfaces (White): Dark text `oklch(0.18 0 0)` - Ratio 17.5:1 ✓

## Font Selection

Typography should communicate Apple's refined simplicity with exceptional readability and subtle hierarchy.

**Primary Font**: Inter - A modern humanist sans-serif optimized for UI with excellent readability at all sizes, similar to Apple's San Francisco

- **Typographic Hierarchy**:
  - H1 (Page Title): Inter Semibold/32px/tight tracking
  - H2 (Section Headers): Inter Semibold/24px/tight tracking
  - H3 (Card Headers): Inter Semibold/18px/normal tracking
  - Body (UI Text): Inter Regular/15px/normal tracking
  - Small (Metadata): Inter Regular/13px/normal tracking
  - Buttons: Inter Medium/15px/normal tracking

## Animations

Animations should feel natural and fluid, inspired by Apple's physics-based motion design with easing curves that mimic real-world momentum.

- **Page transitions**: Smooth fade and slide (300ms ease-out) when moving between steps
- **File upload**: Gentle slide-up and fade-in (300ms ease-out) with staggered delay for multiple items
- **Hover states**: Subtle lift (2px translateY) with soft shadow expansion (200ms ease-out)
- **Button interactions**: Scale feedback (0.99 on press) with spring physics
- **Progress indicators**: Smooth rotation for loading spinners, gentle pulse for waiting states
- **Success states**: Spring-based scale-up (from 0.95 to 1) with bounce, checkmark reveal
- **Cards**: Gentle hover elevation with border color transition
- **Step indicators**: Smooth scale and color transitions with checkmark morph on completion

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
