<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useMemeStore } from '../stores/memeStore'
import {
  X,
  Heart,
  Copy,
  FolderOpen,
  ExternalLink,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Tag as TagIcon,
  Film,
  Calendar,
  HardDrive
} from 'lucide-vue-next'

const store = useMemeStore()
const newTagInput = ref('')
const descriptionInput = ref('')
const tagInputRef = ref<HTMLInputElement | null>(null)
const showTagSuggestions = ref(false)

const meme = computed(() => store.selectedMeme)

watch(
  () => meme.value,
  (newMeme) => {
    if (newMeme) {
      descriptionInput.value = newMeme.description || ''
      newTagInput.value = ''
    }
  },
  { immediate: true }
)

const mediaSrc = computed(() => {
  if (!meme.value) return ''
  return `media://${meme.value.path.replace(/\\/g, '/')}`
})

const currentIndex = computed(() => {
  if (!meme.value) return -1
  return store.filteredMemes.findIndex(m => m.path === meme.value?.path)
})

const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < store.filteredMemes.length - 1 && currentIndex.value !== -1)

function goToPrev() {
  if (hasPrev.value) {
    store.selectedMeme = store.filteredMemes[currentIndex.value - 1]
  }
}

function goToNext() {
  if (hasNext.value) {
    store.selectedMeme = store.filteredMemes[currentIndex.value + 1]
  }
}

function closeModal() {
  store.selectedMeme = null
}

const suggestedTags = computed(() => {
  const currentTags = new Set(meme.value?.tags.map(t => t.toLowerCase()) || [])
  const q = newTagInput.value.toLowerCase().trim()
  return store.allTagsWithCount
    .filter(t => !currentTags.has(t.name.toLowerCase()))
    .filter(t => !q || t.name.toLowerCase().includes(q))
    .slice(0, 8)
})

function addTag(tagName: string) {
  if (!meme.value) return
  const norm = tagName.toLowerCase().trim().replace(/^#/, '')
  if (!norm) return

  const current = [...meme.value.tags]
  if (!current.map(t => t.toLowerCase()).includes(norm)) {
    current.push(norm)
    store.updateMemeTags(meme.value, current)
  }
  newTagInput.value = ''
  showTagSuggestions.value = false
}

function removeTag(tagName: string) {
  if (!meme.value) return
  const current = meme.value.tags.filter(t => t.toLowerCase() !== tagName.toLowerCase())
  store.updateMemeTags(meme.value, current)
}

function saveDescription() {
  if (meme.value && descriptionInput.value !== (meme.value.description || '')) {
    store.updateMemeDescription(meme.value, descriptionInput.value)
  }
}

function getTagColor(tagName: string) {
  const norm = tagName.toLowerCase().trim()
  return store.tags[norm]?.color || '#6366f1'
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function handleKeyDown(e: KeyboardEvent) {
  if (!meme.value) return
  // If typing in input/textarea, don't navigate
  const active = document.activeElement
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
    if (e.key === 'Escape') {
      (active as HTMLElement).blur()
    }
    return
  }

  if (e.key === 'ArrowLeft') {
    goToPrev()
  } else if (e.key === 'ArrowRight') {
    goToNext()
  } else if (e.key === 'Escape') {
    closeModal()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <Transition name="fade">
    <div
      v-if="meme"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 select-text"
      @click.self="closeModal"
    >
      <!-- Modal Container -->
      <div class="relative w-full max-w-6xl h-[88vh] bg-dark-900 border border-dark-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        <!-- Navigation Prev / Next overlay buttons -->
        <button
          v-if="hasPrev"
          @click="goToPrev"
          class="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-dark-900/80 hover:bg-dark-800 text-white border border-dark-700 backdrop-blur shadow-xl transition-all hover:scale-110"
          title="Poprzedni mem (Strzałka w lewo)"
        >
          <ChevronLeft class="w-6 h-6" />
        </button>

        <button
          v-if="hasNext"
          @click="goToNext"
          class="absolute md:right-[360px] right-3 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-dark-900/80 hover:bg-dark-800 text-white border border-dark-700 backdrop-blur shadow-xl transition-all hover:scale-110"
          title="Następny mem (Strzałka w prawo)"
        >
          <ChevronRight class="w-6 h-6" />
        </button>

        <!-- Left Media Preview Area -->
        <div class="flex-1 bg-black/60 flex items-center justify-center p-4 relative overflow-hidden">
          <img
            v-if="meme.type === 'image' || meme.type === 'gif'"
            :src="mediaSrc"
            :alt="meme.name"
            class="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />

          <video
            v-else-if="meme.type === 'video'"
            :src="mediaSrc"
            controls
            autoplay
            playsinline
            class="max-w-full max-h-full rounded-lg shadow-2xl"
          />
        </div>

        <!-- Right Details / Management Sidebar -->
        <div class="w-full md:w-88 bg-dark-800 border-t md:border-t-0 md:border-l border-dark-700 flex flex-col justify-between overflow-y-auto">
          
          <!-- Top bar with close & favorite -->
          <div>
            <div class="p-4 border-b border-dark-700/80 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <button
                  @click="store.toggleFavorite(meme)"
                  class="p-2 rounded-xl border transition-all"
                  :class="[
                    meme.isFavorite
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                      : 'bg-dark-700/50 border-dark-600 text-dark-300 hover:text-rose-400'
                  ]"
                  title="Ulubione"
                >
                  <Heart class="w-4 h-4" :class="{ 'fill-current': meme.isFavorite }" />
                </button>

                <button
                  @click="store.copyMemeToClipboard(meme)"
                  class="p-2 rounded-xl bg-dark-700/50 border border-dark-600 text-dark-300 hover:text-brand-400 hover:border-brand-500/40 transition-all flex items-center gap-1.5 text-xs font-semibold"
                  title="Kopiuj do schowka"
                >
                  <Copy class="w-4 h-4" />
                  <span>Kopiuj</span>
                </button>
              </div>

              <button
                @click="closeModal"
                class="p-2 text-dark-400 hover:text-white rounded-xl hover:bg-dark-700 transition-colors"
                title="Zamknij (Esc)"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Filename & Meta Info -->
            <div class="p-4 border-b border-dark-700/80 space-y-3">
              <div>
                <span class="text-[10px] font-bold text-brand-400 uppercase tracking-wider">Nazwa pliku</span>
                <h3 class="text-sm font-bold text-dark-100 break-all select-all">{{ meme.name }}</h3>
              </div>

              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="p-2 bg-dark-900/60 rounded-lg border border-dark-700">
                  <span class="text-[10px] text-dark-400 flex items-center gap-1">
                    <HardDrive class="w-3 h-3" /> Rozmiar
                  </span>
                  <span class="font-medium text-dark-200 font-mono">{{ formatSize(meme.size) }}</span>
                </div>

                <div class="p-2 bg-dark-900/60 rounded-lg border border-dark-700">
                  <span class="text-[10px] text-dark-400 flex items-center gap-1">
                    <Calendar class="w-3 h-3" /> Zmodyfikowano
                  </span>
                  <span class="font-medium text-dark-200">{{ formatDate(meme.modifiedAt) }}</span>
                </div>
              </div>

              <div class="text-[11px] text-dark-400 break-all select-all bg-dark-900/40 p-2 rounded-lg border border-dark-700/60 font-mono">
                {{ meme.path }}
              </div>
            </div>

            <!-- Tags Editor -->
            <div class="p-4 border-b border-dark-700/80 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-dark-400 uppercase tracking-wider flex items-center gap-1">
                  <TagIcon class="w-3 h-3" /> Tagi ({{ meme.tags.length }})
                </span>
              </div>

              <!-- Tag badges list -->
              <div class="flex flex-wrap gap-1.5 min-h-[30px]">
                <span
                  v-for="tag in meme.tags"
                  :key="tag"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-white shadow-sm"
                  :style="{ backgroundColor: getTagColor(tag) }"
                >
                  #{{ tag }}
                  <button
                    @click="removeTag(tag)"
                    class="hover:bg-black/30 p-0.5 rounded transition-colors ml-0.5"
                    title="Usuń tag"
                  >
                    <X class="w-3 h-3" />
                  </button>
                </span>

                <span v-if="meme.tags.length === 0" class="text-xs text-dark-500 italic">
                  Brak przypisanych tagów
                </span>
              </div>

              <!-- Add Tag Input with Suggestions -->
              <div class="relative">
                <div class="flex items-center gap-2">
                  <input
                    ref="tagInputRef"
                    v-model="newTagInput"
                    type="text"
                    placeholder="Wpisz tag i wciśnij Enter..."
                    class="flex-1 bg-dark-900 border border-dark-700 rounded-lg px-3 py-1.5 text-xs text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500"
                    @focus="showTagSuggestions = true"
                    @keydown.enter.prevent="addTag(newTagInput)"
                  />
                  <button
                    @click="addTag(newTagInput)"
                    class="p-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors"
                    title="Dodaj tag"
                  >
                    <Plus class="w-4 h-4" />
                  </button>
                </div>

                <!-- Suggestions dropdown -->
                <div
                  v-if="showTagSuggestions && suggestedTags.length > 0"
                  class="absolute top-full left-0 right-0 mt-1 bg-dark-900 border border-dark-700 rounded-lg shadow-xl z-20 p-1 space-y-0.5 max-h-36 overflow-y-auto"
                >
                  <div class="px-2 py-1 text-[10px] text-dark-400 font-bold uppercase">Podpowiedzi:</div>
                  <button
                    v-for="st in suggestedTags"
                    :key="st.name"
                    @click="addTag(st.name)"
                    class="w-full flex items-center justify-between px-2.5 py-1 text-xs rounded hover:bg-dark-800 text-left text-dark-200"
                  >
                    <div class="flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: st.color }" />
                      <span>#{{ st.name }}</span>
                    </div>
                    <span class="text-[10px] text-dark-400">({{ st.count }})</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Notes / Description -->
            <div class="p-4 space-y-2">
              <span class="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Notatki / Kontekst mema</span>
              <textarea
                v-model="descriptionInput"
                @blur="saveDescription"
                placeholder="Dodaj opis, kontekst lub transkrypcję mema do łatwego wyszukiwania..."
                rows="3"
                class="w-full bg-dark-900 border border-dark-700 rounded-lg p-2.5 text-xs text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500 resize-none"
              ></textarea>
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="p-4 border-t border-dark-700/80 bg-dark-900/50 space-y-2">
            <button
              @click="store.copyMemeToClipboard(meme)"
              class="w-full py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <Copy class="w-4 h-4" />
              <span>Kopiuj mema do schowka</span>
            </button>

            <div class="grid grid-cols-2 gap-2">
              <button
                @click="store.openInExplorer(meme)"
                class="py-2 bg-dark-800 hover:bg-dark-700 border border-dark-700 text-dark-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                title="Pokaż plik w Eksploratorze Windows"
              >
                <FolderOpen class="w-3.5 h-3.5" />
                <span>Eksplorator</span>
              </button>

              <button
                @click="store.openExternal(meme)"
                class="py-2 bg-dark-800 hover:bg-dark-700 border border-dark-700 text-dark-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                title="Otwórz w domyślnej przeglądarce"
              >
                <ExternalLink class="w-3.5 h-3.5" />
                <span>Otwórz w app</span>
              </button>
            </div>

            <button
              @click="store.deleteMeme(meme)"
              class="w-full py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 class="w-3.5 h-3.5" />
              <span>Przenieś plik do kosza</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  </Transition>
</template>
