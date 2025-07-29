import React, { useRef, useEffect } from 'react';

interface LoginRequiredPopupProps {
  isOpen: boolean;
  onClose: () => void;
  setShowLogin: (open: boolean) => void;
}

const LoginRequiredPopup: React.FC<LoginRequiredPopupProps> = ({ isOpen, onClose, setShowLogin }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-white/30"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-required-title"
      aria-describedby="login-required-desc"
    >
      <div
        ref={modalRef}
        className="relative bg-gradient-to-br from-[#4AAAFF] to-white rounded-2xl shadow-2xl max-w-xs w-full text-center p-8"
        style={{backdropFilter: 'blur(16px)'}}
      >
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-[#2196f3] text-xl font-bold focus:outline-none transition-colors"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 id="login-required-title" className="mb-2 text-3xl font-bold text-white">Sign In Required</h2>
        <div id="login-required-desc" className="mb-4 text-sm text-black/50">You must be signed in before you can book a ride or post a ride.</div>
        <button
          className="bg-[#2196f3] text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 w-full mb-2 transition"
          onClick={() => {
            onClose();
            setShowLogin(true);
          }}
        >
          Sign in
        </button>
      </div>
    </div>
  );
};

export default LoginRequiredPopup; 