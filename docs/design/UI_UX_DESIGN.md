# UI/UX Design System - nano-Grazynka

## Design Philosophy

### Core Principles
1. **Minimalism First** - Every element must justify its existence
2. **Progressive Disclosure** - Show only what's needed, when it's needed
3. **Direct Manipulation** - Immediate feedback and clear cause-effect relationships
4. **Consistency** - Uniform patterns throughout the application
5. **Accessibility** - Clear typography, sufficient contrast, keyboard navigation

### Design Inspiration
- **Apple Human Interface Guidelines** - Clean, intuitive, and delightful
- **iOS/macOS Design Language** - Familiar patterns for users
- **Focus on Content** - UI disappears, content shines

## Visual Design System

### Color Palette

#### Primary Colors
```css
--color-primary: #007aff;        /* Apple Blue - Primary actions */
--color-background: #ffffff;     /* Pure White - Main background */
--color-surface: #f5f5f7;        /* Light Gray - Secondary surfaces */
--color-border: #d2d2d7;         /* Border Gray - Subtle borders */
```

#### Text Colors
```css
--color-text-primary: #1d1d1f;   /* Near Black - Primary text */
--color-text-secondary: #86868b; /* Gray - Secondary text */
--color-text-tertiary: #3c3c43;  /* Dark Gray - Body text */
```

#### Semantic Colors
```css
--color-success: #34c759;        /* Green - Success states */
--color-warning: #ff9500;        /* Orange - Warning states */
--color-error: #ff3b30;          /* Red - Error states */
--color-info: #5856d6;           /* Purple - Information */
```

### Typography

#### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
```

#### Type Scale
- **Hero**: 32px / 600 weight / -0.02em tracking
- **Title**: 20px / 600 weight / -0.01em tracking  
- **Body**: 15px / 400 weight / normal tracking
- **Caption**: 14px / 400 weight / normal tracking
- **Small**: 12px / 400 weight / normal tracking

### Spacing System
Based on 4px grid:
- `4px` - Micro spacing
- `8px` - Small spacing
- `12px` - Compact spacing
- `16px` - Default spacing
- `24px` - Medium spacing
- `32px` - Large spacing
- `48px` - Extra large spacing

### Border Radius
- **Small**: 6px - Buttons, inputs
- **Medium**: 8px - Cards, dropdowns
- **Large**: 12px - Modals, sheets
- **Extra Large**: 16px - Bottom sheets
- **Pill**: 24px - Floating buttons

### Shadows
```css
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
--shadow-md: 0 4px 20px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 8px 40px rgba(0, 0, 0, 0.12);
--shadow-float: 0 4px 20px rgba(0, 122, 255, 0.3);
```

## Component Patterns

### Navigation
- **Sticky Headers** - Always accessible, blur background
- **Back Navigation** - Clear return path with arrow icon
- **Overflow Menus** - Hide secondary actions behind ••• icon

### Forms
- **Single Column** - Vertical flow for better mobile experience
- **Inline Validation** - Immediate feedback on input
- **Progressive Enhancement** - Show advanced options only when needed

### Buttons

#### Primary Button
```css
.primaryButton {
  background: #007aff;
  color: white;
  padding: 12px 24px;
  border-radius: 24px;
  font-weight: 500;
  box-shadow: 0 4px 20px rgba(0, 122, 255, 0.3);
}
```

#### Secondary Button
```css
.secondaryButton {
  background: transparent;
  color: #007aff;
  padding: 10px 20px;
  border: 1px solid #d2d2d7;
  border-radius: 20px;
}
```

#### Toggle/Segmented Control
```css
.segmentedControl {
  background: #f5f5f7;
  padding: 2px;
  border-radius: 8px;
}

.segmentedControl .active {
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
```

### Cards and Containers
- **White backgrounds** with subtle borders
- **Generous padding** (24px default)
- **Clear hierarchy** through spacing, not dividers

### Modals and Sheets
- **Bottom Sheets** - Slide up from bottom (mobile pattern)
- **Centered Modals** - For desktop/tablet
- **Overlay Background** - Semi-transparent black
- **Clear Dismiss** - X button or swipe/click outside

## Interaction Patterns

### Animations
All animations use ease timing functions:
- **Fast**: 0.2s - Hover states, small transitions
- **Normal**: 0.3s - Page transitions, modal appearances
- **Slow**: 0.5s - Complex animations, redirects

#### Standard Animations
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### Loading States
- **Inline Spinners** - For button actions (RefreshCw icon with spin animation)
- **Progress Bars** - For multi-step processes
- **Skeleton Screens** - For content loading with shimmer effects
- **Processing Bars** - Gradient animated bars for active processes
- **Progressive Line Animation** - Simulating content generation with staggered fade-ins
- **Animated Dots** - "Generating..." text with cycling ellipsis

### Error Handling
- **Inline Errors** - Near the relevant field
- **Toast Notifications** - For system-level errors
- **Empty States** - Clear messaging when no content
- **Retry Options** - Always provide a way forward

## Page-Specific Designs

### Homepage
- **Hero Section** - Clear value proposition
- **Upload Area** - Prominent drop zone
- **Model Toggle** - Smart/Fast binary choice
- **Progressive Options** - Show advanced only after file selection

### Note Details Page
- **Clean Header** - Back button, title, overflow menu, Library navigation
- **Tab Navigation** - Summary/Transcription toggle
- **Content Focus** - Consistent width (1200px container)
- **Floating Actions** - Customize Summary button
- **Content Sections** - Unified card design with copy functionality
- **Smart Formatting** - Markdown rendering for summaries, intelligent paragraph detection for transcriptions

### Dashboard
- **Card Grid** - Visual hierarchy for voice notes
- **Usage Metrics** - Clear visualization of limits
- **Quick Actions** - Upload CTA always visible

## Responsive Design

### Breakpoints
- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+

### Mobile Adaptations
- **Full Width Elements** - Edge-to-edge on mobile
- **Bottom Sheets** - Replace centered modals
- **Simplified Navigation** - Hamburger menu if needed
- **Touch Targets** - Minimum 44x44px

## Accessibility

### WCAG 2.1 AA Compliance
- **Color Contrast** - 4.5:1 for normal text, 3:1 for large text
- **Focus Indicators** - Clear outline on keyboard navigation
- **ARIA Labels** - Descriptive labels for screen readers
- **Semantic HTML** - Proper heading hierarchy

### Keyboard Navigation
- **Tab Order** - Logical flow through interface
- **Escape Key** - Close modals and overlays
- **Enter Key** - Activate buttons and links
- **Arrow Keys** - Navigate between options

## Implementation Guidelines

### CSS Architecture
- **CSS Modules** - Component-scoped styles
- **No Dark Mode** - Simplified, light-only design
- **Mobile First** - Base styles for mobile, enhance for desktop

### Performance
- **Lazy Loading** - Images and heavy components
- **Code Splitting** - Route-based chunks
- **Optimized Images** - WebP with fallbacks
- **Minimal Dependencies** - Reduce bundle size

### Testing
- **Visual Regression** - Catch unintended changes
- **Cross-Browser** - Safari, Chrome, Firefox, Edge
- **Device Testing** - Real device testing for touch interactions

## Evolution Notes

### Recent Changes (2025-08-14)
1. **Removed PostTranscriptionDialog** - Simplified flow
2. **Direct-to-Results** - Auto-redirect after processing
3. **Ultra-Minimal Homepage** - Everything visible without scroll
4. **iOS-Style Controls** - Familiar patterns for users
5. **Removed Dark Mode** - Simplified maintenance
6. **Content Formatting** - Markdown rendering, copy functionality, intelligent paragraph detection
7. **Loading Experience** - Skeleton screens with shimmer, progressive animations
8. **UI Polish** - Fixed width consistency (1200px), eliminated polling flicker
9. **Enhanced Textareas** - Optimized height for template visibility (8 rows)

### Future Considerations
- **Micro-interactions** - Delightful feedback animations
- **Gesture Support** - Swipe actions for mobile
- **Offline Mode** - PWA capabilities
- **Theming** - User-customizable accent colors

## Component Library

### Reusable Components
1. **Button** - Primary, Secondary, Icon variants
2. **Input** - Text, Textarea with consistent styling
3. **Toggle** - iOS-style segmented control
4. **Card** - Container with consistent padding
5. **Modal** - Centered overlay pattern
6. **Sheet** - Bottom slide-up panel
7. **Dropdown** - Overflow menu pattern
8. **Tab** - Navigation between views
9. **Progress** - Bar and spinner variants
10. **Empty State** - Consistent no-content messaging
11. **ContentSection** - Unified content display with markdown/transcription formatting
12. **SkeletonLoader** - Progressive loading animation with shimmer effects

### Usage Examples
Each component should follow these principles:
- **Self-contained** - All styles in module
- **Accessible** - ARIA labels and keyboard support
- **Responsive** - Works on all screen sizes
- **Performant** - Minimal re-renders

## Maintenance

### Design Tokens
Consider migrating to CSS custom properties for easier theming:
```css
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
}
```

### Documentation Updates
- Screenshot new components
- Update this guide with new patterns
- Document deprecated patterns
- Add rationale for design decisions

---

*Last Updated: 2025-08-14*
*Version: 1.1*
*Status: Living Document - Update as design evolves*

### Changelog
- **v1.1 (2025-08-14)** - Added content formatting, loading animations, and UI polish improvements
- **v1.0 (2025-08-14)** - Initial comprehensive design system documentation