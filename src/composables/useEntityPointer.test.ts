import { describe, expect, it, vi } from 'vitest'
import {
  createEntityPointerHandlers,
  isKeyboardClick,
  isPrimaryActivate,
} from './useEntityPointer'

describe('isPrimaryActivate', () => {
  it('accepts plain left button', () => {
    expect(isPrimaryActivate({ button: 0, ctrlKey: false, metaKey: false })).toBe(true)
  })

  it('rejects right button', () => {
    expect(isPrimaryActivate({ button: 2, ctrlKey: false, metaKey: false })).toBe(false)
  })

  it('rejects ctrl/meta left (Mac context-click)', () => {
    expect(isPrimaryActivate({ button: 0, ctrlKey: true, metaKey: false })).toBe(false)
    expect(isPrimaryActivate({ button: 0, ctrlKey: false, metaKey: true })).toBe(false)
  })
})

describe('isKeyboardClick', () => {
  it('detects detail 0', () => {
    expect(isKeyboardClick({ detail: 0 } as MouseEvent)).toBe(true)
    expect(isKeyboardClick({ detail: 1 } as MouseEvent)).toBe(false)
  })
})

describe('createEntityPointerHandlers', () => {
  it('activates on primary pointerup and ignores the following click', () => {
    const onActivate = vi.fn()
    const onMenu = vi.fn()
    const h = createEntityPointerHandlers({ onActivate, onMenu })

    h.onPointerUp({ button: 0, ctrlKey: false, metaKey: false } as PointerEvent)
    expect(onActivate).toHaveBeenCalledOnce()

    const click = {
      detail: 1,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as MouseEvent
    h.onClick(click)
    expect(onActivate).toHaveBeenCalledOnce()
    expect(click.preventDefault).toHaveBeenCalled()
  })

  it('opens menu on contextmenu without activate', () => {
    const onActivate = vi.fn()
    const onMenu = vi.fn()
    const h = createEntityPointerHandlers({ onActivate, onMenu })

    const e = {
      clientX: 10,
      clientY: 20,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as MouseEvent
    h.onContextMenu(e)
    expect(onMenu).toHaveBeenCalledWith(10, 20)
    expect(onActivate).not.toHaveBeenCalled()
  })

  it('activates on keyboard click (detail 0)', () => {
    const onActivate = vi.fn()
    const h = createEntityPointerHandlers({ onActivate, onMenu: vi.fn() })
    h.onClick({ detail: 0 } as MouseEvent)
    expect(onActivate).toHaveBeenCalledOnce()
  })

  it('does not activate on ctrl pointerup', () => {
    const onActivate = vi.fn()
    const h = createEntityPointerHandlers({ onActivate, onMenu: vi.fn() })
    h.onPointerUp({ button: 0, ctrlKey: true, metaKey: false } as PointerEvent)
    expect(onActivate).not.toHaveBeenCalled()
  })
})
