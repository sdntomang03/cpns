import { useEffect, useState } from 'react';
import { getDashboardSummary, getNationalRanking } from '../../api/dashboardApi';
import useNotification from '../../components/common/useNotification';
import { getPracticeStatistics } from '../../database/repositories/practiceRepository';
import { useAuthStore } from '../../store/authStore';
import { checkConnection } from '../../utils/network';

const categoryLabels = { twk: 'TWK', tiu: 'TIU', tkp: 'TKP' };

function formatScore(score) {
  return Number(score || 0).toLocaleString('id-ID', { maximumFractionDigits: 1 });
}

function ScoreProgress({ value, label }) {
  const percentage = Math.min(100, Math.max(0, Number(value) || 0));

  return (
    <div
      className="progress"
      role="img"
      aria-label={`${label}: ${percentage.toLocaleString('id-ID')} persen`}
      style={{ height: 12 }}
    >
      <div
        className={`progress-bar ${percentage >= 65 ? 'bg-success' : 'bg-primary'}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export default function StatisticsPage() {
  const userId = useAuthStore((state) => state.user?.id);
  const { notify } = useNotification();
  const [practice, setPractice] = useState(null);
  const [server, setServer] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadStatistics() {
      setIsLoading(true);
      try {
        const [connected, localStats] = await Promise.all([
          checkConnection(),
          userId ? getPracticeStatistics(userId) : Promise.resolve(null),
        ]);
        if (!active) return;
        setIsOnline(connected);
        setPractice(localStats);

        if (!connected) {
          notify('Statistik latihan tersedia dari perangkat. Statistik Try Out dan ranking memerlukan koneksi internet.', {
            title: 'Sedang offline',
            type: 'warning',
          });
          return;
        }

        const [summaryResult, rankingResult] = await Promise.allSettled([
          getDashboardSummary(),
          getNationalRanking(),
        ]);
        if (!active) return;

        if (summaryResult.status === 'fulfilled') {
          setServer(summaryResult.value.data?.data || null);
        } else {
          console.error('Failed to load server tryout statistics', summaryResult.reason);
        }
        if (rankingResult.status === 'fulfilled') {
          const data = rankingResult.value.data?.data;
          setRanking(data?.me || null);
        } else {
          console.error('Failed to load ranking statistics', rankingResult.reason);
        }
        if (summaryResult.status === 'rejected' || rankingResult.status === 'rejected') {
          notify('Sebagian statistik belum dapat dimuat. Statistik latihan di perangkat tetap tersedia.', {
            title: 'Pembaruan belum lengkap',
            type: 'warning',
          });
        }
      } catch (error) {
        console.error('Failed to load statistics', error);
        if (active) {
          notify('Statistik gagal dimuat. Coba buka kembali halaman ini.', {
            title: 'Gagal memuat statistik',
            type: 'error',
          });
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadStatistics();
    return () => {
      active = false;
    };
  }, [notify, userId]);

  const latestSections = server?.latest_tryout?.result?.sections || [];
  const bestTryoutPercent = server?.latest_tryout?.max_score
    ? (server.latest_tryout.total_score / server.latest_tryout.max_score) * 100
    : 0;

  return (
    <div className="container py-4 pb-5">
      <div className="page-heading mb-3">
        <span className="small text-primary fw-semibold text-uppercase">Perkembangan belajar</span>
        <h3 className="fw-bold mb-1 mt-1">Statistik nilai</h3>
        <p className="text-muted small">Pantau nilai latihan dan Try Out dari waktu ke waktu.</p>
      </div>

      <section className="row g-3 mb-4" aria-label="Ringkasan nilai latihan">
        <div className="col-6 col-md-3">
          <div className="card border-0 rounded-4 shadow-sm h-100">
            <div className="card-body">
              <div className="small text-muted">Sesi latihan</div>
              <div className="fs-3 fw-bold">{practice?.sessions ?? '—'}</div>
              <div className="small text-muted">Tersimpan di perangkat</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 rounded-4 shadow-sm h-100">
            <div className="card-body">
              <div className="small text-muted">Rata-rata capaian nilai</div>
              <div className="fs-3 fw-bold">{practice ? `${formatScore(practice.score_progress)}%` : '—'}</div>
              <div className="small text-muted">Dibandingkan nilai maksimum</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 rounded-4 shadow-sm h-100">
            <div className="card-body">
              <div className="small text-muted">Nilai terbaik latihan</div>
              <div className="fs-3 fw-bold">{practice ? formatScore(practice.best_score) : '—'}</div>
              <div className="small text-muted">Nilai mentah tertinggi</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 rounded-4 shadow-sm h-100">
            <div className="card-body">
              <div className="small text-muted">Ranking nasional</div>
              <div className="fs-3 fw-bold">{ranking ? `#${ranking.rank}` : '—'}</div>
              <div className="small text-muted">Berdasarkan nilai Try Out</div>
            </div>
          </div>
        </div>
      </section>

      <section className="card border-0 rounded-4 shadow-sm mb-4">
        <div className="card-body p-4">
          <h5 className="fw-bold mb-1">Nilai latihan per jenis tes</h5>
          <p className="small text-muted mb-3">Capaian dihitung dari jumlah nilai dibandingkan jumlah nilai maksimum.</p>
          {practice?.categories?.length ? (
            <div className="d-grid gap-4">
              {practice.categories.map((category) => (
                <div key={category.category}>
                  <div className="d-flex justify-content-between align-items-center gap-2 mb-1">
                    <strong>{categoryLabels[category.category] || category.category.toUpperCase()}</strong>
                    <span className="small text-muted">
                      {formatScore(category.total_score)}/{formatScore(category.total_max_score)}
                      {' · '}{formatScore(category.score_progress)}%
                      {' · '}{category.sessions} sesi
                    </span>
                  </div>
                  <ScoreProgress value={category.score_progress} label={`Nilai ${categoryLabels[category.category]}`} />
                </div>
              ))}
            </div>
          ) : (
            <p className="small text-muted mb-0">Belum ada nilai latihan. Selesaikan satu paket untuk mulai melihat statistik.</p>
          )}
        </div>
      </section>

      <section className="card border-0 rounded-4 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
            <div>
              <h5 className="fw-bold mb-1">Perkembangan Try Out</h5>
              <p className="small text-muted mb-0">Nilai dan status kelulusan Try Out terbaru.</p>
            </div>
            <i className="bi bi-trophy fs-3 text-warning" />
          </div>
          {server?.latest_tryout ? (
            <>
              <div className="d-flex justify-content-between small mb-1">
                <span>{server.latest_tryout.tryout?.title || 'Try Out terakhir'}</span>
                <strong>
                  {formatScore(server.latest_tryout.total_score)}/{formatScore(server.latest_tryout.max_score)}
                  {' · '}{formatScore(bestTryoutPercent)}%
                </strong>
              </div>
              <ScoreProgress value={bestTryoutPercent} label="Capaian nilai Try Out terakhir" />
              <div className={`small fw-semibold mt-2 ${server.latest_tryout.passed ? 'text-success' : 'text-danger'}`}>
                {server.latest_tryout.passed ? 'Memenuhi PG semua sesi' : 'Belum memenuhi PG semua sesi'}
              </div>
              {latestSections.length ? (
                <div className="d-grid gap-3 mt-4">
                  {latestSections.map((section) => {
                    const percent = section.max_score
                      ? (section.score / section.max_score) * 100
                      : 0;
                    return (
                      <div key={section.id}>
                        <div className="d-flex justify-content-between small mb-1">
                          <span>{section.name}</span>
                          <span>
                            {formatScore(section.score)}/{formatScore(section.max_score)}
                            {' · '}PG {formatScore(section.passing_grade)}
                          </span>
                        </div>
                        <ScoreProgress value={percent} label={`Nilai ${section.name}`} />
                      </div>
                    );
                  })}
                </div>
              ) : null}
              <div className="small text-muted mt-3">
                Total Try Out selesai: {server.tryout_count}
                {' · '}Rata-rata nilai: {formatScore(server.average_score)}
                {' · '}Nilai terbaik: {formatScore(server.best_score)}
              </div>
            </>
          ) : (
            <p className="small text-muted mb-0">
              {isOnline ? 'Belum ada Try Out selesai.' : 'Sambungkan internet untuk melihat statistik Try Out.'}
            </p>
          )}
        </div>
      </section>

      <section className="card border-0 rounded-4 shadow-sm">
        <div className="card-body p-4">
          <h5 className="fw-bold mb-3">Riwayat nilai latihan</h5>
          {practice?.attempts?.length ? (
            <div className="list-group list-group-flush">
              {practice.attempts.map((attempt) => (
                <div className="list-group-item px-0 py-3" key={attempt.uuid}>
                  <div className="d-flex justify-content-between align-items-start gap-3">
                    <div>
                      <div className="fw-semibold">{attempt.package_title}</div>
                      <div className="small text-muted">
                        {categoryLabels[attempt.category] || attempt.category.toUpperCase()}
                        {' · '}{new Date(attempt.completed_at).toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="text-end">
                      <strong>{formatScore(attempt.score)}/{formatScore(attempt.max_score)}</strong>
                      <div className={`small ${attempt.passed ? 'text-success' : 'text-muted'}`}>
                        {attempt.passed ? 'Memenuhi PG' : 'Belum memenuhi PG'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="small text-muted mb-0">Riwayat nilai akan muncul setelah latihan selesai.</p>
          )}
        </div>
      </section>
      {isLoading ? <div className="small text-muted mt-3">Memuat statistik nilai...</div> : null}
    </div>
  );
}
