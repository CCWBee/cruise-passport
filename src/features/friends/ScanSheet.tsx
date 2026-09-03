import { useState } from 'react'
import { extractShareCode } from '../../state/share'
import { useStore } from '../../state/store'
import { Sheet } from '../../ui/Sheet'
import { Scanner } from './Scanner'
import './friends.css'

// In-person add: point the camera at a friend's code. The QR is now an /add# link carrying an
// identity card, so the add works with no internet and their passport follows through the feed. On a
// build with no backend the link still carries the whole passport, so the offline add stays complete.
export function ScanSheet({ onClose, onDone }: {
  onClose: () => void
  /** hands the success up to the screen, which ticks and closes both sheets */
  onDone: (label: string) => void
}) {
  const importCode = useStore((s) => s.importCode)
  const [status, setStatus] = useState('')
  const [camera, setCamera] = useState('') // a camera fault, which needs a way out rather than a message
  const [scanned, setScanned] = useState(false)

  const handle = async (text: string) => {
    if (scanned) return
    setScanned(true)
    const result = await importCode(extractShareCode(text))
    if (result.ok) {
      // No line of text and no wait: the tick is the confirmation, and it is the same one the /add
      // link, the paste field and a group join all land on.
      onDone(`${result.name} added`)
    } else {
      setStatus(result.reason || 'That code could not be read.')
      setTimeout(() => { setStatus(''); setScanned(false) }, 1400) // let them line it up again
    }
  }

  return (
    <Sheet onClose={onClose} labelledBy="scan-title">
      <div className="scan-sheet">
        {/* the same words as the button that opened it, so nobody has to check they are in the
            right place */}
        <h2 className="t-title sheet-title" id="scan-title">Scan their code</h2>
        <p className="sheet-meta scan-lead">Ask them to tap Show my code, then point your camera at it.</p>
        {!scanned && <Scanner onResult={handle} onError={setCamera} />}
        {/* The paste field is on the sheet underneath, which this one covers, so say so and go there. */}
        {camera && (
          <>
            <p className="t-meta scan-error" role="status">{camera}</p>
            <button type="button" className="btn btn-wide scan-out" onClick={onClose}>Close and paste a code</button>
          </>
        )}
        {status && <p className="t-body scan-status" role="status">{status}</p>}
      </div>
    </Sheet>
  )
}
