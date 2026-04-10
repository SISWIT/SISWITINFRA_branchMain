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

---

## 6. CRM Leads Dialog Placeholder & Guidance Upgrade

**Issue:**
The CRM leads create/edit dialog had minimal guidance and no placeholders on most fields, which made quick lead entry less intuitive than the newer CPQ forms.

**Root Cause:**

1. Most lead inputs rendered with labels only and no example values.
2. The dialog header lacked contextual guidance for what data quality was expected.
3. `job_title` existed in form state but was not exposed as an editable field in the dialog.

**Implemented Fixes:**

1. Added a dialog description to explain the purpose of the form and improve first-time usability.
2. Added placeholders for first name, last name, email, phone, company, and description.
3. Added the missing `Job Title` input to match the existing lead form data model.
4. Added semantic input ids and type hints (`email`, `tel`) for better clarity and consistency.
5. Kept existing submit behavior and validation flow unchanged.

**Files Updated:**

- `src/modules/crm/pages/LeadsPage.tsx`

**Outcome:**
CRM lead creation/editing now has clearer, CPQ-style form guidance and better field affordances for faster, less error-prone data entry.

**Validation:**

- `npx eslint src/modules/crm/pages/LeadsPage.tsx`

**Verification:**

- Manually verified on April 10, 2026:
  - Opened `CRM > Leads`
  - Clicked `Add Lead`
  - Confirmed placeholders appear across lead fields
  - Confirmed `Job Title` field is visible and editable
  - Confirmed create/update flow still works normally

---

## 7. CRM Leads Dialog Viewport-Safe Modal Redesign

**Issue:**
After the Leads dialog guidance upgrade, the modal body could extend beyond the visible viewport at normal zoom, making the primary action area hard to access.

**Root Cause:**

1. The dialog used a simple fixed-width shell without viewport height capping.
2. The content was rendered as a single continuous block with no internal scroll region.
3. Footer actions could drift outside immediate view on shorter screen heights.

**Implemented Fixes:**

1. Reworked the Leads dialog to use the same shell pattern as CPQ Product modal:
   - capped viewport dialog container
   - fixed header
   - scrollable form body
   - pinned footer action region
2. Converted the dialog content into a proper `<form>` with submit handling so keyboard submit behavior remains intact.
3. Kept the primary action visible with a full-width bottom button (`Create Lead` / `Update Lead`) to match the CPQ modal style.

**Files Updated:**

- `src/modules/crm/pages/LeadsPage.tsx`

**Outcome:**
The CRM Leads modal now stays within the viewport and keeps the primary action consistently accessible, matching the viewport-safe behavior used in CPQ.

**Validation:**

- `npx eslint src/modules/crm/pages/LeadsPage.tsx`

**Verification:**

- Manually verified on April 10, 2026:
  - Opened `CRM > Leads`
  - Clicked `Add Lead`
  - Confirmed modal stayed fully within viewport at 100% zoom
  - Confirmed only the body scrolled and the action button stayed visible at the bottom

---

## 8. CRM Leads Full Details View Dialog

**Issue:**
The leads list only displayed a small subset of lead fields (name, company, email, status, source, created date), making it hard to review full lead context without entering edit mode.

**Root Cause:**

1. Leads list presentation was intentionally compact, but no dedicated read-only details surface existed.
2. Row actions did not include a `View` affordance for full lead profile inspection.

**Implemented Fixes:**

1. Added a dedicated `Lead Details` modal with a viewport-safe layout (fixed header, scrollable body, pinned footer).
2. Added a `View` action in each row’s action dropdown menu.
3. Enabled row click to open the same details modal for faster access.
4. Added stop-propagation guards on action-menu controls so menu interactions do not trigger accidental row-open behavior.
5. Included full read-only lead details in the modal:
   - status and source badges
   - email, phone, company, job title
   - created and updated dates
   - full description
6. Added an `Edit Lead` shortcut button inside the details modal.

**Files Updated:**

- `src/modules/crm/pages/LeadsPage.tsx`

**Outcome:**
Users can now inspect complete lead information without entering edit mode, either from an explicit `View` action or by tapping/clicking the lead row.

**Validation:**

- `npx eslint src/modules/crm/pages/LeadsPage.tsx`

**Verification:**

- Manually verified on April 10, 2026:
  - Opened `CRM > Leads`
  - Clicked a lead row and confirmed full details modal opened
  - Opened action menu and clicked `View` and confirmed same modal opened
  - Clicked `Edit Lead` from details modal and confirmed edit dialog opened correctly

---

## 9. CRM Accounts Dialog Viewport-Safe Scroll Fix

**Issue:**
The `Add Account` dialog could overflow the viewport and fail to scroll reliably on normal zoom, making lower sections hard to access.

**Root Cause:**

1. The accounts dialog shell did not fully use the same viewport-safe flex modal structure as the fixed Leads/CPQ dialogs.
2. The body scroll region lacked consistent `min-h-0` flex constraints, so overflow behavior could break depending on screen height.

**Implemented Fixes:**

1. Converted the accounts modal to a viewport-capped flex column shell.
2. Wrapped modal content in a proper `<form>` layout with a constrained scrollable body region.
3. Added `min-h-0` + `flex-1` to enforce internal scrolling instead of viewport overflow.
4. Kept footer actions pinned with `shrink-0` while preserving existing `Cancel` and `Create/Update Account` actions.
5. Switched submit flow to form submit (`type="submit"`) for consistent keyboard and button behavior.

**Files Updated:**

- `src/modules/crm/pages/AccountsPage.tsx`

**Outcome:**
`Add Account` now behaves like the fixed modal pattern: stable header/footer with a reliably scrollable body inside viewport bounds.

**Validation:**

- `npx eslint src/modules/crm/pages/AccountsPage.tsx src/modules/crm/pages/LeadsPage.tsx`

**Verification:**

- Manually verified on April 10, 2026:
  - Opened `CRM > Accounts`
  - Clicked `Add Account`
  - Confirmed modal stayed inside viewport at 100% zoom
  - Confirmed body scrolled through all sections and footer remained accessible

---

## 10. CRM Accounts Full Details View Dialog

**Issue:**
The accounts table showed a compact summary only, with no dedicated read-only detail surface for reviewing full account information quickly.

**Root Cause:**

1. Accounts list prioritized concise columns, but there was no `View` flow for full account context.
2. Row interactions did not expose a quick-details experience comparable to the new Leads details pattern.

**Implemented Fixes:**

1. Added a `View` action in each account row dropdown.
2. Enabled account row click to open a full `Account Details` dialog.
3. Added a viewport-safe details modal with fixed header, scrollable body, and pinned footer actions.
4. Included detailed account profile data in the view:
   - account name and industry
   - website shortcut
   - contact fields (email/phone)
   - annual revenue and employee count
   - full address
   - description
5. Added `Edit Account` shortcut in the details modal for quick transition to edit mode.
6. Added stop-propagation guards on dropdown interactions to avoid accidental row-open conflicts.

**Files Updated:**

- `src/modules/crm/pages/AccountsPage.tsx`

**Outcome:**
Users can now inspect complete account details in one click (menu or row tap) without jumping directly into edit mode, matching the improved CRM details flow introduced for Leads.

**Validation:**

- `npx eslint src/modules/crm/pages/AccountsPage.tsx`

**Verification:**

- Manually verified on April 10, 2026:
  - Opened `CRM > Accounts`
  - Clicked an account row and confirmed details modal opened
  - Opened action menu and clicked `View` and confirmed same modal opened
  - Clicked `Edit Account` from details modal and confirmed edit dialog opened correctly

---

## 11. CRM Contacts Full Details View + Accounts/Contacts Dialog Guidance

**Issue:**
Contacts still lacked the same full-details workflow introduced for Leads and Accounts, and Add Account/Add Contact dialog headers needed clearer helper guidance text.

**Root Cause:**

1. Contacts had no dedicated `View` action or read-only details surface.
2. Contacts table row click did not open any details context.
3. Add Account and Add Contact dialogs lacked lead-style contextual descriptions under the modal title.

**Implemented Fixes:**

1. Added `View` action to Contacts row menu.
2. Enabled Contacts row click to open a full `Contact Details` dialog.
3. Added viewport-safe `Contact Details` modal with:
   - fixed header
   - scrollable body
   - pinned footer actions (`Close` / `Edit Contact`)
4. Added detailed contact information blocks in the details modal:
   - full name
   - job title and department
   - email and phone
   - linked account name
   - added date
   - notes/description
5. Added stop-propagation guards on Contacts action menu buttons to avoid accidental row-open collisions.
6. Added helper description text under `Add Account` / `Edit Account` dialog titles.
7. Added helper description text under `Add Contact` / `Edit Contact` dialog titles.

**Files Updated:**

- `src/modules/crm/pages/ContactsPage.tsx`
- `src/modules/crm/pages/AccountsPage.tsx`

**Outcome:**
Contacts now match the improved CRM details flow (Leads/Accounts), and both Account and Contact create/edit dialogs now provide clearer context for data entry quality.

**Validation:**

- `npx eslint src/modules/crm/pages/AccountsPage.tsx src/modules/crm/pages/ContactsPage.tsx`

**Verification:**

- Manually verified on April 10, 2026:
  - Opened `CRM > Contacts`
  - Clicked a contact row and confirmed details modal opened
  - Opened action menu and clicked `View` and confirmed same modal opened
  - Clicked `Edit Contact` from details modal and confirmed edit dialog opened
  - Opened `Add Account` and `Add Contact` and confirmed helper description text appears under each modal title

---

## 12. CRM Add Contact Dialog Viewport-Safe Scroll Fix

**Issue:**
The `Add Contact` / `Edit Contact` dialog was not reliably scrollable on normal zoom, causing lower fields and actions to become hard to access on shorter viewports.

**Root Cause:**

1. The modal shell used a fixed-height container but was not configured as a flex column layout.
2. The intended scrollable body region did not have the required parent flex constraints (`min-h-0` + `flex-1`) to guarantee internal scrolling.
3. Footer actions were not wrapped in a form structure, which made keyboard submit behavior less consistent.

**Implemented Fixes:**

1. Converted the contact dialog to a viewport-capped flex shell (`max-h-[90vh]`, `flex-col`, `overflow-hidden`).
2. Wrapped content in a proper form container (`flex min-h-0 flex-1 flex-col`) and moved submit handling to `onSubmit`.
3. Updated the body to a true internal scroll region (`min-h-0 flex-1 overflow-y-auto`) so only the form body scrolls.
4. Kept the footer pinned with `shrink-0`, using explicit button types (`type="button"` for cancel, `type="submit"` for save).
5. Normalized contact details secondary text separator to ASCII-safe formatting (`job title | department`).

**Files Updated:**

- `src/modules/crm/pages/ContactsPage.tsx`

**Outcome:**
The Contact create/edit modal now behaves consistently with the fixed Accounts/Leads/CPQ modal pattern: header and footer stay stable while the form body scrolls inside the dialog.

**Validation:**

- `npx eslint src/modules/crm/pages/ContactsPage.tsx`

**Verification:**

- Manually verified on April 11, 2026:
  - Opened `CRM > Contacts`
  - Clicked `Add Contact`
  - Confirmed the modal stayed inside viewport at 100% zoom
  - Confirmed only the form body scrolled and footer actions remained accessible

---

## 13. CRM New Opportunity Dialog Viewport-Safe Scroll Redesign

**Issue:**
The `New Opportunity` / `Edit Opportunity` dialog still used the old modal layout, which could overflow on shorter viewports and make lower fields/actions harder to access.

**Root Cause:**

1. The dialog shell was not viewport-capped with a flex column structure.
2. Form content was rendered as a single block without a constrained internal scroll region.
3. Footer actions were not pinned as a dedicated non-scrolling region.

**Implemented Fixes:**

1. Converted the Opportunity dialog to a viewport-safe shell (`max-h-[90vh]`, `flex-col`, `overflow-hidden`).
2. Added a contextual helper description under the dialog title to match the updated CRM modal pattern.
3. Wrapped fields in a proper form layout (`flex min-h-0 flex-1 flex-col`) and moved submit behavior to `onSubmit`.
4. Added a dedicated scrollable body region (`min-h-0 flex-1 overflow-y-auto`) so only form content scrolls.
5. Pinned footer actions with `shrink-0` and explicit button types for consistent click/keyboard submission behavior.

**Files Updated:**

- `src/modules/crm/pages/OpportunitiesPage.tsx`

**Outcome:**
Opportunity create/edit now follows the same stable CRM modal UX as Accounts and Contacts: fixed header, internal form scroll, and always-accessible footer actions.

**Validation:**

- `npx eslint src/modules/crm/pages/OpportunitiesPage.tsx`

**Verification:**

- Manually verified on April 11, 2026:
  - Opened `CRM > Opportunities`
  - Clicked `Add Opportunity`
  - Confirmed modal stayed within viewport at 100% zoom
  - Confirmed the body scrolled while footer actions remained visible

---

## 14. CRM Activities Modal + Details View Upgrade

**Issue:**
The Activities page still used the older interaction model: add/edit modal without viewport-safe internal scrolling and no dedicated read-only details view.

**Root Cause:**

1. `New Activity` / `Edit Activity` dialog was not using the fixed header + scrollable body + pinned footer shell.
2. Activities table offered only `Edit` and `Delete` actions, with no `View` details flow.
3. Row click behavior did not open a detail surface for quick read-only review.

**Implemented Fixes:**

1. Converted the add/edit activity dialog to a viewport-safe shell (`max-h-[90vh]`, `flex-col`, `overflow-hidden`).
2. Added a dialog description to match the CRM helper-guidance pattern used in Leads/Contacts/Opportunities.
3. Wrapped activity form in a true form layout with `onSubmit` handling and `min-h-0 flex-1` container.
4. Moved input area into an internal scroll region (`overflow-y-auto`) while keeping footer actions pinned.
5. Added `View` action to activity row dropdown menu.
6. Enabled row click to open the same `Activity Details` modal.
7. Added full `Activity Details` modal with:
   - subject + type badge
   - completion state badge
   - priority, due date, created date
   - full description/notes
   - quick `Edit Activity` shortcut
8. Added stop-propagation guards on action menu interactions to avoid row-click conflicts.

**Files Updated:**

- `src/modules/crm/pages/ActivitiesPage.tsx`

**Outcome:**
Activities now follows the same modern CRM UX flow as the other pages: stable add/edit modal behavior and a dedicated full-details experience from both row click and action menu.

**Validation:**

- `npx eslint src/modules/crm/pages/ActivitiesPage.tsx`

**Verification:**

- Manually verified on April 11, 2026:
  - Opened `CRM > Activities`
  - Clicked `Add Activity` and confirmed modal is viewport-safe with internal scroll
  - Clicked an activity row and confirmed details modal opened
  - Used action menu `View` and confirmed same details modal opened
  - Clicked `Edit Activity` from details modal and confirmed edit dialog opened

---

## 15. CRM Currency Standardization to INR (₹)

**Issue:**
CRM currency presentation was inconsistent: some pages were already INR while Opportunities and Sales Pipeline still rendered USD-style values and `$` indicators.

**Root Cause:**

1. Opportunity table/details and opportunity form amount UI still used USD formatter/labels.
2. Sales pipeline stage totals and card amount chips used USD formatter and dollar icon.
3. Dashboard and Accounts already used INR, but the module had mixed formatting behavior overall.

**Implemented Fixes:**

1. Updated Opportunities currency formatter from `en-US / USD` to `en-IN / INR`.
2. Updated opportunity amount field label from `Value ($)` to `Value (₹)`.
3. Replaced dollar icon usage with INR icon in opportunity amount input.
4. Updated Sales Pipeline currency formatter from `en-US / USD` to `en-IN / INR`.
5. Replaced dollar icon usage with INR icon in pipeline opportunity cards.
6. Normalized amount-range filter display labels to INR/₹ values.
7. Confirmed Dashboard and Accounts already aligned with INR formatting and kept them consistent.

**Files Updated:**

- `src/modules/crm/pages/OpportunitiesPage.tsx`
- `src/modules/crm/components/OpportunityPipeline.tsx`

**Outcome:**
Currency visuals are now consistent across the requested CRM surfaces (Dashboard, Accounts, Opportunities, and Sales Pipeline), using INR (`₹`) throughout.

**Validation:**

- `npx eslint src/modules/crm/pages/OpportunitiesPage.tsx src/modules/crm/components/OpportunityPipeline.tsx`

**Verification:**

- Manually verified on April 11, 2026:
  - Opened `CRM > Dashboard` and confirmed pipeline/won values are shown in INR
  - Opened `CRM > Accounts` and confirmed revenue remains in INR
  - Opened `CRM > Opportunities` and confirmed amount label/icon and value formatting use `₹`
  - Confirmed `New Opportunity` label now renders as `Value (₹)` (not raw `\u20B9`)
  - Opened `CRM > Sales Pipeline` and confirmed stage totals/card amounts use `₹`
