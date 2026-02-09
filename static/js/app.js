const reciterSelect = document.getElementById("reciter-select");
const surahSelect = document.getElementById("surah-select");
const fromAyahInput = document.getElementById("from-ayah");
const toAyahInput = document.getElementById("to-ayah");
const repeatCountInput = document.getElementById("repeat-count");
const totalLoopsInput = document.getElementById("total-loops");
const loadBtn = document.getElementById("load-btn");
const prevAyahBtn = document.getElementById("prev-ayah-btn");
const nextAyahBtn = document.getElementById("next-ayah-btn");
const playPauseBtn = document.getElementById("play-pause-btn");
const currentLabel = document.getElementById("current-label");
const progressText = document.getElementById("progress-text");
const ayahListEl = document.getElementById("ayah-list");
const audio = document.getElementById("audio");
const langSelect = document.getElementById("language-select");
const ayahTextArEl = document.getElementById("ayah-text-ar");
const ayahTextEnEl = document.getElementById("ayah-text-en");
const addSelectionPlaylistBtn = document.getElementById("add-selection-playlist-btn");
const playSelectionBtn = document.getElementById("play-selection-btn");
const playPlaylistBtn = document.getElementById("play-playlist-btn");
const clearPlaylistBtn = document.getElementById("clear-playlist-btn");
const playlistListEl = document.getElementById("playlist-list");
const ayahDelaySelect = document.getElementById("ayah-delay-select");
const speedSelect = document.getElementById("speed-select");
const repeatPlaylistInput = document.getElementById("repeat-playlist-input");
const reciterSearch = document.getElementById("reciter-search");
const surahSearch = document.getElementById("surah-search");
const reciterDisplay = document.getElementById("reciter-display");
const surahDisplay = document.getElementById("surah-display");
const reciterListEl = document.getElementById("reciter-list");
const surahListEl = document.getElementById("surah-list");

let currentLang = "en";

// Selection (current surah range)
let selectionTracks = []; // [{surah, surah_name_en, surah_name_ar, ayah, audio_url}]
let currentSurahMeta = null;

// Global playlist across surahs (as logical blocks)
// Each block: { id, tracks: [...], repeatEach, repeatSelection }
let playlistBlocks = [];

// Playback state
let currentQueue = []; // reference to either selectionTracks or playlistTracks
let currentQueueType = "selection"; // "selection" | "playlist"
let currentIndex = 0;
let currentAyahRepeat = 0;
let currentLoop = 0;
let maxAyahRepeats = 1;
let maxLoops = 1;
let isLoaded = false;
let ayahDelayMultiplier = 0; // base seconds multiplier between ayahs (0 = no delay)
let playbackSpeedMultiplier = 1;
let ayahDelayTimeout = null;
let currentPlaylistLoop = 1;
let maxPlaylistLoops = 1;

const translations = {
  en: {
    title: "Haffazny حفظني",
    subtitle: "Select a reciter, surah, and ayah range, then control repetitions.",
    language_label: "Language",
    reciter_label: "Reciter",
    surah_label: "Surah",
    from_ayah_label: "From ayah",
    to_ayah_label: "To ayah",
    repeat_each_label: "Repeat each ayah (0 = ∞)",
    repeat_selection_label: "Repeat selection (0 = ∞)",
    load_button: "Load selection",
    prev_ayah_button: "Prev ayah",
    play_button: "Play",
    next_ayah_button: "Next ayah",
    current_ayah_heading: "Current ayah",
    ayahs_in_selection_heading: "Ayahs in selection",
    playlist_heading: "Playlist",
    add_selection_button: "Add selection",
    play_selection_button: "Play selection",
    play_playlist_button: "Play playlist",
    clear_playlist_button: "Clear playlist",
    no_selection: "No selection loaded",
    finished_all_repeats: "Finished all repeats.",
    ayah_label: "Ayah",
    remove_from_playlist: "Remove",
    move_up: "Up",
    move_down: "Down",
    ayah_delay_label: "Ayah delay",
    playback_speed_label: "Playback speed",
    repeat_playlist_label: "Repeat playlist (0 = ∞)",
    combobox_placeholder: "Search or select...",
    link_documentation: "Documentation",
    link_contact: "Contact",
  },
  ar: {
    title: "Haffazny حفظني",
    subtitle: "اختر القارئ والسورة ونطاق الآيات، ثم تحكم في التكرار.",
    language_label: "اللغة",
    reciter_label: "القارئ",
    surah_label: "السورة",
    from_ayah_label: "من الآية",
    to_ayah_label: "إلى الآية",
    repeat_each_label: "تكرار كل آية (0 = ∞)",
    repeat_selection_label: "تكرار المقطع (0 = ∞)",
    load_button: "تحميل المقطع",
    prev_ayah_button: "الآية السابقة",
    play_button: "تشغيل",
    next_ayah_button: "الآية التالية",
    current_ayah_heading: "الآية الحالية",
    ayahs_in_selection_heading: "آيات المقطع",
    playlist_heading: "قائمة التشغيل",
    add_selection_button: "إضافة المقطع",
    play_selection_button: "تشغيل المقطع",
    play_playlist_button: "تشغيل قائمة التشغيل",
    clear_playlist_button: "مسح قائمة التشغيل",
    no_selection: "لم يتم تحميل مقطع بعد",
    finished_all_repeats: "انتهت كل التكرارات.",
    ayah_label: "آية",
    remove_from_playlist: "إزالة",
    move_up: "أعلى",
    move_down: "أسفل",
    ayah_delay_label: "تأخير الآية",
    playback_speed_label: "سرعة التشغيل",
    repeat_playlist_label: "تكرار قائمة التشغيل (0 = ∞)",
    combobox_placeholder: "بحث أو اختر...",
    link_documentation: "التوثيق",
    link_contact: "اتصل بنا",
  },
};

function applyTranslations() {
  document.documentElement.lang = currentLang;
  document.body.dir = currentLang === "ar" ? "rtl" : "ltr";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    const value = translations[currentLang][key];
    if (value) {
      el.textContent = value;
    }
  });

  // Reciter names
  Array.from(reciterSelect.options).forEach((opt) => {
    const nameEn = opt.dataset.nameEn;
    const nameAr = opt.dataset.nameAr;
    opt.textContent = currentLang === "ar" ? nameAr : nameEn;
  });

  // Surah names
  Array.from(surahSelect.options).forEach((opt) => {
    const nameEn = opt.dataset.nameEn;
    const nameAr = opt.dataset.nameAr;
    const num = opt.value.toString().padStart(3, "0");
    if (currentLang === "ar") {
      opt.textContent = `${num} - ${nameAr} (${nameEn})`;
    } else {
      opt.textContent = `${num} - ${nameEn} (${nameAr})`;
    }
  });

  // Sync combobox display and search placeholders
  if (reciterSelect.options.length) {
    reciterDisplay.textContent = reciterSelect.options[reciterSelect.selectedIndex].textContent;
  }
  if (surahSelect.options.length) {
    surahDisplay.textContent = surahSelect.options[surahSelect.selectedIndex].textContent;
  }
  const ph = translations[currentLang].combobox_placeholder;
  reciterSearch.placeholder = surahSearch.placeholder = ph;
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => { el.placeholder = ph; });
}

langSelect.addEventListener("change", () => {
  currentLang = langSelect.value;
  applyTranslations();
  renderAyahList();
  renderPlaylist();
});

// --- Searchable combobox for Reciter and Surah ---
function normalizeForSearch(s) {
  return (s == null || s === "" ? "" : String(s)).normalize("NFC").trim();
}

function getOptNameEn(opt) {
  const v = opt.getAttribute("data-name-en") || opt.dataset?.nameEn || "";
  return normalizeForSearch(v).toLowerCase();
}

function getOptNameAr(opt) {
  const v = opt.getAttribute("data-name-ar") || opt.dataset?.nameAr || "";
  return normalizeForSearch(v);
}

function filterReciterOptions(query) {
  const raw = normalizeForSearch(query);
  if (!raw) return Array.from(reciterSelect.options);
  const q = raw.toLowerCase();
  const qAr = raw.normalize("NFC");
  return Array.from(reciterSelect.options).filter((opt) => {
    const nameEn = getOptNameEn(opt);
    const nameAr = getOptNameAr(opt);
    const display = normalizeForSearch(opt.textContent || "").toLowerCase();
    return nameEn.includes(q) || nameAr.includes(qAr) || nameAr.includes(q) || display.includes(q) || display.includes(qAr);
  });
}

function filterSurahOptions(query) {
  const raw = normalizeForSearch(query);
  if (!raw) return Array.from(surahSelect.options);
  const q = raw.toLowerCase();
  const qAr = raw.normalize("NFC");
  return Array.from(surahSelect.options).filter((opt) => {
    const nameEn = getOptNameEn(opt);
    const nameAr = getOptNameAr(opt);
    const display = normalizeForSearch(opt.textContent || "").toLowerCase();
    const num = opt.value.toString().padStart(3, "0");
    const valStr = String(opt.value);
    return nameEn.includes(q) || nameAr.includes(qAr) || nameAr.includes(q) || display.includes(q) || display.includes(qAr) || num.includes(q) || valStr === raw || valStr === q;
  });
}

function refreshReciterList() {
  const options = filterReciterOptions(reciterSearch.value);
  reciterListEl.innerHTML = "";
  options.forEach((opt) => {
    const index = Array.from(reciterSelect.options).indexOf(opt);
    const div = document.createElement("div");
    div.className = "combobox-item";
    div.setAttribute("role", "option");
    div.textContent = opt.textContent;
    div.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      reciterSelect.selectedIndex = index;
      reciterDisplay.textContent = reciterSelect.options[reciterSelect.selectedIndex].textContent;
      reciterListEl.classList.remove("open");
    });
    reciterListEl.appendChild(div);
  });
}

function showReciterList() {
  refreshReciterList();
  reciterListEl.classList.add("open");
}

function refreshSurahList() {
  const options = filterSurahOptions(surahSearch.value);
  surahListEl.innerHTML = "";
  options.forEach((opt) => {
    const index = Array.from(surahSelect.options).indexOf(opt);
    const div = document.createElement("div");
    div.className = "combobox-item";
    div.setAttribute("role", "option");
    div.textContent = opt.textContent;
    div.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      surahSelect.selectedIndex = index;
      surahDisplay.textContent = surahSelect.options[surahSelect.selectedIndex].textContent;
      surahListEl.classList.remove("open");
      surahSelect.dispatchEvent(new Event("change"));
    });
    surahListEl.appendChild(div);
  });
}

function showSurahList() {
  refreshSurahList();
  surahListEl.classList.add("open");
}

function closeComboboxLists() {
  reciterListEl.classList.remove("open");
  surahListEl.classList.remove("open");
}

// Search field: filter the list (refresh list content when dropdown is open)
reciterSearch.addEventListener("input", () => {
  refreshReciterList();
});
reciterSearch.addEventListener("focus", () => showReciterList());
surahSearch.addEventListener("input", () => {
  refreshSurahList();
});
surahSearch.addEventListener("focus", () => showSurahList());

// Display (dropdown): click to open/close list
reciterDisplay.addEventListener("click", () => {
  if (reciterListEl.classList.toggle("open")) refreshReciterList();
});
surahDisplay.addEventListener("click", () => {
  if (surahListEl.classList.toggle("open")) refreshSurahList();
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".combobox")) closeComboboxLists();
});

// Sync display from select when selection is set programmatically (e.g. first load)
reciterSelect.addEventListener("change", () => {
  if (reciterSelect.options[reciterSelect.selectedIndex])
    reciterDisplay.textContent = reciterSelect.options[reciterSelect.selectedIndex].textContent;
});
surahSelect.addEventListener("change", () => {
  if (surahSelect.options[surahSelect.selectedIndex])
    surahDisplay.textContent = surahSelect.options[surahSelect.selectedIndex].textContent;
});

ayahDelaySelect.addEventListener("change", () => {
  const v = parseFloat(ayahDelaySelect.value || "1");
  ayahDelayMultiplier = Number.isFinite(v) ? v : 1;
});

speedSelect.addEventListener("change", () => {
  const v = parseFloat(speedSelect.value || "1");
  playbackSpeedMultiplier = v > 0 ? v : 1;
  audio.playbackRate = playbackSpeedMultiplier;
});

function clampAyahInputs() {
  const selectedOption = surahSelect.options[surahSelect.selectedIndex];
  const maxAyah = parseInt(selectedOption.dataset.ayahCount, 10);
  let from = parseInt(fromAyahInput.value || "1", 10);
  let to = parseInt(toAyahInput.value || "1", 10);
  if (from < 1) from = 1;
  if (to < 1) to = 1;
  if (from > maxAyah) from = maxAyah;
  if (to > maxAyah) to = maxAyah;
  if (to < from) to = from;
  fromAyahInput.value = from;
  toAyahInput.value = to;
}

surahSelect.addEventListener("change", () => {
  const selectedOption = surahSelect.options[surahSelect.selectedIndex];
  const maxAyah = parseInt(selectedOption.dataset.ayahCount, 10);
  fromAyahInput.value = 1;
  toAyahInput.value = maxAyah;
});

fromAyahInput.addEventListener("change", clampAyahInputs);
toAyahInput.addEventListener("change", clampAyahInputs);

async function loadSelection() {
  clampAyahInputs();
  const reciterId = reciterSelect.value;
  const surah = parseInt(surahSelect.value, 10);
  const fromAyah = parseInt(fromAyahInput.value, 10);
  const toAyah = parseInt(toAyahInput.value, 10);

  const repeatVal = parseInt(repeatCountInput.value || "1", 10);
  const loopsVal = parseInt(totalLoopsInput.value || "1", 10);
  maxAyahRepeats = repeatVal === 0 ? Infinity : Math.max(1, repeatVal);
  maxLoops = loopsVal === 0 ? Infinity : Math.max(1, loopsVal);

  try {
    const params = new URLSearchParams({
      reciter_id: reciterId,
      surah: String(surah),
      from_ayah: String(fromAyah),
      to_ayah: String(toAyah),
    });
    const res = await fetch(`/api/ayahs?${params.toString()}`);
    if (!res.ok) {
      throw new Error("Failed to load ayahs");
    }
    const data = await res.json();
    selectionTracks = data.items;
    currentSurahMeta = data.surah;
    currentQueueType = "selection";
    currentQueue = selectionTracks;
    currentIndex = 0;
    currentAyahRepeat = 0;
    currentLoop = 0;
    isLoaded = currentQueue.length > 0;
    renderAyahList();
    if (isLoaded) {
      loadCurrentAyah();
    } else {
      currentLabel.textContent = translations[currentLang].no_selection;
      progressText.textContent = "";
      audio.classList.add("hidden");
    }
  } catch (err) {
    console.error(err);
    alert("Could not load audio for the selected range.");
  }
}

function renderAyahList() {
  ayahListEl.innerHTML = "";
  currentQueueType = "selection";

  selectionTracks.forEach((item, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "ayah-item";

    const labelBtn = document.createElement("button");
    labelBtn.className = "ayah-label";
    const ayahWord = translations[currentLang].ayah_label;
    labelBtn.textContent = `${ayahWord} ${item.ayah}`;
    labelBtn.addEventListener("click", () => {
      currentQueueType = "selection";
      currentQueue = selectionTracks;
      currentIndex = index;
      currentAyahRepeat = 0;
      loadCurrentAyah(true);
    });

    const addBtn = document.createElement("button");
    addBtn.className = "ayah-add";
    addBtn.textContent = "+";
    addBtn.title = "Add to playlist";
    addBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      addSingleAyahToPlaylist(item);
    });

    wrapper.appendChild(labelBtn);
    wrapper.appendChild(addBtn);

    if (currentQueueType === "selection" && currentIndex === index) {
      wrapper.classList.add("active");
    }

    ayahListEl.appendChild(wrapper);
  });
}

function renderPlaylist() {
  playlistListEl.innerHTML = "";
  playlistBlocks.forEach((block, index) => {
    const row = document.createElement("div");
    row.className = "playlist-item";

    const infoBtn = document.createElement("button");
    infoBtn.className = "playlist-label";

    const first = block.tracks[0];
    const last = block.tracks[block.tracks.length - 1];
    const surahName = currentLang === "ar" ? first.surah_name_ar : first.surah_name_en;
    const fromAyah = first.ayah;
    const toAyah = last.ayah;

    const repeatEachLabel =
      block.repeatEach && block.repeatEach > 0 && block.repeatEach !== Infinity
        ? `×${block.repeatEach}`
        : "×∞";
    const repeatSelLabel =
      block.repeatSelection && block.repeatSelection > 0 && block.repeatSelection !== Infinity
        ? `×${block.repeatSelection}`
        : "×∞";

    const delayLabel = block.ayahDelay != null ? `${block.ayahDelay}x` : "1x";
    const speedLabel = block.playbackSpeed != null ? `${block.playbackSpeed}x` : "1x";
    infoBtn.textContent = `${surahName} (${fromAyah}-${toAyah}) | each ${repeatEachLabel}, all ${repeatSelLabel} | delay ${delayLabel}, speed ${speedLabel}`;
    infoBtn.addEventListener("click", () => {
      // Preview/play this block only
      const queue = expandBlockToQueue(block);
      if (queue.length === 0) return;
      currentQueueType = "playlist";
      currentQueue = queue;
      currentIndex = 0;
      currentAyahRepeat = 0;
      currentLoop = 0;
      maxAyahRepeats = 1;
      maxLoops = 1;
      isLoaded = true;
      loadCurrentAyah(true);
    });

    const controls = document.createElement("div");
    controls.className = "playlist-item-controls";

    const upBtn = document.createElement("button");
    upBtn.textContent = translations[currentLang].move_up;
    upBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      movePlaylistItem(index, -1);
    });

    const downBtn = document.createElement("button");
    downBtn.textContent = translations[currentLang].move_down;
    downBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      movePlaylistItem(index, 1);
    });

    const removeBtn = document.createElement("button");
    removeBtn.textContent = translations[currentLang].remove_from_playlist;
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeFromPlaylist(index);
    });

    controls.appendChild(upBtn);
    controls.appendChild(downBtn);
    controls.appendChild(removeBtn);

    row.appendChild(infoBtn);
    row.appendChild(controls);

    playlistListEl.appendChild(row);
  });
}

function movePlaylistItem(index, delta) {
  const newIndex = index + delta;
  if (newIndex < 0 || newIndex >= playlistBlocks.length) return;
  const [item] = playlistBlocks.splice(index, 1);
  playlistBlocks.splice(newIndex, 0, item);
  renderPlaylist();
}

function removeFromPlaylist(index) {
  playlistBlocks.splice(index, 1);
  renderPlaylist();
}

function getCurrentAyahDelay() {
  const v = parseFloat(ayahDelaySelect.value ?? "0");
  return Number.isFinite(v) ? v : 0;
}

function getCurrentPlaybackSpeed() {
  const v = parseFloat(speedSelect.value || "1");
  return v > 0 ? v : 1;
}

function createBlockFromTracks(tracks, repeatEach, repeatSelection, ayahDelay, playbackSpeed) {
  if (!tracks || tracks.length === 0) return null;
  return {
    id: Date.now() + Math.random(),
    tracks: tracks.map((t) => ({ ...t })),
    repeatEach,
    repeatSelection,
    ayahDelay: ayahDelay != null ? ayahDelay : 1,
    playbackSpeed: playbackSpeed != null ? playbackSpeed : 1,
  };
}

function addToPlaylistAsBlock(tracks, repeatEach, repeatSelection) {
  const block = createBlockFromTracks(
    tracks,
    repeatEach,
    repeatSelection,
    getCurrentAyahDelay(),
    getCurrentPlaybackSpeed()
  );
  if (!block) return;
  playlistBlocks.push(block);
  renderPlaylist();
}

function addSingleAyahToPlaylist(item) {
  addToPlaylistAsBlock([item], 1, 1);
}

function expandBlockToQueue(block) {
  const queue = [];
  const repeatEach =
    block.repeatEach && block.repeatEach > 0 && block.repeatEach !== Infinity
      ? block.repeatEach
      : 1;
  const repeatSelection =
    block.repeatSelection && block.repeatSelection > 0 && block.repeatSelection !== Infinity
      ? block.repeatSelection
      : 1;

  const blockDelay = block.ayahDelay != null ? block.ayahDelay : 1;
  const blockSpeed = block.playbackSpeed != null ? block.playbackSpeed : 1;

  for (let sel = 0; sel < repeatSelection; sel += 1) {
    block.tracks.forEach((track) => {
      for (let r = 0; r < repeatEach; r += 1) {
        queue.push({
          ...track,
          ayahDelayMultiplier: blockDelay,
          playbackSpeedMultiplier: blockSpeed,
        });
      }
    });
  }

  return queue;
}

function expandPlaylistBlocksToQueue() {
  let queue = [];
  playlistBlocks.forEach((block) => {
    queue = queue.concat(expandBlockToQueue(block));
  });
  return queue;
}

function updateAyahListHighlight() {
  const children = Array.from(ayahListEl.children);
  children.forEach((el, index) => {
    if (currentQueueType === "selection" && index === currentIndex) {
      el.classList.add("active");
    } else {
      el.classList.remove("active");
    }
  });
}

async function loadAyahText(item) {
  try {
    const res = await fetch(`/api/ayah-text?surah=${item.surah}&ayah=${item.ayah}`);
    if (!res.ok) return;
    const data = await res.json();
    ayahTextArEl.textContent = data.text_ar || "";
    ayahTextEnEl.textContent = data.text_en || "";
  } catch (e) {
    console.error("Failed to load ayah text", e);
  }
}

function loadCurrentAyah(autoPlay = false) {
  if (!isLoaded || currentQueue.length === 0) return;
  if (ayahDelayTimeout) {
    clearTimeout(ayahDelayTimeout);
    ayahDelayTimeout = null;
  }
  const item = currentQueue[currentIndex];
  const speed = item.playbackSpeedMultiplier != null ? item.playbackSpeedMultiplier : playbackSpeedMultiplier;
  audio.src = item.audio_url;
  audio.load();
  audio.classList.remove("hidden");
  audio.playbackRate = speed > 0 ? speed : 1;

  const repeatTotalStr = maxAyahRepeats === Infinity ? "∞" : String(maxAyahRepeats);
  const loopTotalStr = maxLoops === Infinity ? "∞" : String(maxLoops);

  const ayahWord = translations[currentLang].ayah_label;
  const surahName = currentLang === "ar" ? item.surah_name_ar : item.surah_name_en;
  currentLabel.textContent = `${surahName} - ${ayahWord} ${item.ayah} (repeat ${currentAyahRepeat + 1}/${repeatTotalStr}, loop ${currentLoop + 1}/${loopTotalStr})`;
  let progress = `${ayahWord} ${currentIndex + 1} / ${currentQueue.length}`;
  if (currentQueueType === "playlist" && maxPlaylistLoops !== undefined) {
    const loopStr = maxPlaylistLoops === Infinity ? "∞" : String(maxPlaylistLoops);
    progress += ` | Playlist ${currentPlaylistLoop}/${loopStr}`;
  }
  progressText.textContent = progress;

  updateAyahListHighlight();
  loadAyahText(item);

  if (autoPlay) {
    audio.play().catch(() => {});
  }
}

function goToNextAyah(manual = false) {
  if (!isLoaded) return;

  if (!manual) {
    // Automatic flow with repeats and loops
    if (currentAyahRepeat + 1 < maxAyahRepeats) {
      currentAyahRepeat += 1;
      loadCurrentAyah(true);
      return;
    }

    currentAyahRepeat = 0;

    if (currentIndex + 1 < currentQueue.length) {
      currentIndex += 1;
      loadCurrentAyah(true);
      return;
    }

    // End of ayahs in this loop
    if (currentLoop + 1 < maxLoops) {
      currentLoop += 1;
      currentIndex = 0;
      currentAyahRepeat = 0;
      loadCurrentAyah(true);
      return;
    }

    // Finished all loops (unless infinite)
    if (maxLoops === Infinity) {
      currentIndex = 0;
      currentAyahRepeat = 0;
      loadCurrentAyah(true);
      return;
    }

    // When playing playlist: optionally repeat the whole playlist
    if (currentQueueType === "playlist" && (maxPlaylistLoops === Infinity || currentPlaylistLoop < maxPlaylistLoops)) {
      currentPlaylistLoop += 1;
      currentIndex = 0;
      currentAyahRepeat = 0;
      currentLoop = 0;
      loadCurrentAyah(true);
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    currentLabel.textContent = translations[currentLang].finished_all_repeats;
    progressText.textContent = "";
    return;
  }

  // Manual navigation: move to next ayah, reset repeats but keep loop
  if (currentIndex + 1 < currentQueue.length) {
    currentIndex += 1;
  } else {
    currentIndex = 0;
  }
  currentAyahRepeat = 0;
  loadCurrentAyah(true);
}

function goToPrevAyah() {
  if (!isLoaded) return;
  if (currentIndex - 1 >= 0) {
    currentIndex -= 1;
  } else {
    currentIndex = currentQueue.length - 1;
  }
  currentAyahRepeat = 0;
  loadCurrentAyah(true);
}

loadBtn.addEventListener("click", () => {
  loadSelection();
});

playPauseBtn.addEventListener("click", () => {
  if (!isLoaded) return;
  if (audio.paused) {
    audio.play().catch(() => {});
    playPauseBtn.textContent = translations[currentLang].play_button.replace("Play", "Pause");
  } else {
    audio.pause();
    playPauseBtn.textContent = translations[currentLang].play_button;
  }
});

prevAyahBtn.addEventListener("click", () => {
  goToPrevAyah();
});

nextAyahBtn.addEventListener("click", () => {
  goToNextAyah(true);
});

audio.addEventListener("ended", () => {
  playPauseBtn.textContent = translations[currentLang].play_button;
  if (ayahDelayTimeout) {
    clearTimeout(ayahDelayTimeout);
  }
  const item = currentQueue[currentIndex];
  const delayMult = item && item.ayahDelayMultiplier != null ? item.ayahDelayMultiplier : ayahDelayMultiplier;
  const baseDelayMs = 1000; // 1 second base
  const delayMs = Math.max(0, delayMult * baseDelayMs);
  if (delayMs === 0) {
    goToNextAyah(false);
  } else {
    ayahDelayTimeout = setTimeout(() => {
      ayahDelayTimeout = null;
      goToNextAyah(false);
    }, delayMs);
  }
});

audio.addEventListener("play", () => {
  playPauseBtn.textContent = translations[currentLang].play_button.replace("Play", "Pause");
});

audio.addEventListener("pause", () => {
  playPauseBtn.textContent = translations[currentLang].play_button;
});

playSelectionBtn.addEventListener("click", () => {
  if (selectionTracks.length === 0) return;
  currentQueueType = "selection";
  currentQueue = selectionTracks;
  currentIndex = 0;
  currentAyahRepeat = 0;
  currentLoop = 0;
  isLoaded = true;
  loadCurrentAyah(true);
});

playPlaylistBtn.addEventListener("click", () => {
  if (playlistBlocks.length === 0) return;
  const queue = expandPlaylistBlocksToQueue();
  if (queue.length === 0) return;
  const repeatVal = parseInt(repeatPlaylistInput.value || "1", 10);
  maxPlaylistLoops = repeatVal === 0 ? Infinity : Math.max(1, repeatVal);
  currentPlaylistLoop = 1;
  currentQueueType = "playlist";
  currentQueue = queue;
  currentIndex = 0;
  currentAyahRepeat = 0;
  currentLoop = 0;
  maxAyahRepeats = 1;
  maxLoops = 1;
  isLoaded = true;
  loadCurrentAyah(true);
});

clearPlaylistBtn.addEventListener("click", () => {
  playlistBlocks = [];
  renderPlaylist();
});

addSelectionPlaylistBtn.addEventListener("click", () => {
  if (selectionTracks.length === 0) {
    alert("Load a selection first.");
    return;
  }

  // Use current repetition settings as block configuration
  const repeatVal = parseInt(repeatCountInput.value || "1", 10);
  const loopsVal = parseInt(totalLoopsInput.value || "1", 10);
  const blockRepeatEach = repeatVal === 0 ? Infinity : Math.max(1, repeatVal);
  const blockRepeatSelection = loopsVal === 0 ? Infinity : Math.max(1, loopsVal);

  addToPlaylistAsBlock(selectionTracks, blockRepeatEach, blockRepeatSelection);
});

// Initial language application
applyTranslations();

