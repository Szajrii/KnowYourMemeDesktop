<script setup lang="ts">
import { computed } from 'vue'
import { useMemeStore } from '../stores/memeStore'
import { getMediaUrl } from '../utils/media'
import {
  X,
  BarChart3,
  Flame,
  Star,
  HardDrive,
  Sparkles,
  Layers,
  Tag as TagIcon,
  Image as ImageIcon,
  Film,
  Music,
  TrendingUp,
  Award
} from 'lucide-vue-next'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const store = useMemeStore()

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

const totalSize = computed(() => {
  return store.memes.reduce((acc, m) => acc + (m.size || 0), 0)
})

const topUsedMeme = computed(() => {
  if (store.memes.length === 0) return null
  const sorted = [...store.memes].sort((a, b) => (b.usedCount || 0) - (a.usedCount || 0))
  return (sorted[0]?.usedCount && sorted[0].usedCount > 0) ? sorted[0] : null
})

const totalUses = computed(() => {
  return store.memes.reduce((acc, m) => acc + (m.usedCount || 0), 0)
})

const ocrIndexedCount = computed(() => {
  return store.memes.filter(m => !!m.ocrText).length
})

const ratingDistribution = computed(() => {
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  for (const m of store.memes) {
    if (m.rating && m.rating >= 1 && m.rating <= 5) {
      dist[m.rating as 1 | 2 | 3 | 4 | 5]++
    }
  }
  return dist
})

const topTags = computed(() => {
  return store.allTagsWithCount.slice(0, 6)
})
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-3xl bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
      <!-- Header -->
      <div class="p-4 border-b border-dark-700 flex items-center justify-between bg-dark-900/60">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
            <BarChart3 class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-bold text-sm text-dark-100">Statystyki & Dashboard Memiarza</h3>
            <p class="text-xs text-dark-400">Podsumowanie Twojej kolekcji i nawyków memowych</p>
          </div>
        </div>

        <button
          @click="emit('close')"
          class="p-1.5 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-5 overflow-y-auto space-y-4 flex-1">
        <!-- Top Metrics Row -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <!-- Total Memes -->
          <div class="p-3.5 bg-dark-900/80 border border-dark-700 rounded-xl space-y-1">
            <span class="text-[10px] uppercase font-bold text-dark-400 flex items-center gap-1">
              <Layers class="w-3.5 h-3.5 text-brand-400" />
              <span>Łącznie memów</span>
            </span>
            <div class="text-xl font-extrabold text-dark-100 font-mono">{{ store.memes.length }}</div>
            <div class="text-[10px] text-dark-400">w {{ store.folders.length }} folderach</div>
          </div>

          <!-- Total Disk Space -->
          <div class="p-3.5 bg-dark-900/80 border border-dark-700 rounded-xl space-y-1">
            <span class="text-[10px] uppercase font-bold text-dark-400 flex items-center gap-1">
              <HardDrive class="w-3.5 h-3.5 text-emerald-400" />
              <span>Rozmiar na dysku</span>
            </span>
            <div class="text-xl font-extrabold text-dark-100 font-mono">{{ formatSize(totalSize) }}</div>
            <div class="text-[10px] text-dark-400">zajęte miejsce</div>
          </div>

          <!-- Total Shares -->
          <div class="p-3.5 bg-dark-900/80 border border-dark-700 rounded-xl space-y-1">
            <span class="text-[10px] uppercase font-bold text-dark-400 flex items-center gap-1">
              <Flame class="w-3.5 h-3.5 text-orange-400" />
              <span>Użyć i wysłań</span>
            </span>
            <div class="text-xl font-extrabold text-dark-100 font-mono">{{ totalUses }}</div>
            <div class="text-[10px] text-dark-400">razy skopiowano</div>
          </div>

          <!-- OCR Indexed -->
          <div class="p-3.5 bg-dark-900/80 border border-dark-700 rounded-xl space-y-1">
            <span class="text-[10px] uppercase font-bold text-dark-400 flex items-center gap-1">
              <Sparkles class="w-3.5 h-3.5 text-purple-400" />
              <span>Zindeksowane OCR</span>
            </span>
            <div class="text-xl font-extrabold text-dark-100 font-mono">{{ ocrIndexedCount }}</div>
            <div class="text-[10px] text-dark-400">memów z tekstem</div>
          </div>
        </div>

        <!-- Most Used Meme & Media Breakdown -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <!-- Top Meme of the Collection -->
          <div class="p-4 bg-dark-900/80 border border-dark-700 rounded-xl space-y-3 flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-dark-200 flex items-center gap-1.5">
                <Award class="w-4 h-4 text-amber-400" />
                <span>Twój Mem Roku (Najczęściej Używany)</span>
              </span>
              <span v-if="topUsedMeme" class="text-[11px] font-bold text-orange-400 flex items-center gap-1">
                <Flame class="w-3.5 h-3.5" />
                <span>{{ topUsedMeme.usedCount }} użyć</span>
              </span>
            </div>

            <div v-if="topUsedMeme" class="flex items-center gap-3 bg-dark-950 p-2.5 rounded-xl border border-dark-800">
              <div class="w-16 h-16 rounded-lg bg-dark-900 overflow-hidden flex items-center justify-center shrink-0">
                <img
                  :src="getMediaUrl(topUsedMeme.path)"
                  :alt="topUsedMeme.name"
                  class="w-full h-full object-contain"
                />
              </div>
              <div class="min-w-0 space-y-1">
                <h5 class="text-xs font-bold text-dark-100 truncate">{{ topUsedMeme.name }}</h5>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="t in topUsedMeme.tags.slice(0, 2)"
                    :key="t"
                    class="text-[10px] px-1.5 py-0.2 rounded bg-brand-500/15 text-brand-300"
                  >
                    #{{ t }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="text-xs text-dark-500 italic py-4 text-center">
              Brak jeszcze statystyk użyć. Kopiuj memy do schowka, aby wyłonić zwycięzcę!
            </div>
          </div>

          <!-- Media Types Breakdown -->
          <div class="p-4 bg-dark-900/80 border border-dark-700 rounded-xl space-y-3">
            <span class="text-xs font-bold text-dark-200">Podział formatów w bibliotece</span>

            <div class="grid grid-cols-3 gap-2 text-xs">
              <div class="p-2.5 bg-dark-950 rounded-lg border border-dark-800 text-center space-y-1">
                <ImageIcon class="w-4 h-4 text-indigo-400 mx-auto" />
                <div class="text-xs font-bold text-dark-100">{{ store.stats.images }}</div>
                <div class="text-[10px] text-dark-400">Obrazy</div>
              </div>

              <div class="p-2.5 bg-dark-950 rounded-lg border border-dark-800 text-center space-y-1">
                <span class="text-[11px] font-extrabold text-brand-accent">GIF</span>
                <div class="text-xs font-bold text-dark-100">{{ store.stats.gifs }}</div>
                <div class="text-[10px] text-dark-400">Animacje</div>
              </div>

              <div class="p-2.5 bg-dark-950 rounded-lg border border-dark-800 text-center space-y-1">
                <Film class="w-4 h-4 text-purple-400 mx-auto" />
                <div class="text-xs font-bold text-dark-100">{{ store.stats.videos }}</div>
                <div class="text-[10px] text-dark-400">Wideo</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Tags & Rating Breakdown -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <!-- Top Tags -->
          <div class="p-4 bg-dark-900/80 border border-dark-700 rounded-xl space-y-3">
            <span class="text-xs font-bold text-dark-200 flex items-center gap-1.5">
              <TagIcon class="w-4 h-4 text-brand-400" />
              <span>Najpopularniejsze Tagi</span>
            </span>

            <div class="flex flex-wrap gap-1.5">
              <div
                v-for="t in topTags"
                :key="t.name"
                class="px-2.5 py-1 rounded-lg bg-dark-950 border border-dark-800 text-xs text-dark-200 flex items-center gap-2"
              >
                <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: t.color }" />
                <span class="font-medium">#{{ t.name }}</span>
                <span class="text-[10px] text-dark-400 font-mono">({{ t.count }})</span>
              </div>
            </div>
          </div>

          <!-- Star Ratings Distribution -->
          <div class="p-4 bg-dark-900/80 border border-dark-700 rounded-xl space-y-2.5">
            <span class="text-xs font-bold text-dark-200 flex items-center gap-1.5">
              <Star class="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Rozkład Ocen Gwiazdkowych</span>
            </span>

            <div class="space-y-1.5 text-xs">
              <div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="flex items-center gap-2">
                <span class="text-[11px] font-mono text-dark-300 w-8">{{ star }} ⭐</span>
                <div class="flex-1 h-2 bg-dark-950 rounded-full overflow-hidden border border-dark-800">
                  <div
                    class="h-full bg-amber-400 transition-all rounded-full"
                    :style="{
                      width: store.memes.length > 0
                        ? `${(ratingDistribution[star as 1|2|3|4|5] / store.memes.length) * 100}%`
                        : '0%'
                    }"
                  />
                </div>
                <span class="text-[10px] text-dark-400 font-mono w-6 text-right">
                  {{ ratingDistribution[star as 1|2|3|4|5] }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-dark-700 bg-dark-900/60 flex items-center justify-end">
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
