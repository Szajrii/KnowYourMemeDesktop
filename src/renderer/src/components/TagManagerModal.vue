<script setup lang="ts">
import { ref } from 'vue'
import { useMemeStore } from '../stores/memeStore'
import { X, Plus, Trash2, Palette, Tags } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const store = useMemeStore()
const newTagName = ref('')
const newTagColor = ref('#6366f1')

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#64748b'
]

function handleAddTag() {
  const norm = newTagName.value.toLowerCase().trim().replace(/^#/, '')
  if (!norm) return
  store.setTagColor(norm, newTagColor.value)
  newTagName.value = ''
}

function updateColor(tagName: string, color: string) {
  store.setTagColor(tagName, color)
}

function deleteTag(tagName: string) {
  if (confirm(`Czy na pewno chcesz usunąć tag #${tagName} ze wszystkich memów?`)) {
    store.deleteTag(tagName)
  }
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-lg bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
      <!-- Header -->
      <div class="p-4 border-b border-dark-700 flex items-center justify-between">
        <div class="flex items-center gap-2 text-dark-100">
          <Tags class="w-5 h-5 text-brand-400" />
          <h3 class="font-bold text-sm">Zarządzanie Tagami</h3>
        </div>
        <button
          @click="emit('close')"
          class="p-1 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Add New Tag Row -->
      <div class="p-4 bg-dark-900/60 border-b border-dark-700/60 flex flex-col gap-3">
        <span class="text-xs font-semibold text-dark-300">Dodaj nowy tag</span>
        <div class="flex items-center gap-2">
          <input
            v-model="newTagName"
            type="text"
            placeholder="Nazwa tagu (np. wholesome, dank)..."
            class="flex-1 bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-xs text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500"
            @keydown.enter.prevent="handleAddTag"
          />

          <!-- Color preview / input -->
          <div class="relative">
            <input
              type="color"
              v-model="newTagColor"
              class="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
            />
          </div>

          <button
            @click="handleAddTag"
            class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Plus class="w-4 h-4" />
            <span>Dodaj</span>
          </button>
        </div>

        <!-- Color palette shortcuts -->
        <div class="flex items-center gap-1.5">
          <span class="text-[11px] text-dark-400 mr-1">Kolor:</span>
          <button
            v-for="color in PRESET_COLORS"
            :key="color"
            @click="newTagColor = color"
            class="w-5 h-5 rounded-full border transition-transform hover:scale-110"
            :class="newTagColor === color ? 'border-white ring-2 ring-brand-500/50' : 'border-transparent'"
            :style="{ backgroundColor: color }"
          />
        </div>
      </div>

      <!-- Tags List -->
      <div class="p-4 flex-1 overflow-y-auto space-y-2">
        <div
          v-if="store.allTagsWithCount.length === 0"
          class="text-center py-8 text-xs text-dark-500"
        >
          Brak zdefiniowanych tagów.
        </div>

        <div
          v-for="tag in store.allTagsWithCount"
          :key="tag.name"
          class="flex items-center justify-between p-2.5 bg-dark-900 rounded-xl border border-dark-700/80 hover:border-dark-600 transition-colors"
        >
          <div class="flex items-center gap-3">
            <input
              type="color"
              :value="tag.color"
              @input="(e) => updateColor(tag.name, (e.target as HTMLInputElement).value)"
              class="w-6 h-6 rounded-md cursor-pointer bg-transparent border-0"
              title="Zmień kolor tagu"
            />

            <div>
              <span class="text-xs font-bold text-dark-200">#{{ tag.name }}</span>
              <span class="text-[10px] text-dark-400 ml-2">({{ tag.count }} memów)</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <!-- Palette shortcuts -->
            <div class="hidden sm:flex items-center gap-1">
              <button
                v-for="c in PRESET_COLORS.slice(0, 5)"
                :key="c"
                @click="updateColor(tag.name, c)"
                class="w-3.5 h-3.5 rounded-full hover:scale-125 transition-transform"
                :style="{ backgroundColor: c }"
              />
            </div>

            <button
              @click="deleteTag(tag.name)"
              class="p-1.5 text-dark-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Usuń tag"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-3 border-t border-dark-700 bg-dark-900/40 text-right">
        <button
          @click="emit('close')"
          class="px-4 py-1.5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-lg text-xs font-semibold"
        >
          Zamknij
        </button>
      </div>
    </div>
  </div>
</template>
