export function StatusMeters({ trustLevel, trustLabel, trustValue, comfortLabel, comfortValue }) {
  return (
    <div className="status-meters" aria-label="trust and comfort meters">
      <div className="status-meter">
        <div className="status-meter__label">
          Trust [{trustLabel}]
        </div>
        <div
          className="status-meter__track"
          role="img"
          aria-label={`Trust ${trustValue} percent`}
        >
          <div
            className="status-meter__fill status-meter__fill--trust"
            style={{ width: `${trustValue}%` }}
          />
        </div>
      </div>
      <div className="status-meter">
        <div className="status-meter__label">
          Comfort [{comfortLabel}]
        </div>
        <div
          className="status-meter__track"
          role="img"
          aria-label={`Comfort ${comfortValue} percent`}
        >
          <div
            className="status-meter__fill status-meter__fill--comfort"
            style={{ width: `${comfortValue}%` }}
          />
        </div>
      </div>
    </div>
  );
}
