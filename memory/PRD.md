# Проект: Oksana Oliferenko — переклади документів UA ↔ DE ↔ EN

## Phase 9: Мультимовні типи документів у калькуляторі + трекінг phone-only (поточна сесія, 14.07) — ЗАВЕРШЕНО
### A. Назви типів документів і примітка калькулятора — 3 мовами
- **Backend**: DEFAULT_PRICING.doc_types тепер {name, name_de, name_en, price} (7 типів з перекладами DE/EN); note_de/note_en додані в DEFAULT_PRICING і PricingPayload; _merge_pricing підхоплює автоматично
- **Калькулятор** (Calculator.jsx): docName(dt) — вибір назви за мовою сайту з UA-фолбеком; локалізована назва в селекті, у рядку чека (line 192) і примітка noteText (p.note_de/note_en); у заявку до адмінки (doc_type, message, store.calc) свідомо йде UA-назва (doc.name) — консистентність для адміна
- **PricingScene.jsx**: ticker цін теж мовозалежний
- **Адмінка «Ціни»**: кожен тип — 3 інпути назв (pricing-type-name-{i} / -de-{i} / -en-{i}, клас .adm-pricerow--i18n); примітка — 3 textarea (pricing-note / -de / -en); save() мапить name_de/name_en (spread p вже включає note_*)
### B. Трекінг замовлення за email АБО телефоном (phone-only ліди)
- **Backend** POST /api/orders/track: TrackRequest {code, contact, email(back-compat)}; пошук за id-префіксом коду (regex ^code), потім матч контакту: '@' → email case-insensitive, інакше телефон нормалізований (re.sub \D — будь-яке форматування +49 171 234-56-78 == +491712345678); 400 без контакту, 404 без збігу
- **Order.jsx TrackSection**: одне поле track-contact «Email або телефон» (замість track-email), body {code, contact}
- **Локалі ua/de/en**: track.contact (нове), track.intro/notFound і quick.trackHint оновлені під «email або телефон»; ContentView SCHEMA: locale.track.email → locale.track.contact
### Тестування iteration_2: backend 100% (11/11), frontend 100% (5/5) — мультимовні назви/примітки в калькуляторі UA/DE/EN, адмін-редагування+збереження, трекінг телефоном у різному форматуванні, 404/400, back-compat email, регресія fast-lead. Тест-дані очищено (orders/contacts=0, pricing відновлено до дефолтів, site_content=0)


## Phase 8: Повний CMS контенту сайту — ЗАВЕРШЕННЯ (поточна сесія, 14.07) — ЗАВЕРШЕНО
### Що було в репо (основа, вже реалізовано раніше)
- Адмін-секція «07 Контент» (ContentView.jsx): SCHEMA-редактор УСІХ текстів сайту по мовах UA/DE/EN (акордеони: бренд/нав, hero, спеціалізація, вартість-блок, рукопис, про мене, метод, футер-CTA, CTA-стрічки, сторінки послуги/про/приклади/контакти/замовлення, заголовки секцій, калькулятор, швидка заявка, трекінг, правові лінки + кукі)
- lib/contentStore.js: GET /api/content → overrides deep-merge над дефолтами (content.* → useContent(), locale.* → i18n.addResourceBundle); live-оновлення після збереження (refreshContent)
- Backend: GET /api/content (публічний), PUT/DELETE /api/admin/content/{lang} (JWT), колекція site_content
### ДОРОБЛЕНО в цій сесії (закриті прогалини — «повністю весь контент»)
- **SEO тепер редагується з CMS**: у content/{uk,de,en}.js додано секцію `seo` (home/services/work/about/order/contact × title+description + offers[] для JSON-LD); lib/seo.js ПЕРЕПИСАНО — прибрано хардкод META/BRAND, тепер бере c.seo + c.brand.name через useContent() (og:site_name, титули, дескрипшини, JSON-LD name/makesOffer — усе з CMS); ROUTE_KEYS мапить шлях → ключ seo
- **ContentView SCHEMA доповнено**: нова секція «SEO — заголовки та описи сторінок» (content-sec-seo, 6×title+description + offers strings); manuscript.legend (abbr/illegible/strike/fix — 4 поля); кікери сторінок locale.nav.work/contact/order (у секціях відповідних сторінок)
- Систематичний аналіз покриття: скрипт витяг усі t('…')-ключі публічного коду та SCHEMA-шляхи — після доробки прогалин 0. Legacy-ключі locales (marquee, trust, docs, demo, process, ai, testimonials, cta, footer, faq, hero.*) НЕ використовуються компонентами (мертвий код старого лендінгу) — свідомо не в CMS
- FAQ (3 мови: q/a + q_de/a_de + q_en/a_en у Налаштуваннях), правові тексти (3 мови у «Правові тексти»), приклади/ціни/відгуки — у своїх розділах (як і задумано; хінти в UI ведуть туди)
### Тестування iteration_1 (Phase 8): backend 100% (15/15 — CRUD content по 3 мовах, 404 на fr, 401 без JWT, reset, регресія settings/pricing/work/legal/estimate), frontend 95% (усі функції працюють: секції рендеряться, мовні піли міняють значення, збереження ✓, SEO title на сайті з CMS, reset відновлює дефолти, калькулятор-регресія ок; єдине зауваження LOW — поля секцій рендеряться з невеликою async-затримкою, є стан «Завантаження…», не баг)
- Тест-дані очищено: orders/contacts = 0, site_content = 0 (усі overrides скинуто, сайт на дефолтах)
### Як користуватись (для власника)
- Адмінка → «07 Контент» → обрати мову (UA/DE/EN) → розгорнути блок → редагувати → «Зберегти {мова}» — зміни на сайті одразу; «↺ Скинути {мова}» повертає стандартні тексти


## Redeploy 2rdf23dfc3SSDD (поточна сесія, 14.07) — ЗАВЕРШЕНО
- Репозиторій https://github.com/svetlanaslinko057/2rdf23dfc3SSDD синхронізовано в /app (backend, frontend/src+public+config, memory, tests, plan.md, test_result.md, backend_test.py)
- Превʼю: https://localization-stage.preview.emergentagent.com
- backend/.env відновлено: MONGO_URL, DB_NAME, CORS_ORIGINS, JWT_SECRET (96 hex), ADMIN_EMAIL=admin@translate.ua / ADMIN_PASSWORD=Translate2026!, APP_NAME=uatranslate, EMERGENT_LLM_KEY
- pip -r requirements.txt (resend) + yarn install — OK; supervisor restart — OK; object storage ініціалізовано, 7 work items + 3 legal pages засіяно (свіжа БД)
- POC 16/16: login JWT ✓, /settings (resend_api_key прихований, trust є) ✓, /work (7) ✓, /pricing (7 doc_types + pair_multipliers + discounts) ✓, GET /reviews ✓, GET /legal (terms/privacy/cookies) ✓, GET /content (CMS, порожньо = дефолти) ✓, POST /orders з файлом ✓, download /admin/files HTTP 200 (вміст збігається) ✓, POST /estimate phone-only (code) ✓, /estimate без контакту → 400 ✓, POST /contact ✓, POST /orders/track (status_history) ✓, /admin/stats ✓, test-email graceful 400 ✓, CMS PUT/GET/DELETE roundtrip (site_content) ✓
- УВАГА (нюанси API): POST /orders повертає `files` як ЧИСЛО (кількість), storage_path беремо з GET /admin/orders → files[].storage_path; curl без браузерного User-Agent на превʼю-домені ловить Cloudflare HTML (браузери працюють нормально)
- Frontend скріншоти: Home (hero Oksana Oliferenko, дропдаун мов UA∨, кукі-банер зліва, LeadWidget справа) ✓; /admin логін + панель 9 (!) секцій: Огляд/Заявки/Повідомлення/Відгуки/Приклади/Ціни/**Контент**/Правові тексти/Налаштування, дашборд з воронкою ✓
- **НОВЕ В ЦЬОМУ РЕПО (не було в PRD): CMS «Контент» (секція 07 адмінки)** — редагування ВСІХ текстів публічного сайту по мовах UA/DE/EN: pages/admin/ContentView.jsx (SCHEMA-блоки: brand/nav, hero, expertise, manuscript, person, method, calc, quick тощо; типи полів text/area/strings/list/pairs), lib/contentStore.js (deepMerge + refreshContent), backend: GET /api/content, PUT/DELETE /api/admin/content/{lang}, колекція site_content (порожньо = вбудовані дефолти з content/*.js + locales/*.js; manuscript.sample структурний — не редагується)
- Тестові дані очищено (orders/contacts = 0)
- Аналіз коду: у репо повністю реалізовані Phases 1–7 (UA/DE/EN напрями + знижки + editorial Select, reviews/trust/FAQ/tracking/dashboard, fast-lead: інлайн-крок калькулятора → POST /estimate, OrderModal на всіх CTA, QuickOrderForm одне поле контакту, EN-версія сайту + дропдаун мов, legal pages + кукі-банер, зворотний ребрендинг на Oliferenko) + НОВИЙ CMS контенту
- Відомі свідомі обмеження (з памʼяті репо): /order повна форма вимагає email (бекенд приймає phone-only); трекінг лише code+email
- Статус: превʼю розгорнуто і перевірено, ОЧІКУЄМО КОМАНДУ КОРИСТУВАЧА з наступним таском/правками (нічого не дороблювати без команди)


## Phase 7: Англійська версія сайту + дропдаун мов + виправлення роду (поточна сесія, 14.07) — ЗАВЕРШЕНО
### 3 мови сайту (UA / DE / EN)
- **locales/en.js** + **content/en.js** — повний англійський переклад усіх UI-рядків і контенту (hero, expertise, manuscript, person, method, calc, quick, track, legal, cookie тощо)
- **i18n.js**: ресурс en + валідація збереженої мови (SUPPORTED=['ua','de','en']); **content/index.js**: en у useContent()
- **seo.js**: EN-мета для всіх 6 маршрутів, og:locale en_US + og:locale:alternate (multi-value через setMetaAll), html lang uk/de/en, JSON-LD makesOffer 3 мовами
- PricingScene: 'from' для EN
### Дропдаун мов (замість перемикача UA/DE)
- **Header.jsx**: компонент LangDropdown (експортується) — editorial pill-кнопка з поточною мовою + випадаючий список 3 мов (код + назва), клавіатура (Enter/Space/Arrows/Esc), закриття по кліку поза, aria listbox. Testids: lang-dropdown, lang-dropdown-btn, lang-opt-{ua|de|en}
- Мобільне меню: 3 pill-кнопки menu-lang-{ua|de|en}
- CSS: .langdd* в index.css (стилістика узгоджена з .esel)
### Виправлення роду професії (груба помилка: «перекладачка» не існує)
- uk.js hero.role: «Професійний перекладач документів»; locales/de.js about.p1: «professioneller Übersetzer»; content/de.js: hero.role «Übersetzer für…», notesTitle «Anmerkungen des Übersetzers», leadCta.about «einem Fachmann»; seo.js UA/DE титули «перекладач»/«Übersetzer»
- legal_defaults.py + БД legal_pages (in-place): «професійний перекладач», «professioneller Übersetzer», «der Übersetzer», «den Administrator»; списки мов «українська / німецька / англійська»
### Legal EN (БД + адмінка)
- legal_defaults.py: TERMS_EN, PRIVACY_EN, COOKIES_EN (повні переклади) + title_en у LEGAL_DEFAULTS
- server.py: LegalUpdate: title_en/content_en (optional, default ''); PUT /admin/legal зберігає їх; seed_legal_pages: міграція — існуючим докам без content_en додаються EN-дефолти ($set, UA/DE адміна не чіпаються)
- Legal.jsx: doc[`title_${lang}`] з fallback на UA, дата en-GB; LegalView.jsx: вкладки ['ua','de','en'], поля title_en/content_en у save
### Відомий нюанс (свідомо)
- Назви типів документів у калькуляторі та примітка (pricing.note) — адмінські дані однією мовою (укр.), показуються як є в DE/EN версіях (існуючий патерн)
### Тестування iteration_1 (Phase 7): backend 96% (23/24; «мінус» — 422 замість 400, семантично коректно). Playwright тест-агента таймаутив → UI верифіковано вручну скріншотами: дропдаун відкривається/перемикає ✓, EN Home/Legal/калькулятор + inline lead (success + код) ✓, DE «Übersetzer für…» без «Übersetzerin» ✓, UA «ПРОФЕСІЙНИЙ ПЕРЕКЛАДАЧ» ✓, мобайл 390px 3 кнопки мов ✓, адмінка вкладка EN (Terms of Use + контент) ✓. Тест-дані очищено (orders/contacts = 0)

## Зворотний ребрендинг Oxegen → Oliferenko (поточна сесія, 14.07) — ЗАВЕРШЕНО
- За командою користувача повернено ім'я бренду: Oksana Oxegen → **Oksana Oliferenko** (тільки ім'я, вся логіка/концепція без змін)
- Кирилічних варіантів (Оксіоген) у коді не було — замінено лише латиницю
- **Файли**: backend/legal_defaults.py (5 місць), backend/server.py (email-шаблон), frontend/src/lib/seo.js (BRAND + титули), content/uk.js + de.js (brand.name, person.name), pages/Admin.jsx (логін + сайдбар), admin/SettingsView.jsx (плейсхолдери), public/index.html (title + description), public/manifest.json (name + short_name)
- **БД**: legal_pages terms + privacy (content_ua/content_de) оновлено in-place (сід не перетирає існуючі документи, тому правка напряму в MongoDB)
- **og-image.png** перегенеровано (PIL, LiberationSerif, той самий кремовий editorial стиль, ім'я Oliferenko)
- Перевірено: title/manifest через curl ✓, hero/хедер/футер/копірайт скріншотами ✓, адмін логін + сайдбар ✓, /api/legal/terms без Oxegen ✓, POST /estimate регресія ✓, grep по коду — 0 входжень Oxegen ✓
- Тестові дані очищено (orders = 0)


## Redeploy Hbvhev34rvvddd (поточна сесія, 14.07) — ЗАВЕРШЕНО
- Репозиторій https://github.com/L2PAD/Hbvhev34rvvddd синхронізовано в /app (backend, frontend/src+public+config, memory, tests, plan.md, test_result.md, backend_test.py)
- Превʼю: https://oksana-translate.preview.emergentagent.com
- backend/.env відновлено: MONGO_URL, DB_NAME, CORS_ORIGINS, JWT_SECRET (96 hex), ADMIN_EMAIL=admin@translate.ua / ADMIN_PASSWORD=Translate2026!, APP_NAME=uatranslate, EMERGENT_LLM_KEY
- pip -r requirements.txt (resend) + yarn install — OK; supervisor restart — OK; object storage ініціалізовано, 7 work items + 3 legal pages засіяно (свіжа БД)
- POC curl 14/14: login JWT ✓, /settings (resend_api_key прихований, trust є) ✓, /work (7) ✓, /pricing (7 doc_types + pair_multipliers + discounts) ✓, GET /reviews ✓, GET /legal (terms/privacy/cookies) ✓, POST /orders з файлом (code + files[].storage_path) ✓, download /admin/files HTTP 200 (вміст збігається) ✓, POST /estimate phone-only (code) ✓, /estimate без контакту → 400 ✓, POST /contact ✓, POST /orders/track (status_history) ✓, /admin/stats (orders/by_status/last7/contacts/reviews) ✓, test-email graceful 400 ✓
- УВАГА (нюанс API): вкладення замовлення лежать у полі `files` (не attachments), download路径 = files[].storage_path
- Frontend скріншоти: Home (hero Oksana Oxegen, UA·DE·EN, кукі-банер зліва, LeadWidget справа) ✓, калькулятор #pricing (промо-чипи знижок, prepay −5%, nudge, Select) ✓, /admin логін (бренд Oxegen) + панель 8 секцій (Огляд/Заявки/Повідомлення/Відгуки/Приклади/Ціни/Правові тексти/Налаштування), дашборд з воронкою статусів ✓; fast-lead estimate ліг у «Заявки» ✓
- Тестові дані очищено (orders/contacts = 0)
- Аналіз коду: у репо повністю реалізовані Phases 1–6 (UA/DE/EN + знижки + editorial Select, reviews/trust/FAQ/tracking/dashboard, ребрендинг Oxegen + fast-lead: інлайн-крок калькулятора → POST /estimate, OrderModal на всіх CTA, QuickOrderForm з одним полем контакту) + правові сторінки /legal/:slug + кукі-банер + адмін-секція 07
- Відомі свідомі обмеження (з памʼяті репо): /order повна форма вимагає email (бекенд приймає phone-only); трекінг лише code+email
- Статус: превʼю розгорнуто і перевірено, ОЧІКУЄМО КОМАНДУ КОРИСТУВАЧА з наступним таском/правками (нічого не дороблювати без команди)


## Redeploy GY234rvgdvVV + Legal Pages (поточна сесія, 14.07) — ЗАВЕРШЕНО
### Redeploy
- ВАЖЛИВО: спочатку помилково розгорнули застарілий репо 6r6tfctg (бренд Oliferenko, без калькулятора/адмінки 7 секцій). Користувач вказав актуальний репо: https://github.com/svetlanaslinko057/GY234rvgdvVV — синхронізовано в /app (backend, frontend/src, public, config, memory, tests, plan.md)
- .env відновлено (MONGO_URL, DB_NAME, CORS_ORIGINS, JWT_SECRET, ADMIN_EMAIL/PASSWORD, APP_NAME=uatranslate, EMERGENT_LLM_KEY); pip resend + yarn install; регресія повна — ОК
### НОВЕ: Правові тексти (Terms / Privacy / Cookies) + кукі-банер — повністю керовано з адмінки
- **Backend**: колекція legal_pages (slug terms/privacy/cookies, title_ua/de, content_ua/de, updated_at/by); `legal_defaults.py` — детальні дефолтні тексти UA+DE (бренд Oxegen, 6 напрямів UA⇄DE⇄EN, GDPR/DSGVO, конфіденційність документів, ручна розшифровка рукописів, email-сервіс як processor, трекінг); сід на старті ТІЛЬКИ якщо документа немає (правки адміна не перетираються)
- API: GET /api/legal (список 3), GET /api/legal/{slug}, PUT /api/admin/legal/{slug} (JWT)
- **Frontend**: /legal/:slug (pages/Legal.jsx, markdown-lite рендерер: ## h2, ### h3, - список, **bold**; експорт renderLegalContent), мова сторінки = i18n (ua/de), дата оновлення, крос-лінки; футер: 3 лінки (footer-terms/privacy/cookies) в нижньому барі
- **CookieBanner.jsx**: малий банер ЗЛІВА ВНИЗУ (left:20 bottom:20, z-index 9990 — під модалкою 9998, LeadWidget справа не конфліктує), localStorage 'cookie_consent' (accepted/declined), затримка 1.2s, кнопки Прийняти/Відхилити + лінк Детальніше → /legal/cookies; не на /admin
- **Адмінка**: секція «07 Правові тексти» (pages/admin/LegalView.jsx, adminApi.legal()/saveLegal()): 3 документи, перемикач UA/DE, заголовок+текст, режим «Перегляд» (живий рендер), Зберегти → ✓ Збережено, лінк «Відкрити на сайті»
- Локалі ua/de: секції legal.* та cookie.*
### Тестування iteration_3: backend 95.8% (23/24; єдиний «мінус» — 422 замість 400, семантично коректно), frontend public/admin/regression 100%. Тест-дані очищено (orders/contacts = 0)
### Нюанс
- При повторному деплої на прод: legal_pages сідиться автоматично на порожній БД; відредаговані тексти живуть у MongoDB

## Phase 6: Ребрендинг + Fast-Lead концепція (поточна сесія, 14.07) — ЗАВЕРШЕНО
### Ребрендинг
- Ім'я скрізь замінено: Oksana Oliferenko → **Oksana Oxegen** (content uk/de brand+person, seo.js BRAND+титули, Admin.jsx логін+сайдбар, SettingsView плейсхолдери, index.html, manifest.json, email-шаблон server.py)
- og-image.png перегенеровано (PIL, LiberationSerif, кремовий editorial стиль, нове ім'я); фавікони OO лишаються валідними
### Fast-Lead концепція (заявка максимально швидко в адмінку «Заявки»)
- **Backend**: POST /api/estimate та /api/orders тепер вимагають name + (email АБО phone), email опціональний; обидва повертають code (8 символів id). 400 якщо немає жодного контакту
- **Калькулятор** (Home #pricing, /work, віджет «Вартість» — один компонент): «Замовити переклад» БІЛЬШЕ НЕ веде на /order → розкриває інлайн-крок (.calc-leadstep, dashed бронза): ім'я + «Телефон або email» → POST /estimate → success-бокс (.calc-sentbox) з кодом + копіювання (testids calc-order, calc-lead-form/-name/-contact/-submit/-success, calc-lead-code/-copy). Другорядна кнопка «Повна форма з файлами →» (calc-full-form) → /order з префілом
- **OrderModal** (components/OrderModal.jsx + lib/orderModal.js openOrderModal({origin,direction,docType}) через CustomEvent 'order-modal:open'): компактна editorial модалка (desktop центр, мобайл bottom-sheet ≤640px), містить QuickOrderForm, лінк на повну форму; ESC/оверлей/✕ закривають; scroll-lock + lenis stop/start; z-index 9998/9999 (над віджетом 9995); монтується в App.js Layout (не на /admin). Testids: order-modal, order-modal-close/-overlay/-full, modal-*
- **Всі CTA «Замовити переклад» відкривають модалку** (замість nav('/order')): Header desktop (header-order-cta) + мобільне меню (menu-order-cta), Hero (hero-order-cta), CtaBand primary (cta-{variant}-order), Footer (footer-order-cta). Origin-мітка [CTA · …] пишеться в message заявки
- **QuickOrderForm** (модалка/SideSheet/віджет «Заявка»): замість окремого email — ОДНЕ поле «Телефон або email *» ({prefix}-contact, парсинг: містить @ → email, інакше phone)
- Локалі ua/de: calc.leadTitle/leadContact/fullForm, quick.contact/contactPlaceholder/modalTitle/modalSub (старі leadOpen/leadEmail видалені)
- CSS: секція «PHASE 6 — QUICK ORDER MODAL + CALC INLINE LEAD STEP» в index.css (.omodal*, .calc-leadstep, .calc-sentbox), reduced-motion враховано
### Тестування iteration_1: backend 100% (13/13), frontend 97% (36/37); єдине зауваження «оверлей не закриває модалку» — FALSE NEGATIVE, перевірено вручну (клік поза карткою закриває). Тест-дані очищено (orders/contacts = 0)
### Незакрите/для пам'яті
- /order повна форма досі вимагає email (свідомо — повна форма); бекенд приймає phone-only
- Трекінг статусу працює лише з email (code+email) — phone-only ліди не трекаються клієнтом

## Redeploy w3re342f34SSS (поточна сесія) — ЗАВЕРШЕНО
- Репозиторій https://github.com/svetlanaslinko057/w3re342f34SSS синхронізовано в /app (backend, frontend, memory, tests, plan.md, test_result.md)
- Превʼю: https://localize-app-18.preview.emergentagent.com
- backend/.env відновлено: MONGO_URL, DB_NAME, CORS_ORIGINS, JWT_SECRET (96 hex), ADMIN_EMAIL/PASSWORD, APP_NAME=uatranslate, EMERGENT_LLM_KEY
- pip -r requirements.txt (resend) + yarn install — OK; supervisor restart — OK; object storage ініціалізовано, 7 work items засіяно (свіжа БД)
- POC curl 13/13: login JWT ✓, /settings (resend_api_key прихований, trust є) ✓, /work (7) ✓, /pricing (7 doc_types + pair_multipliers + discounts) ✓, GET /reviews ✓, POST /orders з файлом (code повертається) ✓, download /admin/files HTTP 200 ✓, POST /orders/track (status_history) ✓, POST /contact ✓, POST /estimate (лід створюється) ✓, /admin/stats (by_status + last7 + reviews_total) ✓, admin reviews CRUD ✓, test-email graceful 400 ✓
- Frontend: Home (hero translation desk, UA·DE·EN) ✓, /admin логін + панель 7 секцій (Огляд/Заявки/Повідомлення/Відгуки/Приклади/Ціни/Налаштування) з дашбордом ✓
- Тестові дані очищено (orders/contacts/reviews = 0)
- Аналіз коду: Phase 5 (reviews + trust + FAQ + tracking + dashboard) ПОВНІСТЮ реалізований у цьому репо (5A backend + 5B public + 5C admin), включно з prepay-промо в калькуляторі. Незакінчених тасків із plan.md не виявлено — чекаємо нові правки від користувача
- Статус: превʼю розгорнуто, очікуємо команду користувача з наступним таском/правками

## Статус
- Репозиторій https://github.com/svetlanaslinko057/72dftg3y4g3SS розгорнуто в /app (поточна сесія, redeploy)
- Превʼю працює: https://anufrenka-translate.preview.emergentagent.com
- Очікуємо наступний таск/правки від користувача (користувач дасть команду перед доробками)

## Redeploy 72dftg3y4g3SS (поточна сесія) — ЗАВЕРШЕНО
- Синхронізовано backend/frontend/memory/tests у /app; backend/.env відновлено (MONGO_URL, DB_NAME, CORS_ORIGINS, JWT_SECRET 48+ байт, ADMIN_EMAIL/PASSWORD, APP_NAME, EMERGENT_LLM_KEY)
- pip -r requirements.txt (resend), yarn install — OK; supervisor restart — OK
- Object storage ініціалізовано, 7 work items засіяно
- POC curl: login JWT, /settings (resend_api_key прихований), /work (7), /pricing (7 doc_types), POST /orders з файлом + download через /admin/files, POST /contact, /estimate, /admin/stats, test-email graceful 400 — ВСЕ OK (11/11)
- Frontend: Home рендериться (hero translation desk), /admin логін + панель заявок з файл-чіпом — OK
- Тестові дані очищено (orders/contacts = 0)

## UA/DE/EN + Знижки + Editorial Select (поточна сесія) — ЗАВЕРШЕНО
### Backend (server.py)
- Pricing розширено: `pair_multipliers` {ua-de:1.0, ua-en:1.0, de-en:1.2} (коефіцієнт до базової ціни пари, діє в обох напрямах), `discounts` {volume_enabled, volume_tiers:[{min_pages,pct}], prepay_enabled, prepay_pct}
- 6 напрямів перекладу: ua-de, de-ua, ua-en, en-ua, de-en, en-de (DIRECTION_LABELS + dir_label() для email/повідомлень)
- /api/estimate: нові поля prepay, discount_pct; message містить напрям, опції (терміново/засвідчений переклад/передоплата) і знижку
### Frontend
- `lib/directions.js`: DIRECTIONS, PAIR_OF, DIR_SHORT, pairMult()
- `components/Select.jsx`: кастомний editorial select (paper dropdown, olive активний рядок, клавіатура Enter/Space/Arrows/Esc, testids {id}-btn/{id}-opt-{i}) — замінив системні селекти в калькуляторі (тип документа + напрям), /order (напрям), SideSheet (напрям)
- `Calculator.jsx` переписано: calcPrice(p,typeIdx,pages,direction,{urgent,certified,prepay}) → breakdown; промо-чипи (calc-promo), рядки знижок (calc-discount-volume/prepay), «Ви заощаджуєте X €» (calc-savings), клікабельний nudge «Ще N стор. — і знижка Y%» (calc-nudge, клік підіймає pages до порога), чекбокс «Оплата одразу −5%» (calc-prepay), мультиплікатор пари показується ×1.2 в чеку
- Термінологія: «Засвідчений переклад» / «Beglaubigte Übersetzung» + хінт про нотаріальне засвідчення (calc + locales)
- Локалі ua/de: секція calc.* (усі лейбли калькулятора + dirs 6 напрямів), тексти оновлені на 3 мови (hero, faq, footer, services, about)
- Контент uk/de: brand.line2 'UA · DE · EN', hero.lead/role, person; штампи: CtaBand, LeadWidget, Preloader, Person note, Method doc tag
- seo.js: титули/дескрипшини UA·DE·EN, JSON-LD availableLanguage + en
- SideSheet: вибір напряму тепер префілить форму /order (store.direction/docType читаються в Order.jsx)
### Адмінка
- PricingView: секція 03 «Мовні пари» (3 коефіцієнти, testid pricing-mult-{pair}), секція 04 «Знижки та акції» (перемикач + пороги CRUD + передоплата %, testids pricing-tier-*/pricing-prepay-*), примітка стала 05
- OrdersView: DIR_SHORT для всіх 6 напрямів
### CSS (index.css, секції EDITORIAL SELECT / CALCULATOR PROMO)
- .esel* (селект), .calc-promo*, .calc-line--discount, .calc-save, .calc-nudge, .calc-hint, .calc-mult, .adm-pricerow--tier
### Тестування iteration_1 (Phase 4): backend 97% (32/34, 2 «мінуси» — 422 замість 400, семантично коректно), frontend 95% → «DE toggle не працює» перевірено вручну: FALSE NEGATIVE, перемикач працює (Was kostet eine Übersetzung?, Dokumententyp, Beglaubigte Übersetzung)
- Тестові дані тест-агента прибрано: note відновлено, поріг 20 стор. −15% повернуто, зайві orders/contacts видалено
- Збережені значення власника: urgent_pct 35, certified_fee 15 — не чіпав

## Архітектура
### Backend (FastAPI, /app/backend)
- `server.py` — API з префіксом /api:
  - POST /api/orders — замовлення перекладу з завантаженням файлів (multipart, до 25MB, pdf/jpg/png/webp/heic/doc/docx/txt)
  - POST /api/contact — контактна форма
  - POST /api/auth/login — JWT-логін адміна (admin@translate.ua / Translate2026!)
  - GET /api/admin/orders, /api/admin/contacts — списки (захищено JWT)
  - PATCH /api/admin/orders/{id} — зміна статусу
  - GET /api/admin/files/{path} — скачування файлів замовлень
- `storage.py` — Emergent Object Storage (файли поза MongoDB, тільки метадані в Mongo)
- .env: MONGO_URL, DB_NAME, EMERGENT_LLM_KEY (для storage), JWT_SECRET, ADMIN_EMAIL/PASSWORD, APP_NAME

### Frontend (React + CRACO, /app/frontend)
- Стек: GSAP + ScrollTrigger, Lenis (smooth scroll), i18next (UA/DE), shadcn/ui, Tailwind
- Сторінки: Home (Hero, Expertise, ManuscriptProof, Person, Method), Services, About, Work, Order (форма з файлами), Contact, Admin (панель замовлень)
- Контент: src/content/{uk,de}.js + src/locales/{ua,de}.js, manuscript.js (демо-рукопис)
- Дизайн: світла кремова тема, editorial-стиль, кастомний курсор, preloader, grain, curtain-переходи

## Тест-креденшали
- Адмін: admin@translate.ua / Translate2026! (сторінка /admin)

## Перевірено після розгортання
- Backend API: login, orders list, створення замовлення — OK
- Object storage ініціалізовано — OK
- Frontend рендериться (Home UA) — OK

## Аудит enhancement-pass (DEPTH / OBJECT / INTERACTION / HEADER)
Таск від користувача: 4-й enhancement-pass (не повний редизайн). Статус по коду:

### ✅ Реалізовано
1. **Hero Translation Desk** (Hero.jsx + index.css): 3 шари (оригінал / калька UA→DE / DE-переклад), UA/DE шкала, штамп OO, затискач, pointer-parallax через gsap.quickTo + preserve-3d + perspective 1300, guard на pointer:fine та reduced-motion
2. **Header** (Header.jsx): 3 модулі — brand + service-line, floating segmented nav-console з номерами секцій, actions (UA/DE + CTA); компактний floating-стан при скролі
3. **Cursor system** (CustomCursor.jsx): базова каретка + стани READ (data-doc) / SEND (data-cta) / UA⇄DE (data-lang) / EDIT (data-edit) / link; вимкнено на touch і reduced-motion
4. **Depth tokens** (index.css ~187): --z-bg/--z-paper-base/--z-paper-overlay/--z-annotation/--z-floating-ui, --shadow-paper-soft/raised
5. **SideSheet** (SideSheet.jsx): quick request (тип документа, напрямок, файл) → store → /order
6. **ManuscriptProof**: pin + scrub, 3 стани через dim (частково — див. нижче)
7. **Person**: паперова композиція з нотаткою, підписом, монограмою (базово)

### ❌ НЕ ЗАВЕРШЕНО (CSS написаний, але JSX-компоненти його НЕ використовують!)
1. **Method document journey**: класи .method-journey/.mj-doc/.mj-badge (b1–b5)/.mj-docwrap існують в index.css (~240), але Method.jsx досі стара вертикальна лінія — document token НЕ реалізований
2. **/work layered previews**: класи .work-stack/.ws1-3/.work-item:hover існують у CSS, але Work.jsx досі плоскі кольорові прямокутники
3. **Manuscript фізична сцена**: класи .ms-strike-anim (анімоване перекреслення слюсаря→токаря), .ms-mag (лупа), .ms-grid.is-depth, [data-stage] існують у CSS, але ManuscriptProof.jsx їх не використовує — досі 3 панелі в сітці з dim, без SVG-конекторів і лупи
4. **Header manuscript-labels** (01 ORIGINAL / 02 TRANSCRIPTION / 03 TRANSLATION під час ms-сцени) — не реалізовано
5. **Person depth-деталі**: загнутий край, різні parallax-швидкості шарів — не реалізовано
6. **/services hover document fragments** — не реалізовано

### Висновок
Enhancement-pass ЗАВЕРШЕНО ПОВНІСТЮ (13.07, фінальний прохід):
- ManuscriptProof.jsx переписано: фізична сцена (пін +240%), data-stage 0→1→2, один великий оригінал з лінуванням → калька-розшифровка (translateZ 50px) → DE-аркуш (translateZ 90px, Dreher підсвічено), SVG-конектори (stroke-dashoffset draw), типографічна лупа […], анімоване перекреслення «слюсаря» + поява «токаря» (.ms-strike-anim/.ms-fix-anim)
- Header: nav-console показує 01 · Original / 02 · Transcription / 03 · Translation через CustomEvent 'ms:stage' (тільки під час піну, desktop)
- Method.jsx: document journey — sticky .mj-doc, стейдж від progress ScrollTrigger (стійко до стрибків), бейджі received→analysed→translated→proofread→ready, olive translated layer, OK proof-штамп, чиста рамка s-ge-5
- Person.jsx: загнутий край (::before), OO blind emboss, .person-note поверх рамки, parallax 0.035 vs 0.1
- Work.jsx: .work-stack ws1/ws2/ws3, hover-розкриття, 3 варіанти композицій (wv0/wv1/wv2)
- Services.jsx: .svc-frag hover-фрагменти, 3 варіанти (sf0/sf1/sf2), на touch — завжди видимі
- CustomCursor: EDIT перевіряється перед READ (data-edit пріоритетніший за data-doc)
- Contact: success-блок з data-testid, checkmark, scrollIntoView
- Reduced-motion: стейджі одразу фінальні, курсор вимкнений, транзішни вимкнені
- Тестування: testing_agent iteration_1 — backend 100%, frontend 95% → 2 зауваження виправлені й верифіковані; production build чистий, консоль без помилок

## Адмін-панель + лідогенерація (14.07, поточна сесія) — ЗАВЕРШЕНО
### Backend (нове)
- `settings` колекція (doc id="site"): site{title,hero_title,hero_lead}, contacts{email,phone,telegram,whatsapp,viber,instagram,facebook}, notifications{enabled,resend_api_key,sender_email,recipient_email}
- GET /api/settings (публічний, БЕЗ resend_api_key), GET/PUT /api/admin/settings (JWT), POST /api/admin/settings/test-email (400 при помилці, не 502 — Cloudflare перехоплює 502), GET /api/admin/stats
- Resend-сповіщення (lib resend==2.33.0): нові orders/contacts → best-effort email через asyncio.create_task, збій НЕ блокує створення заявки
### Frontend (нове)
- /admin повністю переписано: лівий вертикальний сайдбар (adm-side), секції Заявки/Повідомлення/Налаштування, логін-картка, все в дизайн-системі сайту (adm-* класи в index.css)
- src/pages/admin/{adminApi.js,OrdersView,ContactsView,SettingsView}.jsx
- src/lib/settings.js: SettingsProvider + channelLinks (нормалізація t.me/wa.me/viber/instagram/facebook/mailto/tel)
- Footer + Contact: блок «Швидкий зв'язок» (chan-link) з каналів у налаштуваннях
- Hero: hero_title/hero_lead override з адмінки (h1 має key={heroTitle} — фікс GSAP-мутації DOM)
- Header nav-console: контрастніший (ink-ring активний пункт, охра-номери)
### Тестування iteration_1 (нове): backend 16/16, frontend 20/20 (після фіксу hero title)
### ВАЖЛИВО для користувача
- Resend API key вводиться в адмінці (Налаштування → 03) — потрібен ключ з resend.com; sender за замовч. onboarding@resend.dev (тест-режим Resend шле тільки на верифіковану пошту власника акаунта)

## Redeploy з GitHub (14.07, поточна сесія) — ЗАВЕРШЕНО
- Репозиторій https://github.com/svetlanaslinko057/23423gyhgYGGG синхронізовано в /app (backend, frontend, memory, tests)
- backend/.env відновлено: MONGO_URL, DB_NAME, CORS_ORIGINS, JWT_SECRET (48+ байт), ADMIN_EMAIL/PASSWORD, APP_NAME, EMERGENT_LLM_KEY (object storage)
- Залежності: pip -r requirements.txt (resend==2.33.0), yarn install (gsap, lenis, i18next)
- Превʼю: https://localization-suite.preview.emergentagent.com
- Нові фічі, знайдені в коді (пізніші за попередній PRD): Work items CRUD (Приклади) + reorder + image upload, Pricing (Ціни) + /api/estimate, Calculator.jsx, LeadWidget.jsx (FAQ-віджет з налаштувань), admin sidebar тепер 5 секцій
- Тестування iteration_1 (redeploy): backend 28/30 (2 «мінуси» — 422 замість 400 на валідації, семантично коректно), frontend 100%
- Hero override з адмінки перевірено вручну — працює (h1 key={heroTitle})
- Логічних обривів НЕ виявлено: всі frontend API-виклики мають відповідні backend-роути, всі 5 адмін-секцій працюють

## Мобільний адаптив (14.07, поточна сесія) — ЗАВЕРШЕНО
- index.css: секція «MOBILE ADAPTIVE PASS» (~150 рядків) — брейкпоінти 960/900/820/760/640/560px
- Header: виправлено «мертву зону» 901–960px (бургер тепер ≤960), CTA nowrap на планшеті, на ≤560px CTA схований (лишається в бургер-меню/hero/футері), бренд одним рядком (hd-brand/hd-cta класи в Header.jsx)
- Hero: менший display-шрифт (clamp 11vw) — заголовок не «скомкується», desk-композиція ≤340px
- Person: нотатка (.person-note) на мобільному перетікає під аркуш (relative, -1.6rem overlap) — не закриває підпис
- Order.jsx: 2-колонкові ряди форми → клас .form-2col, стек на ≤640px
- Calculator: напрям-select повна ширина на ≤560px (не обрізається), степпер компактний
- Work: 1 колонка, м'якші повороти аркушів (без 4px overflow), html/body overflow-x:clip ≤900px
- Admin: горизонтальний nav-rail без скролбару, компактні картки/блоки, savebar з тінню, картки статусів стек ≤560px
- Типографіка: hyphens:none для заголовків, шрифт зменшується замість переносів (вимога користувача)
- Тестування iteration_2: mobile 390x844 + tablet 768 + desktop 1920 regression — 100% після фіксу overflow (єдине зауваження 4px на /work виправлено, верифіковано 0px)
- Тест-дані очищено: pricing.note відновлено до дефолтного тексту

## Фавікон + мета (14.07, поточна сесія) — ЗАВЕРШЕНО
- public/: favicon.svg (адаптивний), favicon.ico (16/32/48), favicon-16/32/48.png, apple-touch-icon.png (180), icon-192/512.png, manifest.json
- Дизайн: монограма OO (два кола, друге 55% opacity) на кремовому фоні --paper з охра-крапкою --accent-2, згенеровано PIL зі скейлом з 1024px
- index.html: усі link rel=icon/apple-touch-icon/manifest, title «Oksana Oliferenko — переклади документів UA ⇄ DE», description, lang="uk", theme-color #F5F1E8
- document.title динамічно оверрайдиться з адмінки (site.title) — залишено як було

## SEO (14.07, поточна сесія) — ЗАВЕРШЕНО
- public/: robots.txt (Disallow /admin, Sitemap), sitemap.xml (6 сторінок), og-image.png (1200×630, PIL, фірмовий стиль)
- src/lib/seo.js: <Seo/> компонент у App.js — per-route title/description UA+DE, canonical, OG (type/site_name/title/desc/url/image/locale+alternate), Twitter card, JSON-LD ProfessionalService (availableLanguage uk/de, makesOffer 3 послуги, email/phone з settings), robots noindex для /admin, document.documentElement.lang = uk/de за i18n
- site.title з адмінки має пріоритет над SEO-title тільки на головній (логіку document.title перенесено з settings.js у seo.js)
- index.html: базові title/description/lang=uk/theme-color вже оновлені у фазі фавікона
- Тест-дані очищено: site.title «Test Edit Mobile» скинуто

## Redeploy wccxwecw343 (поточна сесія, 14.07) — ЗАВЕРШЕНО
- Репозиторій https://github.com/svetlanaslinko057/wccxwecw343 синхронізовано в /app (backend, frontend, memory, tests, plan.md, test_result.md)
- Превʼю: https://preview-translate-1.preview.emergentagent.com
- backend/.env відновлено: MONGO_URL, DB_NAME, CORS_ORIGINS, JWT_SECRET (96 hex), ADMIN_EMAIL/PASSWORD, APP_NAME=uatranslate, EMERGENT_LLM_KEY
- pip -r requirements.txt (resend 2.33.0) + yarn install — OK; supervisor restart — OK
- Object storage ініціалізовано, 7 work items засіяно (свіжа БД — pricing з дефолтами: urgent 30, certified 10)
- POC curl: login JWT ✓, /settings (resend_api_key прихований) ✓, /work (7) ✓, /pricing (7 doc_types + pair_multipliers + discounts) ✓, POST /orders з файлом + download /admin/files (HTTP 200) ✓, POST /contact ✓, POST /estimate (de-en, prepay, discount) ✓, /admin/stats ✓, test-email graceful 400 ✓
- Frontend: Home (hero translation desk, ManuscriptProof) ✓, /admin логін + панель (Заявки/Повідомлення/Приклади/Ціни/Налаштування) ✓, Ціни-в'ю з калькулятором ✓
- Тестові дані очищено (orders/contacts = 0)
- Статус: превʼю розгорнуто, очікуємо команду користувача з наступним таском/правками

## Правки-пас: CtaBand + мобайл + EN-згадка + зображення «Про мене» (14.07) — ЗАВЕРШЕНО
- **CtaBand redesign**: прибрано paddingTop:0 і «відірвану» пунктирну лінію на top:-1px; додано .ctab__perf — свідомий tear-off сепаратор над карткою з відступом (clamp 1.4–2.2rem) + .ctab-scene padding-top clamp(2.2–3.6rem). Мобайл: штамп OO перенесено у правий верхній кут (72px, opacity .5, за текстом) — більше не налазить на кнопки
- **ManuscriptProof EN**: 5-й пункт у примітках перекладача (UA/DE) про доступність англійської (UA ⇄ EN, DE ⇄ EN) + чіп ms-en (testid ms-en-note) на темному аркуші перекладу: «Також доступно: переклад англійською (EN)» / «Ebenfalls verfügbar…»; підсвітка stage 2 включає пункти 4 і 5
- **Зображення «Про мене»**: settings.site.about_image (бекенд DEFAULT_SETTINGS, дефолт — нейтральне editorial-фото пера unsplash photo-1455390582262-044cdead277a); About.jsx — editorial figure (about-figure, фальц, підпис DOCUMENT TRANSLATION · UA·DE·EN, sepia-фільтр), мобайл 16/10; адмінка Налаштування секція 01 — URL-поле + завантаження файлу (reuse /api/admin/work/upload) + прев'ю (testids settings-about-image / -file / -upload / -preview)
- **Мобайл-поліш**: msx-notescard padding/шрифти, esel__menu max-height, calc-promo чіпи, calc-nudge, about-grid 1fr; overflow 390px = 0
- **Тестування iteration_1**: backend 15/15, frontend desktop 7/7, mobile 5/5; «admin login не інтерактивний» — FALSE NEGATIVE (агент шукав input[type=email], у поля немає type; вручну логін працює). Тест-дані агента прибрано (orders/contacts=0, about_image відновлено)

## Redeploy ewfweew423 (поточна сесія, 14.07) — ЗАВЕРШЕНО
- Репозиторій https://github.com/svetlanaslinko057/ewfweew423 синхронізовано в /app (backend, frontend, memory, tests, plan.md, test_result.md)
- Превʼю: https://translation-preview-4.preview.emergentagent.com
- backend/.env відновлено: MONGO_URL, DB_NAME, CORS_ORIGINS, JWT_SECRET (96 hex), ADMIN_EMAIL/PASSWORD, APP_NAME=uatranslate, EMERGENT_LLM_KEY
- pip -r requirements.txt (resend) + yarn install — OK; supervisor restart — OK; object storage ініціалізовано, 7 work items засіяно (свіжа БД)
- POC curl 11/11: login JWT ✓, /settings (resend_api_key прихований, trust присутній) ✓, /work (7) ✓, /pricing (7 doc_types + pair_multipliers + discounts) ✓, GET /reviews (порожньо) ✓, POST /orders з файлом (code fa46af04) + download /admin/files HTTP 200 ✓, POST /orders/track (status_history) ✓, POST /contact ✓, /admin/stats (by_status + orders_last7 + reviews_total) ✓, /admin/reviews ✓, POST /estimate (лід створюється) ✓
- Frontend: Home (hero translation desk) ✓, /admin логін + панель (Заявки/Повідомлення/Приклади/Ціни/Налаштування) ✓
- Тестові дані очищено (orders/contacts/reviews = 0)
- **ВАЖЛИВИЙ АНАЛІЗ СТАНУ КОДУ (Phase 5 з plan.md):**
  - ✅ Phase 5A (backend) РЕАЛІЗОВАНО в коді: reviews CRUD + reorder, trust у settings, POST /orders/track, status_history, розширені /admin/stats
  - ❌ Phase 5B (public frontend) НЕ реалізовано: немає scenes/Reviews.jsx, components/Faq.jsx, components/TrustBand.jsx, немає tracking UI (код замовлення + форма статусу) в Order.jsx
  - ❌ Phase 5C (admin) НЕ реалізовано: немає DashboardView («Огляд»), ReviewsView («Відгуки»), trust-полів у SettingsView, фільтр-чипів у OrdersView
  - Це і є незакінчений таск — фронтенд-частина Phase 5 (5B + 5C + 5D тестування)
- Статус: превʼю розгорнуто, очікуємо команду користувача з наступним таском/правками

## Phase 5: Конверсія + глибина замовлень (14.07, поточна сесія) — ЗАВЕРШЕНО
### Баг-фікс файлів (репорт користувача)
- SideSheet («Надіслати документ» з hero) → повна швидка форма: ім'я, email, напрям, тип, N файлів, прямий POST /api/orders (без редиректу на форму), success з 8-значним кодом + copy
- LeadWidget вкладка «Заявка» → форма замовлення з файлами → /api/orders (раніше йшло в /contact → «Повідомлення»)
- Спільний компонент `components/QuickOrderForm.jsx` (testids sheet-*/widget-order-*), store.files (масив)
### Phase 5B (public)
- `scenes/Reviews.jsx` — паперові slip-картки (pin, зірки охра, штамп OO·VERIFIED, hover), приховано якщо немає опублікованих
- `components/Faq.jsx` — editorial акордеон з settings.widget.faq (одне джерело), Home + Contact, FAQPage JSON-LD (#faq-jsonld, cleanup on unmount)
- `components/TrustBand.jsx` — смуга цифр (роки/документи/год відповіді) з settings.trust, приховано якщо порожньо
- Order.jsx: success з кодом+copy, секція «Статус замовлення» (TrackSection: code+email → POST /api/orders/track → editorial timeline), багато файлів було
- Home: Hero→Expertise→TrustBand→Pricing→Manuscript→CtaBand→Reviews→Person→Method→Faq→CtaBand
- Локалі ua/de: quick.*, track.* (statuses), reviewsSec, faqSec, trustBand
### Phase 5C (admin, 7 секцій: Огляд/Заявки/Повідомлення/Відгуки/Приклади/Ціни/Налаштування)
- `DashboardView` «Огляд»: 7 стат-карток, останні 6 заявок (клік → Заявки), воронка статусів (бари)
- `ReviewsView` «Відгуки»: CRUD, зірки 1–5, publish-toggle, ↑↓ порядок, empty state
- OrdersView: фільтр-чипи зі счетчиками, № код (8 символів), історія статусів
- SettingsView: секція 05 «Цифри довіри» (toggle + 3 поля), FAQ relabel «FAQ та віджет допомоги», trust у save
- adminApi: reviews CRUD + reorder
### CSS: секції PHASE 5 (qform, order-success, trackx, revx, faqx, tband, adm-dash, adm-chips, adm-stars, adm-statusesel) + мобайл

## Мобільний адаптив калькулятора + editorial селекти в адмінці (14.07, поточна сесія) — ЗАВЕРШЕНО
### Баг-репорт користувача
1. **Калькулятор мобайл** (головна, /work, віджет): праві відступи не відпрацьовували, чекбокс-рядки ламались («Засвідчений переклад +10 €» переносилось потворно), CTA-кнопки в 2 рядки
2. **Адмінка**: сірі нативні `<select>` замість дизайн-системи
### Виправлення (index.css + JSX)
- База: `.calc-check` → align-items:flex-start + текст flex:1 min-width:0, `.calc-check em` → white-space:nowrap (ціна не відривається від лейбла)
- Секція «CALCULATOR MOBILE QUALITY PASS» (≤560px): симетричні відступи .calc/.calc__receipt (1.15rem 1rem / 1.2rem 1rem), компактні CTA (.6rem/.56rem letter-spacing .08em — кнопки в 1 рядок), prepay-картка .95rem .85rem, calc-line overflow-wrap, nudge/note/save зменшені; .lw-body 1rem .95rem
- Верифіковано скріншотами 390px: overflow 0px, кнопки однорядкові, гаттери симетричні
- **Адмін селекти**: OrdersView статус-селект → кастомний editorial Select (обгортка .adm-statusesel--{status} з кольорами статусів: нова=охра, в роботі=олива, виконано=олива inverse, відхилено=strike); PricingView валюта → Select (.adm-esel); CSS секція «admin editorial selects», меню правостороннє
### Тестування iteration_1: backend 96% (50/52, 2 «мінуси» = 422 vs 400, семантично ок), frontend 98%, overall 97%
- Всі пункти пройшли: мобайл калькулятор ×3 місця, селекти, quick order multi-files, reviews CRUD+Home, TrustBand, FAQ+JSON-LD, трекінг (+404), дашборд, фільтр-чипи, консоль чиста
- «DE локаль калькулятора не перемикається» — FALSE NEGATIVE, перевірено вручну (Dokumententyp/Beglaubigte Übersetzung/GESAMT рендеряться)
- Тест-дані агента прибрано: orders/contacts/reviews=0, pricing відновлено (note дефолтний, urgent 30, cert 10, extra 15, 3 volume tiers), site.hero_title скинуто

## Виділення «Оплата одразу» в калькуляторі (14.07) — ЗАВЕРШЕНО

- Prepay-опція перетворена на промо-картку (conversion): рамка dashed бронза + градієнт-тінт, бейдж «Вигідно»/«Vorteil» з пульсуючою крапкою (вимикається prefers-reduced-motion), жирний −5%, live-прев'ю економії «≈ −X €» (testid calc-prepay-save, рахується від r.base з урахуванням пари/терміновості)
- Стан is-on: solid olive рамка, тінь, бейдж і % міняють колір на accent
- Локалі ua/de: calc.prepayBadge; CSS: .calc-check--prepay* в index.css
- Перевірено: desktop on/off, DE-локаль, мобайл 390px (overflow 0), LeadWidget compact успадковує автоматично
