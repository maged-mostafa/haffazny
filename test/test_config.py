from src.config import RECITERS, SURAHS, get_reciter, get_surah


def test_reciters_not_empty():
    assert len(RECITERS) > 0


def test_get_reciter_valid():
    first_id = RECITERS[0].id
    r = get_reciter(first_id)
    assert r.id == first_id
    assert r.base_url.startswith("https://everyayah.com/data/")


def test_surahs_114():
    assert len(SURAHS) == 114


def test_get_surah_valid():
    s = get_surah(1)
    assert s.number == 1
    assert s.ayah_count == 7

