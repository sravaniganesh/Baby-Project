export default function StatCard({ title, value, color }) {
  return (
    <div style={{ ...styles.card, borderTop: `4px solid ${color}` }}>
      <div style={styles.title}>{title}</div>
      <div style={styles.value}>{value}</div>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    minWidth: 180,
  },
  title: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 6,
  },
  value: {
    fontSize: 26,
    fontWeight: 700,
  },
};