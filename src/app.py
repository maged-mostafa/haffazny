import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Dict, Tuple

import httpx
import markdown
from fastapi import FastAPI, Query, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, EmailStr

from .config import RECITERS, SURAHS, get_reciter, get_surah


BASE_DIR = Path(__file__).resolve().parent.parent

app = FastAPI(title="Haffazny حفظني")

# Static & templates
static_dir = BASE_DIR / "static"
templates_dir = BASE_DIR / "templates"

app.mount("/static", StaticFiles(directory=static_dir), name="static")
templates = Jinja2Templates(directory=str(templates_dir))


def format_ayah_filename(surah_number: int, ayah_number: int) -> str:
    # EveryAyah format: SSSAAA.mp3
    return f"{surah_number:03d}{ayah_number:03d}.mp3"


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "reciters": RECITERS,
            "surahs": SURAHS,
        },
    )


# --- Documentation (render README as HTML) ---
README_PATH = BASE_DIR / "README.md"


@app.get("/documentation", response_class=HTMLResponse)
async def documentation(request: Request):
    content_html = ""
    if README_PATH.exists():
        raw = README_PATH.read_text(encoding="utf-8")
        content_html = markdown.markdown(raw, extensions=["fenced_code", "tables"])
    return templates.TemplateResponse(
        "documentation.html",
        {"request": request, "content": content_html},
    )


# --- Contact form and email ---
class ContactBody(BaseModel):
    name: str
    email: EmailStr
    subject: str = ""
    message: str


def _send_contact_email(name: str, email: str, subject: str, message: str) -> None:
    to_email = os.environ.get("CONTACT_TO_EMAIL")
    if not to_email:
        raise ValueError("CONTACT_TO_EMAIL is not set")
    smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ.get("SMTP_USER")
    smtp_password = os.environ.get("SMTP_PASSWORD")
    if not smtp_user or not smtp_password:
        raise ValueError("SMTP_USER and SMTP_PASSWORD must be set")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"[Haffazny] {subject or 'Contact form'}"
    msg["From"] = smtp_user
    msg["To"] = to_email

    text = f"From: {name} <{email}>\n\nSubject: {subject or '(none)'}\n\n{message}"
    msg.attach(MIMEText(text, "plain"))

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, to_email, msg.as_string())


@app.get("/privacy-policy", response_class=HTMLResponse)
async def privacy_page(request: Request):
    return templates.TemplateResponse("privacy.html", {"request": request})


@app.get("/contact", response_class=HTMLResponse)
async def contact_page(request: Request):
    return templates.TemplateResponse("contact.html", {"request": request})


@app.post("/api/contact")
async def contact_send(body: ContactBody):
    try:
        _send_contact_email(body.name, body.email, body.subject, body.message)
        return {"success": True, "message": "Sent."}
    except ValueError as e:
        return JSONResponse(
            content={"success": False, "detail": str(e)},
            status_code=503,
        )
    except Exception:
        return JSONResponse(
            content={"success": False, "detail": "Could not send email. Please try again later."},
            status_code=500,
        )


@app.get("/api/ayahs")
async def get_ayahs(
    reciter_id: str = Query(...),
    surah: int = Query(..., ge=1, le=114),
    from_ayah: int = Query(1, ge=1),
    to_ayah: int = Query(..., ge=1),
):
    surah_meta = get_surah(surah)

    if from_ayah > surah_meta.ayah_count:
        from_ayah = surah_meta.ayah_count
    if to_ayah > surah_meta.ayah_count:
        to_ayah = surah_meta.ayah_count
    if to_ayah < from_ayah:
        to_ayah = from_ayah

    reciter = get_reciter(reciter_id)

    items = []
    for ayah in range(from_ayah, to_ayah + 1):
        filename = format_ayah_filename(surah, ayah)
        url = reciter.base_url.rstrip("/") + "/" + filename
        items.append(
            {
                "surah": surah_meta.number,
                "surah_name_en": surah_meta.name_en,
                "surah_name_ar": surah_meta.name_ar,
                "ayah": ayah,
                "audio_url": url,
            }
        )

    return {
        "reciter": {
            "id": reciter.id,
            "name_en": reciter.name_en,
            "name_ar": reciter.name_ar,
        },
        "surah": {
            "number": surah_meta.number,
            "name_en": surah_meta.name_en,
            "name_ar": surah_meta.name_ar,
            "ayah_count": surah_meta.ayah_count,
        },
        "from_ayah": from_ayah,
        "to_ayah": to_ayah,
        "items": items,
    }


_ayah_text_cache: Dict[Tuple[int, int], Dict[str, str]] = {}


@app.get("/api/ayah-text")
async def get_ayah_text(surah: int = Query(..., ge=1, le=114), ayah: int = Query(..., ge=1)):
    """
    Return Arabic and English text for a single ayah.
    Uses api.alquran.cloud and caches results in memory.
    """
    key = (surah, ayah)
    if key in _ayah_text_cache:
        return {
            "surah": surah,
            "ayah": ayah,
            "text_ar": _ayah_text_cache[key]["ar"],
            "text_en": _ayah_text_cache[key]["en"],
        }

    ar_edition = "quran-uthmani"
    en_edition = "en.asad"

    async with httpx.AsyncClient(timeout=10.0) as client:
        ar_resp = await client.get(f"https://api.alquran.cloud/v1/ayah/{surah}:{ayah}/{ar_edition}")
        en_resp = await client.get(f"https://api.alquran.cloud/v1/ayah/{surah}:{ayah}/{en_edition}")

    ar_resp.raise_for_status()
    en_resp.raise_for_status()

    ar_text = ar_resp.json()["data"]["text"]
    en_text = en_resp.json()["data"]["text"]

    _ayah_text_cache[key] = {"ar": ar_text, "en": en_text}

    return {
        "surah": surah,
        "ayah": ayah,
        "text_ar": ar_text,
        "text_en": en_text,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("src.app:app", host="0.0.0.0", port=8000, reload=True)

