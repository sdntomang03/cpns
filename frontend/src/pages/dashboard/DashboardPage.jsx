import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardSummary, getNationalRanking } from '../../api/dashboardApi';
import { getProfile } from '../../api/authApi';
import { syncPracticeProgress } from '../../api/practiceApi';
import useNotification from '../../components/common/useNotification';
import {
  getPendingPracticeAttempts,
  getPracticeSummary,
  markPracticeAttemptsSynced,
} from '../../database/repositories/practiceRepository';
import { useAuthStore } from '../../store/authStore';
import { checkConnection } from '../../utils/network';

function emptyPracticeStats() {
  return {
    sessions: 0,
    questions: 0,
    correct: 0,
    wrong: 0,
    accuracy: 0,
    total_score: 0,
    total_max_score: 0,
    score_progress: 0,
    latest: null,
  };
}

export default function DashboardPage() {
  const { user, token, setAuth } = useAuthStore();
  const { notify } = useNotification();
  const userId = user?.id;
  const [practiceStats, setPracticeStats] = useState(emptyPracticeStats);
  const [serverSummary, setServerSummary] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [topRankings, setTopRankings] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    const connected = await checkConnection();
    setIsOnline(connected);

    try {
      const summary = userId ? await getPracticeSummary(userId) : emptyPracticeStats();
      const answered = summary.correct + summary.wrong;
      setPracticeStats({
        ...summary,
        accuracy: answered ? Math.round((summary.correct / answered) * 1000) / 10 : 0,
      });
    } catch (error) {
      console.error('Failed to read local practice statistics', error);
      notify('Statistik latihan di perangkat gagal dibaca.', { title: 'Statistik tidak tersedia', type: 'error' });
    }

    if (connected) {
      const [summaryResult, rankingResult, profileResult] = await Promise.allSettled([
        getDashboardSummary(),
        getNationalRanking(),
        token ? getProfile() : Promise.resolve(null),
      ]);

      if (summaryResult.status === 'fulfilled') {
        setServerSummary(summaryResult.value.data?.data || null);
      } else {
        console.error('Failed to load server dashboard statistics', summaryResult.reason);
      }
      if (rankingResult.status === 'fulfilled') {
        const data = rankingResult.value.data?.data;
        setRanking(data?.me || null);
        setTopRankings(Array.isArray(data?.rankings) ? data.rankings : []);
      } else {
        console.error('Failed to load national ranking', rankingResult.reason);
        setRanking(null);
        setTopRankings([]);
      }
      if (profileResult.status === 'fulfilled' && profileResult.value?.data?.data) {
        setAuth(profileResult.value.data.data, token);
      }
      if ([summaryResult, rankingResult].some((item) => item.status === 'rejected')) {
        notify('Sebagian statistik belum dapat diperbarui. Coba sinkronkan lagi.', {
          title: 'Pembaruan belum lengkap',
          type: 'warning',
        });
      }
    } else {
      setServerSummary(null);
      setRanking(null);
      setTopRankings([]);
      notify('Statistik latihan dari perangkat tersedia. Statistik Try Out dan ranking memerlukan koneksi internet.', {
        title: 'Sedang offline',
        type: 'warning',
      });
    }
    setIsLoading(false);
  }, [notify, setAuth, token, userId]);

  const syncProgress = useCallback(async () => {
    if (!userId) {
      return;
    }
    setIsSyncing(true);
    try {
      if (!(await checkConnection())) {
        setIsOnline(false);
        notify('Progres tetap tersimpan di perangkat dan dapat disinkronkan nanti.', {
          title: 'Tidak ada koneksi',
          type: 'warning',
        });
        return;
      }
      const pending = await getPendingPracticeAttempts(userId);
      if (pending.length) {
        const response = await syncPracticeProgress(pending.map((attempt) => ({
          uuid: attempt.uuid,
          package_slug: attempt.package_slug,
          category: attempt.category,
          package_title: attempt.package_title,
          score: attempt.score,
          max_score: attempt.max_score,
          passing_score: attempt.passing_score,
          correct_count: attempt.correct_count,
          wrong_count: attempt.wrong_count,
          unanswered_count: attempt.unanswered_count,
          completed_at: attempt.completed_at,
        })));
        const synced = response.data?.data?.synced_uuids;
        if (!Array.isArray(synced)) {
          throw new Error('Respons sinkronisasi progres tidak valid.');
        }
        await markPracticeAttemptsSynced(synced);
      }
      await loadDashboard();
      notify(pending.length
        ? `${pending.length} progres latihan tersinkron. Statistik dan ranking Try Out diperbarui.`
        : 'Data dashboard dan ranking berhasil diperbarui.',
      { title: 'Sinkronisasi berhasil', type: 'success' });
    } catch (error) {
      console.error('Failed to synchronize dashboard data', error);
      notify('Sinkronisasi gagal. Progres lokal tetap tersimpan; coba lagi saat koneksi tersedia.', {
        title: 'Sinkronisasi gagal',
        type: 'error',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [loadDashboard, notify, userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadDashboard().catch((error) => {
        console.error('Failed to load dashboard', error);
        notify('Dashboard gagal dimuat.', { title: 'Gagal memuat dashboard', type: 'error' });
        setIsLoading(false);
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDashboard, notify]);

  return (
    <div className="container pb-5 pt-3">
      <div className="card dashboard-hero rounded-4 mb-3">
        <div className="card-body p-4 p-md-5">
          <div className="d-flex justify-content-between align-items-start gap-3">
            <div>
              <span className="badge rounded-pill bg-white bg-opacity-10 text-white mb-3">
                <i className={`bi ${isOnline ? 'bi-wifi' : 'bi-wifi-off'} me-1`} />
                {isOnline ? 'Belajar konsisten, selangkah lebih dekat' : 'Mode offline'}
              </span>
              <h1 className="fw-bold mb-2">Halo, {user?.name?.split(' ')[0] || 'Peserta'}!</h1>
              <p className="dashboard-subtitle mb-0">Siap melanjutkan persiapan CPNS hari ini?</p>
            </div>
            <div className="d-none d-sm-grid dashboard-stat-icon bg-white bg-opacity-10 text-white fs-4">
              <i className="bi bi-mortarboard" />
            </div>
          </div>
          <div className="d-flex justify-content-between align-items-center mt-4 mb-2 small">
            <span className="dashboard-subtitle">Rata-rata capaian nilai latihan</span>
            <strong>
              {practiceStats.sessions
                ? `${practiceStats.score_progress.toLocaleString('id-ID')}%`
                : 'Belum ada nilai'}
            </strong>
          </div>
          <div className="progress" style={{ height: 8 }}>
            <div
              className="progress-bar"
              style={{ width: `${Math.min(100, practiceStats.score_progress)}%` }}
            />
          </div>
          {practiceStats.sessions ? (
            <div className="dashboard-subtitle small mt-2">
              Total nilai {practiceStats.total_score.toLocaleString('id-ID')}/
              {practiceStats.total_max_score.toLocaleString('id-ID')}
            </div>
          ) : null}
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className={`small fw-semibold ${isOnline ? 'text-success' : 'text-muted'}`}>
          <i className={`bi ${isOnline ? 'bi-check-circle-fill' : 'bi-cloud-slash'} me-1`} />
          {isOnline ? 'Online' : 'Offline · Data perangkat'}
        </span>
        <button
          type="button"
          className="btn btn-light btn-sm rounded-pill px-3"
          onClick={syncProgress}
          disabled={isLoading || isSyncing || !isOnline}
        >
          <i className={`bi ${isSyncing ? 'bi-arrow-repeat' : 'bi-arrow-clockwise'} me-1`} />
          {isSyncing ? 'Menyinkronkan' : 'Sinkronkan'}
        </button>
      </div>
      <div className="row g-2 mb-4">
        <div className="col-12 col-md-4">
          <Link to="/materials" className="card dashboard-quick-link border-0 rounded-4 h-100">
            <div className="card-body d-flex align-items-center gap-3 p-3">
              <span className="dashboard-quick-icon"><i className="bi bi-journal-bookmark" /></span>
              <span><strong className="d-block">Baca materi</strong><small className="text-muted">Pelajari konsep CPNS</small></span>
              <i className="bi bi-chevron-right ms-auto text-muted" />
            </div>
          </Link>
        </div>
        <div className="col-12 col-md-4">
          <Link to="/practice" className="card dashboard-quick-link border-0 rounded-4 h-100">
            <div className="card-body d-flex align-items-center gap-3 p-3">
              <span className="dashboard-quick-icon"><i className="bi bi-pencil-square" /></span>
              <span><strong className="d-block">Latihan soal</strong><small className="text-muted">Asah kemampuanmu</small></span>
              <i className="bi bi-chevron-right ms-auto text-muted" />
            </div>
          </Link>
        </div>
        <div className="col-12 col-md-4">
          <Link to="/tryout" className="card dashboard-quick-link border-0 rounded-4 h-100">
            <div className="card-body d-flex align-items-center gap-3 p-3">
              <span className="dashboard-quick-icon"><i className="bi bi-clipboard2-check" /></span>
              <span><strong className="d-block">Coba Try Out</strong><small className="text-muted">Ukur kesiapanmu</small></span>
              <i className="bi bi-chevron-right ms-auto text-muted" />
            </div>
          </Link>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <StatCard title="Latihan" value={practiceStats.sessions} subtext={`${practiceStats.questions} soal dikerjakan`} icon="bi-pencil-square" tone="primary" />
        <StatCard
          title="Nilai latihan"
          value={practiceStats.sessions
            ? `${practiceStats.total_score}/${practiceStats.total_max_score}`
            : '—'}
          subtext="Total nilai yang terkumpul"
          icon="bi-journal-check"
          tone="success"
        />
        <StatCard
          title="Capaian nilai"
          value={`${practiceStats.score_progress.toLocaleString('id-ID')}%`}
          subtext="Dari total nilai maksimum"
          icon="bi-graph-up-arrow"
          tone="warning"
        />
        <StatCard title="Try Out" value={serverSummary?.tryout_count ?? '—'} subtext={`Nilai terbaik ${serverSummary?.best_score ?? '—'}`} icon="bi-journal-check" tone="danger" />
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-5">
          <div className="card border-0 rounded-4 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-muted">Ranking Nasional</small>
                  {ranking ? (
                    <>
                      <div className="fw-bold fs-3">#{ranking.rank}</div>
                      <div className="small text-muted">{ranking.score} poin dari Try Out</div>
                    </>
                  ) : (
                    <div className="fw-semibold mt-2">{isOnline ? 'Belum ada hasil Try Out' : 'Perlu koneksi internet'}</div>
                  )}
                </div>
                <i className="bi bi-trophy fs-1 text-warning" />
              </div>
              <Link to="/tryout" className="btn btn-outline-primary btn-sm rounded-pill mt-3">Lihat Try Out</Link>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-7">
          <div className="card border-0 rounded-4 shadow-sm h-100">
            <div className="card-body">
              <h5 className="fw-bold mb-3">Ranking teratas</h5>
              {topRankings.length ? (
                <div className="list-group list-group-flush">
                  {topRankings.slice(0, 5).map((item) => (
                    <div className={`list-group-item px-0 d-flex justify-content-between ${item.is_me ? 'fw-bold text-primary' : ''}`} key={item.user_id}>
                      <span>#{item.rank} {item.name}{item.is_me ? ' (Anda)' : ''}</span>
                      <strong>{item.score}</strong>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted small mb-0">Ranking muncul setelah ada peserta menyelesaikan Try Out.</p>}
              <small className="text-muted d-block mt-2">Berdasarkan nilai Try Out terbaik.</small>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-md-6">
          <div className="card border-0 rounded-4 shadow-sm h-100">
            <div className="card-body">
              <h5 className="fw-bold">Latihan terakhir</h5>
              {practiceStats.latest ? (
                <>
                  <div>{practiceStats.latest.package_title}</div>
                  <small className="text-muted">
                    Nilai {practiceStats.latest.score}/{practiceStats.latest.max_score} · {new Date(practiceStats.latest.completed_at).toLocaleString('id-ID')}
                  </small>
                </>
              ) : <p className="small text-muted mb-0">Belum ada latihan selesai di perangkat.</p>}
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="card border-0 rounded-4 shadow-sm h-100">
            <div className="card-body">
              <h5 className="fw-bold">Ringkasan Try Out</h5>
              {serverSummary?.latest_tryout ? (
                <>
                  <div>{serverSummary.latest_tryout.tryout?.title || 'Try Out'}</div>
                  <small className="text-muted">
                    Nilai {serverSummary.latest_tryout.total_score}/{serverSummary.latest_tryout.max_score} ·
                    {' '}{serverSummary.latest_tryout.passed ? 'Memenuhi PG' : 'Belum memenuhi PG'}
                  </small>
                </>
              ) : <p className="small text-muted mb-0">Belum ada hasil Try Out.</p>}
            </div>
          </div>
        </div>
      </div>
      {isLoading ? <div className="small text-muted mt-3">Memuat statistik terbaru...</div> : null}
    </div>
  );
}

function StatCard({ title, value, subtext, icon, tone }) {
  return (
    <div className="col-6 col-md-3">
      <div className="card dashboard-stat-card border-0 shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="text-muted small fw-semibold">{title}</span>
            <span className={`dashboard-stat-icon text-${tone}`}><i className={`bi ${icon}`} /></span>
          </div>
          <div className="fw-bold fs-4">{value}</div>
          <div className="small text-muted">{subtext}</div>
        </div>
      </div>
    </div>
  );
}
