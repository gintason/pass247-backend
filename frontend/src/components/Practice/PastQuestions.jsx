import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import LockedContent from './LockedContent';

/**
 * Past Questions engine with an Exam Year Picker.
 *
 * The year list comes from the backend (`available_years` = every year that
 * has questions for this subject/exam body), and the chosen year is filtered
 * on the server, so a year never "disappears" because its questions were not
 * on the first page.
 */
const QUESTIONS_PER_PAGE = 10;

const PastQuestions = ({ subjectName, subjectId, examCategory, initialYear = 'all', onYearChange }) => {
  const invalidId = !subjectId || subjectId === 'null' || subjectId === 'undefined';

  const [year, setYear] = useState(initialYear ? String(initialYear) : 'all');
  const [data, setData] = useState(null);
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(!invalidId);
  const [error, setError] = useState(invalidId ? 'Subject ID not available' : null);
  const [locked, setLocked] = useState(false); // 402: subscribers only
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [feedbackByQuestion, setFeedbackByQuestion] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (invalidId) return undefined;
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      setLoading(true);
      try {
        const params = { exam_category: examCategory || '' };
        if (year !== 'all') params.year = year;
        const response = await api.get(`/api/exams/past-questions/${subjectId}/`, { params });
        if (cancelled) return;
        setData(response.data);
        // Keep the full year list even while one year is selected.
        if (Array.isArray(response.data.available_years)) setYears(response.data.available_years);
        setError(null);
      } catch (err) {
        console.error('Error fetching past questions:', err);
        if (!cancelled) {
          if (err.response?.status === 402) setLocked(true);
          else setError('Failed to load past questions');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [invalidId, subjectId, examCategory, year, reloadKey]);

  const changeYear = (value) => {
    setYear(value);
    setCurrentPage(1);
    setSelectedAnswers({});
    setFeedbackByQuestion({});
    if (onYearChange) onYearChange(value);
  };

  const handleCheckAnswer = (question) => {
    const chosen = selectedAnswers[question.id];
    if (!chosen) return;
    setFeedbackByQuestion((prev) => ({
      ...prev,
      [question.id]: {
        is_correct: question.correct_answer?.toUpperCase() === chosen.toUpperCase(),
        correct_answer: question.correct_answer,
      },
    }));
  };

  const questions = data?.questions || [];
  const totalPages = Math.max(1, Math.ceil(questions.length / QUESTIONS_PER_PAGE));
  const pageQuestions = questions.slice(
    (currentPage - 1) * QUESTIONS_PER_PAGE, currentPage * QUESTIONS_PER_PAGE);

  const yearPicker = (
    <div className="d-flex align-items-center gap-2">
      <label htmlFor="pq-year" className="small fw-semibold text-muted mb-0">
        <i className="fas fa-calendar-alt me-1"></i>Exam year
      </label>
      <select id="pq-year" className="form-select form-select-sm" style={{ width: 'auto', minWidth: '140px', borderColor: '#6f42c1' }}
        value={year} onChange={(e) => changeYear(e.target.value)} disabled={loading && !data}>
        <option value="all">All years</option>
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
        {year !== 'all' && !years.includes(Number(year)) && <option value={year}>{year}</option>}
      </select>
    </div>
  );

  if (invalidId) {
    return (
      <div className="text-center py-5">
        <i className="fas fa-history fa-3x text-muted mb-3"></i>
        <h5>Past Questions Unavailable</h5>
        <p className="text-muted">Please choose a subject first.</p>
      </div>
    );
  }

  if (locked) {
    return (
      <LockedContent
        title="Past Questions are for subscribers"
        message={`Subscribe to practise every past ${subjectName || ''} paper by year, with answers and explanations.`} />
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <i className="fas fa-history fa-3x text-muted mb-3"></i>
        <h5>Past Questions Unavailable</h5>
        <p className="text-muted">Past questions for {subjectName || 'this subject'} could not be loaded.</p>
        <button className="btn btn-sm mt-2" style={{ color: '#6f42c1', borderColor: '#6f42c1' }}
          onClick={() => setReloadKey((k) => k + 1)}>
          <i className="fas fa-redo me-1"></i> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="past-questions-container">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <h5 className="mb-0" style={{ color: '#4b2e83' }}>
          <i className="fas fa-history me-2"></i>
          {loading ? 'Loading…' : `${data?.total_questions ?? questions.length} Past Question${(data?.total_questions ?? questions.length) !== 1 ? 's' : ''}`}
          {subjectName ? ` — ${subjectName}` : ''}
          {year !== 'all' ? ` (${year})` : ''}
        </h5>
        {yearPicker}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status" style={{ color: '#6f42c1' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-5">
          <i className="fas fa-history fa-3x text-muted mb-3"></i>
          <h5>No Past Questions {year !== 'all' ? `for ${year}` : 'Available'}</h5>
          <p className="text-muted">
            {year !== 'all'
              ? 'Try another year from the picker above.'
              : `Past questions for ${subjectName || 'this subject'} are not yet available.`}
          </p>
        </div>
      ) : (
        <>
          {data?.returned_questions < data?.total_questions && (
            <div className="alert alert-info py-2 small">
              Showing the latest {data.returned_questions} of {data.total_questions}. Pick a year to see a full paper.
            </div>
          )}
          {pageQuestions.map((question, idx) => {
            const chosen = selectedAnswers[question.id];
            const fb = feedbackByQuestion[question.id];
            const options = [
              ['A', question.option_a], ['B', question.option_b], ['C', question.option_c],
              ['D', question.option_d], ['E', question.option_e],
            ].filter(([, text]) => text);

            return (
              <div key={question.id} className="card border-0 shadow-sm mb-3 rounded-3">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge rounded-pill" style={{ backgroundColor: '#ede9fe', color: '#6f42c1' }}>
                      Question {(currentPage - 1) * QUESTIONS_PER_PAGE + idx + 1}
                    </span>
                    {question.year && <span className="text-muted small">{question.exam_category_name} {question.year}</span>}
                  </div>

                  <p className="fw-semibold mb-3" style={{ whiteSpace: 'pre-line' }}>{question.question_text}</p>

                  <div className="d-flex flex-column gap-2 mb-3">
                    {options.map(([letter, text]) => {
                      const isSelected = chosen === letter;
                      let btnClass = 'btn text-start ';
                      if (fb && letter === fb.correct_answer) btnClass += 'btn-success';
                      else if (fb && isSelected && !fb.is_correct) btnClass += 'btn-outline-danger';
                      else btnClass += 'btn-outline-secondary';
                      return (
                        <button key={letter} type="button" className={btnClass}
                          style={isSelected && !fb ? { borderColor: '#6f42c1', color: '#6f42c1' } : {}}
                          disabled={!!fb}
                          onClick={() => setSelectedAnswers((prev) => ({ ...prev, [question.id]: letter }))}>
                          <strong>{letter}.</strong> {text}
                        </button>
                      );
                    })}
                  </div>

                  {!fb ? (
                    <button className="btn btn-sm" style={{ backgroundColor: '#6f42c1', color: '#fff' }}
                      disabled={!chosen} onClick={() => handleCheckAnswer(question)}>
                      Check Answer
                    </button>
                  ) : (
                    <div className={`alert ${fb.is_correct ? 'alert-success' : 'alert-danger'} mb-0`}>
                      <strong>{fb.is_correct ? 'Correct!' : 'Not quite.'}</strong>
                      {!fb.is_correct && <> The correct answer is <strong>{fb.correct_answer}</strong>.</>}
                      {question.explanation && <p className="mb-0 mt-2 small">{question.explanation}</p>}
                    </div>
                  )}

                  {question.reference && <p className="text-muted small mt-2 mb-0">Source: {question.reference}</p>}
                </div>
              </div>
            );
          })}

          {totalPages > 1 && (
            <div className="d-flex justify-content-center align-items-center gap-3 mt-3">
              <button className="btn btn-sm btn-outline-secondary" disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                <i className="fas fa-chevron-left"></i> Previous
              </button>
              <span className="text-muted small">Page {currentPage} of {totalPages}</span>
              <button className="btn btn-sm btn-outline-secondary" disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                Next <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PastQuestions;
