import React from 'react';

const ProgressBar = ({ current, total }) => {
  const percentage = (current / total) * 100;

  return (
    <div className="progress-container mb-4">
      <div className="d-flex justify-content-between mb-2">
        <span>Question {current} of {total}</span>
        <span>{Math.round(percentage)}% Complete</span>
      </div>
      <div className="progress" style={{ height: '10px' }}>
        <div 
          className="progress-bar progress-bar-striped progress-bar-animated" 
          role="progressbar" 
          style={{ width: `${percentage}%` }}
          aria-valuenow={percentage} 
          aria-valuemin="0" 
          aria-valuemax="100"
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;