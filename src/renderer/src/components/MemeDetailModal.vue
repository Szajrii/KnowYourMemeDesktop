<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useMemeStore } from '../stores/memeStore'
import { getMediaUrl } from '../utils/media'
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
  HardDrive,
  Pencil,
  Check,
  FileText,
  Star,
  Flame,
  FileSearch,
  Sparkles
} from 'lucide-vue-next'

const store = useMemeStore()
const newTagInput = ref('')
const descriptionInput = ref('')
const tagInputRef = ref<HTMLInputElement | null>(null)
const showTagSuggestions = ref(false)
const isEditingName = ref(false)
const editingNameInput = ref('')
const editNameInputRef = ref<HTMLInputElement | null>(null)

const meme = computed(() => store.selectedMeme)

watch(
  () => meme.value,
  (newMeme) => {
    if (newMeme) {
      descriptionInput.value = newMeme.description || ''
      newTagInput.value = ''
      showTagSuggestions.value = false
      isEditingName.value = false
      editingNameInput.value = ''
    }
  },
  { immediate: true }
)

function startEditingName() {
  if (!meme.value) return
  editingNameInput.value = meme.value.name
  isEditingName.value = true
  nextTick(() => {
    editNameInputRef.value?.focus()
    editNameInputRef.value?.select()
  })
}

function cancelEditingName() {
  isEditingName.value = false
  editingNameInput.value = ''
}

async function submitRename() {
  if (!meme.value) return
  const trimmed = editingNameInput.value.trim()
  if (!trimmed || trimmed === meme.value.name) {
    cancelEditingName()
    return
  }
  const success = await store.renameMeme(meme.value, trimmed)
  if (success) {
    isEditingName.value = false
  }
}

const mediaSrc = computed(() => {
  if (!meme.value) return ''
  return getMediaUrl(meme.value.path)
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
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6 select-text"
      @click.self="closeModal"
    >
      <!-- Modal Container -->
      <div class="relative w-full max-w-7xl h-[90vh] bg-dark-900 border border-dark-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-row">
        
        <!-- Left Media Preview Area (Takes majority of modal) -->
        <div class="flex-1 min-w-0 h-full bg-black/80 flex items-center justify-center p-6 relative select-none group overflow-hidden">
          
          <!-- Image / GIF Preview -->
          <img
            v-if="meme.type === 'image' || meme.type === 'gif'"
            :src="mediaSrc"
            :alt="meme.name"
            class="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
          />

          <!-- Video Player -->
          <video
            v-else-if="meme.type === 'video'"
            :src="mediaSrc"
            controls
            autoplay
            playsinline
            class="max-w-full max-h-full rounded-xl shadow-2xl"
          />

          <!-- Position Counter Pill (Top-Left) -->
          <div class="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 rounded-full bg-dark-900/80 border border-dark-700/80 backdrop-blur-md text-xs font-mono text-dark-300 shadow-lg">
            <span>{{ currentIndex + 1 }} / {{ store.filteredMemes.length }}</span>
          </div>

          <!-- Navigation Prev / Next Buttons (Inside media viewport) -->
          <button
            v-if="hasPrev"
            @click="goToPrev"
            class="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-dark-900/80 hover:bg-brand-600 text-white border border-dark-700/80 backdrop-blur-md shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            title="Poprzedni mem (Strzałka w lewo)"
          >
            <ChevronLeft class="w-6 h-6 stroke-[2.5]" />
          </button>

          <button
            v-if="hasNext"
            @click="goToNext"
            class="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-dark-900/80 hover:bg-brand-600 text-white border border-dark-700/80 backdrop-blur-md shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            title="Następny mem (Strzałka w prawo)"
          >
            <ChevronRight class="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        <!-- Right Details / Management Sidebar (Fixed Width 380px) -->
        <div class="w-[380px] shrink-0 h-full bg-dark-800 border-l border-dark-700/80 flex flex-col justify-between overflow-y-auto">
          
          <!-- Content Top -->
          <div>
            <!-- Header bar with quick actions & close button -->
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
                  title="Kopiuj obraz do wklejenia w Messenger / Discord"
                >
                  <Copy class="w-4 h-4" />
                  <span>Kopiuj obraz</span>
                </button>

                <button
                  @click="store.copyMemeMetadata(meme)"
                  class="p-2 rounded-xl bg-dark-700/50 border border-dark-600 text-dark-300 hover:text-brand-400 hover:border-brand-500/40 transition-all flex items-center gap-1.5 text-xs font-semibold"
                  title="Kopiuj nazwę, tagi i opis jako tekst"
                >
                  <FileText class="w-4 h-4" />
                  <span>Kopiuj tekst</span>
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

            <!-- Filename & File Info -->
            <div class="p-4 border-b border-dark-700/80 space-y-3">
              <div>
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold text-brand-400 uppercase tracking-wider">Nazwa pliku</span>
                  <button
                    v-if="!isEditingName"
                    @click="startEditingName"
                    class="text-[11px] text-dark-400 hover:text-brand-400 flex items-center gap-1 transition-colors"
                    title="Zmień nazwę pliku"
                  >
                    <Pencil class="w-3 h-3" />
                    <span>Zmień nazwę</span>
                  </button>
                </div>

                <!-- View Mode -->
                <h3
                  v-if="!isEditingName"
                  class="text-sm font-bold text-dark-100 break-all select-all mt-0.5"
                >
                  {{ meme.name }}
                </h3>

                <!-- Inline Edit Mode -->
                <div v-else class="mt-1.5 flex items-center gap-1.5">
                  <input
                    ref="editNameInputRef"
                    v-model="editingNameInput"
                    type="text"
                    class="flex-1 bg-dark-900 border border-brand-500 rounded-lg px-2.5 py-1 text-xs text-dark-100 font-bold focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                    @keydown.enter.prevent="submitRename"
                    @keydown.esc.prevent="cancelEditingName"
                  />
                  <button
                    @click="submitRename"
                    class="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                    title="Zapisz nazwę (Enter)"
                  >
                    <Check class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="cancelEditingName"
                    class="p-1.5 bg-dark-700 hover:bg-dark-600 text-dark-300 rounded-lg transition-colors"
                    title="Anuluj (Esc)"
                  >
                    <X class="w-3.5 h-3.5" />
                  </button>
                </div>
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

              <!-- Rating & Usage Counter -->
              <div class="flex items-center justify-between p-2.5 bg-dark-900/80 rounded-xl border border-dark-700">
                <div class="flex items-center gap-1">
                  <span class="text-[11px] font-semibold text-dark-400 mr-1.5">Ocena:</span>
                  <button
                    v-for="star in 5"
                    :key="star"
                    @click="store.setMemeRating(meme, (meme.rating === star ? 0 : star))"
                    class="p-0.5 hover:scale-110 transition-transform"
                    :title="`Oceń na ${star} / 5`"
                  >
                    <Star
                      class="w-4 h-4"
                      :class="[
                        (meme.rating || 0) >= star
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-dark-600 hover:text-amber-400/50'
                      ]"
                    />
                  </button>
                </div>

                <div class="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                  <Flame class="w-4 h-4 text-orange-400" />
                  <span>Użyto: <strong class="font-mono text-dark-100">{{ meme.usedCount || 0 }}</strong></span>
                </div>
              </div>

              <div class="text-[11px] text-dark-400 break-all select-all bg-dark-900/40 p-2 rounded-lg border border-dark-700/60 font-mono">
                {{ meme.path }}
              </div>
            </div>

            <!-- Tags Section -->
            <div class="p-4 border-b border-dark-700/80 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-dark-400 uppercase tracking-wider flex items-center gap-1">
                  <TagIcon class="w-3 h-3" /> Tagi ({{ meme.tags.length }})
                </span>
              </div>

              <!-- Tag Badges -->
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

              <!-- Add Tag Input -->
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
                  class="absolute top-full left-0 right-0 mt-1 bg-dark-900 border border-dark-700 rounded-lg shadow-xl z-30 p-1 space-y-0.5 max-h-36 overflow-y-auto"
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

            <!-- OCR Recognized Text Section -->
            <div class="p-4 border-b border-dark-700/80 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileSearch class="w-3.5 h-3.5" />
                  <span>Tekst z obrazu (OCR)</span>
                </span>

                <button
                  v-if="meme.type === 'image'"
                  @click="store.scanMemeOcr(meme)"
                  class="text-[11px] text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium hover:underline transition-colors"
                >
                  <Sparkles class="w-3 h-3" />
                  <span>{{ meme.ocrText ? 'Przeskanuj ponownie' : 'Odczytaj tekst (OCR)' }}</span>
                </button>
              </div>

              <div
                v-if="meme.ocrText"
                class="p-2.5 bg-dark-900/90 rounded-xl border border-dark-700/80 text-xs text-dark-200 select-all relative group"
              >
                <p class="pr-8 leading-relaxed font-sans">{{ meme.ocrText }}</p>
                <button
                  @click="store.copyMemeMetadata({ ...meme, description: meme.ocrText, tags: [] })"
                  class="absolute top-2 right-2 p-1 rounded-md bg-dark-800 text-dark-400 hover:text-white hover:bg-dark-700 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                  title="Kopiuj odczytany tekst"
                >
                  <Copy class="w-3.5 h-3.5" />
                </button>
              </div>
              <div v-else class="text-[11px] text-dark-500 italic">
                {{ meme.type === 'image' ? 'Tekst nie został jeszcze odczytany. Kliknij "Odczytaj tekst", aby wyszukiwać mema po jego treści.' : 'OCR jest dostępny tylko dla plików graficznych.' }}
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
            <!-- Copy Image / Media (Primary to paste directly in Messenger/Discord) -->
            <button
              @click="store.copyMemeToClipboard(meme)"
              class="w-full py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              title="Kopiuje obraz do schowka, gotowy do wklejenia w Messengerze / Discordzie"
            >
              <Copy class="w-4 h-4" />
              <span>Kopiuj mema do wklejenia (Messenger/Discord)</span>
            </button>

            <!-- Edit in Meme Studio (For image memes) -->
            <button
              v-if="meme.type === 'image'"
              @click="store.openStudio(meme)"
              class="w-full py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              title="Otwórz tego mema w edytorze Meme Studio"
            >
              <Sparkles class="w-3.5 h-3.5 text-purple-400" />
              <span>Edytuj w Meme Studio</span>
            </button>

            <!-- Copy Metadata / Text + Tags -->
            <button
              @click="store.copyMemeMetadata(meme)"
              class="w-full py-2 bg-dark-800 hover:bg-dark-700 border border-dark-700 text-dark-200 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              title="Kopiuje nazwę, tagi i opis jako sformatowany tekst"
            >
              <FileText class="w-3.5 h-3.5 text-brand-400" />
              <span>Kopiuj opis i tagi (Tekst)</span>
            </button>

            <div class="grid grid-cols-2 gap-2">
              <button
                @click="store.copyPathToClipboard(meme)"
                class="py-2 bg-dark-800 hover:bg-dark-700 border border-dark-700 text-dark-300 hover:text-dark-100 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                title="Kopiuj ścieżkę do pliku na dysku"
              >
                <HardDrive class="w-3.5 h-3.5" />
                <span>Kopiuj ścieżkę</span>
              </button>

              <button
                @click="store.openInExplorer(meme)"
                class="py-2 bg-dark-800 hover:bg-dark-700 border border-dark-700 text-dark-300 hover:text-dark-100 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                title="Pokaż plik w Eksploratorze Windows"
              >
                <FolderOpen class="w-3.5 h-3.5" />
                <span>Eksplorator</span>
              </button>
            </div>

            <div class="flex items-center justify-between pt-1">
              <button
                @click="store.openExternal(meme)"
                class="text-[11px] text-dark-400 hover:text-dark-200 flex items-center gap-1"
                title="Otwórz w domyślnej aplikacji systemowej"
              >
                <ExternalLink class="w-3 h-3" />
                <span>Otwórz w aplikacji domyślnej</span>
              </button>

              <button
                @click="store.deleteMeme(meme)"
                class="text-[11px] text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1"
              >
                <Trash2 class="w-3 h-3" />
                <span>Usuń do kosza</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  </Transition>
</template>
