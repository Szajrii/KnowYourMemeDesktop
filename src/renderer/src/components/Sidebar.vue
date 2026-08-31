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
  Palette
} from 'lucide-vue-next'

const store = useMemeStore()
const emit = defineEmits<{
  (e: 'openTagManager'): void
}>()

const tagSearch = ref('')

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
    <div class="p-3 border-t border-dark-700/80 bg-dark-800/80 space-y-2">
      <!-- Theme Switcher -->
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-medium text-dark-400 flex items-center gap-1.5">
          <Palette class="w-3.5 h-3.5 text-brand-400" />
          <span>Motyw</span>
        </span>

        <div class="flex items-center gap-1 bg-dark-900/80 p-1 rounded-lg border border-dark-700">
          <button
            @click="store.setTheme('dark')"
            class="px-1.5 py-0.5 rounded text-xs transition-all flex items-center gap-1"
            :class="store.settings.theme === 'dark' ? 'bg-brand-600 text-white font-bold shadow' : 'text-dark-400 hover:text-dark-200'"
            title="Ciemny (Domyślny)"
          >
            <span>🌙</span>
          </button>
          <button
            @click="store.setTheme('light')"
            class="px-1.5 py-0.5 rounded text-xs transition-all flex items-center gap-1"
            :class="store.settings.theme === 'light' ? 'bg-brand-600 text-white font-bold shadow' : 'text-dark-400 hover:text-dark-200'"
            title="Jasny"
          >
            <span>☀️</span>
          </button>
          <button
            @click="store.setTheme('cyberpunk')"
            class="px-1.5 py-0.5 rounded text-xs transition-all flex items-center gap-1"
            :class="store.settings.theme === 'cyberpunk' ? 'bg-brand-600 text-white font-bold shadow' : 'text-dark-400 hover:text-dark-200'"
            title="Cyberpunk"
          >
            <span>🌆</span>
          </button>
          <button
            @click="store.setTheme('dracula')"
            class="px-1.5 py-0.5 rounded text-xs transition-all flex items-center gap-1"
            :class="store.settings.theme === 'dracula' ? 'bg-brand-600 text-white font-bold shadow' : 'text-dark-400 hover:text-dark-200'"
            title="Dracula"
          >
            <span>🧛</span>
          </button>
          <button
            @click="store.setTheme('nord')"
            class="px-1.5 py-0.5 rounded text-xs transition-all flex items-center gap-1"
            :class="store.settings.theme === 'nord' ? 'bg-brand-600 text-white font-bold shadow' : 'text-dark-400 hover:text-dark-200'"
            title="Nord"
          >
            <span>❄️</span>
          </button>
        </div>
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
  </aside>
</template>
