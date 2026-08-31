<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMemeStore } from '../stores/memeStore'
import { X, Tags, Plus, Minus, Check } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const store = useMemeStore()
const tagToAdd = ref('')
const tagsToAddList = ref<string[]>([])
const tagsToRemoveList = ref<string[]>([])

const selectedCount = computed(() => store.selectedPaths.size)

function addTagToQueue() {
  const norm = tagToAdd.value.toLowerCase().trim().replace(/^#/, '')
  if (!norm) return
  if (!tagsToAddList.value.includes(norm)) {
    tagsToAddList.value.push(norm)
  }
  tagToAdd.value = ''
}

function removeTagFromQueue(tag: string) {
  tagsToAddList.value = tagsToAddList.value.filter(t => t !== tag)
}

function toggleRemoveTag(tag: string) {
  if (tagsToRemoveList.value.includes(tag)) {
    tagsToRemoveList.value = tagsToRemoveList.value.filter(t => t !== tag)
  } else {
    tagsToRemoveList.value.push(tag)
  }
}

async function applyChanges() {
  if (tagsToAddList.value.length > 0) {
    await store.batchAddTags(tagsToAddList.value)
  }
  if (tagsToRemoveList.value.length > 0) {
    await store.batchRemoveTags(tagsToRemoveList.value)
  }
  store.clearSelection()
  emit('close')
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-md bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="p-4 border-b border-dark-700 flex items-center justify-between">
        <div class="flex items-center gap-2 text-dark-100">
          <Tags class="w-5 h-5 text-brand-400" />
          <h3 class="font-bold text-sm">Masowe Tagowanie ({{ selectedCount }} memów)</h3>
        </div>
        <button
          @click="emit('close')"
          class="p-1 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-4 space-y-4">
        <!-- Add Tags Section -->
        <div>
          <label class="block text-xs font-semibold text-dark-200 mb-1.5">Dodaj tagi do zaznaczonych:</label>
          <div class="flex items-center gap-2">
            <input
              v-model="tagToAdd"
              type="text"
              placeholder="Wpisz tag i wciśnij Enter..."
              class="flex-1 bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-xs text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500"
              @keydown.enter.prevent="addTagToQueue"
            />
            <button
              @click="addTagToQueue"
              class="px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
            >
              <Plus class="w-4 h-4" />
              <span>Dodaj</span>
            </button>
          </div>

          <!-- Pending added tags -->
          <div v-if="tagsToAddList.length > 0" class="flex flex-wrap gap-1.5 mt-2.5">
            <span
              v-for="tag in tagsToAddList"
              :key="tag"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600/80 text-white"
            >
              + #{{ tag }}
              <button @click="removeTagFromQueue(tag)" class="hover:bg-black/30 p-0.5 rounded ml-0.5">
                <X class="w-3 h-3" />
              </button>
            </span>
          </div>
        </div>

        <!-- Quick choose from popular tags -->
        <div>
          <span class="block text-[11px] text-dark-400 mb-1">Szybki wybór z istniejących tagów:</span>
          <div class="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            <button
              v-for="tag in store.allTagsWithCount"
              :key="tag.name"
              @click="tagToAdd = tag.name; addTagToQueue()"
              class="px-2 py-0.5 rounded text-[11px] bg-dark-900 hover:bg-dark-700 border border-dark-700 text-dark-300 hover:text-white transition-colors"
            >
              #{{ tag.name }}
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-dark-700 bg-dark-900/40 flex items-center justify-end gap-2">
        <button
          @click="emit('close')"
          class="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-lg text-xs font-semibold"
        >
          Anuluj
        </button>
        <button
          @click="applyChanges"
          :disabled="tagsToAddList.length === 0 && tagsToRemoveList.length === 0"
          class="px-5 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold shadow-lg shadow-brand-600/30 flex items-center gap-1.5 transition-all"
        >
          <Check class="w-4 h-4" />
          <span>Zastosuj zmiany</span>
        </button>
      </div>
    </div>
  </div>
</template>
