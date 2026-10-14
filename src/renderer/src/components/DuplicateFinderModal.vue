<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMemeStore } from '../stores/memeStore'
import { getMediaUrl } from '../utils/media'
import { MemeItem, SimilarCluster } from '../../../shared/types'
import { X, Copy, Trash2, CheckCircle, RefreshCw, AlertCircle, Sparkles, FolderOpen, Tag as TagIcon, Check } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const store = useMemeStore()
const activeTab = ref<'exact' | 'similar'>('exact')
const duplicateGroups = ref<{ hash: string; totalSize: number; memes: MemeItem[] }[]>([])
const isLoading = ref(false)
const similarityThreshold = ref(80)

const similarClusters = computed<SimilarCluster[]>(() => {
  return store.getSimilarClusters(similarityThreshold.value)
})

const unhashedMemesCount = computed(() => {
  return store.memes.filter(m => !m.phash && m.type !== 'audio').length
})

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function scan() {
  isLoading.value = true
  duplicateGroups.value = await store.findDuplicates()
  isLoading.value = false
}

async function scanSimilarity() {
  await store.scanAllSimilarity()
}

async function syncTags(cluster: SimilarCluster) {
  await store.syncClusterTags(cluster)
}

function openMeme(meme: MemeItem) {
  store.selectedMeme = meme
}

async function deleteSingle(meme: MemeItem, groupIndex: number) {
  if (!confirm(`Czy na pewno chcesz usunąć plik "${meme.name}" z dysku?`)) return

  await store.deleteMeme(meme)
  duplicateGroups.value[groupIndex].memes = duplicateGroups.value[groupIndex].memes.filter(
    m => m.path !== meme.path
  )
  if (duplicateGroups.value[groupIndex].memes.length <= 1) {
    duplicateGroups.value.splice(groupIndex, 1)
  }
}

async function keepOnlyOne(keepMeme: MemeItem, groupIndex: number) {
  const toDelete = duplicateGroups.value[groupIndex].memes.filter(m => m.path !== keepMeme.path)
  if (!confirm(`Czy na pewno chcesz usunąć ${toDelete.length} duplikat(y) i zachować tylko "${keepMeme.name}"?`)) {
    return
  }

  for (const meme of toDelete) {
    await store.deleteMeme(meme)
  }

  duplicateGroups.value.splice(groupIndex, 1)
  store.showToast('Usunięto niepotrzebne duplikaty!', 'success')
}

onMounted(() => {
  scan()
})
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-4xl bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
      <!-- Header -->
      <div class="p-4 border-b border-dark-700 flex items-center justify-between bg-dark-900/60 shrink-0">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Copy class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-bold text-sm text-dark-100">Wykrywacz Duplikatów</h3>
            <p class="text-xs text-dark-400">Znajdź identyczne pliki i zwolnij miejsce na dysku</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="scan"
            :disabled="isLoading"
            class="px-3 py-1.5 rounded-xl bg-dark-700 hover:bg-dark-600 text-dark-200 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <RefreshCw class="w-3.5 h-3.5" :class="isLoading ? 'animate-spin' : ''" />
            <span>{{ isLoading ? 'Skanowanie...' : 'Skanuj ponownie' }}</span>
          </button>

          <button
            @click="emit('close')"
            class="p-1.5 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="px-5 pt-2 flex items-center justify-between border-b border-dark-700 bg-dark-900/40 shrink-0">
        <div class="flex items-center gap-2">
          <button
            @click="activeTab = 'exact'"
            class="pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer"
            :class="activeTab === 'exact' ? 'border-amber-500 text-amber-300' : 'border-transparent text-dark-400 hover:text-dark-200'"
          >
            <Copy class="w-3.5 h-3.5" />
            <span>Identyczne pliki ({{ duplicateGroups.length }})</span>
          </button>

          <button
            @click="activeTab = 'similar'"
            class="pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer"
            :class="activeTab === 'similar' ? 'border-brand-500 text-brand-300' : 'border-transparent text-dark-400 hover:text-dark-200'"
          >
            <Sparkles class="w-3.5 h-3.5" />
            <span>Podobne szablony ({{ similarClusters.length }})</span>
          </button>
        </div>

        <!-- Scan Hashes Button if on similar tab -->
        <div v-if="activeTab === 'similar'" class="flex items-center gap-2 pb-2">
          <span v-if="unhashedMemesCount > 0" class="text-[11px] text-amber-400 hidden sm:inline">
            {{ unhashedMemesCount }} memów bez hasha
          </span>
          <button
            @click="scanSimilarity"
            :disabled="store.isSimilarityScanning"
            class="px-2.5 py-1 rounded-lg bg-brand-600/20 hover:bg-brand-600/30 border border-brand-500/40 text-brand-300 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw class="w-3 h-3" :class="store.isSimilarityScanning ? 'animate-spin' : ''" />
            <span>{{ store.isSimilarityScanning ? (store.similarityProgressText || 'Indeksowanie...') : 'Indeksuj szablony' }}</span>
          </button>
        </div>
      </div>

      <!-- Body: EXACT DUPLICATES TAB -->
      <div v-if="activeTab === 'exact'" class="p-5 overflow-y-auto flex-1 min-h-0 space-y-4">
        <!-- Loading state -->
        <div v-if="isLoading" class="py-16 text-center space-y-3">
          <div class="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p class="text-xs font-medium text-dark-300">Porównywanie sum kontrolnych plików na dysku...</p>
        </div>

        <!-- Empty state -->
        <div v-else-if="duplicateGroups.length === 0" class="py-16 text-center space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle class="w-6 h-6" />
          </div>
          <h4 class="text-sm font-bold text-dark-100">Brak duplikatów!</h4>
          <p class="text-xs text-dark-400 max-w-sm mx-auto">
            Wszystkie pliki w Twoich folderach są unikalne. Twoja kolekcja jest idealnie uporządkowana.
          </p>
        </div>

        <!-- Groups list -->
        <div v-else class="space-y-4">
          <div class="flex items-center justify-between text-xs text-dark-400 px-1">
            <span>Znaleziono <strong>{{ duplicateGroups.length }}</strong> grup duplikatów</span>
            <span>Łączny potencjał odzyskania miejsca: <strong>{{ formatSize(duplicateGroups.reduce((acc, g) => acc + g.totalSize * (g.memes.length - 1) / g.memes.length, 0)) }}</strong></span>
          </div>

          <div
            v-for="(group, gIdx) in duplicateGroups"
            :key="group.hash"
            class="bg-dark-900/80 border border-dark-700 rounded-xl p-4 space-y-3"
          >
            <div class="flex items-center justify-between border-b border-dark-700/60 pb-2.5">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  {{ group.memes.length }} kopie
                </span>
                <span class="text-xs text-dark-300 font-mono">Rozmiar jednego: {{ formatSize(group.memes[0]?.size || 0) }}</span>
              </div>
            </div>

            <!-- Side by side cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div
                v-for="meme in group.memes"
                :key="meme.path"
                class="bg-dark-800 border border-dark-700 rounded-xl p-3 flex flex-col justify-between gap-3 group relative"
              >
                <!-- Thumbnail -->
                <div class="w-full h-36 bg-dark-950 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer" @click="openMeme(meme)">
                  <img
                    :src="getMediaUrl(meme.path)"
                    :alt="meme.name"
                    class="w-full h-full object-contain"
                  />
                </div>

                <!-- Info -->
                <div class="space-y-1">
                  <h5 class="text-xs font-semibold text-dark-200 truncate cursor-pointer hover:text-white" @click="openMeme(meme)" :title="meme.name">
                    {{ meme.name }}
                  </h5>
                  <p class="text-[10px] text-dark-400 truncate font-mono" :title="meme.path">
                    {{ meme.path }}
                  </p>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-2 pt-1 border-t border-dark-700/60">
                  <button
                    @click="keepOnlyOne(meme, gIdx)"
                    class="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                    title="Zostaw ten plik, a pozostałe kopie z tej grupy usuń"
                  >
                    <CheckCircle class="w-3.5 h-3.5" />
                    <span>Zostaw tylko ten</span>
                  </button>

                  <button
                    @click="deleteSingle(meme, gIdx)"
                    class="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs transition-colors cursor-pointer"
                    title="Usuń ten plik"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Body: SIMILAR TEMPLATES TAB -->
      <div v-else class="p-5 overflow-y-auto flex-1 min-h-0 space-y-4">
        <!-- Empty state -->
        <div v-if="similarClusters.length === 0" class="py-16 text-center space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-400 flex items-center justify-center mx-auto">
            <Sparkles class="w-6 h-6" />
          </div>
          <h4 class="text-sm font-bold text-dark-100">Brak wykrytych powiązanych szablonów</h4>
          <p class="text-xs text-dark-400 max-w-sm mx-auto">
            Nie znaleziono wariantów tych samych memów lub szablony nie zostały jeszcze zindeksowane. Kliknij "Indeksuj szablony" powyżej.
          </p>
        </div>

        <!-- Clusters list -->
        <div v-else class="space-y-4">
          <div class="flex items-center justify-between text-xs text-dark-400 px-1">
            <span>Wykryto <strong>{{ similarClusters.length }}</strong> grup podobnych szablonów</span>
            <span v-if="similarClusters.some(c => c.untaggedCount > 0)" class="text-amber-400 font-semibold flex items-center gap-1">
              <AlertCircle class="w-3.5 h-3.5" />
              <span>Są nieotagowane warianty</span>
            </span>
          </div>

          <div
            v-for="cluster in similarClusters"
            :key="cluster.id"
            class="bg-dark-900/80 border rounded-xl p-4 space-y-3"
            :class="cluster.untaggedCount > 0 ? 'border-amber-500/40 bg-amber-500/[0.02]' : 'border-dark-700'"
          >
            <!-- Cluster Header -->
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-dark-700/60 pb-2.5">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-brand-500/15 border border-brand-500/30 text-brand-300">
                  {{ cluster.memes.length }} wariantów szablonu
                </span>

                <span
                  v-if="cluster.untaggedCount > 0"
                  class="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center gap-1"
                >
                  <AlertCircle class="w-3 h-3" />
                  <span>{{ cluster.untaggedCount }} bez tagów</span>
                </span>
              </div>

              <!-- Sync Tags Button -->
              <div v-if="cluster.suggestedTags.length > 0 && cluster.untaggedCount > 0" class="flex items-center gap-2">
                <button
                  @click="syncTags(cluster)"
                  class="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-dark-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                  title="Przypisz tagi z otagowanych memów do wszystkich brakujących w tej grupie"
                >
                  <Sparkles class="w-3.5 h-3.5" />
                  <span>Uzupełnij tagi [{{ cluster.suggestedTags.slice(0, 3).join(', ') }}{{ cluster.suggestedTags.length > 3 ? '...' : '' }}]</span>
                </button>
              </div>
            </div>

            <!-- Memes in this cluster -->
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <div
                v-for="meme in cluster.memes"
                :key="meme.path"
                @click="openMeme(meme)"
                class="bg-dark-800 border rounded-xl p-2.5 flex flex-col justify-between gap-2 group cursor-pointer hover:border-brand-500/50 transition-all"
                :class="(!meme.tags || meme.tags.length === 0) ? 'border-amber-500/30' : 'border-dark-700'"
              >
                <div class="w-full h-32 bg-dark-950 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    :src="getMediaUrl(meme.path)"
                    :alt="meme.name"
                    class="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                </div>

                <div class="space-y-1">
                  <h5 class="text-xs font-semibold text-dark-200 truncate group-hover:text-white" :title="meme.name">
                    {{ meme.name }}
                  </h5>

                  <div class="flex flex-wrap gap-1 min-h-[20px]">
                    <span
                      v-for="t in (meme.tags || []).slice(0, 3)"
                      :key="t"
                      class="text-[10px] px-1.5 py-0.2 rounded bg-dark-700/80 text-dark-300"
                    >
                      #{{ t }}
                    </span>
                    <span
                      v-if="!meme.tags || meme.tags.length === 0"
                      class="text-[10px] text-amber-400 font-semibold flex items-center gap-0.5"
                    >
                      <AlertCircle class="w-2.5 h-2.5" /> Brak tagów
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-dark-700 bg-dark-900/60 flex items-center justify-end shrink-0">
        <button
          @click="emit('close')"
          class="px-4 py-2 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-xl text-xs font-semibold transition-colors"
        >
          Zamknij
        </button>
      </div>
    </div>
  </div>
</template>
