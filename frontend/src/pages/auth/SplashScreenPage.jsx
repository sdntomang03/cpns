export default function SplashScreenPage() {
  return (
    <div className="splash-screen d-flex align-items-center justify-content-center text-center">
      <div>
        <div className="app-logo mb-3">CP</div>
        <h1 className="fw-bold mb-2">CPNS Nasional</h1>
        <p className="text-muted mb-4">Mengecek token login...</p>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    </div>
  );
}
