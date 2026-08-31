<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useMemeStore } from './stores/memeStore'
import Sidebar from './components/Sidebar.vue'
import Topbar from './components/Topbar.vue'
import MemeGrid from './components/MemeGrid.vue'
import MemeDetailModal from './components/MemeDetailModal.vue'
import TagManagerModal from './components/TagManagerModal.vue'
import BatchTagModal from './components/BatchTagModal.vue'
import Toast from './components/Toast.vue'

const store = useMemeStore()
const showTagManager = ref(false)
const showBatchTagModal = ref(false)

function handleGlobalKeydown(e: KeyboardEvent) {
  // Ctrl+F or Cmd+F -> focus search input
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
    e.preventDefault()
    const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement
    if (searchInput) {
      searchInput.focus()
      searchInput.select()
    }
  }

  // Ctrl+A -> select all in grid if not in input
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
    const active = document.activeElement
    if (!active || (active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA')) {
      e.preventDefault()
      store.selectAll()
    }
  }

  // Escape -> close modals or clear selection
  if (e.key === 'Escape') {
    if (showTagManager.value) {
      showTagManager.value = false
    } else if (showBatchTagModal.value) {
      showBatchTagModal.value = false
    } else if (store.selectedMeme) {
      store.selectedMeme = null
    } else if (store.selectedPaths.size > 0) {
      store.clearSelection()
    }
  }
}

onMounted(() => {
  store.init()
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden bg-dark-900 text-dark-100 antialiased font-sans">
    <!-- Left Navigation Sidebar -->
    <Sidebar @openTagManager="showTagManager = true" />

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Topbar @openBatchTagModal="showBatchTagModal = true" />
      <MemeGrid />
    </div>

    <!-- Modals & Overlays -->
    <MemeDetailModal />
    <TagManagerModal v-if="showTagManager" @close="showTagManager = false" />
    <BatchTagModal v-if="showBatchTagModal" @close="showBatchTagModal = false" />
    <Toast />
  </div>
</template>
