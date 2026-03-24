export function Sit({ onSitQuietly, disabled }) {
  return (
    <button onClick={onSitQuietly} disabled={disabled}>
      Sit quietly
    </button>
  );
}
