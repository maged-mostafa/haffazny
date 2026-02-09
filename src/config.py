from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List, Dict, Any

import yaml


BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
PAR_DIR = ROOT_DIR / "par"


@dataclass
class Reciter:
    id: str
    name_en: str
    name_ar: str
    base_url: str


@dataclass
class SurahMeta:
    number: int
    name_en: str
    name_ar: str
    ayah_count: int


def _load_yaml(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def _load_reciters() -> List[Reciter]:
    data = _load_yaml(PAR_DIR / "reciters.yml")
    items = []
    for r in data.get("reciters", []):
        items.append(
            Reciter(
                id=r["id"],
                name_en=r["name_en"],
                name_ar=r["name_ar"],
                base_url=r["base_url"].rstrip("/") + "/",
            )
        )
    return items


def _load_surahs() -> List[SurahMeta]:
    data = _load_yaml(PAR_DIR / "surahs.yml")
    items = []
    for s in data.get("surahs", []):
        items.append(
            SurahMeta(
                number=int(s["number"]),
                name_en=s["name_en"],
                name_ar=s["name_ar"],
                ayah_count=int(s["ayah_count"]),
            )
        )
    return items


RECITERS: List[Reciter] = _load_reciters()
SURAHS: List[SurahMeta] = _load_surahs()


def get_reciter(reciter_id: str) -> Reciter:
    for r in RECITERS:
        if r.id == reciter_id:
            return r
    raise KeyError(f"Unknown reciter id: {reciter_id}")


def get_surah(number: int) -> SurahMeta:
    for s in SURAHS:
        if s.number == number:
            return s
    raise KeyError(f"Unknown surah number: {number}")

