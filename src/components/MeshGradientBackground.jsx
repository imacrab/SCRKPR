import { PLAYER_COLORS } from "@/components/scorekeeper/PlayerSetup";

// Pick a stable subset of colors for the gradient blobs
const BLOB_COLORS = [
  PLAYER_COLORS[0],  // cyan
  PLAYER_COLORS[2],  // indigo
  PLAYER_COLORS[6],  // red
  PLAYER_COLORS[9],  // yellow
  PLAYER_COLORS[12], // teal
  PLAYER_COLORS[14], // sky
];

// Static blob positions so they don't re-render
const BLOBS = [
  { color: BLOB_COLORS[0], x: "10%",  y: "10%",  size: "55vmax", opacity: 0.18 },
  { color: BLOB_COLORS[1], x: "75%",  y: "5%",   size: "45vmax", opacity: 0.14 },
  { color: BLOB_COLORS[2], x: "85%",  y: "60%",  size: "50vmax", opacity: 0.13 },
  { color: BLOB_COLORS[3], x: "20%",  y: "75%",  size: "48vmax", opacity: 0.14 },
  { color: BLOB_COLORS[4], x: "50%",  y: "45%",  size: "40vmax", opacity: 0.10 },
  { color: BLOB_COLORS[5], x: "5%",   y: "50%",  size: "38vmax", opacity: 0.12 },
];

export default function MeshGradientBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      {BLOBS.map((blob, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: blob.x,
            top: blob.y,
            width: blob.size,
            height: blob.size,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background: blob.color,
            opacity: blob.opacity,
            filter: "blur(80px)",
          }}
        />
      ))}
    </div>
  );
}