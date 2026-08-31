import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import Toast from '../src/renderer/src/components/Toast.vue'
import MemeCard from '../src/renderer/src/components/MemeCard.vue'
import { useMemeStore } from '../src/renderer/src/stores/memeStore'
import { MemeItem } from '../src/shared/types'

describe('Vue UI Components', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('Toast component renders message and correct style', async () => {
    const store = useMemeStore()
    const wrapper = mount(Toast)

    expect(wrapper.find('span').exists()).toBe(false)

    // Trigger toast
    store.showToast('Pomyślnie skopiowano!', 'success')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Pomyślnie skopiowano!')
    const toastDiv = wrapper.find('div')
    expect(toastDiv.exists()).toBe(true)
    expect(toastDiv.classes()).toContain('border-emerald-500/40')
  })

  it('MemeCard component renders meme details, badge and tags', () => {
    const store = useMemeStore()
    store.tags = {
      'dank': { color: '#ef4444' },
      'gaming': { color: '#8b5cf6' }
    }

    const testMeme: MemeItem = {
      id: 'test-1',
      path: 'P:\\Memes\\test_meme.gif',
      name: 'test_meme.gif',
      extension: '.gif',
      type: 'gif',
      size: 1048576, // 1 MB
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      tags: ['dank', 'gaming'],
      isFavorite: true,
      folder: 'P:\\Memes'
    }

    const wrapper = mount(MemeCard, {
      props: {
        meme: testMeme
      }
    })

    // Checks
    expect(wrapper.text()).toContain('test_meme.gif')
    expect(wrapper.text()).toContain('1.0 MB')
    expect(wrapper.text()).toContain('GIF')
    expect(wrapper.text()).toContain('#dank')
    expect(wrapper.text()).toContain('#gaming')
  })
})
