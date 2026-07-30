/** True for a plain primary (left) activate — not right-click, not Mac ctrl/cmd-click. */
export function isPrimaryActivate(
  e: Pick<PointerEvent | MouseEvent, 'button' | 'ctrlKey' | 'metaKey'>,
): boolean {
  return e.button === 0 && !e.ctrlKey && !e.metaKey
}

/** Keyboard-synthesized button activation (`click` with detail === 0). */
export function isKeyboardClick(e: MouseEvent): boolean {
  return e.detail === 0
}

/**
 * Create chip/button handlers that separate left-activate from context menu.
 * Mouse left → pointerup; keyboard → click with detail 0; right/ctrl-click → contextmenu only.
 */
export function createEntityPointerHandlers(opts: {
  onActivate: () => void
  onMenu: (x: number, y: number) => void
}) {
  let ignoreNextClick = false

  function onPointerUp(e: PointerEvent) {
    if (!isPrimaryActivate(e)) return
    ignoreNextClick = true
    opts.onActivate()
  }

  function onClick(e: MouseEvent) {
    if (ignoreNextClick) {
      ignoreNextClick = false
      e.preventDefault()
      e.stopPropagation()
      return
    }
    // Enter/Space on <button> synthesizes click with detail 0
    if (isKeyboardClick(e)) {
      opts.onActivate()
    }
  }

  function onContextMenu(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    ignoreNextClick = true
    opts.onMenu(e.clientX, e.clientY)
  }

  return { onPointerUp, onClick, onContextMenu }
}
