export function Logo({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`}>
      <div className="brand__mark" aria-hidden="true">M</div>
      <div>
        <strong>Maya</strong>
        {!compact && <span>Öğrenme Rehberi</span>}
      </div>
    </div>
  )
}
