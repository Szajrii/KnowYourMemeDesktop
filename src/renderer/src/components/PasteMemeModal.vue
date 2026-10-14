<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMemeStore } from '../stores/memeStore'
import { X, Folder, Tag as TagIcon, Check, ClipboardPaste, Sparkles, AlertCircle } from 'lucide-vue-next'
import { computeCanvasDHash } from '../utils/phash'
import { getMediaUrl } from '../utils/media'
import { SimilarityMatch } from '../../../shared/types'

const props = defineProps<{
  visible: boolean
  imageDataUrl: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const store = useMemeStore()

const fileName = ref('')
const selectedFolder = ref('')
const tags = ref<string[]>([])
const tagInput = ref('')
const description = ref('')
const isSaving = ref(false)
const similarMatches = ref<SimilarityMatch[]>([])
const isCheckingSimilarity = ref(false)

const suggestedTags = computed(() => {
  const set = new Set<string>()
  for (const match of similarMatches.value) {
    for (const t of match.meme.tags || []) {
      const norm = t.toLowerCase().trim()
      if (norm && !tags.value.includes(norm)) {
        set.add(norm)
      }
    }
  }
  return Array.from(set)
})

async function checkSimilarity(dataUrl: string) {
  if (!dataUrl) {
    similarMatches.value = []
    return
  }
  isCheckingSimilarity.value = true
  try {
    const hash = await computeCanvasDHash(dataUrl)
    if (hash) {
      similarMatches.value = store.findSimilarTo(hash, 80)
    } else {
      similarMatches.value = []
    }
  } catch (err) {
    console.error('Failed to compute similarity for pasted image:', err)
    similarMatches.value = []
  } finally {
    isCheckingSimilarity.value = false
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '_')
      const timeStr = Date.now().toString().slice(-4)
      fileName.value = `meme_${dateStr}_${timeStr}.png`
      selectedFolder.value = store.folders.length > 0 ? store.folders[0].path : ''
      tags.value = []
      tagInput.value = ''
      description.value = ''
      similarMatches.value = []
      if (props.imageDataUrl) {
        checkSimilarity(props.imageDataUrl)
      }
    }
  },
  { immediate: true }
)

function addSuggestedTag(tag: string) {
  addTag(tag)
}

function addAllSuggestedTags() {
  for (const t of suggestedTags.value) {
    addTag(t)
  }
}

function addTag(tag: string) {
  const norm = tag.toLowerCase().trim()
  if (norm && !tags.value.includes(norm)) {
    tags.value.push(norm)
  }
  tagInput.value = ''
}

function removeTag(tag: string) {
  tags.value = tags.value.filter(t => t !== tag)
}

async function saveMeme() {
  if (!selectedFolder.value) {
    store.showToast('Wybierz folder docelowy', 'error')
    return
  }
  if (!props.imageDataUrl) return

  isSaving.value = true
  const success = await store.savePastedMeme({
    folderPath: selectedFolder.value,
    fileName: fileName.value.trim(),
    base64Data: props.imageDataUrl,
    tags: tags.value,
    description: description.value.trim()
  })
  isSaving.value = false

  if (success) {
    emit('saved')
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible"
        class="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        @click.self="emit('close')"
        @keydown.esc="emit('close')"
      >
        <div class="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
          <!-- Header -->
          <div class="p-4 border-b border-dark-700 flex items-center justify-between bg-dark-900/60 shrink-0">
            <div class="flex items-center gap-2.5">
              <div class="p-2 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-400">
                <ClipboardPaste class="w-5 h-5" />
              </div>
              <div>
                <h3 class="font-bold text-sm text-dark-100">Nowy mem ze schowka</h3>
                <p class="text-xs text-dark-400">Zapisz wklejony obraz w swojej bibliotece</p>
              </div>
            </div>

            <button
              @click="emit('close')"
              class="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="p-5 overflow-y-auto space-y-4 flex-1 min-h-0">
            <!-- Image Preview Box -->
            <div class="w-full max-h-48 sm:max-h-56 bg-dark-950/80 rounded-xl border border-dark-700/80 p-2 flex items-center justify-center overflow-hidden shrink-0">
              <img
                :src="imageDataUrl"
                alt="Pasted meme preview"
                class="max-h-52 max-w-full object-contain rounded-lg shadow-md"
              />
            </div>

            <!-- Similar Memes Recognition Banner -->
            <div
              v-if="similarMatches.length > 0"
              class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2.5 animate-in fade-in duration-200"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-xs font-semibold text-amber-300">
                  <Sparkles class="w-4 h-4 text-amber-400" />
                  <span>Rozpoznano szablon w bibliotece! ({{ similarMatches.length }} podobnych)</span>
                </div>
                <span class="text-[11px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                  {{ similarMatches[0].similarity }}% zgodności
                </span>
              </div>

              <!-- Thumbnails of similar items -->
              <div class="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin">
                <div
                  v-for="match in similarMatches.slice(0, 5)"
                  :key="match.meme.path"
                  class="relative group shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-amber-500/30 bg-dark-900"
                  :title="`${match.meme.name} (${match.similarity}% podobieństwa)`"
                >
                  <img
                    :src="getMediaUrl(match.meme.path)"
                    class="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <span class="absolute bottom-0 inset-x-0 bg-black/75 text-[9px] text-amber-300 text-center font-mono py-0.5">
                    {{ match.similarity }}%
                  </span>
                </div>
              </div>

              <!-- Suggested Tags -->
              <div v-if="suggestedTags.length > 0" class="pt-1 border-t border-amber-500/20 flex flex-wrap items-center gap-1.5">
                <span class="text-[11px] text-amber-200/80 font-medium">Sugerowane tagi:</span>
                <button
                  v-for="stag in suggestedTags"
                  :key="stag"
                  type="button"
                  @click="addSuggestedTag(stag)"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 transition-colors cursor-pointer"
                  title="Kliknij, aby dodać ten tag"
                >
                  <span>+ #{{ stag }}</span>
                </button>
                <button
                  v-if="suggestedTags.length > 1"
                  type="button"
                  @click="addAllSuggestedTags"
                  class="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-dark-950 hover:bg-amber-400 transition-colors ml-auto shadow-sm"
                >
                  Dodaj wszystkie (+{{ suggestedTags.length }})
                </button>
              </div>
            </div>

            <!-- Target Folder Selection -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-dark-300 flex items-center gap-1.5">
                <Folder class="w-3.5 h-3.5 text-brand-400" />
                <span>Zapisz w folderze:</span>
              </label>
              <select
                v-model="selectedFolder"
                class="w-full bg-dark-900 border border-dark-700 rounded-lg p-2 text-xs text-dark-100 focus:outline-none focus:border-brand-500 font-mono"
              >
                <option v-for="f in store.folders" :key="f.path" :value="f.path">
                  {{ f.name }} ({{ f.path }})
                </option>
              </select>
            </div>

            <!-- File Name -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-dark-300">Nazwa pliku:</label>
              <input
                v-model="fileName"
                type="text"
                class="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-xs text-dark-100 focus:outline-none focus:border-brand-500 font-mono font-medium"
                placeholder="np. kot_smieszny.png"
              />
            </div>

            <!-- Tags -->
            <div class="space-y-2">
              <label class="text-xs font-semibold text-dark-300 flex items-center gap-1.5">
                <TagIcon class="w-3.5 h-3.5 text-brand-400" />
                <span>Tagi:</span>
              </label>

              <div class="flex flex-wrap gap-1.5 min-h-[30px] p-2 bg-dark-900/60 border border-dark-700 rounded-lg">
                <span
                  v-for="t in tags"
                  :key="t"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-500/15 border border-brand-500/30 text-brand-300"
                >
                  <span>#{{ t }}</span>
                  <button @click="removeTag(t)" class="hover:text-rose-400">
                    <X class="w-3 h-3" />
                  </button>
                </span>

                <input
                  v-model="tagInput"
                  @keydown.enter.prevent="addTag(tagInput)"
                  type="text"
                  placeholder="Wpisz tag i Enter..."
                  class="flex-1 bg-transparent text-xs text-dark-100 placeholder-dark-500 focus:outline-none min-w-[120px]"
                />
              </div>
            </div>

            <!-- Description -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-dark-300">Opis / Notatki (opcjonalnie):</label>
              <textarea
                v-model="description"
                rows="2"
                placeholder="Wpisz kontekst lub cytat z mema..."
                class="w-full bg-dark-900 border border-dark-700 rounded-lg p-2 text-xs text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500 resize-none"
              ></textarea>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-4 border-t border-dark-700 bg-dark-900/60 flex items-center justify-end gap-2 shrink-0">
            <button
              @click="emit('close')"
              class="px-4 py-2 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Anuluj
            </button>
            <button
              @click="saveMeme"
              :disabled="isSaving || !selectedFolder"
              class="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-600/30 flex items-center gap-1.5"
            >
              <Check class="w-4 h-4" />
              <span>{{ isSaving ? 'Zapisywanie...' : 'Zapisz mema' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
