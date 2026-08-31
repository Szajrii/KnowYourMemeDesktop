<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useMemeStore } from '../stores/memeStore'
import { getMediaUrl } from '../utils/media'
import { MemeItem } from '../../../shared/types'
import { Search, X, Copy, Zap, Star, Flame, Tag as TagIcon } from 'lucide-vue-next'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const store = useMemeStore()
const searchInput = ref('')
const selectedIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)

const results = computed(() => {
  const q = searchInput.value.toLowerCase().trim()
  if (!q) {
    return store.memes.slice(0, 12)
  }
  return store.memes.filter(m => {
    const inName = m.name.toLowerCase().includes(q)
    const inTags = m.tags.some(t => t.toLowerCase().includes(q))
    const inDesc = m.description ? m.description.toLowerCase().includes(q) : false
    const inOcr = m.ocrText ? m.ocrText.toLowerCase().includes(q) : false
    return inName || inTags || inDesc || inOcr
  }).slice(0, 15)
})

watch(
  () => props.visible,
  (val) => {
    if (val) {
      searchInput.value = ''
      selectedIndex.value = 0
      nextTick(() => {
        inputRef.value?.focus()
      })
    }
  }
)

watch(results, () => {
  selectedIndex.value = 0
})

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    e.preventDefault()
    selectedIndex.value = (selectedIndex.value + 1) % Math.max(1, results.value.length)
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    e.preventDefault()
    selectedIndex.value = (selectedIndex.value - 1 + results.value.length) % Math.max(1, results.value.length)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const target = results.value[selectedIndex.value]
    if (target) {
      copyAndClose(target)
    }
  }
}

async function copyAndClose(meme: MemeItem) {
  await store.copyMemeToClipboard(meme)
  emit('close')
}
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/75 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-150"
    @click.self="emit('close')"
    @keydown="handleKeydown"
  >
    <div class="w-full max-w-2xl bg-dark-800 border border-brand-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-brand-500/30">
      <!-- Search Input Bar -->
      <div class="relative flex items-center p-3.5 border-b border-dark-700 bg-dark-900/80">
        <Zap class="w-5 h-5 text-amber-400 ml-1.5 mr-3 shrink-0 animate-pulse" />
        <input
          ref="inputRef"
          v-model="searchInput"
          type="text"
          placeholder="Wyszukaj i wciśnij Enter, aby skopiować mema..."
          class="flex-1 bg-transparent text-sm text-dark-100 placeholder-dark-400 focus:outline-none font-medium"
        />
        <span class="text-[11px] font-mono text-dark-400 px-2 py-0.5 rounded bg-dark-800 border border-dark-700 mr-2">
          Enter = Kopiuj
        </span>
        <button @click="emit('close')" class="text-dark-400 hover:text-white p-1">
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Quick Results List / Grid -->
      <div class="max-h-[60vh] overflow-y-auto p-3 space-y-1.5">
        <div v-if="results.length === 0" class="py-12 text-center text-xs text-dark-500">
          Nie znaleziono memów dla zapytania "{{ searchInput }}"
        </div>

        <div
          v-for="(meme, index) in results"
          :key="meme.path"
          @click="copyAndClose(meme)"
          @mouseenter="selectedIndex = index"
          class="flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border"
          :class="[
            selectedIndex === index
              ? 'bg-dark-700 border-brand-500/80 ring-1 ring-brand-500/40'
              : 'bg-dark-900/60 border-dark-700/60 hover:bg-dark-700/40'
          ]"
        >
          <div class="flex items-center gap-3 min-w-0">
            <!-- Thumbnail -->
            <div class="w-14 h-14 rounded-lg bg-dark-950 overflow-hidden flex items-center justify-center shrink-0 border border-dark-800">
              <img
                :src="getMediaUrl(meme.path)"
                :alt="meme.name"
                class="w-full h-full object-contain"
              />
            </div>

            <!-- Meta -->
            <div class="min-w-0 space-y-1">
              <h5 class="text-xs font-bold text-dark-100 truncate">
                {{ meme.name }}
              </h5>

              <!-- Tags -->
              <div class="flex flex-wrap gap-1 items-center">
                <span
                  v-for="t in meme.tags.slice(0, 3)"
                  :key="t"
                  class="px-1.5 py-0.2 rounded text-[10px] bg-brand-500/15 text-brand-300 border border-brand-500/30"
                >
                  #{{ t }}
                </span>
                <span
                  v-if="meme.ocrText"
                  class="text-[10px] text-dark-400 truncate max-w-[240px] italic font-sans"
                >
                  "{{ meme.ocrText }}"
                </span>
              </div>
            </div>
          </div>

          <!-- Stats and Action Hint -->
          <div class="flex items-center gap-2 shrink-0 pl-2">
            <span
              v-if="meme.usedCount && meme.usedCount > 0"
              class="text-[10px] text-orange-400 font-bold flex items-center gap-0.5"
            >
              <Flame class="w-3 h-3" />
              <span>{{ meme.usedCount }}</span>
            </span>

            <div
              class="px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
              :class="selectedIndex === index ? 'bg-brand-600 text-white shadow' : 'bg-dark-800 text-dark-300'"
            >
              <Copy class="w-3.5 h-3.5" />
              <span>Kopiuj</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Hints -->
      <div class="p-2.5 bg-dark-900 border-t border-dark-700/80 flex items-center justify-between text-[11px] text-dark-400 px-4">
        <div class="flex items-center gap-3">
          <span>↑↓ Nawigacja</span>
          <span>↵ Kopiuj mema</span>
          <span>Esc Zamknij</span>
        </div>
        <span class="font-mono text-brand-400">Skrót globalny: Ctrl + Shift + M / Alt + Space</span>
      </div>
    </div>
  </div>
</template>
