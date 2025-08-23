import React from 'react';
import { FaLightbulb, FaTimes } from 'react-icons/fa';
import './HintModal.css';

const HintModal = ({
  hints = [],
  hintError = null,
  loading = false,
  onClose,
  hintsRemaining = 2
}) => {
  return (
    <div className="hint-modal-overlay" onClick={onClose}>
      <div className="hint-modal" onClick={e => e.stopPropagation()}>
        <div className="hint-modal-header">
          <FaLightbulb style={{ color: '#f7c948', marginRight: 8 }} />
          <span>AI Hint</span>
          <button className="hint-modal-close" onClick={onClose}><FaTimes /></button>
        </div>
        <div className="hint-modal-body">
          {loading && <div className="hint-loading">Getting hint...</div>}
          {hints.map((hint, idx) => (
            <div key={idx} className="hint-item">
              <div className="hint-number">Hint {idx + 1}:</div>
              <div className="hint-text">{hint}</div>
            </div>
          ))}
          {hintError && <div className="hint-error">{hintError}</div>}
        </div>
        <div className="hint-modal-footer">
          <span>{hintsRemaining} hints remaining</span>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default HintModal; 