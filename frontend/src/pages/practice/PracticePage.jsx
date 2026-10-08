import { useCallback, useEffect, useState } from 'react';
import MathContent from '../../components/common/MathContent';
import useNotification from '../../components/common/useNotification';
import QuestionImage from '../../components/common/QuestionImage';
import {
  getPracticePackages as fetchPracticePackages,
  submitPracticeResult,
  syncPracticeProgress,
} from '../../api/practiceApi';
import {
  cachePracticePackage,
  getPendingPracticeAttempts,
  getPracticeAttempts,
  getPracticePackages,
  markPracticeAttemptsSynced,
  savePracticeAttempt,
} from '../../database/repositories/practiceRepository';
import { useAuthStore } from '../../store/authStore';
import { checkConnection, watchConnection } from '../../utils/network';

const categories = [
  { id: 'twk', label: 'TWK' },
  { id: 'tiu', label: 'TIU' },
  { id: 'tkp', label: 'TKP' },
];

export default function PracticePage() {
  const userId = useAuthStore((state) => state.user?.id);
  const { notify, confirm } = useNotification();
  const [selectedCategory, setSelectedCategory] = useState('twk');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [packages, setPackages] = useState([]);
  const [serverPackages, setServerPackages] = useState([]);
  const [downloadingPackage, setDownloadingPackage] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [result, setResult] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncingProgress, setIsSyncingProgress] = useState(false);
  const [practiceHistory, setPracticeHistory] = useState([]);

  const refreshPracticeHistory = useCallback(async () => {
    if (userId) {
      setPracticeHistory(await getPracticeAttempts(userId, 5));
    }
  }, [userId]);

  const syncPendingProgress = useCallback(async () => {
    if (!userId || !(await checkConnection())) {
      return 0;
    }

    const pendingAttempts = await getPendingPracticeAttempts(userId);
    if (!pendingAttempts.length) {
      return 0;
    }

    const response = await syncPracticeProgress(
      pendingAttempts.map((attempt) => ({
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
      })),
    );
    const syncedUuids = response.data?.data?.synced_uuids;

    if (!Array.isArray(syncedUuids)) {
      throw new Error('Respons sinkronisasi progres dari server tidak valid.');
    }

    await markPracticeAttemptsSynced(syncedUuids);
    await refreshPracticeHistory();
    return syncedUuids.length;
  }, [refreshPracticeHistory, userId]);

  const syncProgressNow = useCallback(async () => {
    setIsSyncingProgress(true);
    try {
      const count = await syncPendingProgress();
      notify(
        count
          ? `${count} hasil latihan berhasil disinkronkan untuk statistik.`
          : 'Tidak ada progres latihan yang perlu disinkronkan.',
        { title: count ? 'Sinkronisasi berhasil' : 'Informasi', type: count ? 'success' : 'info' },
      );
    } catch (error) {
      console.error('Failed to sync practice progress', error);
      notify('Progres masih tersimpan di perangkat. Sinkronisasi akan dicoba lagi.', {
        title: 'Sinkronisasi tertunda',
        type: 'warning',
      });
    } finally {
      setIsSyncingProgress(false);
    }
  }, [notify, syncPendingProgress]);
  const loadPackages = useCallback(async (requestedSource, showUpdateNotice = false) => {
    setIsLoading(true);

    try {
      const connected = await checkConnection();
      setIsOnline(connected);

      if (requestedSource === 'server' && connected) {
        const response = await fetchPracticePackages();
        const serverPackages = response.data?.data;

        if (!Array.isArray(serverPackages)) {
          throw new Error('Respons paket latihan dari server tidak valid.');
        }

        try {
          const localPackages = await getPracticePackages();
          setPackages(localPackages);
        } catch (error) {
          console.warn('Could not read cached practice packages while loading server list.', error);
        }

        setServerPackages(serverPackages);
        if (showUpdateNotice) {
          setSourceFilter('server');
          notify('Daftar latihan terbaru dari server berhasil dimuat. Unduh paket yang ingin disimpan di perangkat.', {
            title: 'Paket diperbarui',
            type: 'success',
          });
        }
      } else {
        if (requestedSource === 'server' && !connected) {
          notify('Menampilkan paket yang tersimpan di perangkat.', {
            title: 'Tidak ada koneksi',
            type: 'warning',
          });
        }
        const localPackages = await getPracticePackages();
        setPackages(localPackages);

        if (!localPackages.length) {
          notify('Sambungkan internet untuk mengambil paket latihan.', {
            title: 'Paket belum tersedia',
            type: 'warning',
          });
        }
      }
    } catch (error) {
      console.error('Failed to load practice packages', error);
      if (requestedSource === 'server') {
        notify('Daftar latihan terbaru gagal dimuat. Periksa koneksi lalu coba lagi.', {
          title: 'Gagal memperbarui paket',
          type: 'error',
        });
      } else {
        try {
          const localPackages = await getPracticePackages();
          setPackages(localPackages);
        } catch (localError) {
          console.error('Failed to read local practice packages', localError);
          setPackages([]);
          notify('Paket latihan gagal dimuat. Periksa koneksi atau penyimpanan perangkat.', {
            title: 'Gagal memuat paket',
            type: 'error',
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    const initialLoadTimer = window.setTimeout(() => loadPackages('device'), 0);
    const initialHistoryTimer = window.setTimeout(() => {
      refreshPracticeHistory().catch((error) => {
        console.error('Failed to load local practice history', error);
      });
      syncPendingProgress().catch((error) => {
        console.warn('Practice progress sync will be retried later.', error);
      });
    }, 0);
    let networkListener;

    watchConnection((connected) => {
      setIsOnline(connected);
      if (!connected) {
        loadPackages('device');
      } else {
        syncPendingProgress().catch((error) => {
          console.warn('Practice progress sync will be retried later.', error);
        });
      }
    })
      .then((listener) => {
        networkListener = listener;
      })
      .catch((error) => {
        console.error('Failed to observe network status', error);
      });

    return () => {
      window.clearTimeout(initialLoadTimer);
      window.clearTimeout(initialHistoryTimer);
      networkListener?.remove();
    };
  }, [loadPackages, refreshPracticeHistory, syncPendingProgress]);

  const availablePackages = sourceFilter === 'server'
    ? isOnline
      ? mergePackages(packages, serverPackages).filter((practicePackage) => practicePackage._source !== 'device')
      : []
    : sourceFilter === 'device'
      ? packages.map((practicePackage) => ({ ...practicePackage, _source: 'device' }))
      : isOnline
        ? mergePackages(packages, serverPackages)
        : packages.map((practicePackage) => ({ ...practicePackage, _source: 'device' }));
  const visiblePackages = availablePackages.filter(
    (practicePackage) => practicePackage.category === selectedCategory,
  );

  async function downloadPackage(practicePackage) {
    const key = packageKey(practicePackage);
    if (!isOnline || downloadingPackage !== null || practicePackage._source === 'both') {
      return;
    }

    setDownloadingPackage(key);
    try {
      const packageToCache = { ...practicePackage };
      delete packageToCache._source;
      await cachePracticePackage(packageToCache);
      setPackages((current) => {
        const index = current.findIndex((item) => packageKey(item) === key);
        if (index < 0) {
          return [...current, packageToCache];
        }
        return current.map((item, itemIndex) => (
          itemIndex === index ? packageToCache : item
        ));
      });
      notify(`${practicePackage.title} berhasil diunduh dan tersedia di perangkat.`, {
        title: 'Unduhan selesai',
        type: 'success',
      });
    } catch (error) {
      console.error('Could not download practice package to device', error);
      notify('Paket gagal disimpan di perangkat. Periksa ruang penyimpanan lalu coba lagi.', {
        title: 'Unduhan gagal',
        type: 'error',
      });
    } finally {
      setDownloadingPackage(null);
    }
  }

  async function finishPractice() {
    if (!selectedPackage || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    const submittedAnswers = selectedPackage.questions.map((question) => ({
      question_id: question.id,
      option_id: answers[question.id],
    })).filter((answer) => answer.option_id !== undefined);

    try {
      let finalResult;
      if (await checkConnection()) {
        try {
          const response = await submitPracticeResult(selectedPackage.id, submittedAnswers);
          finalResult = response.data.data;
        } catch (error) {
          console.warn('Server could not score this practice; using cached scoring rules.', error);
          notify('Nilai dihitung menggunakan paket yang tersimpan di perangkat.', {
            title: 'Penilaian offline',
            type: 'warning',
          });
        }
      }

      finalResult ||= calculateLocalResult(selectedPackage, answers);
      setResult(finalResult);

      if (userId) {
        const attempt = {
          uuid: crypto.randomUUID(),
          user_id: userId,
          package_slug: selectedPackage.slug,
          category: selectedPackage.category,
          package_title: selectedPackage.title,
          completed_at: new Date().toISOString(),
          ...finalResult,
        };

        try {
          await savePracticeAttempt(attempt);
          await refreshPracticeHistory();
          if (await checkConnection()) {
            try {
              await syncPendingProgress();
              notify('Hasil tersimpan di perangkat dan progres disinkronkan untuk statistik.', {
                title: 'Latihan selesai',
                type: 'success',
              });
            } catch (error) {
              console.warn('Practice result saved locally and queued for sync.', error);
              notify('Hasil tersimpan di perangkat. Sinkronisasi akan dicoba lagi nanti.', {
                title: 'Latihan selesai',
                type: 'warning',
              });
            }
          } else {
            notify('Hasil tersimpan di perangkat dan menunggu koneksi untuk disinkronkan.', {
              title: 'Latihan selesai',
              type: 'success',
            });
          }
        } catch (error) {
          console.error('Could not save practice result locally', error);
          notify('Hasil sudah dihitung, tetapi gagal disimpan di perangkat.', {
            title: 'Hasil belum tersimpan',
            type: 'error',
          });
        }
      } else {
        notify('Hasil latihan sudah dihitung.', { title: 'Latihan selesai', type: 'success' });
      }
    } catch (error) {
      console.error('Failed to calculate practice result', error);
      notify('Nilai latihan gagal dihitung. Coba kirim jawaban lagi.', {
        title: 'Gagal menghitung nilai',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function openPackage(practicePackage) {
    setSelectedPackage(practicePackage);
    setAnswers({});
    setCurrentQuestion(0);
    setResult(null);
  }

  function restartPractice() {
    setAnswers({});
    setCurrentQuestion(0);
    setResult(null);
  }

  async function leavePackage() {
    if (!result && !(await confirm(
      'Jawaban latihan saat ini tidak akan disimpan sebagai hasil.',
      { title: 'Kembali ke daftar paket?', confirmText: 'Kembali', cancelText: 'Lanjut latihan' },
    ))) {
      return;
    }

    setSelectedPackage(null);
    setAnswers({});
    setResult(null);
  }

  return (
    <div className="container py-4 pb-5">
      {!selectedPackage ? (
        <>
          <div className="page-heading d-flex justify-content-between align-items-center mb-3">
            <div>
              <span className="small text-primary fw-semibold text-uppercase">Belajar bertahap</span>
              <h3 className="fw-bold mb-1 mt-1">Latihan</h3>
              <p className="text-muted small mb-0">Pilih jenis tes dan paket soal.</p>
            </div>
            <button
              className="btn btn-outline-primary btn-sm rounded-pill"
              type="button"
              onClick={() => loadPackages('server', true)}
              disabled={!isOnline || isLoading}
              title={isOnline ? 'Ambil paket terbaru' : 'Perlu koneksi internet'}
            >
              <i className={`bi ${isLoading ? 'bi-arrow-repeat' : 'bi-cloud-download'} me-1`} />
              {isLoading ? 'Memuat...' : 'Perbarui'}
            </button>
          </div>

          <div className="practice-category-tabs mb-3">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`btn rounded-pill ${selectedCategory === category.id ? 'btn-primary' : 'btn-light border'}`}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className="d-flex gap-2 mb-3">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'server', label: 'Terbaru' },
              { id: 'device', label: 'Di perangkat' },
            ].map((filter) => (
              <button
                key={filter.id}
                className={`btn btn-sm rounded-pill ${sourceFilter === filter.id ? 'btn-primary' : 'btn-light border'}`}
                type="button"
                onClick={() => setSourceFilter(filter.id)}
                disabled={isLoading || (filter.id === 'server' && !isOnline)}
              >
                <i
                  className={`bi ${
                    filter.id === 'all'
                      ? 'bi-collection'
                      : filter.id === 'server'
                        ? 'bi-cloud'
                        : 'bi-phone'
                  } me-1`}
                />
                {filter.label}
              </button>
            ))}
          </div>

          {isLoading && !packages.length ? (
            <div className="card border-0 rounded-4 shadow-sm">
              <div className="card-body placeholder-glow">
                <span className="placeholder col-6 mb-3" />
                <span className="placeholder col-9" />
              </div>
            </div>
          ) : null}

          {!isLoading && !visiblePackages.length ? (
            <div className="card border-0 rounded-4 shadow-sm">
              <div className="card-body text-center py-5">
                <i className="bi bi-journal-x fs-1 text-muted" />
                <h5 className="fw-bold mt-3">
                  {sourceFilter === 'server'
                    ? `Belum ada paket ${selectedCategory.toUpperCase()} terbaru dari server`
                    : `Belum ada paket ${selectedCategory.toUpperCase()}`}
                </h5>
                <p className="text-muted mb-0">
                  {sourceFilter === 'server'
                    ? 'Klik Perbarui untuk mengambil daftar paket terbaru.'
                    : 'Coba perbarui paket saat internet tersedia.'}
                </p>
              </div>
            </div>
          ) : null}

          <div className="row g-3">
            {visiblePackages.map((practicePackage) => (
              <div className="col-12 col-md-6" key={practicePackage.id}>
                <article className="card practice-package-card border-0 rounded-4 shadow-sm h-100">
                  <div className="card-body">
                    <button
                      type="button"
                      className="practice-package-open w-100 text-start border-0 bg-transparent p-0"
                      onClick={() => openPackage(practicePackage)}
                    >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-primary-subtle text-primary">
                        {practicePackage.category.toUpperCase()}
                      </span>
                      <i
                        className={`bi ${
                          practicePackage._source === 'device'
                            ? 'bi-phone text-success'
                            : practicePackage._source === 'both'
                              ? 'bi-cloud-check text-primary'
                              : 'bi-cloud text-primary'
                        }`}
                        title={
                          practicePackage._source === 'device'
                            ? 'Tersimpan di perangkat'
                            : practicePackage._source === 'both'
                              ? 'Tersinkron dari server dan tersimpan di perangkat'
                              : 'Tersedia dari server'
                        }
                        aria-label={
                          practicePackage._source === 'device'
                            ? 'Tersimpan di perangkat'
                            : practicePackage._source === 'both'
                              ? 'Tersinkron dari server dan tersimpan di perangkat'
                              : 'Tersedia dari server'
                        }
                      />
                    </div>
                    <h5 className="fw-bold mb-2">{practicePackage.title}</h5>
                    <p className="text-muted small">{practicePackage.description}</p>
                    <div className="small d-flex flex-wrap gap-3">
                      <span><i className="bi bi-list-ol me-1" />{practicePackage.question_count} soal</span>
                      <span><i className="bi bi-flag me-1" />PG {practicePackage.passing_score}</span>
                      <span><i className="bi bi-star me-1" />Maks. {getMaxPracticeScore(practicePackage)}</span>
                    </div>
                    <span className="start-action mt-3">
                      <span>Mulai latihan</span>
                      <i className="bi bi-arrow-right start-action-icon" aria-hidden="true" />
                    </span>
                    </button>
                    {sourceFilter === 'server' ? (
                      <button
                        type="button"
                        className={`btn rounded-pill mt-3 w-100 ${
                          practicePackage._source === 'both' ? 'btn-light border' : 'btn-outline-primary'
                        }`}
                        disabled={practicePackage._source === 'both' || downloadingPackage !== null || !isOnline}
                        onClick={() => downloadPackage(practicePackage)}
                      >
                        {downloadingPackage === packageKey(practicePackage) ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                            Mengunduh...
                          </>
                        ) : practicePackage._source === 'both' ? (
                          <>
                            <i className="bi bi-check-circle me-2" />
                            Sudah diunduh
                          </>
                        ) : (
                          <>
                            <i className="bi bi-download me-2" />
                            Download
                          </>
                        )}
                      </button>
                    ) : null}
                  </div>
                </article>
              </div>
            ))}
          </div>

          <section className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <h5 className="fw-bold mb-0">Riwayat latihan</h5>
                <span className="small text-muted">Disimpan di perangkat · tidak memengaruhi ranking Try Out</span>
              </div>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm rounded-pill"
                onClick={syncProgressNow}
                disabled={!isOnline || isSyncingProgress || !practiceHistory.some((attempt) => !Number(attempt.synced))}
              >
                <i className={`bi ${isSyncingProgress ? 'bi-arrow-repeat' : 'bi-cloud-arrow-up'} me-1`} />
                {isSyncingProgress ? 'Menyinkronkan...' : 'Sinkronkan progres'}
              </button>
            </div>
            {practiceHistory.length ? (
              <div className="card border-0 rounded-4 shadow-sm">
                <div className="list-group list-group-flush rounded-4">
                  {practiceHistory.map((attempt) => (
                    <div
                      className="list-group-item px-3 py-3 d-flex justify-content-between align-items-center"
                      key={attempt.uuid}
                    >
                      <div>
                        <div className="fw-semibold">{attempt.package_title}</div>
                        <div className="small text-muted">
                          {new Date(attempt.completed_at).toLocaleString('id-ID')} · Nilai {attempt.score}/{attempt.max_score}
                        </div>
                      </div>
                      <div className="text-end">
                        <span className={`badge ${Number(attempt.passed) ? 'text-bg-success' : 'text-bg-secondary'}`}>
                          {Number(attempt.passed) ? 'Memenuhi PG' : 'Belum memenuhi PG'}
                        </span>
                        <div className="small text-muted mt-1">
                          {Number(attempt.synced) ? 'Tersinkron' : 'Menunggu sinkron'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card border-0 rounded-4 shadow-sm">
                <div className="card-body text-muted small">Hasil latihan yang selesai akan muncul di sini.</div>
              </div>
            )}
          </section>
        </>
      ) : (
        <PracticeSession
          practicePackage={selectedPackage}
          answers={answers}
          currentQuestion={currentQuestion}
          result={result}
          isSubmitting={isSubmitting}
          onBack={leavePackage}
          onRestart={restartPractice}
          onAnswer={(questionId, optionId) => setAnswers((current) => ({ ...current, [questionId]: optionId }))}
          onQuestionChange={setCurrentQuestion}
          onFinish={finishPractice}
        />
      )}
    </div>
  );
}

function PracticeSession({
  practicePackage,
  answers,
  currentQuestion,
  result,
  isSubmitting,
  onBack,
  onRestart,
  onAnswer,
  onQuestionChange,
  onFinish,
}) {
  const question = practicePackage.questions[currentQuestion];
  const resultByQuestion = new Map((result?.results || []).map((item) => [item.question_id, item]));

  if (result) {
    return (
      <section>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <div className="small text-primary fw-semibold">{practicePackage.category.toUpperCase()}</div>
            <h4 className="fw-bold mb-0">{practicePackage.title}</h4>
          </div>
        </div>
        <PracticeResult result={result} questionCount={practicePackage.questions.length} />
        <div className="practice-result-actions card border-0 rounded-4 shadow-sm mt-3">
          <div className="card-body d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
            <div>
              <h5 className="fw-bold mb-1">Ingin mencoba lagi?</h5>
              <p className="small text-muted mb-0">Mulai ulang paket ini dengan jawaban yang baru.</p>
            </div>
            <div className="d-flex flex-column flex-sm-row gap-2">
              <button
                className="btn btn-primary rounded-pill px-4"
                type="button"
                onClick={onRestart}
              >
                <i className="bi bi-arrow-repeat me-2" />
                Mulai latihan lagi
              </button>
              <button
                className="btn btn-light border rounded-pill px-4"
                type="button"
                onClick={onBack}
              >
                Pilih paket lain
              </button>
            </div>
          </div>
        </div>
        <div className="card border-0 rounded-4 shadow-sm mt-3">
          <div className="card-header bg-white fw-bold">Pembahasan</div>
          <div className="list-group list-group-flush">
            {practicePackage.questions.map((item, index) => {
              const answerResult = resultByQuestion.get(item.id);
              const chosenOption = item.options.find((option) => option.id === answerResult?.option_id);
              const correctOptions = item.options.filter((option) => answerResult?.correct_option_ids.includes(option.id));

              return (
                <div className="list-group-item p-3" key={item.id}>
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div className="fw-semibold">Soal {index + 1}</div>
                    <span className={`badge ${
                      !answerResult?.option_id
                        ? 'text-bg-secondary'
                        : answerResult.is_correct
                          ? 'text-bg-success'
                          : 'text-bg-danger'
                    }`}>
                      {!answerResult?.option_id ? 'Kosong' : answerResult.is_correct ? 'Benar' : 'Salah'}
                    </span>
                  </div>
                  <MathContent content={item.question} className="my-2" />
                  <QuestionImage image={item.image} alt={`Gambar soal ${index + 1}`} />
                  <div className="small">
                    Jawaban Anda: {chosenOption ? `${chosenOption.label}. ${chosenOption.answer}` : 'Tidak dijawab'}
                  </div>
                  {chosenOption?.image ? (
                    <QuestionImage
                      image={chosenOption.image}
                      alt={`Gambar pilihan ${chosenOption.label}`}
                      compact
                    />
                  ) : null}
                  {correctOptions.length ? (
                    <div className="small text-success">
                      Jawaban terbaik:
                      {correctOptions.map((option) => (
                        <div key={option.id}>
                          {option.label}. {option.answer}
                          <QuestionImage
                            image={option.image}
                            alt={`Gambar jawaban ${option.label}`}
                            compact
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <MathContent content={answerResult?.explanation} className="small text-muted mt-1" />
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <button className="btn btn-link p-0 mb-3 text-decoration-none" type="button" onClick={onBack}>
        <i className="bi bi-arrow-left me-1" /> Kembali ke daftar paket
      </button>
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <div className="small text-primary fw-semibold">{practicePackage.category.toUpperCase()}</div>
          <h4 className="fw-bold mb-0">{practicePackage.title}</h4>
        </div>
        <span className="badge text-bg-light">Soal {currentQuestion + 1}/{practicePackage.questions.length}</span>
      </div>

      <div className="card border-0 rounded-4 shadow-sm mb-3">
        <div className="card-body">
          <div className="small text-muted mb-2">Bobot soal: {question.weight}</div>
          <MathContent content={question.question} className="mb-3" />
          <QuestionImage image={question.image} alt={`Gambar soal ${currentQuestion + 1}`} />
          <div className="d-grid gap-2">
            {question.options.map((option) => {
              const selected = answers[question.id] === option.id;
              const optionStyle = selected ? 'btn-primary' : 'btn-light border';

              return (
                <button
                  key={option.id}
                  className={`btn quiz-answer-option text-start rounded-3 ${optionStyle}`}
                  type="button"
                  onClick={() => onAnswer(question.id, option.id)}
                >
                  <span className="me-2">{option.label}.</span>
                  <MathContent content={option.answer} className="d-inline" />
                  <QuestionImage
                    image={option.image}
                    alt={`Gambar pilihan ${option.label}`}
                    compact
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between gap-2">
        <button
          className="btn btn-light border rounded-pill"
          type="button"
          onClick={() => onQuestionChange(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
        >
          <i className="bi bi-arrow-left me-1" /> Sebelumnya
        </button>
        {currentQuestion < practicePackage.questions.length - 1 ? (
          <button
            className="btn btn-primary rounded-pill"
            type="button"
            onClick={() => onQuestionChange(currentQuestion + 1)}
          >
            Berikutnya <i className="bi bi-arrow-right ms-1" />
          </button>
        ) : (
          <button
            className="btn btn-success rounded-pill"
            type="button"
            onClick={onFinish}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Menghitung...' : 'Selesai'}
          </button>
        )}
      </div>
      <section className="mt-4">
        <h6 className="fw-bold mb-2">Daftar soal</h6>
        <div className="d-flex flex-wrap gap-2">
          {practicePackage.questions.map((item, index) => {
            const answered = answers[item.id] !== undefined;

            return (
              <button
                key={item.id}
                type="button"
                className={`btn btn-sm rounded-3 ${
                  currentQuestion === index
                    ? 'btn-primary'
                    : answered
                      ? 'btn-success'
                      : 'btn-light border'
                }`}
                aria-label={`Soal ${index + 1}${answered ? ', sudah dijawab' : ', belum dijawab'}`}
                aria-current={currentQuestion === index ? 'step' : undefined}
                onClick={() => onQuestionChange(index)}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
        <div className="small text-muted mt-2">
          <span className="badge text-bg-success me-1"> </span>Sudah dijawab
          <span className="badge bg-light border ms-3 me-1"> </span>Belum dijawab
        </div>
      </section>
    </>
  );
}

function mergePackages(localPackages, serverPackages) {
  const packagesBySlug = new Map();

  for (const practicePackage of localPackages) {
    packagesBySlug.set(packageKey(practicePackage), { ...practicePackage, _source: 'device' });
  }

  for (const practicePackage of serverPackages) {
    const key = packageKey(practicePackage);
    const cachedPackage = packagesBySlug.get(key);
    packagesBySlug.set(key, {
      ...practicePackage,
      _source: cachedPackage && hasSamePackageContent(cachedPackage, practicePackage) ? 'both' : 'server',
    });
  }

  return [...packagesBySlug.values()];
}

function hasSamePackageContent(first, second) {
  return first.id === second.id
    && first.slug === second.slug
    && first.title === second.title
    && first.description === second.description
    && first.passing_score === second.passing_score
    && first.max_score === second.max_score
    && JSON.stringify(first.questions) === JSON.stringify(second.questions);
}

function packageKey(practicePackage) {
  return practicePackage.slug || String(practicePackage.id);
}

function PracticeResult({ result, questionCount }) {
  const correctCount = result.correct_count ?? result.results.filter((answer) => answer.is_correct).length;
  const wrongCount = result.wrong_count ?? result.results.filter(
    (answer) => answer.option_id !== null && !answer.is_correct,
  ).length;
  const unansweredCount = result.unanswered_count ?? questionCount - correctCount - wrongCount;
  const answeredCount = correctCount + wrongCount;
  const scorePercent = result.max_score > 0 ? (result.score / result.max_score) * 100 : 0;
  const passingPercent = result.max_score > 0 ? (result.passing_score / result.max_score) * 100 : 0;
  const correctPercent = questionCount > 0 ? (correctCount / questionCount) * 100 : 0;
  const wrongPercent = questionCount > 0 ? (wrongCount / questionCount) * 100 : 0;
  const chartBackground = `conic-gradient(#198754 0% ${correctPercent}%, #dc3545 ${correctPercent}% ${correctPercent + wrongPercent}%, #adb5bd ${correctPercent + wrongPercent}% 100%)`;

  return (
    <div className="card border-0 rounded-4 shadow-sm">
      <div className="card-body p-4">
        <div className={`alert ${result.passed ? 'alert-success' : 'alert-warning'} rounded-4`}>
          <h4 className="fw-bold mb-1">{result.passed ? 'Memenuhi PG' : 'Belum memenuhi PG'}</h4>
          <div>PG: {result.passing_score}</div>
        </div>

        <div className="row align-items-center g-4">
          <div className="col-12 col-md-5 d-flex justify-content-center">
            <div
              role="img"
              aria-label={`Grafik jawaban: ${correctCount} benar, ${wrongCount} salah, ${unansweredCount} kosong`}
              style={{
                width: 190,
                height: 190,
                borderRadius: '50%',
                background: chartBackground,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <div className="bg-white rounded-circle d-flex flex-column justify-content-center align-items-center" style={{ width: 132, height: 132 }}>
                <span className="text-muted small">Total skor</span>
                <strong className="fs-3">{result.score}</strong>
                <span className="small text-muted">/{result.max_score}</span>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-7">
            <div className="d-grid gap-2">
              <div className="d-flex justify-content-between">
                <span><i className="bi bi-circle-fill text-success me-2" />Benar</span>
                <strong>{correctCount}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span><i className="bi bi-circle-fill text-danger me-2" />Salah</span>
                <strong>{wrongCount}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span><i className="bi bi-circle-fill text-secondary me-2" />Tidak dijawab</span>
                <strong>{unansweredCount}</strong>
              </div>
              <div className="small text-muted mt-2">
                Dijawab {answeredCount} dari {questionCount} soal
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="d-flex justify-content-between small mb-1">
            <span>Skor</span>
            <span>{result.score}/{result.max_score}</span>
          </div>
          <div
            className="progress position-relative"
            role="img"
            aria-label={`Skor ${result.score} dari ${result.max_score}; PG ${result.passing_score}`}
            style={{ height: 18 }}
          >
            <div
              className={`progress-bar ${result.passed ? 'bg-success' : 'bg-primary'}`}
              style={{ width: `${Math.min(100, Math.max(0, scorePercent))}%` }}
            />
            <span
              className="position-absolute top-0 bottom-0 border-start border-3 border-dark"
              title={`PG ${result.passing_score}`}
              style={{ left: `${Math.min(100, Math.max(0, passingPercent))}%` }}
            />
          </div>
          <div className="small text-muted mt-1">Garis penanda menunjukkan nilai PG.</div>
        </div>
      </div>
    </div>
  );
}

function calculateLocalResult(practicePackage, answers) {
  const results = practicePackage.questions.map((question) => {
    const selectedOption = question.options.find((option) => option.id === answers[question.id]);

    return {
      question_id: question.id,
      option_id: selectedOption?.id ?? null,
      score: selectedOption ? selectedOption.score * question.weight : 0,
      is_correct: selectedOption?.is_correct ?? false,
      explanation: question.explanation,
      correct_option_ids: question.options.filter((option) => option.is_correct).map((option) => option.id),
    };
  });
  const score = results.reduce((total, item) => total + item.score, 0);
  const correctCount = results.filter((item) => item.is_correct).length;
  const unansweredCount = results.filter((item) => item.option_id === null).length;
  const wrongCount = results.length - correctCount - unansweredCount;

  return {
    package_id: practicePackage.id,
    score,
    max_score: getMaxPracticeScore(practicePackage),
    passing_score: practicePackage.passing_score,
    passed: score >= practicePackage.passing_score,
    correct_count: correctCount,
    wrong_count: wrongCount,
    unanswered_count: unansweredCount,
    results,
  };
}

function getMaxPracticeScore(practicePackage) {
  return practicePackage.questions.reduce((total, question) => {
    const highestOptionScore = question.options.reduce(
      (highest, option) => Math.max(highest, Number(option.score) || 0),
      0,
    );

    return total + (Number(question.weight) || 0) * highestOptionScore;
  }, 0);
}
