<script setup lang="ts">
import { useMemeStore } from '../stores/memeStore'
import {
  Search,
  X,
  ArrowUpDown,
  LayoutGrid,
  Grid,
  CheckSquare,
  Square,
  Tags,
  Shuffle,
  Dices,
  Sparkles
} from 'lucide-vue-next'

const store = useMemeStore()
const emit = defineEmits<{
  (e: 'openBatchTagModal'): void
}>()

function toggleSelectAll() {
  if (store.selectedPaths.size === store.filteredMemes.length && store.filteredMemes.length > 0) {
    store.clearSelection()
  } else {
    store.selectAll()
  }
}
</script>

<template>
  <header class="bg-dark-800/90 backdrop-blur-md border-b border-dark-700/80 px-6 py-3.5 flex flex-col gap-3 shrink-0">
    <!-- Top Action Bar -->
    <div class="flex items-center justify-between gap-4">
      <!-- Search Input -->
      <div class="relative flex-1 max-w-xl">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
        <input
          v-model="store.filter.searchQuery"
          type="text"
          placeholder="Wyszukaj po nazwie, tagu, opisie lub tekście (Ctrl + F)..."
          class="w-full bg-dark-900/90 border border-dark-700 rounded-xl pl-10 pr-10 py-2 text-xs text-dark-100 placeholder-dark-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all font-medium"
        />
        <button
          v-if="store.filter.searchQuery"
          @click="store.filter.searchQuery = ''"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Quick Action Controls -->
      <div class="flex items-center gap-2.5">
        <!-- Meme Generator / Studio Button -->
        <button
          @click="store.openStudio()"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 border border-purple-500/40 text-purple-300 hover:text-purple-200 text-xs font-semibold transition-all active:scale-95 shadow-sm"
          title="Stwórz nowego mema lub edytuj w Meme Studio"
        >
          <Sparkles class="w-4 h-4 text-purple-400" />
          <span>Generator</span>
        </button>

        <!-- Random Meme Button -->
        <button
          @click="store.pickRandomMeme"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-semibold transition-all active:scale-95 shadow-sm"
          title="Wylosuj mema z bieżącej kolekcji (Ctrl + R)"
        >
          <Dices class="w-4 h-4 text-amber-400" />
          <span>Losuj mema</span>
        </button>

        <!-- Tag Matching Mode Toggle (AND vs OR) -->
        <div
          v-if="store.filter.selectedTags.length > 1"
          class="flex items-center bg-dark-900 border border-dark-700 rounded-xl p-0.5"
        >
          <button
            @click="store.filter.tagMatchMode = 'any'"
            class="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all"
            :class="store.filter.tagMatchMode === 'any' ? 'bg-brand-600 text-white shadow' : 'text-dark-400 hover:text-dark-200'"
            title="Pokaż memy zawierające DOWOLNY z wybranych tagów"
          >
            Dowolny (OR)
          </button>
          <button
            @click="store.filter.tagMatchMode = 'all'"
            class="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all"
            :class="store.filter.tagMatchMode === 'all' ? 'bg-brand-600 text-white shadow' : 'text-dark-400 hover:text-dark-200'"
            title="Pokaż memy zawierające WSZYSTKIE wybrane tagi"
          >
            Wszystkie (AND)
          </button>
        </div>

        <!-- Sort dropdown -->
        <div class="flex items-center gap-1.5 bg-dark-900 border border-dark-700 rounded-xl px-3 py-1.5 text-xs text-dark-300">
          <ArrowUpDown class="w-3.5 h-3.5 text-brand-400" />
          <select
            v-model="store.filter.sortBy"
            class="bg-transparent text-xs text-dark-200 focus:outline-none cursor-pointer pr-2"
          >
            <option value="date_desc" class="bg-dark-800 text-dark-100">Najnowsze</option>
            <option value="date_asc" class="bg-dark-800 text-dark-100">Najstarsze</option>
            <option value="used_desc" class="bg-dark-800 text-dark-100">🔥 Najczęściej używane</option>
            <option value="rating_desc" class="bg-dark-800 text-dark-100">⭐ Najwyżej oceniane</option>
            <option value="name_asc" class="bg-dark-800 text-dark-100">Nazwa: A do Z</option>
            <option value="name_desc" class="bg-dark-800 text-dark-100">Nazwa: Z do A</option>
            <option value="size_desc" class="bg-dark-800 text-dark-100">Rozmiar: Największe</option>
            <option value="size_asc" class="bg-dark-800 text-dark-100">Rozmiar: Najmniejsze</option>
            <option value="random" class="bg-dark-800 text-dark-100">Losowo</option>
          </select>
        </div>

        <!-- Thumbnail Size Toggle -->
        <div class="flex items-center bg-dark-900 border border-dark-700 rounded-xl p-0.5">
          <button
            @click="store.settings.thumbnailSize = 'small'"
            class="p-1.5 rounded-lg text-xs transition-all"
            :class="store.settings.thumbnailSize === 'small' ? 'bg-dark-700 text-brand-400 shadow' : 'text-dark-400 hover:text-dark-200'"
            title="Małe kafelki"
          >
            <Grid class="w-3.5 h-3.5" />
          </button>
          <button
            @click="store.settings.thumbnailSize = 'medium'"
            class="p-1.5 rounded-lg text-xs transition-all"
            :class="store.settings.thumbnailSize === 'medium' ? 'bg-dark-700 text-brand-400 shadow' : 'text-dark-400 hover:text-dark-200'"
            title="Średnie kafelki"
          >
            <LayoutGrid class="w-3.5 h-3.5" />
          </button>
          <button
            @click="store.settings.thumbnailSize = 'large'"
            class="p-1.5 rounded-lg text-xs transition-all"
            :class="store.settings.thumbnailSize === 'large' ? 'bg-dark-700 text-brand-400 shadow' : 'text-dark-400 hover:text-dark-200'"
            title="Duże kafelki"
          >
            <Shuffle class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Multi-select Action Bar (Shown when items are selected) -->
    <Transition name="fade">
      <div
        v-if="store.selectedPaths.size > 0"
        class="flex items-center justify-between bg-dark-900/90 border border-brand-500/40 rounded-xl px-4 py-2 text-xs"
      >
        <div class="flex items-center gap-3">
          <span class="font-bold text-brand-400">
            Zaznaczono: {{ store.selectedPaths.size }} z {{ store.filteredMemes.length }}
          </span>

          <button
            @click="toggleSelectAll"
            class="text-dark-300 hover:text-white flex items-center gap-1.5 underline"
          >
            <CheckSquare v-if="store.selectedPaths.size === store.filteredMemes.length" class="w-3.5 h-3.5" />
            <Square v-else class="w-3.5 h-3.5" />
            <span>{{ store.selectedPaths.size === store.filteredMemes.length ? 'Odznacz wszystkie' : 'Zaznacz wszystkie' }}</span>
          </button>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="emit('openBatchTagModal')"
            class="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow transition-all"
          >
            <Tags class="w-3.5 h-3.5" />
            <span>Zarządzaj tagami zaznaczonych</span>
          </button>

          <button
            @click="store.clearSelection()"
            class="p-1.5 text-dark-400 hover:text-rose-400 rounded-lg transition-colors"
            title="Anuluj zaznaczenie"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
    </Transition>
  </header>
</template>
