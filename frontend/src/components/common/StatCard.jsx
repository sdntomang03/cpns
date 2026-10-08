export default function StatCard({ title, value, subtext, icon, tone = 'primary' }) {
  return (
    <div className="col-6 col-md-3">
      <div className={`card h-100 border-0 shadow-sm rounded-4 bg-${tone} bg-opacity-10`}>
        <div className="card-body d-flex flex-column justify-content-between">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="text-muted small fw-semibold">{title}</span>
            <span className="fs-4 text-primary">{icon}</span>
          </div>
          <div className="fw-bold fs-4">{value}</div>
          <div className="small text-muted">{subtext}</div>
        </div>
      </div>
    </div>
  );
}
