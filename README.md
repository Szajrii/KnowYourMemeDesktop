# Know Your Meme Desktop 🚀

Nowoczesna, elegancka i szybka aplikacja desktopowa do zarządzania, tagowania, wyszukiwania i szybkiego kopiowania Twojej kolekcji memów (obrazów, GIF-ów, wideo).

---

## 🌟 Główne Możliwości

- **Wszystko w jednym (Zero zbędnych serwerów / Dockera)**: Aplikacja działa jako pojedynczy proces desktopowy z wbudowaną szybką bazą danych.
- **Wielomediowa obsługa**:
  - Obrazy: JPG, PNG, WEBP, BMP, SVG, AVIF
  - Animacje: GIF (z podglądem i dedykowanym badge'em)
  - Wideo: MP4, WEBM, MKV, MOV (z automatycznym podglądem po najechaniu myszką i pełnym odtwarzaczem)
- **Szybkie akcje do memowania**:
  - **Kopiuj do schowka** – kopiuje obraz bezpośrednio do schowka systemowego (gotowy do wklejenia w Discord / Messenger / Reddit / Paint).
  - **Ulubione** – oznaczaj memy serduszkiem i filtruj jednym kliknięciem.
  - **Pokaż w eksploratorze** – szybkie przejście do oryginalnego pliku na dysku.
- **Zaawansowany system tagowania**:
  - Dodawanie wielu tagów do mema z podpowiedziami (autocomplete).
  - Kolorowanie tagów (wbudowana paleta i próbnik kolorów).
  - Masowe tagowanie (batch tagging dla wielu zaznaczonych memów naraz).
  - Tryb filtrowania tagów: **Dowolny (OR)** lub **Wszystkie (AND)**.
- **Szybkie filtrowanie i wyszukiwanie**:
  - Wyszukiwanie na żywo po nazwie pliku, tagach lub własnych notatkach.
  - Filtrowanie po typie: Obrazy / GIFy / Wideo.
  - Sortowanie: Najnowsze, Najstarsze, Nazwa A-Z, Nazwa Z-A, Rozmiar, Losowo.
- **Automatyczna synchronizacja z dyskiem**:
  - Obserwator folderów w czasie rzeczywistym (`chokidar`) – automatycznie wykrywa dodane, usunięte lub zmodyfikowane memy.

---

## ⚡ Uruchomienie Aplikacji

### Opcja 1: Uruchomienie 1-kliknięciem (Skrypt Launcher)
Uruchom plik:
```
launch.bat
```
Skrypt automatycznie zainstaluje zależności (jeśli to pierwsze uruchomienie) i włączy aplikację.

### Opcja 2: Tryb deweloperski przez terminal
```bash
npm install
npm run dev
```

### Opcja 3: Gotowy plik wykonywalny `.exe`
Gotowy skompilowany plik aplikacji znajduje się w:
```
release\win-unpacked\Know Your Meme Desktop.exe
```

---

## ⌨️ Skróty Klawiszowe

| Skrót | Akcja |
|-------|-------|
| `Ctrl + F` | Natychmiastowe przejście do wyszukiwarki memów |
| `Ctrl + A` | Zaznaczenie wszystkich aktualnie wyświetlanych memów |
| `←` / `→` | Przechodzenie do poprzedniego / następnego mema w trybie podglądu |
| `Esc` | Zamknięcie podglądu / modali / odznaczenie |

---

## 🛠️ Stack Technologiczny

- **Framework Desktop**: Electron 34 + TypeScript
- **Frontend**: Vue 3 (Composition API `<script setup>`) + Vite
- **Zarządzanie Stanem**: Pinia
- **Style & UI**: Tailwind CSS (Dark Mode) + Lucide Icons
- **Baza Danych**: Szybki, wbudowany magazyn JSON z automatycznym zapisem i synchronizacją
- **Budowanie**: Electron Builder (Target: Windows x64 NSIS & Portable)
