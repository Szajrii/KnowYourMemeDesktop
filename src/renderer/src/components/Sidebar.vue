<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMemeStore } from '../stores/memeStore'
import {
  Folder,
  FolderPlus,
  Heart,
  Image,
  Film,
  Sparkles,
  Layers,
  Tags,
  RefreshCw,
  Trash2,
  Settings2,
  X,
  Search,
  Palette,
  Copy,
  FileSearch
} from 'lucide-vue-next'

import { AppTheme } from '../../../shared/types'

const store = useMemeStore()
const emit = defineEmits<{
  (e: 'openTagManager'): void
  (e: 'openDuplicates'): void
}>()

const tagSearch = ref('')
const showThemeModal = ref(false)

const themesList: {
  id: AppTheme
  name: string
  icon: string
  category: 'light' | 'dark'
  desc: string
  previewColors: string[]
}[] = [
  // Jasne
  { id: 'light', name: 'Klasyczny Jasny', icon: '☀️', category: 'light', desc: 'Przejrzysty, chłodny jasny interfejs', previewColors: ['#f1f5f9', '#ffffff', '#4f46e5', '#0f172a'] },
  { id: 'sakura', name: 'Sakura Pastel', icon: '🌸', category: 'light', desc: 'Delikatny pastelowy róż i mięta', previewColors: ['#fff1f5', '#ffffff', '#f472b6', '#34d399'] },
  { id: 'coffee', name: 'Ciepłe Latte', icon: '☕', category: 'light', desc: 'Przytulny krem, karmel i espresso', previewColors: ['#faf5ee', '#ffffff', '#b45309', '#431b0f'] },
  { id: 'matcha', name: 'Matcha Herbata', icon: '🍵', category: 'light', desc: 'Świeża zielona herbata i mięta', previewColors: ['#f2f9f4', '#ffffff', '#10b981', '#059669'] },
  { id: 'ocean', name: 'Morski Błękit', icon: '🌊', category: 'light', desc: 'Lazurowy błękit i koral', previewColors: ['#f0f9ff', '#ffffff', '#0ea5e9', '#f43f5e'] },
  { id: 'sunset', name: 'Złoty Zachód', icon: '🌅', category: 'light', desc: 'Ciepły bursztyn i słoneczny pomarańcz', previewColors: ['#fffbeb', '#ffffff', '#f97316', '#8b5cf6'] },

  // Ciemne
  { id: 'dark', name: 'Ciemny (Domyślny)', icon: '🌙', category: 'dark', desc: 'Głęboki grafit i fiolet indygo', previewColors: ['#0d1117', '#161b22', '#6366f1', '#f0f6fc'] },
  { id: 'cyberpunk', name: 'Cyberpunk Neon', icon: '🌆', category: 'dark', desc: 'Neonowy róż i cyjan', previewColors: ['#080812', '#101020', '#ff007f', '#00f0ff'] },
  { id: 'dracula', name: 'Dracula', icon: '🧛', category: 'dark', desc: 'Kultowy fiolet i róż', previewColors: ['#21222c', '#282a36', '#bd93f9', '#ff79c6'] },
  { id: 'nord', name: 'Nord Arktyczny', icon: '❄️', category: 'dark', desc: 'Chłodny arktyczny błękit', previewColors: ['#242933', '#2e3440', '#88c0d0', '#eceff4'] },
  { id: 'synthwave', name: 'Synthwave', icon: '🌌', category: 'dark', desc: 'Głęboka purpura i magenta', previewColors: ['#1a102f', '#261746', '#d946ef', '#facc15'] }
]

const currentThemeInfo = computed(() => {
  return themesList.find(t => t.id === store.settings.theme) || themesList[0]
})

const filteredTags = computed(() => {
  const q = tagSearch.value.toLowerCase().trim()
  if (!q) return store.allTagsWithCount
  return store.allTagsWithCount.filter(t => t.name.toLowerCase().includes(q))
})

function setFolderFilter(folderPath: string | null) {
  if (store.filter.selectedFolder === folderPath) {
    store.filter.selectedFolder = null
  } else {
    store.filter.selectedFolder = folderPath
  }
}

function toggleMediaType(type: 'image' | 'gif' | 'video') {
  if (store.filter.mediaType === type && !store.filter.onlyFavorites) {
    // Toggle back to all
    store.filter.mediaType = 'all'
  } else {
    store.filter.mediaType = type
    store.filter.onlyFavorites = false
  }
}

function showAllMedia() {
  store.filter.mediaType = 'all'
  store.filter.onlyFavorites = false
}

function setFavoritesOnly() {
  store.filter.onlyFavorites = !store.filter.onlyFavorites
  if (store.filter.onlyFavorites) {
    store.filter.mediaType = 'all'
  }
}
</script>

<template>
  <aside class="w-64 bg-dark-800 border-r border-dark-700/80 flex flex-col h-screen select-none shrink-0">
    <!-- App Header Branding -->
    <div class="p-4 border-b border-dark-700/80 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-accent flex items-center justify-center shadow-lg shadow-brand-500/20">
          <Sparkles class="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 class="font-bold text-sm text-dark-100 tracking-tight leading-none">KnowYourMeme</h1>
          <span class="text-[11px] text-brand-400 font-medium">Desktop Manager</span>
        </div>
      </div>

      <button
        @click="store.rescan()"
        class="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-all"
        :class="{ 'animate-spin text-brand-400': store.isScanning }"
        title="Przeskanuj wszystkie foldery"
      >
        <RefreshCw class="w-4 h-4" />
      </button>
    </div>

    <!-- Navigation / Quick Filters -->
    <div class="px-3 py-3 border-b border-dark-700/80 space-y-1">
      <button
        @click="showAllMedia"
        class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all"
        :class="[
          store.filter.mediaType === 'all' && !store.filter.onlyFavorites
            ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
            : 'text-dark-300 hover:bg-dark-700 hover:text-dark-100'
        ]"
      >
        <div class="flex items-center gap-2.5">
          <Layers class="w-4 h-4" />
          <span>Wszystkie memy</span>
        </div>
        <span class="text-[11px] px-1.5 py-0.5 rounded-full font-semibold"
          :class="store.filter.mediaType === 'all' && !store.filter.onlyFavorites ? 'bg-brand-700 text-white' : 'bg-dark-900 text-dark-400'"
        >
          {{ store.stats.total }}
        </span>
      </button>

      <button
        @click="setFavoritesOnly"
        class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all"
        :class="[
          store.filter.onlyFavorites
            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
            : 'text-dark-300 hover:bg-dark-700 hover:text-dark-100'
        ]"
      >
        <div class="flex items-center gap-2.5">
          <Heart class="w-4 h-4 text-rose-400" :class="{ 'fill-white text-white': store.filter.onlyFavorites }" />
          <span>Ulubione</span>
        </div>
        <span class="text-[11px] px-1.5 py-0.5 rounded-full font-semibold"
          :class="store.filter.onlyFavorites ? 'bg-rose-600 text-white' : 'bg-dark-900 text-dark-400'"
        >
          {{ store.stats.favorites }}
        </span>
      </button>

      <div class="pt-2 grid grid-cols-3 gap-1">
        <button
          @click="toggleMediaType('image')"
          class="flex flex-col items-center justify-center p-2 rounded-lg text-[11px] font-medium border transition-all"
          :class="[
            store.filter.mediaType === 'image' && !store.filter.onlyFavorites
              ? 'bg-dark-700 border-brand-500 text-brand-400'
              : 'border-transparent text-dark-400 hover:bg-dark-700/60 hover:text-dark-200'
          ]"
          title="Filtruj: Tylko obrazy (kliknij ponownie, aby wyczyścić)"
        >
          <Image class="w-4 h-4 mb-1" />
          <span>Obrazy</span>
          <span class="text-[10px] text-dark-400">({{ store.stats.images }})</span>
        </button>

        <button
          @click="toggleMediaType('gif')"
          class="flex flex-col items-center justify-center p-2 rounded-lg text-[11px] font-medium border transition-all"
          :class="[
            store.filter.mediaType === 'gif' && !store.filter.onlyFavorites
              ? 'bg-dark-700 border-brand-accent text-brand-accent'
              : 'border-transparent text-dark-400 hover:bg-dark-700/60 hover:text-dark-200'
          ]"
          title="Filtruj: Tylko GIFy (kliknij ponownie, aby wyczyścić)"
        >
          <Sparkles class="w-4 h-4 mb-1" />
          <span>GIFy</span>
          <span class="text-[10px] text-dark-400">({{ store.stats.gifs }})</span>
        </button>

        <button
          @click="toggleMediaType('video')"
          class="flex flex-col items-center justify-center p-2 rounded-lg text-[11px] font-medium border transition-all"
          :class="[
            store.filter.mediaType === 'video' && !store.filter.onlyFavorites
              ? 'bg-dark-700 border-brand-500 text-brand-400'
              : 'border-transparent text-dark-400 hover:bg-dark-700/60 hover:text-dark-200'
          ]"
          title="Filtruj: Tylko wideo (kliknij ponownie, aby wyczyścić)"
        >
          <Film class="w-4 h-4 mb-1" />
          <span>Wideo</span>
          <span class="text-[10px] text-dark-400">({{ store.stats.videos }})</span>
        </button>
      </div>
    </div>

    <!-- Folders Section -->
    <div class="px-3 py-3 border-b border-dark-700/80">
      <div class="flex items-center justify-between mb-2">
        <span class="text-[11px] font-bold tracking-wider text-dark-400 uppercase">Foldery z memami</span>
        <button
          @click="store.chooseAndAddFolder()"
          class="p-1 rounded-md text-brand-400 hover:text-white hover:bg-brand-600 transition-all flex items-center gap-1 text-xs font-semibold px-1.5"
          title="Dodaj folder z memami"
        >
          <FolderPlus class="w-3.5 h-3.5" />
          <span>Dodaj</span>
        </button>
      </div>

      <div class="space-y-1 max-h-36 overflow-y-auto pr-1">
        <div
          v-if="store.folders.length === 0"
          class="text-xs text-dark-500 py-2 text-center border border-dashed border-dark-700 rounded-lg"
        >
          Brak dodanych folderów. Kliknij "+ Dodaj".
        </div>

        <div
          v-for="folder in store.folders"
          :key="folder.path"
          class="group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
          :class="[
            store.filter.selectedFolder?.toLowerCase() === folder.path.toLowerCase()
              ? 'bg-dark-700 text-brand-400 border border-brand-500/50'
              : 'text-dark-300 hover:bg-dark-700/60 hover:text-dark-100'
          ]"
          @click="setFolderFilter(folder.path)"
        >
          <div class="flex items-center gap-2 truncate pr-2">
            <Folder class="w-3.5 h-3.5 shrink-0 text-brand-400" />
            <span class="truncate" :title="folder.path">{{ folder.name }}</span>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <span
              v-if="folder.itemCount !== undefined"
              class="text-[10px] text-dark-400 group-hover:hidden"
            >
              {{ folder.itemCount }}
            </span>
            <div class="hidden group-hover:flex items-center gap-1">
              <button
                @click.stop="store.rescan(folder.path)"
                class="p-1 rounded hover:bg-dark-600 text-dark-400 hover:text-white"
                title="Skanuj folder"
              >
                <RefreshCw class="w-3 h-3" />
              </button>
              <button
                @click.stop="store.removeFolder(folder.path)"
                class="p-1 rounded hover:bg-rose-500/20 text-dark-400 hover:text-rose-400"
                title="Usuń z biblioteki"
              >
                <Trash2 class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tags Filter Section -->
    <div class="px-3 py-3 flex-1 flex flex-col min-h-0 overflow-hidden">
      <div class="flex items-center justify-between mb-2">
        <span class="text-[11px] font-bold tracking-wider text-dark-400 uppercase">Tagi</span>
        <button
          @click="emit('openTagManager')"
          class="p-1 rounded-md text-dark-400 hover:text-brand-400 hover:bg-dark-700 transition-all flex items-center gap-1 text-[11px]"
          title="Zarządzaj kolorami i nazwami tagów"
        >
          <Settings2 class="w-3 h-3" />
          <span>Edytuj</span>
        </button>
      </div>

      <!-- Tag Search -->
      <div class="relative mb-2">
        <Search class="w-3.5 h-3.5 text-dark-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="tagSearch"
          type="text"
          placeholder="Szukaj tagu..."
          class="w-full bg-dark-900 border border-dark-700 rounded-lg pl-8 pr-3 py-1 text-xs text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500"
        />
        <button
          v-if="tagSearch"
          @click="tagSearch = ''"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
        >
          <X class="w-3 h-3" />
        </button>
      </div>

      <!-- Selected Tags Clear Indicator -->
      <div
        v-if="store.filter.selectedTags.length > 0"
        class="flex items-center justify-between pb-2 mb-2 border-b border-dark-700/60 text-xs"
      >
        <span class="text-brand-400 font-medium">Aktywne filtry: ({{ store.filter.selectedTags.length }})</span>
        <button
          @click="store.filter.selectedTags = []"
          class="text-[11px] text-dark-400 hover:text-rose-400 underline"
        >
          Wyczyść
        </button>
      </div>

      <!-- Tags List (Scrollable) -->
      <div class="flex-1 overflow-y-auto space-y-1 pr-1">
        <div
          v-if="filteredTags.length === 0"
          class="text-xs text-dark-500 py-3 text-center"
        >
          Brak tagów. Dodaj tagi do swoich memów!
        </div>

        <button
          v-for="tag in filteredTags"
          :key="tag.name"
          @click="store.toggleTagFilter(tag.name)"
          class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all"
          :class="[
            store.filter.selectedTags.includes(tag.name)
              ? 'bg-dark-700 ring-1 ring-brand-500 text-white font-semibold'
              : 'text-dark-300 hover:bg-dark-700/60 hover:text-dark-100'
          ]"
        >
          <div class="flex items-center gap-2 truncate">
            <span
              class="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
              :style="{ backgroundColor: tag.color }"
            />
            <span class="truncate">#{{ tag.name }}</span>
          </div>

          <span
            class="text-[10px] px-1.5 py-0.2 rounded-full font-mono"
            :class="store.filter.selectedTags.includes(tag.name) ? 'bg-brand-600 text-white' : 'bg-dark-900 text-dark-400'"
          >
            {{ tag.count }}
          </span>
        </button>
      </div>
    </div>

    <!-- Theme & Status Footer -->
    <div class="p-3 border-t border-dark-700/80 bg-dark-800/80 space-y-1.5">
      <!-- Duplicate Finder & OCR Tools Row -->
      <div class="grid grid-cols-2 gap-1.5">
        <button
          @click="emit('openDuplicates')"
          class="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-dark-900/80 border border-dark-700 hover:border-amber-500/40 text-dark-300 hover:text-amber-300 text-[11px] font-semibold transition-all shadow-sm"
          title="Wykryj identyczne pliki i zwolnij miejsce"
        >
          <Copy class="w-3.5 h-3.5 text-amber-400" />
          <span>Duplikaty</span>
        </button>

        <button
          @click="store.scanAllOcr"
          :disabled="store.isOcrScanning"
          class="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-dark-900/80 border border-dark-700 hover:border-brand-500/40 text-dark-300 hover:text-brand-300 text-[11px] font-semibold transition-all shadow-sm disabled:opacity-50"
          title="Rozpoznaj tekst (OCR) dla wszystkich memów bez indeksu"
        >
          <FileSearch class="w-3.5 h-3.5 text-brand-400" :class="store.isOcrScanning ? 'animate-pulse' : ''" />
          <span>{{ store.isOcrScanning ? 'OCR...' : 'Skan OCR' }}</span>
        </button>
      </div>

      <!-- Theme Switcher Button / Indicator -->
      <button
        @click="showThemeModal = true"
        class="w-full flex items-center justify-between p-2 rounded-xl bg-dark-900/70 border border-dark-700 hover:border-brand-500/50 hover:bg-dark-900 transition-all text-xs text-dark-300 hover:text-dark-100 group"
        title="Otwórz paletę motywów"
      >
        <div class="flex items-center gap-2">
          <Palette class="w-4 h-4 text-brand-400 group-hover:rotate-12 transition-transform" />
          <span class="font-semibold">{{ currentThemeInfo.icon }} {{ currentThemeInfo.name }}</span>
        </div>
        <span class="text-[10px] text-brand-400 font-medium px-2 py-0.5 bg-brand-500/10 rounded-md">
          Motywy (11)
        </span>
      </button>

      <!-- OCR Progress Bar -->
      <div
        v-if="store.isOcrScanning && store.ocrProgressText"
        class="p-2 bg-brand-950/40 border border-brand-500/30 rounded-lg flex items-center gap-2 text-xs text-brand-300 animate-pulse"
      >
        <FileSearch class="w-3.5 h-3.5 shrink-0 text-brand-400" />
        <span class="truncate text-[10px] font-mono">{{ store.ocrProgressText }}</span>
      </div>

      <!-- Scanner Status Bar -->
      <div
        v-if="store.isScanning"
        class="p-2 bg-dark-900 border border-dark-700 rounded-lg flex items-center gap-2 text-xs text-brand-400"
      >
        <RefreshCw class="w-3.5 h-3.5 animate-spin shrink-0" />
        <span class="truncate text-[11px]">{{ store.scannerStatusText }}</span>
      </div>
    </div>

    <!-- Theme Gallery Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showThemeModal"
          class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          @click.self="showThemeModal = false"
        >
          <div class="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <!-- Modal Header -->
            <div class="p-4 border-b border-dark-700 flex items-center justify-between bg-dark-900/60">
              <div class="flex items-center gap-2.5">
                <div class="p-2 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-400">
                  <Palette class="w-5 h-5" />
                </div>
                <div>
                  <h3 class="font-bold text-sm text-dark-100">Wybór Motywu Aplikacji</h3>
                  <p class="text-xs text-dark-400">Wybierz jeden z 11 dopracowanych stylów graficznych</p>
                </div>
              </div>

              <button
                @click="showThemeModal = false"
                class="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Modal Content (Scrollable) -->
            <div class="p-5 overflow-y-auto space-y-6 flex-1">
              <!-- Light Themes Section -->
              <div class="space-y-3">
                <div class="flex items-center gap-2 text-xs font-bold text-brand-400 uppercase tracking-wider">
                  <span>☀️ Motywy Jasne & Pastelowe (6)</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    v-for="t in themesList.filter(x => x.category === 'light')"
                    :key="t.id"
                    @click="store.setTheme(t.id)"
                    class="p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between"
                    :class="[
                      store.settings.theme === t.id
                        ? 'border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/30'
                        : 'border-dark-700 bg-dark-900/60 hover:border-dark-600 hover:bg-dark-900'
                    ]"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-2">
                        <span class="text-lg">{{ t.icon }}</span>
                        <span class="font-bold text-xs text-dark-100">{{ t.name }}</span>
                      </div>
                      <span
                        v-if="store.settings.theme === t.id"
                        class="text-[10px] bg-brand-600 text-white font-bold px-2 py-0.5 rounded-full"
                      >
                        Aktywny
                      </span>
                    </div>

                    <p class="text-[11px] text-dark-400 mb-3">{{ t.desc }}</p>

                    <!-- Color Swatches Preview -->
                    <div class="flex items-center gap-1.5 pt-2 border-t border-dark-700/50">
                      <span
                        v-for="(c, ci) in t.previewColors"
                        :key="ci"
                        class="w-5 h-5 rounded-full border border-black/20 shadow-sm"
                        :style="{ backgroundColor: c }"
                      />
                    </div>
                  </button>
                </div>
              </div>

              <!-- Dark Themes Section -->
              <div class="space-y-3">
                <div class="flex items-center gap-2 text-xs font-bold text-brand-400 uppercase tracking-wider">
                  <span>🌙 Motywy Ciemne & Futurystyczne (5)</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    v-for="t in themesList.filter(x => x.category === 'dark')"
                    :key="t.id"
                    @click="store.setTheme(t.id)"
                    class="p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between"
                    :class="[
                      store.settings.theme === t.id
                        ? 'border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/30'
                        : 'border-dark-700 bg-dark-900/60 hover:border-dark-600 hover:bg-dark-900'
                    ]"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-2">
                        <span class="text-lg">{{ t.icon }}</span>
                        <span class="font-bold text-xs text-dark-100">{{ t.name }}</span>
                      </div>
                      <span
                        v-if="store.settings.theme === t.id"
                        class="text-[10px] bg-brand-600 text-white font-bold px-2 py-0.5 rounded-full"
                      >
                        Aktywny
                      </span>
                    </div>

                    <p class="text-[11px] text-dark-400 mb-3">{{ t.desc }}</p>

                    <!-- Color Swatches Preview -->
                    <div class="flex items-center gap-1.5 pt-2 border-t border-dark-700/50">
                      <span
                        v-for="(c, ci) in t.previewColors"
                        :key="ci"
                        class="w-5 h-5 rounded-full border border-black/20 shadow-sm"
                        :style="{ backgroundColor: c }"
                      />
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="p-4 border-t border-dark-700 bg-dark-900/60 flex items-center justify-end">
              <button
                @click="showThemeModal = false"
                class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all"
              >
                Gotowe
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </aside>
</template>
