# Fixes - 2026-04-10 Employee Panel

**Author:** Sunny

**Scope:**
Standalone continuation log for Employee Panel updates from April 10 onward.

---

## 1. CPQ Product Activation / Inactive Toggle Completion

**Issue:**
The CPQ Product Catalog exposed a `Show inactive products` toggle and displayed `Active` / `Inactive` badges, but there was no actual user-facing way to mark a product inactive or reactivate it later.

**Root Cause:**

1. The backend and CPQ hooks already supported the `is_active` field, but the Product Catalog page only consumed that state as a filter.
2. Product cards exposed only `Edit` and `Delete`, so users had no UI action to change product status.
3. The product form always submitted `is_active: true`, which meant editing an inactive product could silently reactivate it.

**Implemented Fixes:**

1. Added explicit `Deactivate` / `Activate` actions to product cards so users can control product availability directly from the catalog.
2. Updated the card action layout to accommodate the new status action cleanly alongside `Edit` and `Delete`.
3. Added a `Product Status` control to the create/edit dialog so product availability is visible and editable within the form itself.
4. Preserved the actual `is_active` value when editing an existing product instead of hard-resetting it to `true`.
5. Kept the existing `Show inactive products` toggle meaningful by connecting it to a complete status-management flow.

**Files Updated:**

- `src/modules/cpq/pages/ProductsPage.tsx`

**Outcome:**
Inactive products are now a real, user-manageable concept in CPQ rather than a half-finished backend field. Users can deactivate products they do not want offered in standard quote flows, reveal them with `Show inactive products`, and reactivate them when needed.

**Validation:**

- `npx eslint src/modules/cpq/pages/ProductsPage.tsx`

**Verification:**

- Manually verified on April 10, 2026:
  - Deactivated an active product and confirmed it disappeared from the default list
  - Enabled `Show inactive products` and confirmed the product reappeared with an `Inactive` badge
  - Reactivated the same product and confirmed it returned to the active list
  - Edited an inactive product and confirmed status stayed unchanged unless explicitly toggled

---

## 2. CPQ Add Product Dialog Viewport-Safe Redesign

**Issue:**
After the activation controls were added, the `Add New Product` dialog could extend beyond the visible viewport on smaller or shorter screens, making the bottom action harder to access.

**Root Cause:**

1. The dialog used a simple fixed-width container without a viewport height cap.
2. All form sections were rendered in one continuous layout block, so longer content pushed the modal beyond screen bounds.
3. The submit action lived at the end of the form flow, so it could fall outside immediate view when content overflowed.

**Implemented Fixes:**

1. Redesigned the dialog container as a capped viewport shell with `max-h-[90vh]`.
2. Converted the modal to a flex column structure so header, body, and footer behave as separate regions.
3. Moved form fields into an internal scrollable content zone (`overflow-y-auto`) so only the body scrolls.
4. Added a dedicated bottom action bar with border separation so the submit button stays consistently visible.
5. Improved small-screen behavior for the status control row by allowing responsive vertical stacking before switching to horizontal layout on larger screens.

**Files Updated:**

- `src/modules/cpq/pages/ProductsPage.tsx`

**Outcome:**
The product modal now stays inside the viewport, keeps input areas accessible through internal scrolling, and preserves a clear always-available primary action area for better usability.

**Validation:**

- `npx eslint src/modules/cpq/pages/ProductsPage.tsx`

**Verification:**

- Manually verified on April 10, 2026:
  - Opened `CPQ > Products` and clicked `Add Product`
  - Confirmed the modal stayed within viewport bounds
  - Confirmed only the form body scrolled while the header and submit area remained stable
  - Confirmed the submit button stayed easy to reach on shorter screens

---

## 3. CPQ Template Validity Input Backspace Behavior

**Issue:**
In `Create Quote Template`, the `Validity (Days)` field snapped back to `30` while users were still backspacing, making it hard to clear and retype the value naturally.

**Root Cause:**

1. The input handler used `Number(value || 0) || 30`, which immediately forced fallback to `30` whenever the field became temporarily empty during editing.
2. The field had no separate "raw input" state, so transient edit states (like empty string during backspace) could not be represented.

**Implemented Fixes:**

1. Added a dedicated `validityInput` string state so the field can be temporarily empty while the user edits.
2. Updated `onChange` to allow empty input without instant reset and only parse numeric values when present.
3. Added `onBlur` normalization so invalid/empty values cleanly fall back to `30` after editing ends.
4. Added save-time normalization so templates never persist invalid validity values.
5. Updated preview rendering to show `—` while the validity field is temporarily empty.

**Files Updated:**

- `src/modules/cpq/pages/CPQTemplatesHubPage.tsx`

**Outcome:**
The validity input now behaves naturally during typing and backspacing, while still enforcing a safe default (`30`) after blur or save.

**Validation:**

- `npx eslint src/modules/cpq/pages/CPQTemplatesHubPage.tsx`

**Verification:**

- Manually verified on April 10, 2026:
  - Opened `CPQ > Templates` and clicked `Create Quote Template`
  - In `Validity (Days)`, used backspace to clear `30`
  - Confirmed the input stayed clear while editing and did not snap back immediately
  - Clicked outside and confirmed it normalized to `30` when left empty
  - Entered a new value and confirmed it persisted correctly

---

## 4. CPQ Template Dialog Footer Visibility at 100% Zoom

**Issue:**
In `Create Quote Template`, the footer actions (`Cancel` and `Create Template`) were getting clipped outside the viewport at normal 100% zoom, and were only clearly visible after browser zoom-out.

**Root Cause:**

1. The dialog body layout consumed most of the available vertical space with a fixed max-height section and no true flexed middle region.
2. Footer actions were rendered below this structure, so on some screen heights the footer fell outside the visible modal area.
3. The two-column template layout needed explicit `min-h-0` + scroll boundaries to prevent internal overflow from hiding footer actions.

**Implemented Fixes:**

1. Converted the template dialog container into a viewport-capped flex column shell.
2. Made the middle content region a real `flex-1` grid area with `min-h-0` so it can shrink correctly inside the modal.
3. Updated both the form panel and live-preview panel to use internal overflow behavior inside the body region.
4. Marked the footer as `shrink-0` so action buttons remain visible and anchored.
5. Normalized a malformed validity preview placeholder character while adjusting this block.

**Files Updated:**

- `src/modules/cpq/pages/CPQTemplatesHubPage.tsx`

**Outcome:**
Template dialog action buttons remain visible at normal zoom, with content scrolling inside the modal instead of pushing footer actions out of view.

**Validation:**

- `npx eslint src/modules/cpq/pages/CPQTemplatesHubPage.tsx`

**Verification:**

- Manually verified on April 10, 2026:
  - Opened `CPQ > Templates` and clicked `Create Quote Template`
  - Confirmed `Cancel` and `Create Template` were visible at 100% zoom
  - Scrolled modal content and confirmed buttons stayed accessible
  - Confirmed behavior remained stable when browser zoom changed

---

## 5. CPQ Quote Builder Back Navigation Label

**Issue:**
In the quote builder header, the back action was shown only as a standalone arrow icon before `Create Quote`, which was easy to miss and did not clearly communicate destination.

**Root Cause:**

1. The header used an icon-only ghost button with no supporting text label.
2. The button used `navigate(-1)`, which depends on browser history and is less explicit than returning to the quotes list.

**Implemented Fixes:**

1. Moved the back action above the title block so it reads as a lightweight navigation line.
2. Added explicit button text: `Back to Quotes`.
3. Kept the left-arrow icon for quick visual recognition.
4. Updated navigation target to route directly to `cpq/quotes` via `tenantAppPath(...)`.

**Files Updated:**

- `src/modules/cpq/pages/QuoteBuilderPage.tsx`

**Outcome:**
The quote builder now shows a clearer and more intentional back affordance that is easier to spot and directly returns users to quote listing.

**Validation:**

- `npx eslint src/modules/cpq/pages/QuoteBuilderPage.tsx`

**Verification:**

- Manually verified on April 10, 2026:
  - Opened `CPQ > Quotes > Create Quote`
  - Confirmed `Back to Quotes` appears above the heading
  - Clicked it and confirmed it routes to the quotes list
