## Contributing

Thanks for contributing.

### Setup

```bash
python -m venv .venv
pip install -r requirements.txt -r requirements-dev.txt
```

### Run locally

```bash
python -m uvicorn src.app:app --reload
```

### Run tests

```bash
pytest
```

### Project conventions

- **Config** lives in `par/*.yml`
- Keep UI text translatable via `data-i18n` and the `translations` object in `static/js/app.js`

