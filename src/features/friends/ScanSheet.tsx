import { useState } from 'react'
import { extractShareCode } from '../../state/share'
import { useStore } from '../../state/store'
import { Sheet } from '../../ui/Sheet'
import { Scanner } from './Scanner'
import './friends.css'

// In-person add: point the camera at a friend's "Add me" QR. The QR is now an /add# link carrying an
// identity card, so the add works with no internet and their passport follows through the feed. On a
// build with no backend the link still carries the whole passport, so the offline add stays complete.
export function ScanSheet({ onClose, onAdded }: { onClose: () => void; onAdded?: (name: string) => void }) {
  const importCode = useStore((s) => s.importCode)
  const [status, setStatus] = useState('')
  const [camera, setCamera] = useState('') // a camera fault, which needs a way out rather than a message
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
    <Sheet onClose={onClose} labelledBy="scan-title" eyebrow={<div className="sheet-eyebrow eyebrow">In person</div>}>
      <div className="scan-sheet">
        <h2 className="t-title" id="scan-title">Scan a friend</h2>
        <p className="muted t-body scan-lead">Point your camera at their <strong>Add me</strong> code.</p>
        {!scanned && <Scanner onResult={handle} onError={setCamera} />}
        {/* The paste field is on the sheet underneath, which this one covers, so say so and go there. */}
        {camera && (
          <>
            <p className="muted t-body scan-error" role="status">{camera}</p>
            <button type="button" className="btn btn-wide" onClick={onClose}>Close and paste a code</button>
          </>
        )}
        {status && <p className="t-body scan-status" role="status">{status}</p>}
      </div>
    </Sheet>
  )
}
