import React from 'react';

const AnswerFeedback = ({ feedback }) => {
  if (!feedback) return null;

  // Generate a fallback banner heading if backend didn't supply an explicit text message
  const headingText = feedback.feedback_message || (feedback.is_correct ? 'Correct Answer!' : 'Incorrect Answer');

  // Extract the letter reference if available
  const correctOptionLetter = feedback.correct_option || feedback.correct_answer;

  return (
    <div className={`alert border-0 ${
      feedback.is_correct === true ? 'alert-success bg-success bg-opacity-10 text-success' : 
      feedback.is_correct === false ? 'alert-danger bg-danger bg-opacity-10 text-danger' : 
      'alert-info bg-info bg-opacity-10 text-info'
    }`} style={{ borderRadius: '12px' }}>
      
      {/* Feedback Message Block */}
      <div className="d-flex align-items-center mb-3">
        <i className={`fas ${
          feedback.is_correct === true ? 'fa-check-circle text-success' : 
          feedback.is_correct === false ? 'fa-times-circle text-danger' : 
          'fa-info-circle text-info'
        } fs-4 me-3`}></i>
        <h5 className="mb-0 fw-bold" style={{ color: 'inherit' }}>{headingText}</h5>
      </div>

      {/* Correct Answer Identifier Row */}
      {correctOptionLetter && (
        <div className="mb-3 p-3 bg-white bg-opacity-50 rounded border border-light text-dark">
          <strong>Correct Option:</strong>
          <span className="badge bg-success ms-2 px-2.5 py-1.5 fs-6 rounded-circle">
            {String(correctOptionLetter).toUpperCase()}
          </span>
        </div>
      )}

      {/* Explanation Text */}
      {feedback.explanation && (
        <div className="mb-3 text-dark">
          <strong className="text-muted d-block mb-1">Explanation:</strong>
          <p className="mb-0 lh-base">{feedback.explanation}</p>
        </div>
      )}

      {/* Documentation / Reference Citations */}
      {feedback.reference && (
        <div className="small text-muted mt-2 border-top pt-2">
          <strong>Reference:</strong> {feedback.reference}
        </div>
      )}
    </div>
  );
};

export default AnswerFeedback;