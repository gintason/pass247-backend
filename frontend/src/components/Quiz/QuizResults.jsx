import React from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// NOTE ON THIS COMPONENT
//
// This previously called `GET /api/quiz/results/${sessionId}/`, which does not
// exist - quiz/urls_api.py has no `results` route, and the quiz app has no
// session model, so there is nothing to look a sessionId up against. The call
// always 404'd and the component rendered an empty div (its body was only a
// placeholder comment), so the page appeared blank.
//
// Quiz results are produced by `POST /api/quiz/submit-timed/`, which returns
// the full result payload directly. TimedQuiz/UntimedQuiz already render that
// payload inline. This component now renders the same payload when passed via
// router state, e.g.
//
//     navigate('/quiz/results/summary', { state: { results, product } });
//
// If server-side quiz sessions are added later, fetch them here.

const QuizResults = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const results = location.state?.results || null;
  const product = location.state?.product || null;

  if (!results) {
    return (
      <div className="container py-5" style={{ minHeight: '70vh' }}>
        <div className="row justify-content-center">
          <div className="col-md-8 text-center">
            <div className="card border-0 shadow-sm rounded-4 p-5">
              <i className="bi bi-clipboard-x display-1 text-muted mb-3"></i>
              <h3 className="fw-bold mb-2">Results not available</h3>
              <p className="text-muted mb-4">
                Quiz results are shown right after you submit a quiz. This page
                doesn&apos;t have any results to display
                {sessionId ? ` for "${sessionId}"` : ''}.
              </p>
              <div className="d-flex gap-2 justify-content-center flex-wrap">
                <button className="btn btn-primary" onClick={() => navigate('/interview-levels')}>
                  Take a quiz
                </button>
                <Link className="btn btn-outline-secondary" to="/dashboard">
                  Go to dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const percent = Number(results.percent) || 0;

  return (
    <div className="quiz-results container py-5" style={{ minHeight: '70vh' }}>
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <motion.div
            className="card border-0 shadow-sm rounded-4 p-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center mb-4">
              <h2 className="fw-bold mb-1">Quiz Complete</h2>
              {results.time_taken && (
                <p className="text-muted mb-0">Time taken: {results.time_taken}</p>
              )}
            </div>

            <div className="d-flex justify-content-center mb-4">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: 160,
                  height: 160,
                  background: `conic-gradient(#4400ff ${percent * 3.6}deg, #e9ecef 0deg)`,
                }}
              >
                <div
                  className="rounded-circle bg-white d-flex align-items-center justify-content-center"
                  style={{ width: 130, height: 130 }}
                >
                  <span className="h2 fw-bold mb-0">{Math.round(percent)}%</span>
                </div>
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-4">
                <div className="bg-success bg-opacity-10 p-3 rounded-3 text-center">
                  <h5 className="fw-bold text-success mb-0">{results.correct || 0}</h5>
                  <small>Correct</small>
                </div>
              </div>
              <div className="col-4">
                <div className="bg-danger bg-opacity-10 p-3 rounded-3 text-center">
                  <h5 className="fw-bold text-danger mb-0">{results.wrong || 0}</h5>
                  <small>Wrong</small>
                </div>
              </div>
              <div className="col-4">
                <div className="bg-primary bg-opacity-10 p-3 rounded-3 text-center">
                  <h5 className="fw-bold text-primary mb-0">{results.score || 0}</h5>
                  <small>Points</small>
                </div>
              </div>
            </div>

            {Array.isArray(results.answers) && results.answers.length > 0 && (
              <div className="mb-3">
                <h5 className="fw-bold mb-3">Review</h5>
                {results.answers.map((answer) => (
                  <div
                    key={answer.question_id}
                    className={`p-3 mb-2 rounded-3 border ${
                      answer.is_correct
                        ? 'border-success bg-success bg-opacity-10'
                        : 'border-danger bg-danger bg-opacity-10'
                    }`}
                  >
                    <p className="fw-semibold mb-1">{answer.question}</p>
                    <p className="mb-1 small">
                      <strong>Your answer:</strong> {answer.user_answer}
                    </p>
                    {!answer.is_correct && answer.correct_answer && (
                      <p className="mb-0 small">
                        <strong>Correct answer:</strong> {answer.correct_answer}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="d-flex gap-2 justify-content-center flex-wrap">
              <button
                className="btn btn-outline-primary"
                onClick={() => navigate(product?.slug ? `/interview/${product.slug}` : '/interview-levels')}
              >
                Back to quizzes
              </button>
              <Link className="btn btn-primary" to="/dashboard">
                Dashboard
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;
