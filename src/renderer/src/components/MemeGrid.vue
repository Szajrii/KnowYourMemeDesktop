<script setup lang="ts">
import { computed } from 'vue'
import { useMemeStore } from '../stores/memeStore'
import MemeCard from './MemeCard.vue'
import { FolderPlus, FilterX, Sparkles, Image as ImageIcon } from 'lucide-vue-next'

const store = useMemeStore()

const gridClass = computed(() => {
  switch (store.settings.thumbnailSize) {
    case 'small':
      return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3'
    case 'large':
      return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'
    case 'medium':
    default:
      return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
  }
})
</script>

<template>
  <main class="flex-1 overflow-y-auto p-6 relative">
    <!-- Empty State: No Folders Added Yet -->
    <div
      v-if="store.folders.length === 0"
      class="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto"
    >
      <div class="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mb-4 text-brand-400 shadow-xl shadow-brand-500/10">
        <Sparkles class="w-8 h-8" />
      </div>
      <h2 class="text-lg font-bold text-dark-100 mb-2">Rozpocznij z KnowYourMeme</h2>
      <p class="text-xs text-dark-400 mb-6 leading-relaxed">
        Wskaż folder na dysku ze swoimi memami (obrazki, GIFy, klipy wideo). Aplikacja automatycznie je zindeksuje i umożliwi łatwe tagowanie i wyszukiwanie!
      </p>
      <button
        @click="store.chooseAndAddFolder()"
        class="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-600/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
      >
        <FolderPlus class="w-4 h-4" />
        <span>Wybierz folder z memami</span>
      </button>
    </div>

    <!-- Empty State: Filters return 0 items -->
    <div
      v-else-if="store.filteredMemes.length === 0"
      class="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto"
    >
      <div class="w-16 h-16 rounded-2xl bg-dark-800 border border-dark-700 flex items-center justify-center mb-4 text-dark-400 shadow-xl">
        <FilterX class="w-8 h-8" />
      </div>
      <h2 class="text-lg font-bold text-dark-100 mb-2">Brak wyników</h2>
      <p class="text-xs text-dark-400 mb-6 leading-relaxed">
        Żaden mem nie pasuje do aktualnych filtrów lub wyszukiwania. Spróbuj zmienić zapytanie lub odznaczyć wybrane tagi.
      </p>
      <button
        @click="store.clearFilters()"
        class="px-4 py-2 bg-dark-800 hover:bg-dark-700 border border-dark-600 text-dark-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
      >
        <span>Wyczyść filtry</span>
      </button>
    </div>

    <!-- Memes Grid -->
    <div v-else class="grid" :class="gridClass">
      <MemeCard
        v-for="meme in store.filteredMemes"
        :key="meme.path"
        :meme="meme"
      />
    </div>
  </main>
</template>
