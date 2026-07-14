from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException, Header, Depends, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import copy
import html as html_lib
import logging
import uuid
import jwt
import asyncio
import re
import resend
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta

from storage import init_storage, put_object, get_object, APP_NAME, MIME_TYPES
from legal_defaults import LEGAL_DEFAULTS

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@translate.ua")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Translate2026!")
# Public site origin for links inside emails (tracking etc.); empty => links omitted
PUBLIC_BASE_URL = os.environ.get("PUBLIC_BASE_URL", "").rstrip("/")


def track_url(order_id: str) -> str:
    """Deep link to the order-tracking form on the public site."""
    return f"{PUBLIC_BASE_URL}/order?track={str(order_id)[:8]}" if PUBLIC_BASE_URL else ""

MAX_FILE_MB = 25
ALLOWED_EXT = {"pdf", "jpg", "jpeg", "png", "webp", "heic", "doc", "docx", "txt"}

app = FastAPI(title="UA-DE Document Translation API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uatranslate")


# ---------------------- Models ----------------------
class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: str = ""
    direction: str = "ua-de"
    doc_type: str = ""
    message: str = ""
    files: List[dict] = []
    status: str = "new"
    status_history: List[dict] = Field(
        default_factory=lambda: [{"status": "new", "at": datetime.now(timezone.utc).isoformat()}]
    )
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ContactCreate(BaseModel):
    name: str
    email: str
    message: str


class LoginRequest(BaseModel):
    email: str
    password: str


class SettingsPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")
    site: Dict[str, Any] = {}
    contacts: Dict[str, Any] = {}
    notifications: Dict[str, Any] = {}
    widget: Dict[str, Any] = {}
    trust: Dict[str, Any] = {}


class ReviewPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    meta: str = ""  # context line, e.g. "Договір · UA → DE"
    text: str
    rating: Optional[int] = None
    published: bool = True


class TrackRequest(BaseModel):
    code: str
    contact: str = ""  # email OR phone (single field)
    email: str = ""    # back-compat with older clients


class WorkItemPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str
    note: str = ""
    direction: str = "UA ⇄ DE"
    price_from: Optional[float] = None
    image_url: str = ""
    published: bool = True


class PricingPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")
    enabled: bool = True
    currency: str = "EUR"
    doc_types: List[Dict[str, Any]] = []
    extra_page_price: float = 15
    urgent_pct: float = 30
    certified_fee: float = 10
    note: str = ""
    note_de: str = ""
    note_en: str = ""
    pair_multipliers: Dict[str, Any] = {"ua-de": 1.0, "ua-en": 1.0, "de-en": 1.2}
    discounts: Dict[str, Any] = {
        "volume_enabled": True,
        "volume_tiers": [{"min_pages": 5, "pct": 5}, {"min_pages": 10, "pct": 10}, {"min_pages": 20, "pct": 15}],
        "prepay_enabled": True,
        "prepay_pct": 5,
    }


class EstimateRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    email: str = ""  # optional — at least one of email/phone is required
    phone: str = ""
    direction: str = "ua-de"
    doc_type: str = ""
    pages: int = 1
    urgent: bool = False
    certified: bool = False
    prepay: bool = False
    discount_pct: float = 0
    price: float = 0
    comment: str = ""


# 3 working languages -> 6 translation directions
DIRECTION_LABELS = {
    "ua-de": "UA → DE", "de-ua": "DE → UA",
    "ua-en": "UA → EN", "en-ua": "EN → UA",
    "de-en": "DE → EN", "en-de": "EN → DE",
}


def dir_label(direction: str) -> str:
    return DIRECTION_LABELS.get(direction, direction)


# ---------------------- Settings ----------------------
DEFAULT_SETTINGS = {
    "id": "site",
    "site": {
        "title": "", "hero_title": "", "hero_lead": "",
        # Neutral editorial image for the About page (admin-configurable; not a portrait by default)
        "about_image": "https://images.unsplash.com/photo-1455390582262-044cdead277a?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200",
        "work_fallback_image": "https://images.unsplash.com/photo-1695041713023-c08f364a4ea2?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200",
    },
    "contacts": {
        "email": "", "phone": "",
        "telegram": "", "whatsapp": "", "viber": "",
        "instagram": "", "facebook": "",
    },
    "notifications": {
        "enabled": False,
        "resend_api_key": "",
        "sender_email": "onboarding@resend.dev",
        "recipient_email": "",
    },
    "widget": {
        "enabled": True,
        "faq": [
            {"q": "Скільки триває переклад?", "a": "Стандартний документ — зазвичай 2–4 робочі дні. Точний строк я підтверджую після перегляду документа."},
            {"q": "Чи приймуть переклад офіційні установи?", "a": "Так. Переклади виконуються з дотриманням офіційних вимог, за потреби готуються для нотаріального засвідчення."},
            {"q": "Як відбувається оплата?", "a": "Після узгодження вартості та строку. Ви отримуєте підтвердження ціни до початку роботи."},
            {"q": "Чи конфіденційні мої документи?", "a": "Так. Усі матеріали обробляються суворо конфіденційно та не передаються третім особам."},
        ],
    },
    # Trust stats strip on the home page (admin-configurable, empty values are hidden)
    "trust": {
        "enabled": True,
        "years": "",
        "docs_count": "",
        "response_hours": "",
    },
}

DEFAULT_PRICING = {
    "id": "pricing",
    "enabled": True,
    "currency": "EUR",
    "doc_types": [
        {"name": "Свідоцтво / довідка", "name_de": "Urkunde / Bescheinigung", "name_en": "Certificate / official statement", "price": 35},
        {"name": "Довіреність", "name_de": "Vollmacht", "name_en": "Power of attorney", "price": 35},
        {"name": "Диплом з додатком", "name_de": "Diplom mit Anhang", "name_en": "Diploma with transcript", "price": 45},
        {"name": "Договір", "name_de": "Vertrag", "name_en": "Contract", "price": 45},
        {"name": "Судове рішення", "name_de": "Gerichtsentscheidung", "name_en": "Court decision", "price": 55},
        {"name": "Рукописний документ", "name_de": "Handschriftliches Dokument", "name_en": "Handwritten document", "price": 60},
        {"name": "Інший документ", "name_de": "Anderes Dokument", "name_en": "Other document", "price": 40},
    ],
    "extra_page_price": 15,
    "urgent_pct": 30,
    "certified_fee": 10,
    "note": "Орієнтовна вартість. Точну ціну та строк я підтверджую після перегляду документа.",
    "note_de": "Richtwert. Den genauen Preis und die Frist bestätige ich nach Durchsicht des Dokuments.",
    "note_en": "Estimated price. I confirm the exact price and deadline after reviewing the document.",
    # language pairs: base doc prices are for UA⇄DE; other pairs use a multiplier
    "pair_multipliers": {"ua-de": 1.0, "ua-en": 1.0, "de-en": 1.2},
    # conversion promos, fully admin-configurable
    "discounts": {
        "volume_enabled": True,
        "volume_tiers": [{"min_pages": 5, "pct": 5}, {"min_pages": 10, "pct": 10}, {"min_pages": 20, "pct": 15}],
        "prepay_enabled": True,
        "prepay_pct": 5,
    },
}

SEED_WORK_ITEMS = [
    {"title": "Договори", "title_de": "Verträge", "title_en": "Contracts",
     "note": "Купівля-продаж, оренда, трудові угоди", "note_de": "Kaufverträge, Miete, Arbeitsverträge", "note_en": "Sales, lease and employment agreements", "price_from": 45,
     "image_url": "https://images.unsplash.com/photo-1589330694653-ded6df03f754?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200"},
    {"title": "Довіреності", "title_de": "Vollmachten", "title_en": "Powers of attorney",
     "note": "Нотаріальні довіреності та заяви", "note_de": "Notarielle Vollmachten und Erklärungen", "note_en": "Notarial powers of attorney and declarations", "price_from": 35,
     "image_url": "https://images.unsplash.com/photo-1780246029794-2935f29d80b2?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200"},
    {"title": "Свідоцтва", "title_de": "Urkunden", "title_en": "Certificates",
     "note": "Народження, шлюб, розлучення", "note_de": "Geburt, Ehe, Scheidung", "note_en": "Birth, marriage, divorce", "price_from": 35,
     "image_url": "https://images.unsplash.com/photo-1559588501-59a118c47e59?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200"},
    {"title": "Дипломи", "title_de": "Diplome", "title_en": "Diplomas",
     "note": "Дипломи з додатками, атестати", "note_de": "Diplome mit Anhängen, Zeugnisse", "note_en": "Diplomas with transcripts, school certificates", "price_from": 45,
     "image_url": "https://images.unsplash.com/photo-1638636241638-aef5120c5153?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200"},
    {"title": "Рішення судів", "title_de": "Gerichtsentscheidungen", "title_en": "Court decisions",
     "note": "Рішення, ухвали, позовні заяви", "note_de": "Urteile, Beschlüsse, Klageschriften", "note_en": "Judgments, rulings, statements of claim", "price_from": 55,
     "image_url": "https://images.unsplash.com/photo-1554224155-cfa08c2a758f?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200"},
    {"title": "Архівні документи", "title_de": "Archivdokumente", "title_en": "Archival documents",
     "note": "Довідки, виписки, старі акти", "note_de": "Bescheinigungen, Auszüge, alte Urkunden", "note_en": "Certificates, extracts, old records", "price_from": 45,
     "image_url": "https://images.unsplash.com/photo-1526656001029-20a71b17f7ba?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200"},
    {"title": "Рукописи", "title_de": "Handschriften", "title_en": "Manuscripts",
     "note": "Листи, записи, історичні документи", "note_de": "Briefe, Aufzeichnungen, historische Dokumente", "note_en": "Letters, notes, historical documents", "price_from": 60,
     "image_url": "https://images.unsplash.com/photo-1561812938-f6e60cbf95e3?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200"},
]


def _merge_settings(stored: Optional[dict]) -> dict:
    merged = copy.deepcopy(DEFAULT_SETTINGS)
    if stored:
        for section in ("site", "contacts", "notifications", "widget", "trust"):
            sec = stored.get(section) or {}
            for k in merged[section]:
                if k in sec and sec[k] is not None:
                    merged[section][k] = sec[k]
    return merged


def _merge_pricing(stored: Optional[dict]) -> dict:
    merged = copy.deepcopy(DEFAULT_PRICING)
    if stored:
        for k in merged:
            if k != "id" and k in stored and stored[k] is not None:
                merged[k] = stored[k]
    return merged


async def get_settings() -> dict:
    doc = await db.settings.find_one({"id": "site"}, {"_id": 0})
    return _merge_settings(doc)


async def get_pricing() -> dict:
    doc = await db.settings.find_one({"id": "pricing"}, {"_id": 0})
    return _merge_pricing(doc)


# ---------------------- Email notifications (Resend) ----------------------
def _esc(v: str) -> str:
    return html_lib.escape(str(v or ""))


def _email_shell(title: str, rows: List[tuple], button: Optional[tuple] = None) -> str:
    trs = "".join(
        f'<tr><td style="padding:8px 14px;font-family:monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#8a8578;white-space:nowrap;vertical-align:top">{_esc(k)}</td>'
        f'<td style="padding:8px 14px;font-size:14px;color:#1B1B18">{_esc(v)}</td></tr>'
        for k, v in rows if str(v or "").strip()
    )
    btn = ""
    if button and button[1]:
        label, url = button
        btn = (
            f'<div style="padding:4px 14px 20px"><a href="{_esc(url)}" '
            'style="display:inline-block;background:#1B1B18;color:#F5F1E8;text-decoration:none;'
            'padding:12px 26px;border-radius:100px;font-family:monospace;font-size:12px;letter-spacing:.12em;text-transform:uppercase">'
            f'{_esc(label)}</a></div>'
        )
    return (
        '<div style="background:#F5F1E8;padding:32px 16px">'
        '<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;width:100%">'
        f'<tr><td style="padding:0 0 18px"><span style="font-family:monospace;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#39463D">Oksana Oliferenko · UA ⇄ DE</span></td></tr>'
        '<tr><td style="background:#FCFAF5;border:1px solid #DCD6C9;border-radius:10px;overflow:hidden">'
        f'<div style="padding:20px 14px 6px"><h2 style="margin:0;font-size:20px;color:#1B1B18;font-family:Georgia,serif">{_esc(title)}</h2></div>'
        f'<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:10px 0 16px">{trs}</table>'
        f'{btn}'
        '</td></tr>'
        '<tr><td style="padding:14px 2px"><span style="font-family:monospace;font-size:10px;letter-spacing:.12em;color:#8a8578">AUTOMATED NOTIFICATION · ADMIN PANEL</span></td></tr>'
        '</table></div>'
    )


def _send_via_resend(api_key: str, sender: str, recipient: str, subject: str, html: str) -> dict:
    resend.api_key = api_key
    return resend.Emails.send({
        "from": sender or "onboarding@resend.dev",
        "to": [recipient],
        "subject": subject,
        "html": html,
    })


async def notify_admin(subject: str, title: str, rows: List[tuple], button: Optional[tuple] = None):
    """Best-effort email notification. Never raises."""
    try:
        s = await get_settings()
        n = s["notifications"]
        if not n.get("enabled") or not n.get("resend_api_key") or not n.get("recipient_email"):
            return
        html = _email_shell(title, rows, button=button)
        result = await asyncio.to_thread(
            _send_via_resend, n["resend_api_key"], n.get("sender_email"), n["recipient_email"], subject, html
        )
        logger.info(f"Notification email sent: {result.get('id') if isinstance(result, dict) else result}")
    except Exception as e:
        logger.error(f"Notification email failed (non-blocking): {e}")


ORDER_STATUS_LABELS = {"new": "Отримано", "in_progress": "У роботі", "done": "Виконано", "declined": "Відхилено"}


async def notify_client_status(order: dict, status: str):
    """Best-effort status-change email to the CLIENT. Never raises, never blocks."""
    try:
        s = await get_settings()
        n = s["notifications"]
        if not n.get("enabled") or not n.get("resend_api_key") or not order.get("email"):
            return
        label = ORDER_STATUS_LABELS.get(status, status)
        code = str(order.get("id", ""))[:8]
        url = track_url(order.get("id", ""))
        html = _email_shell("Статус вашого замовлення оновлено", [
            ("Код замовлення", code),
            ("Новий статус", label),
            ("Документ", order.get("doc_type") or "—"),
            ("Напрям", dir_label(order.get("direction", ""))),
            ("Підказка", "Статус можна перевірити за кодом і вашим email або телефоном на сторінці «Замовити переклад» → «Статус замовлення»."),
        ], button=("Перевірити статус →", url))
        result = await asyncio.to_thread(
            _send_via_resend, n["resend_api_key"], n.get("sender_email"), order["email"],
            f"Статус замовлення {code}: {label}", html,
        )
        logger.info(f"Client status email sent: {result.get('id') if isinstance(result, dict) else result}")
    except Exception as e:
        logger.error(f"Client status email failed (non-blocking): {e}")


# ---------------------- Auth helpers ----------------------
def create_token(email: str) -> str:
    payload = {"sub": email, "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def verify_admin(authorization: Optional[str] = Header(None), auth: Optional[str] = None) -> str:
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
    elif auth:
        token = auth
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload["sub"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ---------------------- Public routes ----------------------
@api_router.get("/")
async def root():
    return {"status": "ok", "service": "uatranslate"}


@api_router.get("/settings")
async def public_settings():
    s = await get_settings()
    return {"site": s["site"], "contacts": s["contacts"], "widget": s["widget"], "trust": s["trust"]}


@api_router.get("/work")
async def public_work():
    items = await db.work_items.find({"published": True}, {"_id": 0}).sort("position", 1).to_list(200)
    return items


@api_router.get("/pricing")
async def public_pricing():
    p = await get_pricing()
    if not p.get("enabled"):
        return {"enabled": False}
    return p


@api_router.get("/reviews")
async def public_reviews():
    items = await db.reviews.find({"published": True}, {"_id": 0}).sort("position", 1).to_list(100)
    return items


@api_router.post("/orders/track")
async def track_order(payload: TrackRequest):
    """Track by code + contact (email OR phone) — phone-only leads can track too."""
    code = payload.code.strip().lower()
    contact = (payload.contact or payload.email or "").strip()
    if len(code) < 6 or not contact:
        raise HTTPException(status_code=400, detail="Вкажіть код замовлення (мін. 6 символів) та email або телефон")
    candidates = await db.orders.find(
        {"id": {"$regex": f"^{re.escape(code)}"}}, {"_id": 0}
    ).to_list(20)
    if "@" in contact:
        order = next((o for o in candidates if (o.get("email") or "").strip().lower() == contact.lower()), None)
    else:
        norm = re.sub(r"\D", "", contact)
        order = next((o for o in candidates if norm and re.sub(r"\D", "", o.get("phone") or "") == norm), None)
    if not order:
        raise HTTPException(status_code=404, detail="Замовлення не знайдено")
    history = order.get("status_history") or [{"status": order.get("status", "new"), "at": order.get("created_at")}]
    return {
        "code": str(order["id"])[:8],
        "status": order.get("status", "new"),
        "status_history": history,
        "created_at": order.get("created_at"),
        "direction": order.get("direction", ""),
        "doc_type": order.get("doc_type", ""),
    }


@api_router.post("/estimate")
async def create_estimate(payload: EstimateRequest):
    # Fast-lead: name + (email OR phone) is enough — the lead must reach admin instantly
    if not payload.name.strip() or (not payload.email.strip() and not payload.phone.strip()):
        raise HTTPException(status_code=400, detail="Вкажіть ім'я та телефон або email")
    p = await get_pricing()
    cur = p.get("currency", "EUR")
    d_label = dir_label(payload.direction)
    opts = []
    if payload.urgent:
        opts.append("терміново")
    if payload.certified:
        opts.append("засвідчений переклад")
    if payload.prepay:
        opts.append("передоплата")
    discount_note = f" · знижка {payload.discount_pct:g}%" if payload.discount_pct else ""
    msg = (
        f"[Запит з калькулятора]\n"
        f"Документ: {payload.doc_type or '—'} · {payload.pages} стор. · {d_label}"
        + (f" · {', '.join(opts)}" if opts else "")
        + f"\nОрієнтовна вартість: від {payload.price:g} {cur}{discount_note}"
        + (f"\nКоментар: {payload.comment.strip()}" if payload.comment.strip() else "")
    )
    order = Order(
        name=payload.name.strip(), email=payload.email.strip(), phone=payload.phone.strip(),
        direction=payload.direction, doc_type=payload.doc_type.strip(), message=msg,
    )
    await db.orders.insert_one(order.model_dump())
    logger.info(f"New estimate request {order.id} from {payload.email or payload.phone}")
    asyncio.create_task(notify_admin(
        f"Запит на прорахунок — {order.name}",
        "Запит на прорахунок вартості",
        [
            ("Ім'я", order.name), ("Email", order.email), ("Телефон", order.phone),
            ("Документ", payload.doc_type), ("Сторінок", str(payload.pages)),
            ("Напрям", d_label), ("Опції", ", ".join(opts)),
            ("Знижка", f"{payload.discount_pct:g}%" if payload.discount_pct else ""),
            ("Орієнтовна ціна", f"від {payload.price:g} {cur}"),
            ("Коментар", payload.comment),
            ("Код замовлення", order.id[:8]),
            ("Трекінг", track_url(order.id)),
        ],
    ))
    return {"id": order.id, "status": "received", "code": order.id[:8]}


@api_router.get("/media/{path:path}")
async def public_media(path: str):
    if not path.startswith(f"{APP_NAME}/work/"):
        raise HTTPException(status_code=404, detail="Not found")
    try:
        data, content_type = await asyncio.to_thread(get_object, path)
    except Exception:
        raise HTTPException(status_code=404, detail="Not found")
    return Response(content=data, media_type=content_type or "image/jpeg", headers={"Cache-Control": "public, max-age=86400"})


@api_router.post("/orders")
async def create_order(
    name: str = Form(...),
    email: str = Form(""),
    phone: str = Form(""),
    direction: str = Form("ua-de"),
    doc_type: str = Form(""),
    message: str = Form(""),
    files: List[UploadFile] = File(default=[]),
):
    # Fast-lead: name + (email OR phone) is enough
    if not name.strip() or (not email.strip() and not phone.strip()):
        raise HTTPException(status_code=400, detail="Вкажіть ім'я та телефон або email")

    order_id = str(uuid.uuid4())
    stored_files = []

    for f in files or []:
        if not f or not f.filename:
            continue
        ext = f.filename.rsplit(".", 1)[-1].lower() if "." in f.filename else "bin"
        if ext not in ALLOWED_EXT:
            raise HTTPException(status_code=400, detail=f"File type .{ext} is not allowed")
        data = await f.read()
        if len(data) > MAX_FILE_MB * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"File {f.filename} exceeds {MAX_FILE_MB}MB")
        path = f"{APP_NAME}/orders/{order_id}/{uuid.uuid4()}.{ext}"
        content_type = f.content_type or MIME_TYPES.get(ext, "application/octet-stream")
        try:
            result = await asyncio.to_thread(put_object, path, data, content_type)
        except Exception:
            raise HTTPException(status_code=502, detail="File storage is temporarily unavailable")
        stored_files.append({
            "id": str(uuid.uuid4()),
            "storage_path": result.get("path", path),
            "original_filename": f.filename,
            "content_type": content_type,
            "size": result.get("size", len(data)),
        })

    order = Order(
        id=order_id, name=name.strip(), email=email.strip(), phone=phone.strip(),
        direction=direction, doc_type=doc_type.strip(), message=message.strip(),
        files=stored_files,
    )
    await db.orders.insert_one(order.model_dump())
    logger.info(f"New order {order_id} from {email} with {len(stored_files)} file(s)")
    asyncio.create_task(notify_admin(
        f"Нова заявка на переклад — {order.name}",
        "Нова заявка на переклад",
        [
            ("Ім'я", order.name), ("Email", order.email), ("Телефон", order.phone),
            ("Напрям", dir_label(order.direction)),
            ("Тип документа", order.doc_type), ("Коментар", order.message),
            ("Файлів", str(len(stored_files)) if stored_files else ""),
            ("Код замовлення", order_id[:8]),
            ("Трекінг", track_url(order_id)),
        ],
    ))
    return {"id": order_id, "status": "received", "files": len(stored_files), "code": order_id[:8]}


@api_router.post("/contact")
async def create_contact(payload: ContactCreate):
    doc = {
        "id": str(uuid.uuid4()),
        "name": payload.name.strip(),
        "email": payload.email.strip(),
        "message": payload.message.strip(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.contacts.insert_one(doc)
    asyncio.create_task(notify_admin(
        f"Нове повідомлення — {doc['name']}",
        "Нове повідомлення з сайту",
        [("Ім'я", doc["name"]), ("Email", doc["email"]), ("Повідомлення", doc["message"])],
    ))
    return {"id": doc["id"], "status": "received"}


# ---------------------- Site content (CMS: full text content per language) ----------------------
CONTENT_LANGS = ("ua", "de", "en")


class SiteContentUpdate(BaseModel):
    content: dict = {}
    locale: dict = {}


@api_router.get("/content")
async def get_site_content():
    """Public: returns per-language content overrides for the frontend runtime merge."""
    docs = await db.site_content.find({}, {"_id": 0}).to_list(10)
    return {
        d["lang"]: {
            "content": d.get("content", {}),
            "locale": d.get("locale", {}),
            "updated_at": d.get("updated_at"),
        }
        for d in docs if d.get("lang") in CONTENT_LANGS
    }


@api_router.put("/admin/content/{lang}")
async def update_site_content(lang: str, payload: SiteContentUpdate, admin: str = Depends(verify_admin)):
    if lang not in CONTENT_LANGS:
        raise HTTPException(status_code=404, detail="Unknown language")
    await db.site_content.update_one(
        {"lang": lang},
        {"$set": {
            "lang": lang,
            "content": payload.content,
            "locale": payload.locale,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "updated_by": admin,
        }},
        upsert=True,
    )
    doc = await db.site_content.find_one({"lang": lang}, {"_id": 0})
    return doc


@api_router.delete("/admin/content/{lang}")
async def reset_site_content(lang: str, admin: str = Depends(verify_admin)):
    """Reset a language to built-in defaults (removes stored overrides)."""
    if lang not in CONTENT_LANGS:
        raise HTTPException(status_code=404, detail="Unknown language")
    await db.site_content.delete_one({"lang": lang})
    return {"status": "reset", "lang": lang}


# ---------------------- Legal pages (public + admin-editable) ----------------------
LEGAL_SLUGS = ("terms", "privacy", "cookies")


class LegalUpdate(BaseModel):
    title_ua: str
    title_de: str
    content_ua: str
    content_de: str
    title_en: str = ""
    content_en: str = ""


@api_router.get("/legal")
async def list_legal():
    docs = await db.legal_pages.find({}, {"_id": 0}).to_list(20)
    order = {s: i for i, s in enumerate(LEGAL_SLUGS)}
    docs.sort(key=lambda d: order.get(d.get("slug"), 99))
    return docs


@api_router.get("/legal/{slug}")
async def get_legal(slug: str):
    if slug not in LEGAL_SLUGS:
        raise HTTPException(status_code=404, detail="Unknown legal page")
    doc = await db.legal_pages.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Legal page not found")
    return doc


@api_router.put("/admin/legal/{slug}")
async def update_legal(slug: str, payload: LegalUpdate, admin: str = Depends(verify_admin)):
    if slug not in LEGAL_SLUGS:
        raise HTTPException(status_code=404, detail="Unknown legal page")
    update = {
        "title_ua": payload.title_ua.strip(),
        "title_de": payload.title_de.strip(),
        "title_en": payload.title_en.strip(),
        "content_ua": payload.content_ua.strip(),
        "content_de": payload.content_de.strip(),
        "content_en": payload.content_en.strip(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": admin,
    }
    await db.legal_pages.update_one({"slug": slug}, {"$set": update}, upsert=True)
    doc = await db.legal_pages.find_one({"slug": slug}, {"_id": 0})
    return doc


async def seed_legal_pages():
    """Insert default legal texts on first startup only; admin edits are never overwritten.
    Migration: if an existing document lacks the EN fields, they are added from defaults
    (UA/DE content edited by the admin is left untouched)."""
    for slug, data in LEGAL_DEFAULTS.items():
        existing = await db.legal_pages.find_one({"slug": slug})
        if not existing:
            await db.legal_pages.insert_one({
                "slug": slug,
                **data,
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "updated_by": "seed",
            })
            logger.info(f"Seeded legal page: {slug}")
        elif not existing.get("content_en"):
            await db.legal_pages.update_one(
                {"slug": slug},
                {"$set": {"title_en": data["title_en"], "content_en": data["content_en"]}},
            )
            logger.info(f"Migrated legal page to EN: {slug}")


# ---------------------- Admin routes ----------------------
@api_router.post("/auth/login")
async def login(payload: LoginRequest):
    if payload.email.strip().lower() != ADMIN_EMAIL.lower() or payload.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"token": create_token(payload.email.strip().lower()), "email": ADMIN_EMAIL}


@api_router.get("/admin/orders")
async def list_orders(admin: str = Depends(verify_admin)):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders


@api_router.get("/admin/contacts")
async def list_contacts(admin: str = Depends(verify_admin)):
    contacts = await db.contacts.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return contacts


@api_router.patch("/admin/orders/{order_id}")
async def update_order_status(order_id: str, status: str = Form(...), admin: str = Depends(verify_admin)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Замовлення не знайдено")
    entry = {"status": status, "at": datetime.now(timezone.utc).isoformat()}
    await db.orders.update_one({"id": order_id}, {"$set": {"status": status}, "$push": {"status_history": entry}})
    if order.get("status") != status:
        asyncio.create_task(notify_client_status(order, status))
    return {"id": order_id, "status": status}


@api_router.get("/admin/files/{path:path}")
async def download_file(path: str, authorization: Optional[str] = Header(None), auth: Optional[str] = None):
    verify_admin(authorization=authorization, auth=auth)
    order = await db.orders.find_one({"files.storage_path": path}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="File not found")
    file_meta = next((f for f in order["files"] if f["storage_path"] == path), None)
    try:
        data, content_type = await asyncio.to_thread(get_object, path)
    except Exception:
        raise HTTPException(status_code=502, detail="Storage unavailable")
    ct = file_meta.get("content_type", content_type) if file_meta else content_type
    return Response(content=data, media_type=ct)


@api_router.get("/admin/stats")
async def admin_stats(admin: str = Depends(verify_admin)):
    orders_total = await db.orders.count_documents({})
    by_status = {}
    for st in ("new", "in_progress", "done", "declined"):
        by_status[st] = await db.orders.count_documents({"status": st})
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    orders_last7 = await db.orders.count_documents({"created_at": {"$gte": week_ago}})
    contacts_total = await db.contacts.count_documents({})
    reviews_total = await db.reviews.count_documents({})
    return {
        "orders_total": orders_total,
        "orders_new": by_status["new"],
        "by_status": by_status,
        "orders_last7": orders_last7,
        "contacts_total": contacts_total,
        "reviews_total": reviews_total,
    }


@api_router.get("/admin/settings")
async def admin_get_settings(admin: str = Depends(verify_admin)):
    return await get_settings()


@api_router.put("/admin/settings")
async def admin_update_settings(payload: SettingsPayload, admin: str = Depends(verify_admin)):
    merged = _merge_settings(payload.model_dump())
    await db.settings.update_one({"id": "site"}, {"$set": merged}, upsert=True)
    logger.info("Site settings updated by admin")
    return merged


@api_router.post("/admin/settings/test-email")
async def admin_test_email(admin: str = Depends(verify_admin)):
    s = await get_settings()
    n = s["notifications"]
    if not n.get("resend_api_key"):
        raise HTTPException(status_code=400, detail="Resend API key не налаштовано")
    if not n.get("recipient_email"):
        raise HTTPException(status_code=400, detail="Email отримувача не налаштовано")
    html = _email_shell("Тестовий лист", [
        ("Статус", "Інтеграцію Resend налаштовано правильно"),
        ("Час", datetime.now(timezone.utc).strftime("%d.%m.%Y %H:%M UTC")),
    ])
    try:
        result = await asyncio.to_thread(
            _send_via_resend, n["resend_api_key"], n.get("sender_email"), n["recipient_email"],
            "Тестовий лист — адмін-панель", html,
        )
        return {"status": "sent", "email_id": result.get("id") if isinstance(result, dict) else None}
    except Exception as e:
        logger.error(f"Test email failed: {e}")
        raise HTTPException(status_code=400, detail=f"Не вдалося надіслати: {e}")


# ---------------------- Admin: work items ----------------------
@api_router.get("/admin/work")
async def admin_list_work(admin: str = Depends(verify_admin)):
    return await db.work_items.find({}, {"_id": 0}).sort("position", 1).to_list(200)


@api_router.post("/admin/work")
async def admin_create_work(payload: WorkItemPayload, admin: str = Depends(verify_admin)):
    last = await db.work_items.find({}, {"_id": 0, "position": 1}).sort("position", -1).to_list(1)
    pos = (last[0]["position"] + 1) if last else 0
    doc = {"id": str(uuid.uuid4()), "position": pos, "created_at": datetime.now(timezone.utc).isoformat(), **payload.model_dump()}
    await db.work_items.insert_one({**doc})
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/work/{item_id}")
async def admin_update_work(item_id: str, payload: WorkItemPayload, admin: str = Depends(verify_admin)):
    res = await db.work_items.update_one({"id": item_id}, {"$set": payload.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return await db.work_items.find_one({"id": item_id}, {"_id": 0})


@api_router.delete("/admin/work/{item_id}")
async def admin_delete_work(item_id: str, admin: str = Depends(verify_admin)):
    await db.work_items.delete_one({"id": item_id})
    return {"status": "deleted"}


@api_router.post("/admin/work/reorder")
async def admin_reorder_work(ids: List[str], admin: str = Depends(verify_admin)):
    for i, item_id in enumerate(ids):
        await db.work_items.update_one({"id": item_id}, {"$set": {"position": i}})
    return {"status": "ok"}


IMAGE_EXT = {"jpg", "jpeg", "png", "webp"}


@api_router.post("/admin/work/upload")
async def admin_upload_work_image(file: UploadFile = File(...), admin: str = Depends(verify_admin)):
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else ""
    if ext not in IMAGE_EXT:
        raise HTTPException(status_code=400, detail="Дозволені формати: JPG, PNG, WEBP")
    data = await file.read()
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Файл понад 8MB")
    path = f"{APP_NAME}/work/{uuid.uuid4()}.{ext}"
    content_type = file.content_type or MIME_TYPES.get(ext, "image/jpeg")
    try:
        await asyncio.to_thread(put_object, path, data, content_type)
    except Exception:
        raise HTTPException(status_code=400, detail="Сховище тимчасово недоступне")
    return {"url": f"/api/media/{path}"}


# ---------------------- Admin: reviews ----------------------
@api_router.get("/admin/reviews")
async def admin_list_reviews(admin: str = Depends(verify_admin)):
    return await db.reviews.find({}, {"_id": 0}).sort("position", 1).to_list(200)


@api_router.post("/admin/reviews")
async def admin_create_review(payload: ReviewPayload, admin: str = Depends(verify_admin)):
    if not payload.name.strip() or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Вкажіть ім'я та текст відгуку")
    last = await db.reviews.find({}, {"_id": 0, "position": 1}).sort("position", -1).to_list(1)
    pos = (last[0]["position"] + 1) if last else 0
    doc = {"id": str(uuid.uuid4()), "position": pos, "created_at": datetime.now(timezone.utc).isoformat(), **payload.model_dump()}
    await db.reviews.insert_one({**doc})
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/reviews/{review_id}")
async def admin_update_review(review_id: str, payload: ReviewPayload, admin: str = Depends(verify_admin)):
    res = await db.reviews.update_one({"id": review_id}, {"$set": payload.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Відгук не знайдено")
    return await db.reviews.find_one({"id": review_id}, {"_id": 0})


@api_router.delete("/admin/reviews/{review_id}")
async def admin_delete_review(review_id: str, admin: str = Depends(verify_admin)):
    await db.reviews.delete_one({"id": review_id})
    return {"status": "deleted"}


@api_router.post("/admin/reviews/reorder")
async def admin_reorder_reviews(ids: List[str], admin: str = Depends(verify_admin)):
    for i, review_id in enumerate(ids):
        await db.reviews.update_one({"id": review_id}, {"$set": {"position": i}})
    return {"status": "ok"}


# ---------------------- Admin: pricing ----------------------
@api_router.get("/admin/pricing")
async def admin_get_pricing(admin: str = Depends(verify_admin)):
    return await get_pricing()


@api_router.put("/admin/pricing")
async def admin_update_pricing(payload: PricingPayload, admin: str = Depends(verify_admin)):
    merged = _merge_pricing(payload.model_dump())
    await db.settings.update_one({"id": "pricing"}, {"$set": merged}, upsert=True)
    logger.info("Pricing updated by admin")
    return merged


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(",") if os.environ.get("CORS_ORIGINS") else ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Object storage initialised")
    except Exception as e:
        logger.error(f"Storage init failed (uploads may fail until fixed): {e}")
    # Seed work examples once (real document photos), admin manages afterwards
    try:
        if await db.work_items.count_documents({}) == 0:
            now = datetime.now(timezone.utc).isoformat()
            docs = [
                {"id": str(uuid.uuid4()), "position": i, "direction": "UA ⇄ DE", "published": True,
                 "created_at": now, **item}
                for i, item in enumerate(SEED_WORK_ITEMS)
            ]
            await db.work_items.insert_many(docs)
            logger.info(f"Seeded {len(docs)} work items")
        else:
            # Idempotent migration: add DE/EN translations to seeded items that lack them
            # (matched by original UA title; admin-edited fields are never overwritten)
            for item in SEED_WORK_ITEMS:
                res = await db.work_items.update_many(
                    {"title": item["title"], "title_de": {"$exists": False}},
                    {"$set": {
                        "title_de": item["title_de"], "title_en": item["title_en"],
                        "note_de": item["note_de"], "note_en": item["note_en"],
                    }},
                )
                if res.modified_count:
                    logger.info(f"Work item '{item['title']}': added DE/EN translations")
    except Exception as e:
        logger.error(f"Work items seed failed: {e}")
    try:
        await seed_legal_pages()
    except Exception as e:
        logger.error(f"Legal pages seed failed: {e}")


@app.on_event("shutdown")
async def shutdown():
    client.close()
