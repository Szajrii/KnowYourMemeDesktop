<script setup lang="ts">
import { ref, computed } from 'vue'
import { MemeItem } from '../../../shared/types'
import { useMemeStore } from '../stores/memeStore'
import {
  Heart,
  Copy,
  FolderOpen,
  Film,
  Sparkles,
  Check,
  Tag as TagIcon
} from 'lucide-vue-next'

const props = defineProps<{
  meme: MemeItem
}>()

const store = useMemeStore()
const videoRef = ref<HTMLVideoElement | null>(null)
const isHovered = ref(false)

const mediaSrc = computed(() => {
  // Convert path to custom media protocol
  const normalized = props.meme.path.replace(/\\/g, '/')
  return `media://${normalized}`
})

const formattedSize = computed(() => {
  const bytes = props.meme.size
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
})

const isSelected = computed(() => store.selectedPaths.has(props.meme.path))

function handleMouseEnter() {
  isHovered.value = true
  if (props.meme.type === 'video' && videoRef.value) {
    videoRef.value.play().catch(() => {})
  }
}

function handleMouseLeave() {
  isHovered.value = false
  if (props.meme.type === 'video' && videoRef.value) {
    videoRef.value.pause()
    videoRef.value.currentTime = 0
  }
}

function openDetail() {
  store.selectedMeme = props.meme
}

function getTagColor(tagName: string) {
  const norm = tagName.toLowerCase().trim()
  return store.tags[norm]?.color || '#6366f1'
}
</script>

<template>
  <div
    class="group relative flex flex-col bg-dark-800 border rounded-xl overflow-hidden shadow-md transition-all duration-200 cursor-pointer"
    :class="[
      isSelected
        ? 'border-brand-500 ring-2 ring-brand-500/40'
        : 'border-dark-700/80 hover:border-dark-500 hover:shadow-xl hover:-translate-y-0.5'
    ]"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @click="openDetail"
  >
    <!-- Media Container -->
    <div
      class="relative w-full bg-dark-900 overflow-hidden flex items-center justify-center"
      :class="[
        store.settings.thumbnailSize === 'small' ? 'h-40' :
        store.settings.thumbnailSize === 'large' ? 'h-72' : 'h-52'
      ]"
    >
      <!-- Image / GIF -->
      <img
        v-if="meme.type === 'image' || meme.type === 'gif'"
        :src="mediaSrc"
        :alt="meme.name"
        loading="lazy"
        class="w-full h-full object-contain pointer-events-none transition-transform duration-300 group-hover:scale-[1.02]"
      />

      <!-- Video -->
      <video
        v-else-if="meme.type === 'video'"
        ref="videoRef"
        :src="mediaSrc"
        muted
        loop
        playsinline
        preload="metadata"
        class="w-full h-full object-contain pointer-events-none"
      />

      <!-- Type Badge -->
      <div class="absolute top-2 left-2 flex items-center gap-1 z-10">
        <span
          v-if="meme.type === 'gif'"
          class="px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase bg-brand-accent/90 text-white rounded-md backdrop-blur-md shadow"
        >
          GIF
        </span>
        <span
          v-else-if="meme.type === 'video'"
          class="px-2 py-0.5 text-[10px] font-bold uppercase bg-brand-600/90 text-white rounded-md backdrop-blur-md shadow flex items-center gap-1"
        >
          <Film class="w-3 h-3" /> Wideo
        </span>
      </div>

      <!-- Quick Action Overlay Buttons (Top Right) -->
      <div
        class="absolute top-2 right-2 flex items-center gap-1.5 z-10 transition-opacity duration-150"
        :class="isHovered || meme.isFavorite || isSelected ? 'opacity-100' : 'opacity-0'"
        @click.stop
      >
        <!-- Selection Checkbox -->
        <button
          @click="store.toggleSelectPath(meme.path)"
          class="w-7 h-7 rounded-lg flex items-center justify-center transition-all backdrop-blur-md shadow"
          :class="[
            isSelected
              ? 'bg-brand-500 text-white ring-2 ring-brand-400'
              : 'bg-dark-900/80 text-dark-300 hover:text-white hover:bg-dark-800'
          ]"
          title="Zaznacz"
        >
          <Check v-if="isSelected" class="w-4 h-4 stroke-[3]" />
          <div v-else class="w-3.5 h-3.5 rounded-sm border border-dark-400" />
        </button>

        <!-- Favorite Button -->
        <button
          @click="store.toggleFavorite(meme)"
          class="w-7 h-7 rounded-lg flex items-center justify-center transition-all backdrop-blur-md shadow"
          :class="[
            meme.isFavorite
              ? 'bg-rose-500 text-white'
              : 'bg-dark-900/80 text-dark-300 hover:text-rose-400 hover:bg-dark-800'
          ]"
          title="Ulubione"
        >
          <Heart
            class="w-4 h-4"
            :class="meme.isFavorite ? 'fill-current' : ''"
          />
        </button>

        <!-- Copy Meme to Clipboard -->
        <button
          @click="store.copyMemeToClipboard(meme)"
          class="w-7 h-7 rounded-lg bg-dark-900/80 hover:bg-dark-800 text-dark-300 hover:text-brand-400 flex items-center justify-center transition-all backdrop-blur-md shadow"
          title="Kopiuj do schowka"
        >
          <Copy class="w-4 h-4" />
        </button>
      </div>

      <!-- Quick Action Overlay Buttons (Bottom Right Hover) -->
      <div
        class="absolute bottom-2 right-2 flex items-center gap-1.5 z-10 transition-opacity duration-150"
        :class="isHovered ? 'opacity-100' : 'opacity-0'"
        @click.stop
      >
        <button
          @click="store.openInExplorer(meme)"
          class="px-2 py-1 rounded-md bg-dark-900/85 hover:bg-dark-800 text-dark-300 hover:text-white text-[11px] font-medium flex items-center gap-1 backdrop-blur-md shadow"
          title="Pokaż w eksploratorze"
        >
          <FolderOpen class="w-3.5 h-3.5" />
          <span>Folder</span>
        </button>
      </div>
    </div>

    <!-- Metadata & Tags Footer -->
    <div class="p-3 flex flex-col gap-2 flex-grow justify-between bg-dark-800">
      <div>
        <div class="flex items-center justify-between gap-2">
          <h4
            class="text-xs font-semibold text-dark-200 truncate group-hover:text-brand-400 transition-colors"
            :title="meme.name"
          >
            {{ meme.name }}
          </h4>
          <span class="text-[10px] text-dark-400 font-mono shrink-0">{{ formattedSize }}</span>
        </div>
      </div>

      <!-- Tags Pills -->
      <div class="flex flex-wrap gap-1 items-center min-h-[22px]">
        <span
          v-for="tag in meme.tags.slice(0, 3)"
          :key="tag"
          class="px-1.5 py-0.5 rounded text-[10px] font-medium text-white/90 truncate max-w-[100px] flex items-center gap-0.5"
          :style="{ backgroundColor: getTagColor(tag) + 'cc' }"
          @click.stop="store.toggleTagFilter(tag)"
          :title="`Filtruj po: #${tag}`"
        >
          #{{ tag }}
        </span>

        <span
          v-if="meme.tags.length > 3"
          class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-dark-700 text-dark-300"
          :title="meme.tags.slice(3).join(', ')"
        >
          +{{ meme.tags.length - 3 }}
        </span>

        <span
          v-if="meme.tags.length === 0"
          class="text-[10px] text-dark-500 italic flex items-center gap-1"
        >
          <TagIcon class="w-2.5 h-2.5" /> brak tagów
        </span>
      </div>
    </div>
  </div>
</template>
