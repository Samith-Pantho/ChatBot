import React from 'react';
import '../styles/Modal.css';

const Modal = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;

  // Determine modal color based on title
  const getModalColor = () => {
    if (title.toLowerCase().includes('error')) return 'border-red-500 bg-red-50';
    if (title.toLowerCase().includes('success')) return 'border-green-500 bg-green-50';
    if (title.toLowerCase().includes('info')) return 'border-blue-500 bg-blue-50';
    return 'border-blue-500 bg-blue-50'; // default
  };

  // Determine text color based on title
  const getTextColor = () => {
    if (title.toLowerCase().includes('error')) return 'text-red-700';
    if (title.toLowerCase().includes('success')) return 'text-green-700';
    if (title.toLowerCase().includes('info')) return 'text-blue-700';
    return 'text-blue-700'; // default
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1002 }}>
      <div className={`modal-container ${getModalColor()}`} style={{ zIndex: 1002 }}>
        <div className={`modal-content ${getTextColor()}`}>
          <div className="modal-close-btn">
            <button 
              onClick={onClose} 
              className={`close-btn ${getTextColor()}`}
            >
              &times;
            </button>
          </div>
          <div className="modal-header">
            <h3 className="modal-title">{title}</h3>
          </div>
          <div className="modal-body">
            {message && message.includes('- ') ? (
              <div className="message-with-bullets">
                {message.split('\n').map((line, index) => {
                  if (line.startsWith('- ')) {
                    return (
                      <div key={index} className="bullet-point">
                        <span className="bullet">•</span>
                        <span className="bullet-text">{line.substring(2)}</span>
                      </div>
                    );
                  } else if (line.trim().length > 0) {
                    return <p key={index} className="message-paragraph">{line}</p>;
                  }
                  return null;
                })}
              </div>
            ) : (
              <p className="message-plain">{message}</p>
            )}
          </div>
          <div className="modal-footer">
            <button 
              onClick={onClose} 
              className={`button button-primary ${
                title.toLowerCase().includes('error') ? 'bg-red-500 hover:bg-red-600' :
                title.toLowerCase().includes('success') ? 'bg-green-500 hover:bg-green-600' :
                title.toLowerCase().includes('info') ? 'bg-blue-500 hover:bg-blue-600' :
                'bg-blue-500 hover:bg-blue-600'
              } text-white transition-colors`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;