#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================
user_problem_statement: "Redeploy full project from GitHub repo (svetlanaslinko057/23423gyhgYGGG) - Oksana Oliferenko UA-DE translation services website with admin panel, verify everything works and finish any logical gaps."

backend:
  - task: "Auth login JWT (admin@translate.ua / Translate2026!)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Verified via curl after redeploy"
  - task: "Orders POST with multipart file upload to object storage"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Order created, file stored, downloadable via /api/admin/files/{path}"
  - task: "Contact POST, admin orders/contacts lists, status PATCH (Form data), stats"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "All verified via curl"
  - task: "Settings system (public GET hides resend_api_key, admin GET/PUT, test-email graceful 400)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Verified; test-email returns 400 'Resend API key не налаштовано' when unconfigured"
  - task: "Work items CRUD + reorder + image upload, pricing GET/PUT, estimate POST"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "7 work items seeded on startup; public /api/work returns them"

frontend:
  - task: "Public site pages (Home/Services/About/Work/Order/Contact) UA/DE"
    implemented: true
    working: true
    file: "frontend/src/App.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Home renders with hero translation desk; needs full e2e pass"
  - task: "Admin panel (login, sidebar: Заявки/Повідомлення/Приклади/Ціни/Налаштування)"
    implemented: true
    working: true
    file: "frontend/src/pages/Admin.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Login + orders view with status dropdown and file chip verified via screenshot"
  - task: "Order form with file upload, Contact form, Calculator (pricing/estimate), LeadWidget"
    implemented: true
    working: "NA"
    file: "frontend/src/pages/Order.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Needs e2e testing"

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: true

test_plan:
  current_focus:
    - "Full e2e after redeploy: public site + admin panel + forms"
  stuck_tasks: []
  test_all: true
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "Project redeployed from GitHub into /app. Backend .env reconstructed. All curl POC checks passed. Need full backend+frontend e2e regression."

  - task: "Mobile adaptive pass (390px/768px): header, hero, scenes, forms, calculator, admin"
    implemented: true
    working: "NA"
    file: "frontend/src/index.css"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Added MOBILE ADAPTIVE PASS CSS layer + Header.jsx classnames (hd-brand/hd-cta) + Order.jsx form-2col stacking. Verified via screenshots: no horizontal overflow UA/DE, header one-line, person note repositioned, calculator select full width, admin nav rail + savebar polish. Needs full mobile e2e."

agent_communication:
  - agent: "main"
    message: "Mobile adaptive pass complete. Test all pages at mobile viewport 390x844: navigation via burger menu, order form submit, contact form submit, calculator estimate, lead widget, admin panel all sections. Also verify desktop 1920px is NOT broken by changes."

  - task: "Lead-gen pass: PricingScene on home (#pricing, price ticker + calculator), CtaBand (proof/method/services/about), hero + expertise nudges, anchor scroll /#pricing"
    implemented: true
    working: "NA"
    file: "frontend/src/scenes/PricingScene.jsx, frontend/src/components/CtaBand.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Added animated pricing scene on home after Expertise, reusable CTA bands on Home(x2)/Services/About, hero price-hint, expertise nudge, hash scroll support in ScrollManager. Verified visually desktop+mobile. Needs e2e."

  - task: "UA/DE/EN expansion: 6 translation directions (ua-de,de-ua,ua-en,en-ua,de-en,en-de) in calculator/order/sidesheet/backend estimate; pair_multipliers in pricing"
    implemented: true
    working: "NA"
    file: "frontend/src/lib/directions.js, frontend/src/components/Calculator.jsx, backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Added 6 directions with per-pair multipliers (ua-de 1.0, ua-en 1.0, de-en 1.2 default). Verified math manually via screenshot (35*1.2 + 9*15*1.2 = 204, -15% = 173)."

  - task: "Discount/promo system: volume tiers + prepay discount, admin-configurable (PricingView sections 03/04), calculator shows promo chips, discount lines, savings, next-tier nudge"
    implemented: true
    working: "NA"
    file: "frontend/src/pages/admin/PricingView.jsx, frontend/src/components/Calculator.jsx, backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "discounts: {volume_enabled, volume_tiers[{min_pages,pct}], prepay_enabled, prepay_pct} in pricing settings. Calculator applies max matching tier + prepay pct, shows savings and clickable nudge."

  - task: "Custom editorial Select component replacing native selects (calc doc type, calc direction, order direction, sidesheet direction)"
    implemented: true
    working: "NA"
    file: "frontend/src/components/Select.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Keyboard accessible (Enter/Space/Arrows/Esc), click-outside close, olive active row, testids: {testId}-btn, {testId}-menu, {testId}-opt-{i}"

  - task: "Certified translation terminology + UA/DE/EN branding texts (locales, content, seo jsonld availableLanguage en)"
    implemented: true
    working: "NA"
    file: "frontend/src/locales/ua.js, frontend/src/locales/de.js, frontend/src/lib/seo.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Засвідчений переклад / Beglaubigte Übersetzung with hints; brand line UA · DE · EN everywhere"

agent_communication:
  - agent: "main"
    message: "Phase 4 (UA/DE/EN + discounts + editorial Select) implemented. Needs full e2e: calculator all directions/discount combos, estimate lead flow, order form with new direction select, sidesheet, admin pricing save (pairs+tiers+prepay), admin orders direction labels, DE locale, no console errors."

  - task: "CtaBand redesign: tear-off perforation separator + spacing, mobile stamp reposition (top-right, no button collision)"
    implemented: true
    working: "NA"
    file: "frontend/src/components/CtaBand.jsx, frontend/src/index.css"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Removed paddingTop:0, added .ctab__perf dashed separator with gap; mobile stamp now top-right 72px opacity .5"

  - task: "ManuscriptProof EN mention: 5th translator note (UA/DE) + ms-en chip on translation sheet, stage-2 highlight includes note 5"
    implemented: true
    working: "NA"
    file: "frontend/src/scenes/ManuscriptProof.jsx, frontend/src/content/uk.js, frontend/src/content/de.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "data-testid ms-en-note; note 5 about UA⇄EN/DE⇄EN availability"

  - task: "About page image: neutral editorial default (fountain pen), admin-configurable via settings.site.about_image (URL input + file upload via /api/admin/work/upload), editorial figure with caption"
    implemented: true
    working: "NA"
    file: "frontend/src/pages/About.jsx, frontend/src/pages/admin/SettingsView.jsx, backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "testids: about-figure, settings-about-image, settings-about-image-file, settings-about-image-upload, settings-about-image-preview. GET /api/settings returns site.about_image"

  - task: "Mobile adaptive polish: msx-notescard padding/font, esel menu height, calc promo chips, about figure 16/10 on mobile"
    implemented: true
    working: "NA"
    file: "frontend/src/index.css"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Verified via screenshots at 390px: no horizontal overflow"

agent_communication:
  - agent: "main"
    message: "New pass: CtaBand perforation redesign, EN mention in manuscript scene, admin-configurable about image, mobile polish. Test backend settings round-trip (site.about_image save via PUT /api/admin/settings, public GET), frontend about page image render, admin settings upload flow, ctab on mobile+desktop, manuscript EN note UA/DE."
