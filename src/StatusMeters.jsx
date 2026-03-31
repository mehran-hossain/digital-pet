function interpolateHexColor(startColor, endColor, ratio) {
  const clampRatio = Math.max(0, Math.min(1, ratio));
  const parseHex = (hex) => parseInt(hex.replace("#", ""), 16);
  const start = parseHex(startColor);
  const end = parseHex(endColor);

  const r = Math.round(((start >> 16) & 0xff) + (((end >> 16) & 0xff) - ((start >> 16) & 0xff)) * clampRatio);
  const g = Math.round(((start >> 8) & 0xff) + (((end >> 8) & 0xff) - ((start >> 8) & 0xff)) * clampRatio);
  const b = Math.round((start & 0xff) + ((end & 0xff) - (start & 0xff)) * clampRatio);

  return `rgb(${r}, ${g}, ${b})`;
}

function getTrustFillColor(value) {
  return interpolateHexColor("#ff4b4b", "#ffd86a", value / 100);
}

function getComfortFillColor(value) {
  return interpolateHexColor("#4f96ff", "#ffd86a", value / 100);
}

export function StatusMeters({ trustLevel, trustLabel, trustValue, comfortLabel, comfortValue, pulse = false }) {
  return (
    <div
      className={`status-mood-box${pulse ? " status-mood-box--pulse" : ""}`}
      aria-label="Meowzart's mood"
    >
      <div className="status-mood-box__title">Meowzart's Mood</div>
      <div className="status-meters" aria-label="trust and comfort meters">
        <div className="status-meter">
          <div className="status-meter__label">Trust: {trustLabel}</div>
          <div
            className="status-meter__track"
            role="img"
            aria-label={`Trust ${trustValue} percent`}
          >
            <div
              className="status-meter__fill"
              style={{
                width: `${trustValue}%`,
                backgroundColor: getTrustFillColor(trustValue),
              }}
            />
          </div>
        </div>

        <div className="status-meter">
          <div className="status-meter__label">Comfort: {comfortLabel}</div>
          <div
            className="status-meter__track"
            role="img"
            aria-label={`Comfort ${comfortValue} percent`}
          >
            <div
              className="status-meter__fill"
              style={{
                width: `${comfortValue}%`,
                backgroundColor: getComfortFillColor(comfortValue),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
