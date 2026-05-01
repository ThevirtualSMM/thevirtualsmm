// Server-renderable skeleton — same dimensions as the real content so the
// page doesn't shift when data arrives.

const COLORS = {
  border: "rgba(31,27,46,0.10)",
  card:   "#fff",
  muted:  "#7A7088",
};

function Block({ w, h, mt = 0, br = 6 }: { w: string | number; h: number; mt?: number; br?: number }) {
  return (
    <div
      className="sage-shimmer"
      style={{
        width: w, height: h, marginTop: mt, borderRadius: br,
        background: "#eee",
      }}
    />
  );
}

export default function Skeleton() {
  return (
    <div className="space-y-3">
      {/* Profile header */}
      <div
        className="flex items-center"
        style={{
          background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 18,
          padding: "1.5rem 2rem", gap: "1.75rem",
        }}
      >
        <div className="sage-shimmer" style={{ width: 80, height: 80, borderRadius: "50%", background: "#eee", flexShrink: 0 }} />
        <div style={{ flexShrink: 0 }}>
          <Block w={120} h={14} br={4} />
          <Block w={80}  h={10} br={4} mt={8} />
          <Block w={180} h={8}  br={4} mt={10} />
          <Block w={140} h={8}  br={4} mt={4} />
        </div>
        <div style={{ width: 1, alignSelf: "stretch", background: COLORS.border, margin: "4px 0" }} />
        <div className="flex flex-1 justify-evenly items-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Block w={20}  h={20} br={6} />
              <Block w={48}  h={14} br={4} />
              <Block w={56}  h={8}  br={4} />
              <Block w={64}  h={10} br={20} />
            </div>
          ))}
        </div>
      </div>

      {/* ER banner */}
      <div className="sage-shimmer" style={{ height: 70, borderRadius: 14, background: "#eee" }} />

      {/* Two-col grid */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <SkelCard heading rows={3} />
        <div className="space-y-3">
          <SkelCard heading rows={3} />
          <SkelCard heading rows={4} />
          <SkelCard heading rows={3} />
        </div>
      </div>
    </div>
  );
}

function SkelCard({ heading, rows }: { heading: boolean; rows: number }) {
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(31,27,46,0.10)", borderRadius: 16, padding: "1rem 1.1rem" }}>
      {heading && <Block w={120} h={10} br={4} />}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-start gap-2.5" style={{ marginTop: 14 }}>
          <Block w={22} h={22} br={6} />
          <Block w={52} h={52} br={9} />
          <div className="flex-1 space-y-2">
            <Block w="80%" h={10} />
            <Block w="60%" h={8} />
            <Block w={70} h={16} br={20} />
          </div>
        </div>
      ))}
    </div>
  );
}
