# Haffazny حفظني

Web app to select a Sheikh (reciter), choose a surah + ayah range, repeat ayahs/selection (including infinity), and build a multi-surah playlist of selections.

## Features

- **Reciter selection** (data stored in `par/reciters.yml`)
- **Surah + ayah range selection** (data stored in `par/surahs.yml`)
- **Repetition**
  - Repeat each ayah: set to `0` for infinity
  - Repeat selection: set to `0` for infinity
- **Language toggle**: English / Arabic UI + reciter/surah names
- **Ayah text**: shows Arabic + English text for the current ayah
- **Playlist**
  - Add individual ayahs with `+`
  - Add the loaded selection as a **single block** (keeps repeat settings)
  - Reorder / remove blocks

## Tech stack

- **Backend**: Python + FastAPI
- **Frontend**: HTML + CSS + Vanilla JS
- **Audio**: EveryAyah verse-by-verse MP3 URLs (filename format `SSSAAA.mp3`)
- **Ayah text API**: `api.alquran.cloud` (cached in-memory)

## Project structure

```
.
├── par/
│   ├── reciters.yml
│   └── surahs.yml
├── src/
│   ├── __init__.py
│   ├── app.py
│   └── config.py
├── static/
│   ├── css/style.css
│   └── js/app.js
├── templates/
│   └── index.html
├── test/
│   └── test_config.py
├── requirements.txt
├── requirements-dev.txt
├── Dockerfile
├── docker-compose.yml
└── Jenkinsfile
```

## Run locally

### 1) Create a virtual environment (recommended)

```bash
python -m venv .venv
```

Activate:

- Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

### 2) Install dependencies

```bash
pip install -r requirements.txt -r requirements-dev.txt
```

### 3) Run the server

```bash
python -m uvicorn src.app:app --reload
```

Open `http://127.0.0.1:8000`.

## Run with Docker

```bash
docker compose up --build
```

Open `http://127.0.0.1:8000`.

## Run tests

```bash
pytest
```

## Configuration

- **Reciters**: `par/reciters.yml`
- **Surahs**: `par/surahs.yml`

After editing YAML files, restart the server.

## Contact form (email)

The **Contact** page sends messages via SMTP. Set these environment variables (e.g. in `.env` or your host):

- `CONTACT_TO_EMAIL` – address that receives the form submissions
- `SMTP_HOST` – e.g. `smtp.gmail.com` (default)
- `SMTP_PORT` – e.g. `587` (default)
- `SMTP_USER` – your SMTP login
- `SMTP_PASSWORD` – your SMTP password (or app password for Gmail)

If these are not set, the Contact form will return a “not configured” message.

## Notes

- If `api.alquran.cloud` is down/slow, ayah text may not load; audio still works.
- Audio URLs depend on EveryAyah directories for each reciter.

