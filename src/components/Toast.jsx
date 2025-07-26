import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';
import './Toast.css';

let toastId = 0;

const Toast = () => {
  const [toasts, setToasts] = useState([]);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const addToast = (message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    const toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);
    
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
    
    return id;
  };

  // Exponer función globalmente
  useEffect(() => {
    window.showToast = addToast;
    return () => {
      delete window.showToast;
    };
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      case 'warning':
        return <AlertCircle size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="toast-icon">
              {getIcon(toast.type)}
            </div>
            <div className="toast-message">
              {toast.message}
            </div>
            <button
              className="toast-close"
              onClick={() => removeToast(toast.id)}
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Funciones de utilidad
export const showSuccess = (message) => {
  if (window.showToast) {
    window.showToast(message, 'success');
  }
};

export const showError = (message) => {
  if (window.showToast) {
    window.showToast(message, 'error');
  }
};

export const showWarning = (message) => {
  if (window.showToast) {
    window.showToast(message, 'warning');
  }
};

export const showInfo = (message) => {
  if (window.showToast) {
    window.showToast(message, 'info');
  }
};

export default Toast;