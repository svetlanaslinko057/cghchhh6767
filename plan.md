# Translation Services Website (UA ↔ DE ↔ EN) — Deployment + Completion Plan (UPDATED)

## 1) Objectives
- ✅ **Deploy everything from GitHub repo** (backend + frontend + DB + object storage + admin) into the runtime environment (`/app`).
- ✅ Validate the **core workflow end-to-end**:
  - orders/contact submission
  - file upload to Emergent Object Storage + admin download
  - settings-driven lead-gen rendering on public site
  - best‑effort Resend notifications (never blocks user flows)
- ✅ Confirm **no logical gaps** between frontend and backend (admin views, endpoints, auth headers, env/config).
- ✅ Confirm **public site + admin panel** are stable, consistent with the editorial design system.

**Scope completed (Phase 4):**
- ✅ Add **English (EN)** as a full translation direction across the product:
  - 3 languages supported as translation directions: **UA / DE / EN**
  - 6 directions: `ua-de`, `de-ua`, `ua-en`, `en-ua`, `de-en`, `en-de`
  - wired through calculator (home/work/widget), order flow, quick request side sheet, admin orders, SEO
- ✅ Add **admin-configurable promo/discount system** (conversion-focused; no fake testimonials):
  - volume discount tiers (from N pages → %)
  - prepay discount (%)
  - calculator UI shows applied discounts, savings, and “next-tier” nudge
  - ✅ prepay option is now visually highlighted as a conversion element (badge + saving preview)
- ✅ Replace native `<select>` with a **custom editorial Select** component (keyboard accessible) in:
  - Calculator (doc type + direction)
  - Order form direction
  - SideSheet quick request direction
- ✅ Correct/standardize **certification terminology**:
  - UA: “Засвідчений переклад”
  - DE: “Beglaubigte Übersetzung”
  - explanatory hint in calculator + forms

**Scope completed (post-Phase 4 polish):**
- ✅ Fix “blocks merging” in bottom CTA bands (tear‑off perforation separator + spacing)
- ✅ Full mobile adaptive pass for new blocks (CTA band, calculator promo, manuscript notes, about figure)
- ✅ ManuscriptProof explicitly mentions EN availability (UA/DE text + EN chip)
- ✅ About page uses neutral editorial image by default and is **admin-configurable** (`site.about_image` + upload)

**Scope completed (Phase 5 — conversion + depth):**
- ✅ Reviews: public scene + admin CRUD + reorder
- ✅ Trust stats strip (admin-managed)
- ✅ FAQ component + FAQPage JSON‑LD (admin-managed via settings.widget.faq)
- ✅ Order tracking (code + email) + status history
- ✅ Admin dashboard “Огляд”, reviews view, order status filters

**Current status:** Project is deployed and stable on preview:
- **Preview URL:** https://localize-app-18.preview.emergentagent.com
- **Admin creds:** `admin@translate.ua` / `Translate2026!`

---

## 2) Implementation Steps

### Phase 1 — Core Workflow POC (Isolation) (deployment-critical integrations)
**Core = “Submission flow must never fail”:** order/contact creation + file upload to object storage + optional Resend email + settings retrieval.

User stories:
1. ✅ As a visitor, I can submit an order with files and always receive a success response.
2. ✅ As a visitor, I can submit a contact message and always receive a success response.
3. ✅ As an admin, I can configure notification settings and send a test email (or receive a graceful error if not configured).
4. ✅ As a visitor, I can fetch public settings without ever seeing sensitive keys.
5. ✅ As an admin, I can download uploaded order files.

Steps (completed):
- ✅ **Environment & secrets**
  - `backend/.env` populated and verified:
    - `MONGO_URL`, `DB_NAME`, `CORS_ORIGINS`
    - `JWT_SECRET` (48+ bytes)
    - `ADMIN_EMAIL=admin@translate.ua`, `ADMIN_PASSWORD=Translate2026!`
    - `APP_NAME=uatranslate`
    - `EMERGENT_LLM_KEY` (for Emergent Object Storage)
  - Frontend env verified:
    - `REACT_APP_BACKEND_URL` points to preview base URL
- ✅ **Dependencies installed**
  - Backend: `pip install -r backend/requirements.txt` (includes `resend`)
  - Frontend: `yarn install`
- ✅ **POC verification via curl**
  - Admin login → JWT OK
  - `POST /api/orders` multipart upload OK
  - `GET /api/admin/files/{storage_path}` download OK
  - `POST /api/contact` OK
  - `GET /api/settings` hides `notifications.resend_api_key` OK
  - `POST /api/admin/settings/test-email` graceful 400 when key not configured OK
  - `GET /api/admin/stats` OK
  - `GET /api/work` shows seeded items OK

Deliverable: ✅ Verified POC logs + successful file download.

---

### Phase 2 — V1 App Development (Full deploy + coherence pass)
**Goal:** deploy the full site and ensure frontend↔backend wiring is complete for public pages + admin panel.

User stories:
1. ✅ As a visitor, I can browse the site (Home/Services/About/Work/Order/Contact) in UA/DE without console errors.
2. ✅ As a visitor, I see hero title/lead and quick-contact buttons populated from Settings.
3. ✅ As a visitor, I can place an order (UI supports submit; backend supports multipart + attachments).
4. ✅ As an admin, I can log in, navigate the left-sidebar panel, and manage order statuses.
5. ✅ As an admin, I can view contact messages, edit settings, and verify notifications via test email.

Steps (completed):
- ✅ **Deploy everything from repo into `/app`**
- ✅ **Backend readiness + route coverage confirmed**
- ✅ **Frontend readiness**
  - `/admin` panel confirmed functional + styled.

Deliverable: ✅ Deployed V1 with stable navigation, functional forms, functional admin.

---

### Phase 3 — Hardening + Finish Logical Gaps (production reliability)
**Goal:** eliminate edge-case breaks and finalize incomplete task threads found in code.

Steps (completed / not required beyond current state):
- ✅ Best‑effort Resend notifications are non-blocking.
- ✅ Error states verified.
- ✅ Session persistence + logout verified.
- ✅ No logical gaps found in endpoint coverage.

Deliverable: ✅ Stable release with no known broken routes.

---

### Phase 4 — UA/DE/EN Expansion + Promo System + Editorial Select
**Goal:** expand the product from UA↔DE to **UA/DE/EN directions** and add **admin-configurable discounts** and **custom Select** while preserving the editorial design system.

Status: ✅ COMPLETE (backend + frontend + admin + testing)

---

### Phase 5 — Conversion Expansion (NO online payments) + Deeper Admin/Order Logic
**Goal:** strengthen the landing experience while preserving the editorial paper concept, and expand admin capabilities.

**Constraints:**
- ❌ No online payments.
- ✅ No fake/mock reviews.
- ✅ Everything configurable from admin where appropriate.
- ✅ Preserve existing editorial style + animations.

Status: ✅ COMPLETE (backend + public UI + admin + regression pass)

---

### Phase 6 — Rebrand + Fast-Lead Conversion Concept (current work)
**Goal:** rebrand to the new name and redesign “calculator → lead” and “Order CTA” flows so that **any high-intent action creates an order instantly** in admin **«Заявки»** with minimal friction.

**Constraints:**
- ✅ Keep /order full form for attachments.
- ✅ Preserve editorial style.
- ✅ Lead actions must never end up in admin «Повідомлення» (contacts) — only in «Заявки».

---

#### Phase 6A — Global rename (brand consistency)
**User stories:**
1. As a visitor, I see only the new brand name across all pages (UA + DE versions).
2. As an admin, I see the new name in admin chrome/login.
3. SEO + PWA metadata use the new name.

**Implementation steps:**
- Replace every occurrence of the old name:
  - **Latin:** `Oksana Oliferenko` → `Oksana Oxegen`
  - **Cyrillic:** `Оксана Іллєнко`/other variants → `Оксана Оксіоген`
- Frontend:
  - `src/content/uk.js`, `src/content/de.js`: `brand.name`, `person.name`
  - `src/lib/seo.js`: `BRAND` and per-route titles/descriptions
  - `src/pages/Admin.jsx`: login name + sidebar name
  - `src/pages/admin/SettingsView.jsx`: placeholders for site.title + hero_title
  - `public/index.html`: `<title>` + description meta
  - `public/manifest.json`: `name`, `short_name`
  - Regenerate `public/og-image.png` (new name rendered)
- Backend:
  - Update Resend email HTML template signature/header line containing brand name

**Deliverable:** new name is consistent across UI, admin, metadata, and emails.

---

#### Phase 6B — Fast-lead concept: calculator should create an order (not navigate)
**User stories:**
1. As a visitor, after I calculate price, I can submit my contact in-place (without leaving the page) and the request appears immediately in admin «Заявки».
2. As a visitor, I can still open the full /order form (for file uploads) with prefilled data.

**Implementation steps:**
- Calculator component (single source used on Home, /work, LeadWidget calc tab):
  - Change primary CTA behavior:
    - Clicking **“Замовити переклад”** must **NOT** navigate to `/order`.
    - Instead, show **inline Step 2** (not modal): fields
      - `name *`
      - `contact *` (single field: **phone or email**)
    - Submit → `POST /api/estimate` so that the item lands in **orders** collection.
    - Success UI: ✓ + show tracking code; offer copy button.
  - Secondary action:
    - “Повна форма з файлами →” navigates to `/order` and uses store prefill (doc_type, direction, message, calculator summary).
- Ensure the “estimate” submission never routes to /contact and never creates “contact messages”.

**Deliverable:** calculator lead flow is inline, fast, and always creates an order.

---

#### Phase 6C — Backend schema adjustments for fast-lead (email optional)
**User stories:**
1. As a visitor, I can submit a lead with phone-only or email-only.
2. Validation prevents empty contact.

**Implementation steps:**
- Update `EstimateRequest`:
  - Require: `name` + (**email OR phone**)
  - `email` becomes optional
  - Return `{ id, code: id[:8], status }`
- Update `POST /api/orders` (multipart):
  - Require: `name` + (**email OR phone**)
  - `email` becomes optional
- Maintain tracking endpoint behavior (Phase 5) — keep `code + email` for now unless explicitly changed later.

**Deliverable:** backend accepts phone-only leads for estimate/orders and returns tracking code.

---

#### Phase 6D — Unify quick order forms: single “phone or email” field
**User stories:**
1. As a visitor, quick forms are максимально швидкі: one contact field, optional message, optional files.

**Implementation steps:**
- Update `QuickOrderForm` (used by SideSheet and LeadWidget «Заявка» tab):
  - Replace separate email input with one required field: `contact` (phone or email)
  - Parse: if contains `@` → email else phone
  - Submit to `/api/orders` as before (so it lands in admin «Заявки»)

**Deliverable:** fast compact forms with minimal required inputs.

---

#### Phase 6E — Global compact OrderModal for all “Замовити переклад” CTAs
**User stories:**
1. As a visitor, any “Замовити переклад” CTA opens a compact modal form for fast submission.
2. As a visitor, I can still go to full /order page when I want to upload files or provide more details.

**Implementation steps:**
- Create `components/OrderModal.jsx`:
  - Editorial paper modal (desktop centered; mobile bottom-sheet)
  - Contains the updated `QuickOrderForm` (single contact field)
  - Includes a link: “Повна форма →” to `/order`
- Add a tiny event bus in `src/lib/orderModal.js`:
  - `openOrderModal({ origin, direction, doc_type })` and subscription for modal component
- Wire **all** sitewide CTAs to open modal instead of `nav('/order')`:
  - `Header.jsx` (desktop + mobile)
  - `Hero.jsx` primary CTA
  - `CtaBand.jsx` primary CTA
  - `Footer.jsx` CTA
  - Any other order CTA occurrences found by grep

**Deliverable:** all “Order” CTAs create fast path lead entry without navigation.

---

#### Phase 6F — Locales + styling
**Implementation steps:**
- Add UA/DE locale keys:
  - `calc.leadTitle`, `calc.leadContact`, `calc.fullForm`
  - `quick.contact`, `quick.modalTitle`, `quick.modalSub`
- Add CSS in `index.css`:
  - `.omodal*` (editorial modal, overlay, mobile sheet behavior)
  - Calculator inline lead step polish (spacing, validation, success state)

**Deliverable:** the new flow looks native to the editorial design system and works on mobile.

---

#### Phase 6G — Testing + regression (with testing_agent)
**Backend tests:**
- `/api/estimate`:
  - phone-only OK
  - email-only OK
  - neither → 400
  - returns `code`
- `/api/orders`:
  - phone-only OK
  - email-only OK
  - neither → 400

**Frontend tests (manual + testing_agent):**
- Rename is visible everywhere (header/footer/admin/SEO title)
- Calculator inline lead flow works on:
  - Home (#pricing)
  - /work page calculator
  - LeadWidget “Вартість” tab
- Modal opens from all CTAs and submits to orders
- Admin receives leads in «Заявки» (not «Повідомлення»)
- Mobile 390px and DE locale regression
- Cleanup all test data after

**Deliverable:** stable rebranded release with fast-lead conversion flows.

---

## 3) Next Actions
1. ✅ DONE — Phase 6 (rename + fast-lead) shipped in repo.
2. ✅ DONE — Phase 7 (EN site version + lang dropdown) shipped in repo.
3. ✅ DONE (current session) — Phase 8: full site content CMS completed:
   - Admin «Контент» section edits ALL public texts in UA/DE/EN (existing base),
   - NEW: SEO titles/descriptions per route per language now CMS-managed (content.seo.* + seo.js refactor),
   - NEW: manuscript legend labels + page kickers (locale.nav.work/contact/order) added to SCHEMA,
   - Coverage audit: 0 public-site text keys remain outside admin control (FAQ/legal/pricing/work/reviews live in their own admin sections).
4. ✅ DONE (current session) — Phase 9: calculator doc-type names + pricing note in 3 languages (admin «Ціни»: name_de/name_en, note_de/note_en with UA fallback) + order tracking by email OR phone (phone-only leads can track; back-compat kept).
5. Awaiting next user task.

---

## 4) Success Criteria
- ✅ Existing site remains stable (no regression) and keeps editorial design system.
- ✅ Global rename:
  - No old name remains in UI/admin/SEO/PWA metadata/emails.
- ✅ Fast-lead conversion:
  - Calculator “Замовити переклад” creates an order in admin «Заявки» (no redirect).
  - Inline Step 2 appears (name + phone/email) and submits successfully.
  - Secondary link opens full /order form with prefilled calculator context.
  - SideSheet + LeadWidget quick order forms use single contact field and still support files.
  - All sitewide “Замовити переклад” CTAs open a compact modal and submit quickly.
- ✅ Backend validation:
  - name + (email OR phone) required for estimate/orders
  - returns tracking code for success
- ✅ Testing:
  - flows work on desktop + mobile, UA + DE, and test data cleaned.
