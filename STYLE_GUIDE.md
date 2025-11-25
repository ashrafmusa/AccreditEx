# AccreditEx: UI & Graphics Style Guide

## 1. Design Philosophy

The design of AccreditEx is guided by three core principles: **Clarity**, **Professionalism**, and **Efficiency**. The user interface is crafted to be clean, intuitive, and data-driven, allowing healthcare professionals to manage complex accreditation processes with ease and confidence.

-   **Clarity**: The UI prioritizes scannable layouts, a clear visual hierarchy, and ample white space to reduce cognitive load. Information is presented in a structured and digestible format.
-   **Professionalism**: The aesthetic is modern and trustworthy, utilizing a controlled color palette, crisp typography, and subtle animations. It is designed to feel like a serious, enterprise-grade tool.
-   **Efficiency**: The design supports user workflows. Interactive elements are responsive, and key actions are always accessible. Features like the command palette and clear navigation are implemented to speed up user tasks.

---

## 2. Color Palette

The color system is built using CSS variables to ensure consistency and easy theming for both light and dark modes.

| Role                  | Variable Name              | Light Mode (`#HEX`) | Dark Mode (`#HEX`)  | Usage                                                                 |
| --------------------- | -------------------------- | ------------------- | ------------------- | --------------------------------------------------------------------- |
| **Primary**           | `--brand-primary-color`    | `#4f46e5` (Indigo)  | `#818cf8` (Indigo)  | Main actions, buttons, links, active states, highlights.              |
| **Surface**           | `--color-surface`          | `#ffffff` (White)   | `#1e293b` (Slate)   | Background for cards, modals, and primary content areas.              |
| **Background**        | `--color-background`       | `#f8fafc` (Slate)   | `#020617` (Slate)   | The main body background of the application.                          |
| **Border**            | `--color-border`           | `#e2e8f0` (Slate)   | `#334155` (Slate)   | Borders for cards, inputs, and dividers.                              |
| **Primary Text**      | `--color-text-primary`     | `#0f172a` (Slate)   | `#e2e8f0` (Slate)   | Headings and primary content text.                                    |
| **Secondary Text**    | `--color-text-secondary`   | `#64748b` (Slate)   | `#94a3b8` (Slate)   | Subheadings, descriptions, labels, and less important text.         |
| **Success**           | (Direct)                   | `#22c55e` (Green)   | `#4ade80` (Green)   | Success messages, compliant statuses, positive indicators.            |
| **Warning**           | (Direct)                   | `#f97316` (Orange)  | `#fb923c` (Orange)  | Warnings, 'in progress' statuses, items needing attention.          |
| **Error / Danger**    | (Direct)                   | `#ef4444` (Red)     | `#f87171` (Red)     | Error messages, non-compliant statuses, destructive actions.          |

---

## 3. Typography

A system-native font stack is used for optimal performance and a familiar feel across different operating systems.

-   **Font Family**: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif`
-   **Scale**: A responsive and consistent typographic scale is used via Tailwind CSS classes:
    -   **Page Headers (`h1`)**: `text-3xl font-bold` (36px)
    -   **Card/Section Titles (`h2`)**: `text-xl font-semibold` (24px)
    -   **Sub-titles (`h3`)**: `text-lg font-semibold` (20px)
    -   **Body Text**: `text-sm` (14px) or `text-base` (16px) for prose.
    -   **Labels & Captions**: `text-xs` (12px) or `text-sm` (14px)

---

## 4. Layout & Spacing

-   **Main Layout**: A three-part structure: a collapsible **Navigation Rail** on the left, a fixed **Header** at the top, and a scrollable **Main Content** area. This provides persistent navigation and context.
-   **Responsiveness**: On smaller screens (`< 640px`), the navigation rail is hidden and accessible via a "hamburger" menu, creating a **Mobile Sidebar** that overlays the content.
-   **Spacing**: A consistent spacing scale based on multiples of `4px` (`0.25rem`) is used for all padding, margins, and gaps to create a harmonious rhythm. Common values are `p-4`, `p-6`, `gap-6`.

---

## 5. Component Styling

-   **Cards**: The primary container for content. Styled with `rounded-xl`, a subtle `shadow-sm`, and a `1px` border (`border-brand-border`). On hover, they lift slightly (`-translate-y-1`) and the shadow intensifies (`shadow-lg`) to provide clear visual feedback.
-   **Buttons**:
    -   **Primary**: Solid `brand-primary` background, white text, rounded corners (`rounded-lg`), and a subtle shadow. Used for the main call-to-action.
    -   **Secondary**: White/transparent background with a `brand-border`. Used for secondary actions like "Cancel".
    -   **Icon Buttons**: Circular or square with a transparent background that gains a light gray fill on hover (`hover:bg-slate-100`).
-   **Forms**: Inputs, selects, and textareas share a unified style: `1px` solid `brand-border`, `rounded-md`, and a distinct blue focus ring (`focus:ring-brand-primary`) for accessibility.
-   **Modals**: Appear with a backdrop blur effect. The modal content animates in with a subtle scale and fade (`scaleIn`, `fadeIn`) to draw the user's attention without being jarring.

---

## 6. Graphics & Imagery

The application uses graphics sparingly to maintain a professional and uncluttered interface.

### A. Logo

The **AccreditEx logo** is a stylized hexagon, representing structure, strength, and interconnectedness. Its clean, sharp lines convey precision and professionalism. The use of the primary brand color reinforces identity.

### B. Icons

A consistent set of outline-style icons (based on Heroicons) is used throughout the application.
-   **Style**: Thin stroke (`stroke-width: 1.5`), clean lines, and easily recognizable metaphors.
-   **Color**: `brand-text-secondary` for informational icons and `brand-primary` or semantic colors (red, green) for interactive or status-related icons.
-   **Usage**: Icons are always paired with text labels or used in universally understood contexts (e.g., a trash can for delete) to ensure clarity.

### C. Login Page Globe

The login page features a prominent, interactive 3D globe (`cobe`) to create a visually engaging and modern first impression.
-   **Purpose**: To evoke a sense of global standards, connectivity, and a high-tech platform.
-   **Style**: It is rendered with a dark, professional base color (`darkness: 0.9`), a subtle glow, and pulsing markers that highlight key global healthcare hubs. The user's own location is marked with a more prominent pulse.
-   **Customization**: The globe's appearance (colors, scale, rotation speed) is fully customizable via the Admin settings, allowing organizations to align it with their branding.

### D. Data Visualizations

Charts and graphs (`Recharts`) are styled to be clean, readable, and consistent with the application's color palette.
-   **Colors**: The `brand-primary` color is used for the main data series. Semantic colors are used where appropriate (e.g., red for "Failures," green for "Pass").
-   **Tooltips**: Custom-styled tooltips with a blurred background provide detailed information on hover without cluttering the chart.
-   **Readability**: Clear axes, legends, and sufficient spacing are prioritized.

---

## 7. Dark Mode

Dark Mode is a first-class citizen in AccreditEx. It's designed to reduce eye strain in low-light environments.
-   **Palette**: Instead of a pure black, it uses a palette of dark slate grays (`#020617`, `#1e293b`). This reduces harsh contrast.
-   **Text**: Primary text is a slightly off-white (`#e2e8f0`) rather than pure white to soften the appearance.
-   **Primary Color**: The primary action color is a lighter, more accessible shade of indigo (`#818cf8`) to ensure it stands out against the dark backgrounds.

---

## 8. Animations & Transitions

Subtle animations are used to enhance the user experience by providing feedback and guiding the eye.
-   **Page Transitions**: Content fades in and slides up slightly (`fadeInUp`) on navigation.
-   **Hover Effects**: Cards lift, and buttons and links change color or background smoothly (`transition-colors`, `duration-200`).
-   **State Changes**: Icons rotate (e.g., `ChevronDownIcon` in accordions) to indicate a change in state.
-   **Modal Entry**: Modals and their backdrops fade in, with the content scaling up slightly for a gentle entry.
-   **Loading States**: `pulse` animations are used on skeletons to provide a non-intrusive loading indicator. Spinners are reserved for explicit actions like form submissions.
