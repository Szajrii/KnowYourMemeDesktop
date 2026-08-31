<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useMemeStore } from '../stores/memeStore'
import { getMediaUrl } from '../utils/media'
import { MemeItem } from '../../../shared/types'
import {
  X,
  Sparkles,
  Copy,
  Download,
  Check,
  RotateCw,
  FlipHorizontal,
  Sliders,
  Type,
  Crop,
  Layers,
  Image as ImageIcon,
  FolderPlus,
  RefreshCw,
  Upload,
  Search,
  Folder,
  Plus
} from 'lucide-vue-next'

const props = defineProps<{
  visible: boolean
  sourceMeme?: MemeItem | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const store = useMemeStore()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const sourceImage = ref<HTMLImageElement | null>(null)
const isLoaded = ref(false)
const hasCustomImage = ref(false)
const showLibraryPicker = ref(false)
const librarySearch = ref('')

// Edit Controls
const topText = ref('')
const bottomText = ref('')
const fontSize = ref(36)
const fontColor = ref('#ffffff')
const strokeColor = ref('#000000')
const strokeWidth = ref(4)
const isUppercase = ref(true)
const fontFamily = ref('Impact')

// Image Transformations & Filters
const rotation = ref(0) // 0, 90, 180, 270
const flipH = ref(false)
const brightness = ref(100) // %
const contrast = ref(100) // %
const saturation = ref(100) // %
const grayscale = ref(0) // %
const sepia = ref(0) // %

// Save Dialog controls
const showSaveOptions = ref(false)
const targetFolder = ref('')
const newFileName = ref('')
const newTags = ref<string[]>([])
const newTagInput = ref('')
const isSaving = ref(false)

const fontOptions = [
  { name: 'Impact (Klasyczny)', value: 'Impact, Arial Black, sans-serif' },
  { name: 'Arial (Prosty)', value: 'Arial, sans-serif' },
  { name: 'Montserrat (Nowoczesny)', value: 'Montserrat, sans-serif' },
  { name: 'Comic Sans (Ironiczny)', value: '"Comic Sans MS", cursive, sans-serif' }
]

const availableLibraryMemes = computed(() => {
  const q = librarySearch.value.toLowerCase().trim()
  return store.memes.filter(m => {
    if (m.type !== 'image' && m.type !== 'gif') return false
    if (!q) return true
    const inName = m.name.toLowerCase().includes(q)
    const inTags = m.tags.some(t => t.toLowerCase().includes(q))
    return inName || inTags
  })
})

function resetSettings() {
  topText.value = ''
  bottomText.value = ''
  fontSize.value = 40
  fontColor.value = '#ffffff'
  strokeColor.value = '#000000'
  strokeWidth.value = 4
  isUppercase.value = true
  fontFamily.value = 'Impact, Arial Black, sans-serif'
  rotation.value = 0
  flipH.value = false
  brightness.value = 100
  contrast.value = 100
  saturation.value = 100
  grayscale.value = 0
  sepia.value = 0
}

function deepFry() {
  contrast.value = 240
  saturation.value = 280
  brightness.value = 115
  render()
}

function loadImage(src: string, isCustom = true) {
  isLoaded.value = false
  const img = new window.Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    sourceImage.value = img
    isLoaded.value = true
    hasCustomImage.value = isCustom
    nextTick(() => {
      render()
    })
  }
  img.src = src
}

function triggerFileUpload() {
  fileInputRef.value?.click()
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (event) => {
    const dataUrl = event.target?.result as string
    if (dataUrl) {
      loadImage(dataUrl, true)
      store.showToast('Wczytano obraz z dysku!', 'success')
    }
  }
  reader.readAsDataURL(file)
  target.value = ''
}

function selectFromLibrary(meme: MemeItem) {
  loadImage(getMediaUrl(meme.path), true)
  if (meme.tags && meme.tags.length > 0) {
    newTags.value = [...meme.tags, 'custom']
  }
  showLibraryPicker.value = false
  store.showToast(`Wczytano mema: ${meme.name}`, 'info')
}

async function pasteFromClipboard() {
  if (window.electronAPI?.readClipboardImage) {
    const res = await window.electronAPI.readClipboardImage()
    if (res.hasImage && res.dataUrl) {
      loadImage(res.dataUrl, true)
      store.showToast('Wczytano obraz ze schowka!', 'success')
      return
    }
  }
  store.showToast('Brak obrazu w schowku systemowym', 'info')
}

function handleStudioDrop(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0]
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string
        if (dataUrl) {
          loadImage(dataUrl, true)
          store.showToast('Upuszczono i wczytano obraz!', 'success')
        }
      }
      reader.readAsDataURL(file)
    }
  }
}

function handleStudioPaste(e: ClipboardEvent) {
  const active = document.activeElement
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
    return
  }
  if (e.clipboardData?.items) {
    for (let i = 0; i < e.clipboardData.items.length; i++) {
      if (e.clipboardData.items[i].type.indexOf('image') !== -1) {
        const file = e.clipboardData.items[i].getAsFile()
        if (file) {
          e.preventDefault()
          const reader = new FileReader()
          reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string
            if (dataUrl) {
              loadImage(dataUrl, true)
              store.showToast('Wklejono obraz ze schowka!', 'success')
            }
          }
          reader.readAsDataURL(file)
          return
        }
      }
    }
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      resetSettings()
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '_')
      const timeStr = Date.now().toString().slice(-4)
      newFileName.value = `meme_edit_${dateStr}_${timeStr}.png`
      targetFolder.value = store.folders.length > 0 ? store.folders[0].path : ''
      newTags.value = ['generator']

      if (props.sourceMeme && (props.sourceMeme.type === 'image' || props.sourceMeme.type === 'gif')) {
        loadImage(getMediaUrl(props.sourceMeme.path), true)
        if (props.sourceMeme.tags) {
          newTags.value = [...props.sourceMeme.tags, 'custom']
        }
      } else {
        // Default blank canvas
        hasCustomImage.value = false
        const blankCanvas = document.createElement('canvas')
        blankCanvas.width = 600
        blankCanvas.height = 600
        const ctx = blankCanvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#1e293b'
          ctx.fillRect(0, 0, 600, 600)
          loadImage(blankCanvas.toDataURL(), false)
        }
      }

      window.addEventListener('paste', handleStudioPaste)
    } else {
      window.removeEventListener('paste', handleStudioPaste)
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  window.removeEventListener('paste', handleStudioPaste)
})

function render() {
  if (!canvasRef.value || !sourceImage.value || !isLoaded.value) return

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const img = sourceImage.value
  const isRotated90 = rotation.value === 90 || rotation.value === 270

  canvas.width = isRotated90 ? img.height : img.width
  canvas.height = isRotated90 ? img.width : img.height

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.save()

  // Apply CSS Filters
  const filterString = `
    brightness(${brightness.value}%)
    contrast(${contrast.value}%)
    saturate(${saturation.value}%)
    grayscale(${grayscale.value}%)
    sepia(${sepia.value}%)
  `.trim()
  ctx.filter = filterString

  // Transform matrix (Rotate & Flip)
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate((rotation.value * Math.PI) / 180)
  ctx.scale(flipH.value ? -1 : 1, 1)

  ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height)
  ctx.restore()

  // Reset filter for text overlay
  ctx.filter = 'none'

  // Text settings
  const calcFontSize = Math.max(16, Math.floor((canvas.width / 600) * fontSize.value))
  ctx.font = `bold ${calcFontSize}px ${fontFamily.value}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillStyle = fontColor.value
  ctx.strokeStyle = strokeColor.value
  ctx.lineWidth = Math.max(1, (calcFontSize / 36) * strokeWidth.value)
  ctx.lineJoin = 'round'

  // Top Text
  if (topText.value.trim()) {
    const text = isUppercase.value ? topText.value.toUpperCase() : topText.value
    drawWrappedText(ctx, text, canvas.width / 2, 20, canvas.width - 40, calcFontSize * 1.15, 'top')
  }

  // Bottom Text
  if (bottomText.value.trim()) {
    const text = isUppercase.value ? bottomText.value.toUpperCase() : bottomText.value
    drawWrappedText(ctx, text, canvas.width / 2, canvas.height - 20, canvas.width - 40, calcFontSize * 1.15, 'bottom')
  }
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  position: 'top' | 'bottom'
) {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i]
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && i > 0) {
      lines.push(currentLine)
      currentLine = words[i]
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)

  let startY = y
  if (position === 'bottom') {
    startY = y - lines.length * lineHeight
  }

  for (let i = 0; i < lines.length; i++) {
    const lineY = startY + i * lineHeight
    ctx.strokeText(lines[i], x, lineY)
    ctx.fillText(lines[i], x, lineY)
  }
}

function getCanvasDataUrl(): string {
  if (!canvasRef.value) return ''
  return canvasRef.value.toDataURL('image/png')
}

async function copyToClipboard() {
  const dataUrl = getCanvasDataUrl()
  if (!dataUrl || !window.electronAPI || store.folders.length === 0) return

  const res = await store.savePastedMeme({
    folderPath: store.folders[0].path,
    fileName: `meme_clip_${Date.now()}.png`,
    base64Data: dataUrl,
    tags: ['generator']
  })
  if (res) {
    store.showToast('Mem zapisany i skopiowany do schowka! Gotowy do wklejenia.', 'success')
  }
}

async function saveMemeToLibrary() {
  if (!targetFolder.value) {
    store.showToast('Wybierz folder docelowy', 'error')
    return
  }

  const dataUrl = getCanvasDataUrl()
  if (!dataUrl) return

  isSaving.value = true
  try {
    const res = await store.savePastedMeme({
      folderPath: targetFolder.value,
      fileName: newFileName.value.trim() || `meme_${Date.now()}.png`,
      base64Data: dataUrl,
      tags: newTags.value
    })

    if (res) {
      showSaveOptions.value = false
      emit('saved')
      emit('close')
    }
  } finally {
    isSaving.value = false
  }
}

function rotateClockwise() {
  rotation.value = (rotation.value + 90) % 360
  render()
}

function toggleFlip() {
  flipH.value = !flipH.value
  render()
}

function addNewTag() {
  const norm = newTagInput.value.toLowerCase().trim().replace(/^#/, '')
  if (norm && !newTags.value.includes(norm)) {
    newTags.value.push(norm)
  }
  newTagInput.value = ''
}

function removeTag(tag: string) {
  newTags.value = newTags.value.filter(t => t !== tag)
}
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
    @click.self="emit('close')"
  >
    <!-- Hidden File Input for Image Uploading -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
      class="hidden"
      @change="handleFileChange"
    />

    <div class="w-full max-w-5xl h-[92vh] bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="p-4 border-b border-dark-700 flex items-center justify-between bg-dark-900/70">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
            <Sparkles class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-bold text-sm text-dark-100 flex items-center gap-2">
              <span>Meme Studio & Generator</span>
              <span class="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Live Studio
              </span>
            </h3>
            <p class="text-xs text-dark-400">Dodawaj napisy, filtry, kadruj i generuj memy</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Load image buttons -->
          <button
            @click="triggerFileUpload"
            class="px-3 py-1.5 rounded-xl bg-dark-700 hover:bg-dark-600 text-dark-100 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 border border-dark-600"
            title="Wgraj obraz z dysku komputera"
          >
            <Upload class="w-3.5 h-3.5 text-brand-400" />
            <span>Wgraj obraz</span>
          </button>

          <button
            @click="showLibraryPicker = true"
            class="px-3 py-1.5 rounded-xl bg-dark-700 hover:bg-dark-600 text-dark-100 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 border border-dark-600"
            title="Wybierz mema ze swojej biblioteki"
          >
            <ImageIcon class="w-3.5 h-3.5 text-purple-400" />
            <span>Z biblioteki</span>
          </button>

          <button
            @click="copyToClipboard"
            class="px-3.5 py-1.5 rounded-xl bg-dark-700 hover:bg-dark-600 text-dark-100 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 border border-dark-600"
            title="Kopiuj gotowy obraz do schowka"
          >
            <Copy class="w-4 h-4 text-emerald-400" />
            <span>Kopiuj do schowka</span>
          </button>

          <button
            @click="showSaveOptions = true"
            class="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-brand-600/30 active:scale-95"
          >
            <Check class="w-4 h-4" />
            <span>Zapisz w bibliotece</span>
          </button>

          <button
            @click="emit('close')"
            class="p-1.5 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700 transition-colors ml-1"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Main Workspace -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Left Panel: Controls & Typography -->
        <div class="w-80 border-r border-dark-700/80 bg-dark-900/50 p-4 overflow-y-auto space-y-5 flex flex-col shrink-0">
          <!-- Image Selector Quick Bar -->
          <div class="p-3 bg-dark-950/80 border border-dark-700 rounded-xl space-y-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-dark-400 flex items-center gap-1">
              <ImageIcon class="w-3.5 h-3.5 text-brand-400" />
              <span>Źródłowy obraz</span>
            </span>
            <div class="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                @click="triggerFileUpload"
                class="py-1.5 px-2 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 text-dark-200 flex items-center justify-center gap-1 transition-all"
              >
                <Upload class="w-3 h-3 text-brand-400" />
                <span>Z dysku</span>
              </button>
              <button
                @click="showLibraryPicker = true"
                class="py-1.5 px-2 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 text-dark-200 flex items-center justify-center gap-1 transition-all"
              >
                <Folder class="w-3 h-3 text-purple-400" />
                <span>Z biblioteki</span>
              </button>
            </div>
            <button
              @click="pasteFromClipboard"
              class="w-full py-1.5 px-2 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 text-dark-300 hover:text-white flex items-center justify-center gap-1.5 text-[11px] transition-all"
            >
              <Copy class="w-3 h-3 text-emerald-400" />
              <span>Wklej ze schowka (Ctrl+V)</span>
            </button>
          </div>

          <!-- Text Inputs -->
          <div class="space-y-3">
            <span class="text-[11px] font-bold tracking-wider text-dark-400 uppercase flex items-center gap-1.5">
              <Type class="w-3.5 h-3.5 text-brand-400" />
              <span>Napisy Mema</span>
            </span>

            <div class="space-y-2">
              <div>
                <label class="text-[11px] font-medium text-dark-300">Górny tekst (Top):</label>
                <input
                  v-model="topText"
                  @input="render"
                  type="text"
                  placeholder="NP. KIEDY KOD DZIAŁA..."
                  class="w-full mt-1 bg-dark-950 border border-dark-700 rounded-lg px-3 py-2 text-xs text-dark-100 placeholder-dark-600 focus:outline-none focus:border-brand-500 font-bold"
                />
              </div>

              <div>
                <label class="text-[11px] font-medium text-dark-300">Dolny tekst (Bottom):</label>
                <input
                  v-model="bottomText"
                  @input="render"
                  type="text"
                  placeholder="NP. ALE NIE WIESZ DLACZEGO"
                  class="w-full mt-1 bg-dark-950 border border-dark-700 rounded-lg px-3 py-2 text-xs text-dark-100 placeholder-dark-600 focus:outline-none focus:border-brand-500 font-bold"
                />
              </div>
            </div>
          </div>

          <!-- Font Customization -->
          <div class="space-y-3">
            <span class="text-[11px] font-bold tracking-wider text-dark-400 uppercase">Czcionka i Styl</span>

            <div class="space-y-2.5">
              <div>
                <label class="text-[11px] text-dark-400">Krój pisma:</label>
                <select
                  v-model="fontFamily"
                  @change="render"
                  class="w-full mt-1 bg-dark-950 border border-dark-700 rounded-lg p-2 text-xs text-dark-100 focus:outline-none focus:border-brand-500"
                >
                  <option v-for="f in fontOptions" :key="f.value" :value="f.value">
                    {{ f.name }}
                  </option>
                </select>
              </div>

              <!-- Size slider -->
              <div>
                <div class="flex justify-between text-[11px] text-dark-400 mb-1">
                  <span>Rozmiar tekstu</span>
                  <span class="font-mono text-dark-200">{{ fontSize }}px</span>
                </div>
                <input
                  v-model.number="fontSize"
                  @input="render"
                  type="range"
                  min="16"
                  max="90"
                  class="w-full accent-brand-500 h-1.5 bg-dark-700 rounded-lg"
                />
              </div>

              <!-- Colors: Fill & Stroke -->
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-[11px] text-dark-400 block mb-1">Kolor tekstu:</label>
                  <div class="flex items-center gap-2 bg-dark-950 p-1.5 border border-dark-700 rounded-lg">
                    <input
                      v-model="fontColor"
                      @input="render"
                      type="color"
                      class="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span class="text-[10px] font-mono text-dark-300 uppercase">{{ fontColor }}</span>
                  </div>
                </div>

                <div>
                  <label class="text-[11px] text-dark-400 block mb-1">Kolor obrysu:</label>
                  <div class="flex items-center gap-2 bg-dark-950 p-1.5 border border-dark-700 rounded-lg">
                    <input
                      v-model="strokeColor"
                      @input="render"
                      type="color"
                      class="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span class="text-[10px] font-mono text-dark-300 uppercase">{{ strokeColor }}</span>
                  </div>
                </div>
              </div>

              <!-- Uppercase toggle -->
              <label class="flex items-center gap-2 text-xs text-dark-300 cursor-pointer pt-1">
                <input
                  v-model="isUppercase"
                  @change="render"
                  type="checkbox"
                  class="rounded accent-brand-500 w-4 h-4"
                />
                <span>Zawsze WIELKIE LITERY (Caps Lock)</span>
              </label>
            </div>
          </div>

          <!-- Image Adjustments & Transforms -->
          <div class="space-y-3 pt-2 border-t border-dark-700/80">
            <span class="text-[11px] font-bold tracking-wider text-dark-400 uppercase flex items-center gap-1.5">
              <Sliders class="w-3.5 h-3.5 text-brand-400" />
              <span>Narzędzia Obrazu</span>
            </span>

            <!-- Rotation & Flip Buttons -->
            <div class="grid grid-cols-2 gap-2">
              <button
                @click="rotateClockwise"
                class="py-1.5 px-2.5 rounded-lg bg-dark-950 hover:bg-dark-800 border border-dark-700 text-xs font-semibold text-dark-200 flex items-center justify-center gap-1.5 transition-all"
              >
                <RotateCw class="w-3.5 h-3.5 text-brand-400" />
                <span>Obróć 90°</span>
              </button>

              <button
                @click="toggleFlip"
                class="py-1.5 px-2.5 rounded-lg bg-dark-950 hover:bg-dark-800 border border-dark-700 text-xs font-semibold text-dark-200 flex items-center justify-center gap-1.5 transition-all"
              >
                <FlipHorizontal class="w-3.5 h-3.5 text-brand-400" />
                <span>Odbij poziom</span>
              </button>
            </div>

            <!-- Deep Fry Button -->
            <button
              @click="deepFry"
              class="w-full py-1.5 rounded-lg bg-gradient-to-r from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 border border-orange-500/40 text-orange-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <span>🔥 Efekt Deep Fry</span>
            </button>

            <!-- Sliders -->
            <div class="space-y-2 text-xs">
              <div>
                <div class="flex justify-between text-[10px] text-dark-400">
                  <span>Kontrast</span>
                  <span>{{ contrast }}%</span>
                </div>
                <input
                  v-model.number="contrast"
                  @input="render"
                  type="range"
                  min="50"
                  max="300"
                  class="w-full accent-brand-500 h-1.5"
                />
              </div>

              <div>
                <div class="flex justify-between text-[10px] text-dark-400">
                  <span>Nasycenie</span>
                  <span>{{ saturation }}%</span>
                </div>
                <input
                  v-model.number="saturation"
                  @input="render"
                  type="range"
                  min="0"
                  max="300"
                  class="w-full accent-brand-500 h-1.5"
                />
              </div>

              <div>
                <div class="flex justify-between text-[10px] text-dark-400">
                  <span>Jasność</span>
                  <span>{{ brightness }}%</span>
                </div>
                <input
                  v-model.number="brightness"
                  @input="render"
                  type="range"
                  min="50"
                  max="200"
                  class="w-full accent-brand-500 h-1.5"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Center: Interactive Canvas Preview Area -->
        <div
          class="flex-1 bg-dark-950 flex items-center justify-center p-6 overflow-hidden relative select-none"
          @dragover.prevent
          @drop="handleStudioDrop"
        >
          <!-- When no custom image is loaded, show a prominent Drop/Picker area -->
          <div
            v-if="!hasCustomImage"
            class="max-w-md w-full p-8 rounded-2xl bg-dark-900/80 border-2 border-dashed border-dark-700 hover:border-brand-500/60 flex flex-col items-center justify-center text-center space-y-4 transition-all"
          >
            <div class="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 shadow-xl">
              <Upload class="w-8 h-8" />
            </div>
            <div class="space-y-1">
              <h4 class="font-bold text-sm text-dark-100">Załaduj obraz do edycji</h4>
              <p class="text-xs text-dark-400">Przeciągnij plik tutaj, wybierz z komputera lub z biblioteki</p>
            </div>
            <div class="flex flex-wrap gap-2 justify-center pt-2">
              <button
                @click="triggerFileUpload"
                class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-brand-600/20"
              >
                <Upload class="w-4 h-4" />
                <span>Wgraj z dysku</span>
              </button>

              <button
                @click="showLibraryPicker = true"
                class="px-4 py-2 bg-dark-800 hover:bg-dark-700 text-dark-200 border border-dark-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <ImageIcon class="w-4 h-4 text-purple-400" />
                <span>Wybierz z biblioteki</span>
              </button>
            </div>
            <span class="text-[11px] text-dark-500">Możesz też wkleić obraz ze schowka (Ctrl + V)</span>
          </div>

          <!-- Canvas container -->
          <div
            v-show="hasCustomImage"
            class="max-w-full max-h-full flex items-center justify-center p-2 rounded-2xl bg-dark-900/40 border border-dark-700/50 shadow-2xl"
          >
            <canvas
              ref="canvasRef"
              class="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg border border-dark-800"
            ></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Library Meme Picker Drawer / Modal -->
    <Teleport to="body">
      <div
        v-if="showLibraryPicker"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150"
        @click.self="showLibraryPicker = false"
      >
        <div class="w-full max-w-2xl bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
          <div class="p-4 border-b border-dark-700 flex items-center justify-between bg-dark-900/60">
            <div class="flex items-center gap-2">
              <ImageIcon class="w-5 h-5 text-purple-400" />
              <h4 class="font-bold text-sm text-dark-100">Wybierz mema ze swojej biblioteki</h4>
            </div>
            <button @click="showLibraryPicker = false" class="text-dark-400 hover:text-white p-1">
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="p-3 border-b border-dark-700 bg-dark-900/40">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                v-model="librarySearch"
                type="text"
                placeholder="Szukaj po nazwie lub tagu..."
                class="w-full bg-dark-950 border border-dark-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-dark-100 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div class="p-4 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-3 flex-1">
            <div
              v-for="meme in availableLibraryMemes"
              :key="meme.path"
              @click="selectFromLibrary(meme)"
              class="group relative rounded-xl bg-dark-900 border border-dark-700/80 hover:border-brand-500 overflow-hidden cursor-pointer aspect-square flex items-center justify-center p-1 transition-all hover:scale-105 shadow-md"
            >
              <img
                :src="getMediaUrl(meme.path)"
                :alt="meme.name"
                class="w-full h-full object-contain pointer-events-none"
              />
              <div class="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="text-[10px] text-white font-bold truncate block">{{ meme.name }}</span>
              </div>
            </div>

            <div v-if="availableLibraryMemes.length === 0" class="col-span-full py-12 text-center text-xs text-dark-500">
              Brak pasujących grafik w bibliotece
            </div>
          </div>

          <div class="p-3 border-t border-dark-700 bg-dark-900/60 flex justify-end">
            <button
              @click="showLibraryPicker = false"
              class="px-4 py-1.5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-xs font-semibold"
            >
              Anuluj
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Save Options Dialog Modal -->
    <Teleport to="body">
      <div
        v-if="showSaveOptions"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        @click.self="showSaveOptions = false"
      >
        <div class="w-full max-w-md bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl p-5 space-y-4">
          <div class="flex items-center justify-between border-b border-dark-700 pb-3">
            <h4 class="font-bold text-sm text-dark-100 flex items-center gap-2">
              <FolderPlus class="w-4 h-4 text-brand-400" />
              <span>Zapisz mema w bibliotece</span>
            </h4>
            <button @click="showSaveOptions = false" class="text-dark-400 hover:text-white">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="font-semibold text-dark-300">Wybierz folder:</label>
              <select
                v-model="targetFolder"
                class="w-full mt-1 bg-dark-900 border border-dark-700 rounded-lg p-2 text-dark-100 font-mono text-xs focus:outline-none focus:border-brand-500"
              >
                <option v-for="f in store.folders" :key="f.path" :value="f.path">
                  {{ f.name }} ({{ f.path }})
                </option>
              </select>
            </div>

            <div>
              <label class="font-semibold text-dark-300">Nazwa pliku:</label>
              <input
                v-model="newFileName"
                type="text"
                placeholder="meme.png"
                class="w-full mt-1 bg-dark-900 border border-dark-700 rounded-lg p-2 text-dark-100 font-mono text-xs focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label class="font-semibold text-dark-300 block mb-1">Tagi:</label>
              <div class="flex items-center gap-2">
                <input
                  v-model="newTagInput"
                  @keydown.enter.prevent="addNewTag"
                  type="text"
                  placeholder="Wpisz tag i wciśnij Enter..."
                  class="flex-1 bg-dark-900 border border-dark-700 rounded-lg p-2 text-xs text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500"
                />
                <button
                  @click="addNewTag"
                  class="px-3 py-2 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-lg font-bold"
                >
                  Dodaj
                </button>
              </div>

              <!-- Tags List -->
              <div class="flex flex-wrap gap-1.5 mt-2">
                <span
                  v-for="t in newTags"
                  :key="t"
                  class="px-2 py-0.5 rounded-md text-xs bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center gap-1"
                >
                  #{{ t }}
                  <button @click="removeTag(t)" class="hover:text-white">
                    <X class="w-3 h-3" />
                  </button>
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-dark-700">
            <button
              @click="showSaveOptions = false"
              class="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-dark-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Anuluj
            </button>

            <button
              @click="saveMemeToLibrary"
              :disabled="isSaving"
              class="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-brand-600/20 disabled:opacity-50"
            >
              <Download class="w-3.5 h-3.5" />
              <span>{{ isSaving ? 'Zapisywanie...' : 'Zapisz' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
