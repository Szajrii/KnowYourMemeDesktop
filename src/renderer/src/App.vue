<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useMemeStore } from './stores/memeStore'
import Sidebar from './components/Sidebar.vue'
import Topbar from './components/Topbar.vue'
import MemeGrid from './components/MemeGrid.vue'
import MemeDetailModal from './components/MemeDetailModal.vue'
import TagManagerModal from './components/TagManagerModal.vue'
import BatchTagModal from './components/BatchTagModal.vue'
import PasteMemeModal from './components/PasteMemeModal.vue'
import DuplicateFinderModal from './components/DuplicateFinderModal.vue'
import MemeStudioModal from './components/MemeStudioModal.vue'
import QuickLauncherModal from './components/QuickLauncherModal.vue'
import BackupModal from './components/BackupModal.vue'
import StatsDashboardModal from './components/StatsDashboardModal.vue'
import Toast from './components/Toast.vue'

const store = useMemeStore()
const showTagManager = ref(false)
const showBatchTagModal = ref(false)
const showPasteModal = ref(false)
const showDuplicateModal = ref(false)
const showBackupModal = ref(false)
const showLauncherModal = ref(false)
const showStatsModal = ref(false)
const pastedImageDataUrl = ref('')

async function checkAndHandlePaste(e?: ClipboardEvent) {
  // Do not trigger global paste modal when another modal (e.g. Meme Studio, Detail, Launcher) is open
  if (
    store.showStudioModal ||
    store.selectedMeme ||
    showLauncherModal.value ||
    showStatsModal.value ||
    showBackupModal.value ||
    showDuplicateModal.value ||
    showTagManager.value ||
    showBatchTagModal.value
  ) {
    return
  }

  const active = document.activeElement
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
    return // allow default text paste inside text fields
  }

  // 1. Check DOM ClipboardEvent items
  if (e?.clipboardData) {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) {
          e.preventDefault()
          const reader = new FileReader()
          reader.onload = (event) => {
            pastedImageDataUrl.value = event.target?.result as string
            showPasteModal.value = true
          }
          reader.readAsDataURL(file)
          return
        }
      }
    }
  }

  // 2. Check Electron native clipboard
  if (window.electronAPI?.readClipboardImage) {
    const res = await window.electronAPI.readClipboardImage()
    if (res.hasImage && res.dataUrl) {
      if (e) e.preventDefault()
      pastedImageDataUrl.value = res.dataUrl
      showPasteModal.value = true
    }
  }
}

function handleGlobalKeydown(e: KeyboardEvent) {
  // Ctrl+Shift+M -> toggle quick launcher
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
    e.preventDefault()
    showLauncherModal.value = !showLauncherModal.value
  }

  // Ctrl+F or Cmd+F -> focus search input
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'f') {
    e.preventDefault()
    const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement
    if (searchInput) {
      searchInput.focus()
      searchInput.select()
    }
  }

  // Ctrl+R -> random meme
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
    const active = document.activeElement
    if (!active || (active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA')) {
      e.preventDefault()
      store.pickRandomMeme()
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
    if (showLauncherModal.value) {
      showLauncherModal.value = false
    } else if (showStatsModal.value) {
      showStatsModal.value = false
    } else if (showBackupModal.value) {
      showBackupModal.value = false
    } else if (store.showStudioModal) {
      store.closeStudio()
    } else if (showDuplicateModal.value) {
      showDuplicateModal.value = false
    } else if (showPasteModal.value) {
      showPasteModal.value = false
    } else if (showTagManager.value) {
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
  window.addEventListener('paste', checkAndHandlePaste as any)

  if (window.electronAPI?.onLauncherToggle) {
    window.electronAPI.onLauncherToggle(() => {
      showLauncherModal.value = true
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('paste', checkAndHandlePaste as any)
})
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden bg-dark-900 text-dark-100 antialiased font-sans">
    <!-- Left Sidebar -->
    <Sidebar
      @open-tag-manager="showTagManager = true"
      @open-duplicates="showDuplicateModal = true"
      @open-backup="showBackupModal = true"
    />

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
      <Topbar
        @open-batch-tag-modal="showBatchTagModal = true"
        @open-stats="showStatsModal = true"
      />
      <MemeGrid />
    </main>

    <!-- Modals & Feedback Overlays -->
    <MemeDetailModal />
    
    <TagManagerModal
      v-if="showTagManager"
      @close="showTagManager = false"
    />

    <BatchTagModal
      v-if="showBatchTagModal"
      @close="showBatchTagModal = false"
    />

    <DuplicateFinderModal
      v-if="showDuplicateModal"
      @close="showDuplicateModal = false"
    />

    <BackupModal
      v-if="showBackupModal"
      @close="showBackupModal = false"
    />

    <StatsDashboardModal
      :visible="showStatsModal"
      @close="showStatsModal = false"
    />

    <QuickLauncherModal
      :visible="showLauncherModal"
      @close="showLauncherModal = false"
    />

    <MemeStudioModal
      :visible="store.showStudioModal"
      :source-meme="store.studioMeme"
      @close="store.closeStudio()"
    />

    <PasteMemeModal
      :visible="showPasteModal"
      :image-data-url="pastedImageDataUrl"
      @close="showPasteModal = false"
    />

    <Toast />
  </div>
</template>
