import { toBlob } from 'html-to-image'

export async function generateStoryImage(node: HTMLElement): Promise<Blob> {
  const blob = await toBlob(node, {
    width: 1080,
    height: 1920,
    pixelRatio: 1,
    cacheBust: true,
    backgroundColor: '#0A0E1A',
  })
  if (!blob) throw new Error('Could not generate image')
  return blob
}

export interface ShareOptions {
  title: string
  text: string
  filename: string
}

export async function shareImage(blob: Blob, opts: ShareOptions): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], opts.filename, { type: 'image/png' })

  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean
    share?: (data: ShareData) => Promise<void>
  }

  if (nav.canShare?.({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file], title: opts.title, text: opts.text })
      return 'shared'
    } catch (err) {
      // AbortError = user cancelled. Anything else falls through to download.
      if ((err as Error)?.name === 'AbortError') return 'shared'
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = opts.filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  return 'downloaded'
}
