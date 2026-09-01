import { useState } from 'react'
import { extractShareCode } from '../../state/share'
import { useStore } from '../../state/store'
import { Sheet } from '../../ui/Sheet'
import { Scanner } from './Scanner'
import './friends.css'

// In-person add: point the camera at a friend's "Add me" QR. A scanned QR carries their whole
// passport, so this is a full add with no internet.
export function ScanSheet({ onClose, onAdded }: { onClose: () => void; onAdded?: (name: string) => void }) {
  const importCode = useStore((s) => s.importCode)
  const [status, setStatus] = useState('')
  const [scanned, setScanned] = useState(false)

  const handle = async (text: string) => {
    if (scanned) return
    setScanned(true)
    const result = await importCode(extractShareCode(text))
    if (result.ok) {
      setStatus(`Added ${result.name}.`)
      onAdded?.(result.name || 'your friend')
      setTimeout(onClose, 900)
    } else {
      setStatus(result.reason || 'That code could not be read.')
      setTimeout(() => { setStatus(''); setScanned(false) }, 1400) // let them line it up again
    }
  }

  return (
    <Sheet onClose={onClose} eyebrow={<div className="sheet-eyebrow eyebrow">In person</div>}>
      <div className="scan-sheet">
        <h2 className="t-title">Scan a friend</h2>
        <p className="muted t-body scan-lead">Point your camera at their <strong>Add me</strong> code.</p>
        {!scanned && <Scanner onResult={handle} />}
        {status && <p className="t-body scan-status" role="status">{status}</p>}
      </div>
    </Sheet>
  )
}
