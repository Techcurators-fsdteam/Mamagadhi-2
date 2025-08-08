import React, { useState } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'warning' | 'danger' | 'info';
  requireTyping?: boolean;
  typingText?: string;
}

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Continue',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning',
  requireTyping = false,
  typingText = 'DELETE'
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requireTyping && inputValue !== typingText) {
      return;
    }
    onConfirm();
  };

  const handleCancel = () => {
    setInputValue('');
    onCancel();
  };

  const isConfirmDisabled = requireTyping && inputValue !== typingText;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: '🚨',
          confirmBg: 'bg-red-600 hover:bg-red-700',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600'
        };
      case 'info':
        return {
          icon: 'ℹ️',
          confirmBg: 'bg-blue-600 hover:bg-blue-700',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600'
        };
      default:
        return {
          icon: '⚠️',
          confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start space-x-3 sm:space-x-4">
          {/* Icon */}
          <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full ${styles.iconBg} flex items-center justify-center`}>
            <span className="text-sm sm:text-lg">{styles.icon}</span>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
              {message}
            </p>
            
            {/* Typing verification field */}
            {requireTyping && (
              <div className="mt-3 sm:mt-4">
                <p className="text-xs sm:text-sm text-gray-700 mb-2">
                  Type <span className="font-mono font-bold text-red-600">{typingText}</span> to confirm:
                </p>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono text-sm sm:text-base"
                  placeholder={typingText}
                  autoFocus
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-6">
          <button
            onClick={handleCancel}
            className="w-full sm:flex-1 bg-gray-200 text-gray-800 px-4 py-2.5 sm:py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm sm:text-base order-2 sm:order-1"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className={`w-full sm:flex-1 ${styles.confirmBg} text-white px-4 py-2.5 sm:py-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base order-1 sm:order-2`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
