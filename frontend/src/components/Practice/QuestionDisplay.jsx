import React, { useEffect } from 'react';

const QuestionDisplay = ({ 
  question, 
  selectedAnswer, 
  onAnswerSelect, 
  showFeedback, 
  feedback,
  disabled 
}) => {

  // ============================================================
  // FUNCTIONS DECLARED BEFORE EFFECTS
  // ============================================================
  const showCelebrationAlert = (message) => {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'celebration-alert';
    alertDiv.innerHTML = `
      <div class="celebration-content">
        <i class="fas fa-trophy"></i>
        <span>${message}</span>
        <i class="fas fa-star"></i>
      </div>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
      alertDiv.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      alertDiv.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(alertDiv);
      }, 300);
    }, 3000);
  };

  // Debug log to trace data structure in your browser's inspect tools console
  useEffect(() => {
    if (showFeedback) {
      console.log('--- QuestionDisplay Debugger ---');
      console.log('User Input Answer:', selectedAnswer);
      console.log('Feedback API Payload Received:', feedback);
      console.log('Detected Correct Key value:', feedback?.correct_option || feedback?.correct_answer);
    }
  }, [showFeedback, feedback, selectedAnswer]);

  // Show celebration alert when answer is correct
  useEffect(() => {
    if (showFeedback && feedback && feedback.is_correct) {
      const points = feedback.points_earned || 25;
      showCelebrationAlert(`🎉 Correct! +${points} points`);
    }
  }, [showFeedback, feedback]);

  if (!question) return null;

  const handleOptionChange = (option) => {
    if (!disabled) {
      onAnswerSelect(option);
    }
  };

  // Safe normalization helper to match target selections cleanly
  const isOptionCorrect = (option) => {
    if (!showFeedback || !feedback) return false;
    
    const backendCorrectKey = feedback.correct_option || feedback.correct_answer || feedback.correct;
    if (!backendCorrectKey) return false;
    
    return String(backendCorrectKey).trim().toUpperCase() === String(option).trim().toUpperCase();
  };

  const isUserSelectedWrong = (option) => {
    if (!showFeedback || !feedback) return false;
    
    const isThisOptionSelected = String(selectedAnswer).trim().toUpperCase() === String(option).trim().toUpperCase();
    return isThisOptionSelected && !feedback.is_correct;
  };

  return (
    <div>
      {/* Question Header Status Badges */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="badge bg-info">
          {question.subject_name} - {question.exam_category_name}
        </span>
        <span className={`badge ${
          question.difficulty === 'EASY' ? 'bg-success' :
          question.difficulty === 'MEDIUM' ? 'bg-warning' : 'bg-danger'
        }`}>
          {question.difficulty}
        </span>
      </div>

      {/* Question Text Formulation */}
      <h5 className="mb-4">{question.question_text}</h5>

      {/* Display Attachment Image if populated */}
      {question.question_image && (
        <div className="text-center mb-4">
          <img 
            src={question.question_image} 
            alt="Question illustration" 
            className="img-fluid rounded"
            style={{ maxHeight: '300px' }}
          />
        </div>
      )}

      {/* Target Multiple Choice Option Grid Loop */}
      {question.question_type === 'OBJECTIVE' && (
        <div className="options-container">
          {['A', 'B', 'C', 'D', 'E'].map(option => {
            const optionText = question[`option_${option.toLowerCase()}`];
            if (!optionText) return null;
            
            const isSelected = String(selectedAnswer).trim().toUpperCase() === String(option).trim().toUpperCase();
            const isCorrect = isOptionCorrect(option);
            const isWrongSelected = isUserSelectedWrong(option);
            
            let optionClasses = 'option-item p-3 mb-2 border rounded';
            let customStyle = {
              cursor: disabled ? 'default' : 'pointer',
              transition: 'all 0.2s ease'
            };
            
            if (!showFeedback) {
              if (isSelected) {
                optionClasses += ' border-primary border-2';
                customStyle.backgroundColor = 'rgba(13, 110, 253, 0.1)'; 
              }
            } else {
              // Active Feedback State Styling Lock rules
              if (isCorrect) {
                optionClasses += ' border-success border-2';
                customStyle.backgroundColor = 'rgba(40, 167, 69, 0.25)';
              } else if (isWrongSelected) {
                optionClasses += ' border-danger border-2';
                customStyle.backgroundColor = 'rgba(220, 53, 69, 0.15)';
              }
            }

            let iconElement = null;
            let textColor = '';
            let circleBgClass = 'bg-light text-dark';
            
            if (showFeedback) {
              if (isCorrect) {
                iconElement = <i className="fas fa-check-circle text-success fs-5"></i>;
                textColor = 'text-success fw-bold';
                circleBgClass = 'bg-success text-white';
              } else if (isWrongSelected) {
                iconElement = <i className="fas fa-times-circle text-danger fs-5"></i>;
                textColor = 'text-danger';
                circleBgClass = 'bg-danger text-white';
              }
            } else if (isSelected) {
              iconElement = <i className="fas fa-circle text-primary fs-6"></i>;
              circleBgClass = 'bg-primary text-white';
            }
            
            return (
              <div 
                key={option}
                className={optionClasses}
                onClick={() => handleOptionChange(option)}
                style={customStyle}
              >
                <div className="d-flex align-items-center">
                  <div className={`option-letter me-3 d-flex align-items-center justify-content-center ${circleBgClass}`} style={{
                    width: '35px',
                    height: '35px',
                    borderRadius: '50%',
                    fontWeight: 'bold',
                    flexShrink: 0,
                    transition: 'all 0.2s ease'
                  }}>
                    {option}
                  </div>
                  <div className={`flex-grow-1 ${textColor}`}>
                    {optionText}
                  </div>
                  {iconElement && (
                    <div className="ms-3">
                      {iconElement}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Theory Input Blocks */}
      {question.question_type === 'THEORY' && (
        <div className="theory-container">
          <textarea
            className="form-control"
            rows="6"
            placeholder="Type your answer here..."
            value={selectedAnswer}
            onChange={(e) => onAnswerSelect(e.target.value)}
            disabled={disabled}
          ></textarea>
          {showFeedback && feedback && (
            <div className={`mt-3 p-3 rounded ${feedback.is_correct ? 'bg-success bg-opacity-25' : 'bg-danger bg-opacity-25'}`}>
              <strong>{feedback.is_correct ? '✓ Correct!' : '✗ Incorrect'}</strong>
              <p className="mb-0 mt-2">{feedback.explanation}</p>
            </div>
          )}
        </div>
      )}

      {/* Popups & Celebration CSS Rule definitions */}
      <style jsx>{`
        .celebration-alert {
          position: fixed;
          top: 20%;
          left: 50%;
          transform: translateX(-50%) translateY(-100px);
          z-index: 9999;
          opacity: 0;
          transition: all 0.3s ease;
        }
        .celebration-alert.show {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        .celebration-content {
          background: linear-gradient(135deg, #28a745, #20c997);
          color: white;
          padding: 16px 32px;
          border-radius: 50px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 1.2rem;
          font-weight: bold;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          animation: pulse 0.5s ease;
        }
        @keyframes pulse {
          0% { transform: scale(0.9); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default QuestionDisplay;