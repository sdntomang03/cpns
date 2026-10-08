import { useCallback, useEffect, useRef, useState } from 'react';
import MathContent from '../../components/common/MathContent';
import useNotification from '../../components/common/useNotification';
import QuestionImage from '../../components/common/QuestionImage';
import {
  getTryouts,
  getTryoutResult,
  saveTryoutAnswer,
  startTryout,
  submitTryout,
} from '../../api/tryoutApi';

function formatCountdown(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;
  return [hours, minutes, remaining].map((value) => String(value).padStart(2, '0')).join(':');
}

export default function TryoutPage() {
  const { notify, confirm } = useNotification();
  const [tryouts, setTryouts] = useState([]);
  const [selectedTryout, setSelectedTryout] = useState(null);
  const [active, setActive] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(null);
  const [deadline, setDeadline] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const automaticSubmissionStarted = useRef(false);
  const submissionInProgress = useRef(false);
  const manualFinishPending = useRef(false);

  useEffect(() => {
    getTryouts()
      .then((response) => {
        const data = response.data?.data;
        if (!Array.isArray(data)) {
          throw new Error('Data Try Out dari server tidak valid.');
        }
        setTryouts(data);
      })
      .catch((error) => {
        console.error('Failed to load server tryouts', error);
        notify('Try Out gagal dimuat. Periksa koneksi lalu coba lagi.', {
          title: 'Try Out tidak tersedia',
          type: 'error',
        });
      })
      .finally(() => setLoading(false));
  }, [notify]);

  async function beginTryout(tryout) {
    setBusy(true);
    try {
      const response = await startTryout(tryout.id);
      const data = response.data?.data;
      if (
        !data?.attempt_id
        || !Array.isArray(data.tryout?.sections)
        || !Number.isFinite(data.tryout.duration_minutes)
        || data.tryout.duration_minutes <= 0
        || !Number.isFinite(data.remaining_seconds)
        || data.remaining_seconds < 0
        || !Array.isArray(data.answers)
      ) {
        throw new Error('Respons mulai Try Out dari server tidak valid.');
      }
      setActive({ ...data.tryout, tryout_id: tryout.id, attempt_id: data.attempt_id });
      const tryoutDeadline = Date.now() + data.remaining_seconds * 1000;
      setDeadline(tryoutDeadline);
      setRemainingSeconds(data.remaining_seconds);
      automaticSubmissionStarted.current = false;
      submissionInProgress.current = false;
      manualFinishPending.current = false;
      setAnswers(Object.fromEntries(data.answers.map(({ question_id, option_id }) => [question_id, option_id])));
      setTryouts((current) => current.map((item) => (
        item.id === tryout.id ? { ...item, attempt_status: 'in_progress' } : item
      )));
      setSelectedTryout((current) => (
        current?.id === tryout.id ? { ...current, attempt_status: 'in_progress' } : current
      ));
      setResult(null);
      setSectionIndex(0);
      setQuestionIndex(0);
    } catch (error) {
      console.error('Failed to start tryout', error);
      notify(error.response?.data?.message || 'Try Out gagal dimulai. Coba lagi.', {
        title: 'Try Out gagal dimulai',
        type: 'error',
      });
    } finally {
      setBusy(false);
    }
  }

  async function viewTryoutResult(tryout) {
    if (!tryout.attempt_id || busy) {
      return;
    }

    setBusy(true);
    try {
      const response = await getTryoutResult(tryout.attempt_id);
      const data = response.data?.data;
      if (!Array.isArray(data?.sections)) {
        throw new Error('Respons hasil Try Out dari server tidak valid.');
      }
      setActive({ ...tryout, tryout_id: tryout.id, attempt_id: tryout.attempt_id });
      setResult(data);
    } catch (error) {
      console.error('Failed to load completed tryout result', error);
      notify(error.response?.data?.message || 'Hasil Try Out gagal dimuat. Coba lagi.', {
        title: 'Gagal memuat hasil',
        type: 'error',
      });
    } finally {
      setBusy(false);
    }
  }

  async function chooseAnswer(questionId, optionId) {
    if (!active || savingQuestion !== null || remainingSeconds <= 0) {
      return;
    }
    setSavingQuestion(questionId);
    try {
      await saveTryoutAnswer(active.attempt_id, questionId, optionId);
      setAnswers((current) => ({ ...current, [questionId]: optionId }));
    } catch (error) {
      console.error('Failed to save tryout answer', error);
      notify(error.response?.data?.message || 'Jawaban belum tersimpan. Coba pilih lagi.', {
        title: 'Jawaban belum tersimpan',
        type: 'error',
      });
    } finally {
      setSavingQuestion(null);
    }
  }

  const finishTryout = useCallback(async (automatic = false) => {
    if (
      !active
      || busy
      || submissionInProgress.current
      || (automatic && (savingQuestion !== null || manualFinishPending.current))
      || (!automatic && manualFinishPending.current)
    ) {
      return;
    }
    if (!automatic) {
      manualFinishPending.current = true;
      const confirmed = await confirm(
        'Jawaban yang sudah tersimpan akan dinilai. Soal yang belum dijawab mendapat nilai 0.',
        { title: 'Apakah Anda yakin?', confirmText: 'Ya, selesaikan', cancelText: 'Lanjut mengerjakan' },
      );
      manualFinishPending.current = false;
      if (!confirmed || submissionInProgress.current) {
        return;
      }
    }
    submissionInProgress.current = true;
    setBusy(true);
    if (automatic) {
      automaticSubmissionStarted.current = true;
      notify('Waktu Try Out habis. Hasil sedang dihitung...', {
        title: 'Waktu habis',
        type: 'warning',
      });
    }
    try {
      const response = await submitTryout(active.attempt_id);
      const data = response.data?.data;
      if (!Array.isArray(data?.sections)) {
        throw new Error('Respons hasil Try Out dari server tidak valid.');
      }
      setResult(data);
      setDeadline(null);
      setTryouts((current) => current.map((tryout) => (
        tryout.id === active.tryout_id ? { ...tryout, attempt_status: 'completed' } : tryout
      )));
      setSelectedTryout((current) => (
        current?.id === active.tryout_id ? { ...current, attempt_status: 'completed' } : current
      ));
    } catch (error) {
      submissionInProgress.current = false;
      console.error('Failed to submit tryout', error);
      notify(error.response?.data?.message || 'Try Out gagal diselesaikan. Jawaban yang sudah tersimpan tetap aman.', {
        title: 'Try Out gagal diselesaikan',
        type: 'error',
      });
    } finally {
      setBusy(false);
    }
  }, [active, busy, confirm, notify, savingQuestion]);

  useEffect(() => {
    if (!active || !deadline || result) {
      return undefined;
    }

    function updateCountdown() {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemainingSeconds(seconds);
      if (
        seconds === 0
        && !automaticSubmissionStarted.current
        && !submissionInProgress.current
        && !manualFinishPending.current
      ) {
        void finishTryout(true);
      }
    }

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [active, deadline, finishTryout, result]);

  async function leaveTryout() {
    if (active && !result && !(await confirm(
      'Jawaban yang sudah tersimpan tetap aman.',
      { title: 'Keluar dari Try Out?', confirmText: 'Keluar', cancelText: 'Lanjut mengerjakan' },
    ))) {
      return;
    }
    setActive(null);
    setSelectedTryout(null);
    setResult(null);
    setDeadline(null);
    setRemainingSeconds(0);
    setAnswers({});
  }

  if (loading) {
    return (
      <div className="container py-4">
        <div className="card border-0 rounded-4 shadow-sm">
          <div className="card-body placeholder-glow">
            <span className="placeholder col-6 mb-3" />
            <span className="placeholder col-9" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4 pb-5">
      <div className="page-heading d-flex justify-content-between align-items-center mb-3">
        <div>
          <span className="small text-primary fw-semibold text-uppercase">Uji kesiapan</span>
          <h3 className="fw-bold mb-1">Try Out Nasional</h3>
        </div>
        {active ? (
          <button
            type="button"
            className="btn btn-link p-0 text-decoration-none"
            onClick={leaveTryout}
          >
            <i className="bi bi-arrow-left me-1" /> Kembali
          </button>
        ) : selectedTryout ? (
          <button
            type="button"
            className="btn btn-link p-0 text-decoration-none"
            onClick={() => setSelectedTryout(null)}
          >
            <i className="bi bi-arrow-left me-1" /> Daftar Try Out
          </button>
        ) : null}
      </div>

      {result ? (
        <TryoutResult
          result={result}
          tryout={active}
          onBack={() => {
            setActive(null);
            setSelectedTryout(null);
            setResult(null);
            setDeadline(null);
            setAnswers({});
          }}
        />
      ) : active ? (
        <TryoutSession
          tryout={active}
          answers={answers}
          remainingSeconds={remainingSeconds}
          sectionIndex={sectionIndex}
          questionIndex={questionIndex}
          savingQuestion={savingQuestion}
          busy={busy}
          onSectionChange={(index) => {
            setSectionIndex(index);
            setQuestionIndex(0);
          }}
          onQuestionChange={setQuestionIndex}
          onAnswer={chooseAnswer}
          onFinish={finishTryout}
        />
      ) : selectedTryout ? (
        <TryoutDetails
          tryout={selectedTryout}
          busy={busy}
          onStart={() => beginTryout(selectedTryout)}
          onViewResult={() => viewTryoutResult(selectedTryout)}
        />
      ) : tryouts.length ? (
        <div className="row g-3">
          {tryouts.map((tryout) => (
            <div className="col-12" key={tryout.id}>
              <button
                className="card tryout-list-card border-0 rounded-4 shadow-sm w-100 text-start"
                type="button"
                onClick={() => setSelectedTryout(tryout)}
              >
                <div className="card-body p-4 d-flex justify-content-between align-items-center gap-3">
                  <div>
                    <h5 className="fw-bold mb-1">{tryout.title}</h5>
                    <p className="text-muted small mb-2">{tryout.description}</p>
                    <span className="small text-muted">
                      {tryout.sections.reduce((total, section) => total + section.question_count, 0)} soal
                      {' · '}{tryout.sections.length} bagian
                      {' · '}{tryout.duration_minutes} menit
                    </span>
                  </div>
                  <i className="bi bi-chevron-right fs-4 text-primary" aria-label="Lihat detail" />
                </div>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card border-0 rounded-4 shadow-sm">
          <div className="card-body text-center text-muted py-5">
            Belum ada Try Out yang tersedia.
          </div>
        </div>
      )}
    </div>
  );
}

function TryoutDetails({ tryout, busy, onStart, onViewResult }) {
  const alreadyCompleted = tryout.attempt_status === 'completed';

  return (
    <article className="card border-0 rounded-4 shadow-sm">
      <div className="card-body p-4">
        <span className="badge text-bg-primary mb-2">Detail Try Out</span>
        {alreadyCompleted ? (
          <div className="alert alert-success rounded-3 py-2">
            <i className="bi bi-check-circle-fill me-2" />
            Try Out ini sudah pernah dikerjakan.
          </div>
        ) : tryout.attempt_status === 'in_progress' ? (
          <div className="alert alert-primary rounded-3 py-2">
            <i className="bi bi-arrow-repeat me-2" />
            Try Out ini sudah dimulai. Anda dapat melanjutkan pengerjaan.
          </div>
        ) : null}
        <h4 className="fw-bold">{tryout.title}</h4>
        <p className="text-muted">{tryout.description}</p>
        <p className="small text-primary">
          <i className="bi bi-clock me-1" />
          Waktu pengerjaan {tryout.duration_minutes} menit, mengikuti waktu pada perangkat.
        </p>
        <div className="row g-3 mb-4">
          {tryout.sections.map((section) => (
            <div className="col-12 col-md-4" key={section.id}>
              <div className="border rounded-4 p-3 h-100">
                <h5 className="fw-bold">{section.name}</h5>
                <div className="small text-muted">{section.question_count} soal · {section.duration} menit</div>
                <div className="mt-2"><strong>PG:</strong> {section.passing_grade}</div>
              </div>
            </div>
          ))}
        </div>
        {alreadyCompleted ? (
          <button
            className="btn btn-primary rounded-pill px-4"
            type="button"
            disabled={busy || !tryout.attempt_id}
            onClick={onViewResult}
          >
            {busy ? 'Memuat hasil...' : 'Lihat hasil pengerjaan'}
          </button>
        ) : (
          <button
            className="start-action"
            type="button"
            disabled={busy || !tryout.sections.length || tryout.sections.some((section) => !section.question_count)}
            onClick={onStart}
          >
            {busy ? (
              <>
                <span>Memulai...</span>
                <i className="bi bi-arrow-repeat start-action-icon is-spinning" aria-hidden="true" />
              </>
            ) : (
              <>
                <span>{tryout.attempt_status === 'in_progress' ? 'Lanjutkan Try Out' : 'Mulai mengerjakan'}</span>
                <i className="bi bi-arrow-right start-action-icon" aria-hidden="true" />
              </>
            )}
          </button>
        )}
      </div>
    </article>
  );
}

function TryoutSession({
  tryout,
  answers,
  remainingSeconds,
  sectionIndex,
  questionIndex,
  savingQuestion,
  busy,
  onSectionChange,
  onQuestionChange,
  onAnswer,
  onFinish,
}) {
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const section = tryout.sections[sectionIndex];
  const question = section.questions[questionIndex];
  const allQuestions = tryout.sections.flatMap((item, itemSectionIndex) => (
    item.questions.map((itemQuestion, itemQuestionIndex) => ({
      ...itemQuestion,
      section: item,
      sectionIndex: itemSectionIndex,
      questionIndex: itemQuestionIndex,
    }))
  ));
  const answeredCount = allQuestions.filter((item) => answers[item.id] !== undefined).length;
  const timerWarning = remainingSeconds <= 5 * 60;

  useEffect(() => {
    if (!showQuestionModal) {
      return undefined;
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        setShowQuestionModal(false);
      }
    }

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [showQuestionModal]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
        <div>
          <div className="small text-primary fw-semibold">{tryout.title}</div>
          <h4 className="fw-bold mb-0">{section.name}</h4>
        </div>
        <div className="d-flex flex-column align-items-end gap-2">
          <span className={`badge ${timerWarning ? 'text-bg-danger' : 'text-bg-light'}`} aria-live="off">
            <i className="bi bi-clock me-1" />
            {formatCountdown(remainingSeconds)}
          </span>
          <button
            className="btn btn-outline-primary btn-sm rounded-pill text-nowrap"
            type="button"
            onClick={() => setShowQuestionModal(true)}
          >
            <i className="bi bi-grid-3x3-gap me-1" />
            Nomor soal
          </button>
        </div>
      </div>

      <div className="d-flex gap-2 overflow-auto pb-2 mb-3">
        {tryout.sections.map((item, index) => (
          <button
            className={`btn rounded-pill text-nowrap ${index === sectionIndex ? 'btn-primary' : 'btn-light border'}`}
            type="button"
            key={item.id}
            onClick={() => onSectionChange(index)}
          >
            {item.name} <span className="small">{item.questions.length}</span>
          </button>
        ))}
      </div>

      <div className="card border-0 rounded-4 shadow-sm mb-3">
        <div className="card-body p-4">
          <div className="small text-muted mb-2">Bobot soal: {question.weight}</div>
          <MathContent content={question.question} className="mb-3" />
          <QuestionImage image={question.image} alt={`Gambar soal ${questionIndex + 1}`} />
          <div className="d-grid gap-2">
            {question.options.map((option) => (
              <button
                key={option.id}
                className={`btn quiz-answer-option text-start rounded-3 ${
                  answers[question.id] === option.id ? 'btn-primary' : 'btn-light border'
                }`}
                type="button"
                disabled={savingQuestion !== null || remainingSeconds <= 0}
                onClick={() => onAnswer(question.id, option.id)}
              >
                <span className="me-2">{option.label}.</span>
                <MathContent content={option.answer} className="d-inline" />
                <QuestionImage
                  image={option.image}
                  alt={`Gambar pilihan ${option.label}`}
                  compact
                />
                {savingQuestion === question.id && answers[question.id] !== option.id ? (
                  <span className="spinner-border spinner-border-sm ms-2" aria-label="Menyimpan jawaban" />
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between gap-2">
        <button
          className="btn btn-light border rounded-pill"
          type="button"
          disabled={questionIndex === 0}
          onClick={() => onQuestionChange(questionIndex - 1)}
        >
          <i className="bi bi-arrow-left me-1" /> Sebelumnya
        </button>
        {questionIndex < section.questions.length - 1 ? (
          <button
            className="btn btn-primary rounded-pill"
            type="button"
            onClick={() => onQuestionChange(questionIndex + 1)}
          >
            Berikutnya <i className="bi bi-arrow-right ms-1" />
          </button>
        ) : sectionIndex < tryout.sections.length - 1 ? (
          <button
            className="btn btn-primary rounded-pill"
            type="button"
            onClick={() => onSectionChange(sectionIndex + 1)}
          >
            Sesi berikutnya <i className="bi bi-arrow-right ms-1" />
          </button>
        ) : (
          <button
            className="btn btn-success rounded-pill"
            type="button"
            disabled={busy || savingQuestion !== null}
            onClick={() => onFinish()}
          >
            {busy ? 'Menghitung...' : 'Selesai'}
          </button>
        )}
      </div>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <span className="small text-muted">{answeredCount}/{allQuestions.length} terjawab</span>
        <span className="small text-muted">Jawaban tersimpan</span>
      </div>

      {showQuestionModal ? (
        <>
          <div className="modal-backdrop show tryout-number-backdrop" />
          <div
            className="modal d-block tryout-number-modal"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tryout-number-modal-title"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setShowQuestionModal(false);
              }
            }}
          >
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content rounded-4 border-0 shadow">
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title fw-bold" id="tryout-number-modal-title">Daftar nomor soal</h5>
                    <div className="small text-muted">{answeredCount} dari {allQuestions.length} soal terjawab</div>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Tutup daftar nomor soal"
                    onClick={() => setShowQuestionModal(false)}
                  />
                </div>
                <div className="modal-body">
                  <div className="tryout-number-grid mb-4">
                    {allQuestions.map((itemQuestion, index) => {
                      const isCurrent = sectionIndex === itemQuestion.sectionIndex
                        && questionIndex === itemQuestion.questionIndex;
                      const isAnswered = answers[itemQuestion.id] !== undefined;

                      return (
                        <button
                          className={`btn btn-sm rounded-3 ${
                            isCurrent
                              ? 'btn-primary'
                              : isAnswered
                                ? 'btn-success'
                                : 'btn-light border'
                          }`}
                          type="button"
                          key={itemQuestion.id}
                          aria-label={`Soal ${index + 1}, ${itemQuestion.section.name}${isAnswered ? ', sudah dijawab' : ', belum dijawab'}`}
                          aria-pressed={isCurrent}
                          onClick={() => {
                            onSectionChange(itemQuestion.sectionIndex);
                            onQuestionChange(itemQuestion.questionIndex);
                            setShowQuestionModal(false);
                          }}
                        >
                          {index + 1}
                        </button>
                      );
                    })}
                  </div>
                  <div className="d-flex flex-wrap gap-3 small text-muted">
                    <span><i className="bi bi-square-fill text-primary me-1" />Soal aktif</span>
                    <span><i className="bi bi-square-fill text-success me-1" />Sudah dijawab</span>
                    <span><i className="bi bi-square text-secondary me-1" />Belum dijawab</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}

function TryoutResult({ result, tryout, onBack }) {
  const sectionsById = new Map(tryout.sections.map((section) => [section.id, section]));

  return (
    <section>
      <div className={`card border-0 rounded-4 shadow-sm mb-3 ${result.passed ? 'bg-success-subtle' : 'bg-warning-subtle'}`}>
        <div className="card-body p-4 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
          <div>
            <div className={`small fw-semibold text-uppercase ${result.passed ? 'text-success' : 'text-warning-emphasis'}`}>
              Hasil Try Out
            </div>
            <h4 className="fw-bold mb-1">{result.passed ? 'Berhasil — semua sesi tuntas' : 'Belum berhasil'}</h4>
            {!result.passed ? (
              <div className="small text-muted">Nilai pada setiap sesi harus mencapai batas lulusnya.</div>
            ) : null}
          </div>
          <div className="text-sm-end">
            <div className="small text-muted">Nilai total</div>
            <div className={`display-6 fw-bold lh-1 ${result.passed ? 'text-success' : 'text-warning-emphasis'}`}>
              {result.total_score}
              <span className="fs-4 text-muted">/{result.max_score}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 rounded-4 shadow-sm mb-3">
        <div className="card-body p-4">
          <h5 className="fw-bold mb-3">Grafik nilai per bagian</h5>
          <div className="d-grid gap-3">
            {result.sections.map((section) => {
              const percent = section.max_score
                ? Math.min(100, Math.max(0, (section.score / section.max_score) * 100))
                : 0;

              return (
                <div key={section.id}>
                  <div className="d-flex justify-content-between small mb-1">
                    <strong>{section.name}</strong>
                    <span>{section.score}/{section.max_score} · PG {section.passing_grade}</span>
                  </div>
                  <div
                    className="progress"
                    role="img"
                    aria-label={`${section.name}: skor ${section.score} dari ${section.max_score}, PG ${section.passing_grade}`}
                    style={{ height: 16 }}
                  >
                    <div
                      className={`progress-bar ${section.passed ? 'bg-success' : 'bg-danger'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="d-flex justify-content-between border-top pt-3 mt-3">
            <strong>Total nilai</strong>
            <strong>{result.total_score}/{result.max_score}</strong>
          </div>
        </div>
      </div>

      {result.sections.map((section) => {
        return (
          <article className="card border-0 rounded-4 shadow-sm mb-3" key={section.id}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center gap-3">
                <div>
                  <h5 className="fw-bold mb-1">{section.name}</h5>
                  <div className="small text-muted">PG {section.passing_grade} · {section.correct_count}/{section.question_count} benar</div>
                </div>
                <div className="text-end">
                  <strong className="fs-4">{section.score}/{section.max_score}</strong>
                  <div className={`small fw-semibold ${section.passed ? 'text-success' : 'text-danger'}`}>
                    {section.passed ? 'Memenuhi PG' : 'Belum memenuhi PG'}
                  </div>
                </div>
              </div>
              <div className="progress mt-3" role="img" aria-label={`Nilai ${section.name} ${section.score} dari ${section.max_score}`}>
                <div
                  className={`progress-bar ${section.passed ? 'bg-success' : 'bg-primary'}`}
                  style={{ width: `${section.max_score ? Math.min(100, (section.score / section.max_score) * 100) : 0}%` }}
                />
              </div>
              <details className="mt-3">
                <summary className="fw-semibold">Rincian jawaban dan pembahasan</summary>
                <div className="mt-3 d-grid gap-3">
                  {section.results.map((item, index) => {
                    const sourceQuestion = sectionsById.get(section.id)?.questions
                      .find((question) => question.id === item.question_id);
                    const options = item.options || sourceQuestion?.options || [];
                    const chosen = options.find((option) => option.id === item.selected_option_id);
                    const correct = options.filter((option) => item.correct_option_ids.includes(option.id));

                    return (
                      <div className="border rounded-3 p-3" key={item.question_id}>
                        <div className="d-flex justify-content-between gap-2">
                          <strong>Soal {index + 1}</strong>
                          <span className={`badge ${item.is_correct ? 'text-bg-success' : item.selected_option_id ? 'text-bg-danger' : 'text-bg-secondary'}`}>
                            {item.is_correct ? 'Benar' : item.selected_option_id ? 'Salah' : 'Kosong'}
                          </span>
                        </div>
                        <MathContent content={item.question} className="my-2" />
                        <QuestionImage image={item.image || sourceQuestion?.image} alt={`Gambar soal ${index + 1}`} />
                        <div className="small">
                          Jawaban Anda: {chosen ? `${chosen.label}. ${chosen.answer}` : 'Tidak dijawab'}
                        </div>
                        {chosen?.image ? (
                          <QuestionImage image={chosen.image} alt={`Gambar pilihan ${chosen.label}`} compact />
                        ) : null}
                        <div className="small text-success">Jawaban terbaik:</div>
                        {correct.map((option) => (
                          <div key={option.id} className="small text-success">
                            {option.label}. {option.answer}
                            <QuestionImage
                              image={option.image}
                              alt={`Gambar jawaban ${option.label}`}
                              compact
                            />
                          </div>
                        ))}
                        <MathContent content={item.explanation} className="small text-muted mt-1" />
                      </div>
                    );
                  })}
                </div>
              </details>
            </div>
          </article>
        );
      })}
      <button type="button" className="btn btn-outline-primary rounded-pill" onClick={onBack}>
        Kembali ke daftar Try Out
      </button>
    </section>
  );
}
