import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api, { fetchCSRFToken } from '../../api/client';
import StudyNotesViewer from './StudyNotesViewer';
import SyllabusPicker from './SyllabusPicker';
import PastQuestions from './PastQuestions';
import UpgradeCTA from './UpgradeCTA';

/**
 * Practice Portal - /practice-portal/:examType?subject=<id>&tab=<tab>&year=<yyyy>
 *
 * Four sections per subject:
 *   1. Study Notes         (free, colour-coded notes)
 *   2. Exam Syllabus       (picker by exam body; view / download)
 *   3. Past Questions      (Exam Year Picker)
 *   4. Practice Questions  (free for signed-up students, instant feedback)
 * plus the Main Exam Mode card (timed, by year) behind the Upgrade Plan prompt.
 */

const FALLBACK_BODIES = [
  { slug: 'jssce', display_name: 'JSSCE' },
  { slug: 'waec', display_name: 'WAEC/NECO' },
  { slug: 'jamb', display_name: 'UTME/JAMB' },
  { slug: 'post-utme', display_name: 'Post-UTME' },
];

const TABS = [
  { id: 'notes', label: 'Study Notes', icon: '📖', color: '#059669' },
  { id: 'syllabus', label: 'Exam Syllabus', icon: '📜', color: '#0b7fa8' },
  { id: 'past', label: 'Past Questions', icon: '🗂️', color: '#7c3aed' },
  { id: 'practice', label: 'Practice Questions', icon: '📝', color: '#4400ff' },
];

const redirectToLogin = (navigate) => {
  sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
  navigate('/login');
};

/* ------------------------------------------------------------------ */
/* Practice Questions engine: practice sets for the chosen subject      */
/* ------------------------------------------------------------------ */
const PracticeSets = ({ examType, subject, access }) => {
  const navigate = useNavigate();
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingKey, setStartingKey] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      setLoading(true);
      try {
        const res = await api.get('/api/exams/practice/categories/', {
          params: { exam_category: examType, subject: subject.id },
        });
        if (!cancelled) { setSets(res.data.categories || []); setError(null); }
      } catch {
        if (!cancelled) setError('Could not load practice sets.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [examType, subject.id]);

  const start = async (set) => {
    if (!access?.is_authenticated) { redirectToLogin(navigate); return; }
    const key = set.id ?? `all-${set.subject_id}`;
    setStartingKey(key);
    setError(null);
    try {
      await fetchCSRFToken();
      const body = set.id
        ? { practice_category_id: set.id }
        : { subject_id: set.subject_id, exam_category: examType };
      const res = await api.post('/api/exams/practice/start/', body);
      const params = new URLSearchParams({
        mode: 'practice',
        subject: res.data.subject_name,
        subject_id: String(res.data.subject_id),
        exam_category: res.data.exam_category || examType,
      });
      navigate(`/practice/session/${res.data.session_id}?${params.toString()}`);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) { redirectToLogin(navigate); return; }
      setError(err.response?.data?.error || 'Could not start practice. Please try again.');
      setStartingKey(null);
    }
  };

  if (loading) {
    return <div className="text-center py-5"><span className="spinner-border text-primary"></span></div>;
  }

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div>
          <h5 className="mb-1">Practice {subject.name}</h5>
          <div className="small text-muted">
            <i className="fas fa-unlock me-1 text-success"></i>
            Free for signed-up students · instant feedback & explanations · pair with the Study Notes tab
          </div>
        </div>
      </div>

      {error && <div className="alert alert-warning">{error}</div>}

      {sets.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="fas fa-pencil-alt fa-3x mb-3 d-block"></i>
          <h5 className="text-dark">No practice questions yet</h5>
          <p className="mb-0">Practice sets for {subject.name} will appear here once they are uploaded.</p>
        </div>
      ) : (
        <div className="pp-set-grid">
          {sets.map((set) => {
            const key = set.id ?? `all-${set.subject_id}`;
            return (
              <div key={key} className="pp-set">
                <div className="pp-set__title">{set.name}</div>
                {set.description && <div className="pp-set__desc">{set.description}</div>}
                <div className="d-flex justify-content-between align-items-center mt-auto pt-2">
                  <span className="badge rounded-pill text-bg-light">{set.question_count} questions</span>
                  <button type="button" className="btn btn-sm btn-primary fw-semibold"
                    disabled={startingKey !== null} onClick={() => start(set)}>
                    {startingKey === key
                      ? <><span className="spinner-border spinner-border-sm me-1"></span>Starting…</>
                      : <>Start practice <i className="fas fa-play ms-1"></i></>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {access?.is_authenticated && !access?.main_exam_unlocked && (
        <div className="mt-4">
          <UpgradeCTA variant="banner" title="Ready for the real thing? Unlock Main Exam Mode" />
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Main Exam Mode: Exam Year Picker + start (paid)                      */
/* ------------------------------------------------------------------ */
const MainExamCard = ({ examType, examName, subject, access, initialYear, cardRef }) => {
  const navigate = useNavigate();
  const [years, setYears] = useState([]);
  const [year, setYear] = useState(initialYear || '');
  const [count, setCount] = useState(40);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);
  const [upgrade, setUpgrade] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/api/exams/exam-years/', {
          params: { exam_category: examType, subject: subject?.id },
        });
        if (!cancelled) setYears(res.data.years || []);
      } catch {
        if (!cancelled) setYears([]);
      }
    })();
    return () => { cancelled = true; };
  }, [examType, subject?.id]);

  const locked = access?.is_authenticated && !access?.main_exam_unlocked;

  const start = async () => {
    if (!access?.is_authenticated) { redirectToLogin(navigate); return; }
    if (locked) { setUpgrade({}); return; }
    setStarting(true);
    setError(null);
    try {
      await fetchCSRFToken();
      const res = await api.post('/api/exams/main-exam/start/', {
        subject_id: subject.id, exam_category: examType, year: year || undefined, limit: count,
      });
      const params = new URLSearchParams({
        mode: 'exam',
        subject: res.data.subject_name,
        subject_id: String(res.data.subject_id),
        exam_category: res.data.exam_category || examType,
      });
      navigate(`/practice/session/${res.data.session_id}?${params.toString()}`);
    } catch (err) {
      if (err.response?.status === 402) setUpgrade(err.response.data);
      else if (err.response?.status === 401) redirectToLogin(navigate);
      else setError(err.response?.data?.error || 'Could not start the exam. Please try again.');
      setStarting(false);
    }
  };

  return (
    <div className="pp-main-exam" ref={cardRef} id="main-exam">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
        <div>
          <div className="pp-main-exam__eyebrow">
            <i className="fas fa-stopwatch me-1"></i> Main Exam Mode
            {locked && <span className="badge bg-warning text-dark ms-2"><i className="fas fa-lock me-1"></i>Premium</span>}
            {access?.main_exam_unlocked && <span className="badge bg-success ms-2"><i className="fas fa-check me-1"></i>Unlocked</span>}
          </div>
          <h5 className="mb-1">{examName} {subject?.name} — timed paper</h5>
          <div className="small text-muted">Exam conditions: timer, no hints, full result at the end.</div>
        </div>
      </div>

      <div className="row g-2 align-items-end mt-2">
        <div className="col-sm-4">
          <label htmlFor="me-year" className="form-label small fw-semibold text-muted mb-1">Select year</label>
          <select id="me-year" className="form-select" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">All years (mixed)</option>
            {years.map((y) => (
              <option key={y.year} value={y.year} disabled={y.question_count === 0}>
                {y.year}{y.question_count ? ` · ${y.question_count} questions` : ' · coming soon'}
              </option>
            ))}
          </select>
        </div>
        <div className="col-sm-3">
          <label htmlFor="me-count" className="form-label small fw-semibold text-muted mb-1">Questions</label>
          <select id="me-count" className="form-select" value={count} onChange={(e) => setCount(Number(e.target.value))}>
            {[20, 40, 60, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="col-sm-5">
          <button type="button" className="btn btn-dark w-100 fw-bold" disabled={starting || !subject} onClick={start}>
            {starting ? <><span className="spinner-border spinner-border-sm me-2"></span>Starting…</>
              : locked ? <><i className="fas fa-lock me-2"></i>Unlock Main Exam</>
                : <><i className="fas fa-play me-2"></i>Start Main Exam</>}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-warning mt-3 mb-0">{error}</div>}
      {upgrade && (
        <div className="mt-3">
          <UpgradeCTA plans={upgrade.plans?.length ? upgrade.plans : undefined}
            message={upgrade.error} onClose={() => setUpgrade(null)} />
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
const PracticePortal = () => {
  const navigate = useNavigate();
  const { examType: examParam } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const mainExamRef = useRef(null);

  const examType = examParam || 'jssce';
  const tab = TABS.some((t) => t.id === searchParams.get('tab')) ? searchParams.get('tab') : 'notes';
  const subjectParam = searchParams.get('subject');
  const yearParam = searchParams.get('year') || '';

  const [bodies, setBodies] = useState(FALLBACK_BODIES);
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [access, setAccess] = useState(null);

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '' || v === 'all') next.delete(k); else next.set(k, String(v));
    });
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    (async () => {
      try {
        const res = await api.get('/api/exams/portal/exam-bodies/');
        if (res.data.exam_bodies?.length) setBodies(res.data.exam_bodies);
      } catch { /* keep fallback list */ }
      try {
        const res = await api.get('/api/exams/portal/access/');
        setAccess(res.data);
      } catch {
        setAccess({ is_authenticated: false, main_exam_unlocked: false });
      }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      setSubjectsLoading(true);
      try {
        const res = await api.get('/api/exams/portal/subjects/', { params: { exam_category: examType } });
        if (!cancelled) setSubjects(res.data.subjects || []);
      } catch {
        if (!cancelled) setSubjects([]);
      } finally {
        if (!cancelled) setSubjectsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [examType]);

  // Main Exam deep link from the Exams page (?tab=main-exam&year=2023)
  useEffect(() => {
    if (searchParams.get('tab') === 'main-exam' && mainExamRef.current && !subjectsLoading) {
      mainExamRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchParams, subjectsLoading]);

  const subject = useMemo(() => {
    if (!subjects.length) return null;
    return subjects.find((s) => String(s.id) === String(subjectParam))
      || subjects.find((s) => s.practice_questions || s.has_notes || s.past_questions)
      || subjects[0];
  }, [subjects, subjectParam]);

  const body = bodies.find((b) => b.slug === examType) || { slug: examType, display_name: examType.toUpperCase() };

  const counts = subject ? {
    notes: subject.has_notes ? '✓' : null,
    syllabus: subject.syllabuses || null,
    past: subject.past_questions || null,
    practice: subject.practice_questions || null,
  } : {};

  return (
    <div className="practice-portal">
      <style>{PORTAL_STYLES}</style>

      <section className="pp-hero">
        <div className="pp-wrap">
          <span className="pp-hero__eyebrow">Pass 24/7 · Practice Portal</span>
          <h1 className="pp-hero__title">{body.display_name} Practice Portal</h1>
          <p className="pp-hero__subtitle">
            Study notes, official syllabuses, past questions by year and unlimited practice —
            free for every signed-up student.
          </p>

          <div className="pp-bodies" role="tablist" aria-label="Exam body">
            {bodies.map((b) => (
              <button key={b.slug} type="button" role="tab" aria-selected={b.slug === examType}
                className={`pp-body ${b.slug === examType ? 'active' : ''}`}
                onClick={() => navigate(`/practice-portal/${b.slug}`)}>
                {b.display_name}
              </button>
            ))}
          </div>

          <div className="pp-subject-row">
            <label htmlFor="pp-subject" className="pp-subject-label">Subject</label>
            <select id="pp-subject" className="form-select pp-subject-select" value={subject?.id || ''}
              disabled={subjectsLoading || !subjects.length}
              onChange={(e) => updateParams({ subject: e.target.value })}>
              {subjectsLoading && <option>Loading subjects…</option>}
              {!subjectsLoading && !subjects.length && <option>No subjects yet</option>}
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.practice_questions ? ` · ${s.practice_questions} practice` : ''}
                </option>
              ))}
            </select>
          </div>
          {access && !access.is_authenticated && (
            <div className="pp-signin">
              <i className="fas fa-user-plus me-2"></i>
              <button type="button" className="btn btn-link p-0 text-warning fw-bold" onClick={() => redirectToLogin(navigate)}>Sign in</button>
              {' '}or <button type="button" className="btn btn-link p-0 text-warning fw-bold" onClick={() => navigate('/register')}>create a free account</button>
              {' '}to answer practice questions.
            </div>
          )}
        </div>
      </section>

      <div className="pp-wrap pp-body-area">
        {!subject && !subjectsLoading ? (
          <div className="alert alert-info">
            No subjects are set up for {body.display_name} yet. Please choose another exam body.
          </div>
        ) : subject && (
          <>
            <div className="pp-tabs" role="tablist" aria-label="Practice sections">
              {TABS.map((t) => (
                <button key={t.id} type="button" role="tab" aria-selected={tab === t.id}
                  className={`pp-tab ${tab === t.id ? 'active' : ''}`}
                  style={tab === t.id ? { background: t.color, borderColor: t.color } : undefined}
                  onClick={() => updateParams({ tab: t.id })}>
                  <span aria-hidden="true">{t.icon}</span> {t.label}
                  {counts[t.id] && <span className="pp-tab__count">{counts[t.id]}</span>}
                </button>
              ))}
            </div>

            <div className="pp-panel">
              {tab === 'notes' && (
                <StudyNotesViewer key={subject.id} subjectId={subject.id} subjectName={subject.name} />
              )}
              {tab === 'syllabus' && (
                <SyllabusPicker key={`${examType}-${subject.id}`} examBodies={bodies}
                  examCategory={examType} subjectId={subject.id} subjectName={subject.name} />
              )}
              {tab === 'past' && (
                <PastQuestions key={`${examType}-${subject.id}`} subjectId={subject.id}
                  subjectName={subject.name} examCategory={examType} initialYear={yearParam || 'all'}
                  onYearChange={(y) => updateParams({ year: y })} />
              )}
              {tab === 'practice' && (
                <PracticeSets key={`${examType}-${subject.id}`} examType={examType} subject={subject} access={access} />
              )}
            </div>

            <MainExamCard key={`${examType}-${subject.id}`} examType={examType} examName={body.display_name}
              subject={subject} access={access} initialYear={yearParam} cardRef={mainExamRef} />
          </>
        )}
      </div>
    </div>
  );
};

const PORTAL_STYLES = `
  .practice-portal { background: #f6f5fb; min-height: 80vh; padding-bottom: 3rem; }
  .pp-wrap { max-width: 1100px; margin: 0 auto; padding: 0 1rem; }
  .pp-hero { background: linear-gradient(135deg, #2b00a3 0%, #4400ff 60%, #7c3aed 100%);
    color: #fff; padding: 2.25rem 0 1.75rem; margin-bottom: 1.5rem; }
  .pp-hero__eyebrow { display: inline-block; font-size: .72rem; font-weight: 700; letter-spacing: .16em;
    text-transform: uppercase; padding: .3rem .75rem; border-radius: 999px; background: rgba(255,255,255,.16); }
  .pp-hero__title { color: #fff; font-weight: 800; margin: .75rem 0 .35rem; font-size: clamp(1.6rem, 1.2rem + 1.6vw, 2.4rem); }
  .pp-hero__subtitle { opacity: .9; max-width: 62ch; margin-bottom: 1.1rem; }
  .pp-bodies { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 1rem; }
  .pp-body { border: 1px solid rgba(255,255,255,.35); background: rgba(255,255,255,.08); color: #fff;
    border-radius: 999px; padding: .4rem 1rem; font-weight: 600; font-size: .9rem; }
  .pp-body.active { background: #ffc100; color: #12101a; border-color: #ffc100; }
  .pp-subject-row { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
  .pp-subject-label { font-weight: 700; font-size: .85rem; text-transform: uppercase; letter-spacing: .08em; }
  .pp-subject-select { max-width: 380px; }
  .pp-signin { margin-top: .9rem; font-size: .92rem; opacity: .95; }
  .pp-tabs { display: grid; grid-template-columns: repeat(4, 1fr); gap: .5rem; margin-bottom: 1rem; }
  .pp-tab { display: flex; align-items: center; justify-content: center; gap: .45rem; padding: .8rem .6rem;
    border-radius: 14px; border: 2px solid #e4e1ee; background: #fff; font-weight: 700; color: #2d2a3a; }
  .pp-tab.active { color: #fff; box-shadow: 0 8px 20px rgba(18,16,26,.12); }
  .pp-tab__count { font-size: .7rem; padding: .1rem .45rem; border-radius: 999px; background: rgba(0,0,0,.08); }
  .pp-tab.active .pp-tab__count { background: rgba(255,255,255,.25); }
  .pp-panel { background: #fff; border-radius: 18px; padding: 1.25rem; box-shadow: 0 6px 22px rgba(18,16,26,.05);
    margin-bottom: 1.5rem; }
  .pp-set-grid { display: grid; gap: .9rem; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); }
  .pp-set { display: flex; flex-direction: column; border: 1px solid #e4e1ee; border-left: 4px solid #4400ff;
    border-radius: 14px; padding: 1rem; background: #fff; min-height: 130px; }
  .pp-set__title { font-weight: 700; }
  .pp-set__desc { font-size: .88rem; color: #5b5670; margin-top: .25rem; }
  .pp-main-exam { background: #fff; border-radius: 18px; padding: 1.25rem; border: 2px solid #12101a;
    box-shadow: 0 6px 22px rgba(18,16,26,.06); scroll-margin-top: 90px; }
  .pp-main-exam__eyebrow { font-size: .75rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase;
    color: #4400ff; margin-bottom: .35rem; }
  @media (max-width: 767px) {
    .pp-tabs { grid-template-columns: repeat(2, 1fr); }
    .pp-tab { font-size: .85rem; padding: .65rem .4rem; }
    .pp-panel { padding: .9rem; }
  }
`;

export default PracticePortal;
