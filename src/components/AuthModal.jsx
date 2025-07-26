import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Mail, Lock, User, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'customer'
  });

  const { login, register } = useAuth();

  // Regex patterns
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,30}$/;
  
  // Función para validar contraseña con estándares de seguridad
  const validatePassword = (password) => {
    // Validación estándar para todas las contraseñas
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);
    const hasLength = password.length >= 8;
    
    return hasLower && hasUpper && hasNumber && hasSpecial && hasLength;
  };

  useEffect(() => {
    setMode(initialMode);
    resetForm();
  }, [initialMode]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      role: 'customer'
    });
    setValidationErrors({});
    setError('');
    setSuccess('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const validateField = (name, value) => {
    const errors = { ...validationErrors };
    
    switch (name) {
      case 'email':
        if (!value) {
          errors.email = 'El email es requerido';
        } else if (!emailRegex.test(value)) {
          errors.email = 'Formato de email inválido (ejemplo: usuario@dominio.com)';
        } else {
          delete errors.email;
        }
        break;
        
      case 'password':
        if (!value) {
          errors.password = 'La contraseña es requerida';
        } else if (!validatePassword(value)) {
          errors.password = 'Debe tener 8+ caracteres, mayúscula, minúscula, número y símbolo (@$!%*?&)';
        } else {
          delete errors.password;
        }
        
        if (formData.confirmPassword && mode === 'register') {
          if (value !== formData.confirmPassword) {
            errors.confirmPassword = 'Las contraseñas no coinciden';
          } else {
            delete errors.confirmPassword;
          }
        }
        break;
        
      case 'confirmPassword':
        if (mode === 'register') {
          if (!value) {
            errors.confirmPassword = 'Confirma tu contraseña';
          } else if (value !== formData.password) {
            errors.confirmPassword = 'Las contraseñas no coinciden';
          } else {
            delete errors.confirmPassword;
          }
        }
        break;
        
      case 'firstName':
        if (mode === 'register') {
          if (!value) {
            errors.firstName = 'El nombre es requerido';
          } else if (!nameRegex.test(value)) {
            errors.firstName = 'Solo letras y espacios, 2-30 caracteres';
          } else {
            delete errors.firstName;
          }
        }
        break;
        
      case 'lastName':
        if (mode === 'register') {
          if (!value) {
            errors.lastName = 'El apellido es requerido';
          } else if (!nameRegex.test(value)) {
            errors.lastName = 'Solo letras y espacios, 2-30 caracteres';
          } else {
            delete errors.lastName;
          }
        }
        break;
    }
    
    setValidationErrors(errors);
    return !errors[name];
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    validateField(name, value);
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    const fields = ['email', 'password'];
    if (mode === 'register') {
      fields.push('confirmPassword', 'firstName', 'lastName');
    }
    
    let isValid = true;
    fields.forEach(field => {
      if (!validateField(field, formData[field])) {
        isValid = false;
      }
    });
    
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Por favor corrige los errores en el formulario');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
        setSuccess('¡Bienvenido! Iniciando sesión...');
        setTimeout(onClose, 1500);
      } else {
        await register(
          formData.email, 
          formData.password, 
          formData.firstName, 
          formData.lastName,
          formData.role
        );
        setSuccess('¡Cuenta creada exitosamente! Iniciando sesión...');
        setTimeout(onClose, 2000);
      }
    } catch (error) {
      console.error('Error en autenticación:', error);
      setError(error.message || 'Ha ocurrido un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    resetForm();
  };

  const getFieldStatus = (fieldName) => {
    if (!formData[fieldName]) return '';
    return validationErrors[fieldName] ? 'error' : 'success';
  };

  const getPasswordStrength = () => {
    if (!formData.password) return { strength: 0, label: '', color: '' };
    
    const strength = [
      /[a-z]/.test(formData.password), // minúscula
      /[A-Z]/.test(formData.password), // mayúscula
      /\d/.test(formData.password),    // número
      /[@$!%*?&]/.test(formData.password), // símbolo
      formData.password.length >= 8    // longitud
    ].filter(Boolean).length;
    
    const levels = [
      { strength: 0, label: '', color: '' },
      { strength: 1, label: 'Muy débil', color: '#ff4444' },
      { strength: 2, label: 'Débil', color: '#ff8800' },
      { strength: 3, label: 'Regular', color: '#ffaa00' },
      { strength: 4, label: 'Fuerte', color: '#88cc00' },
      { strength: 5, label: 'Muy fuerte', color: '#44cc44' }
    ];
    
    return levels[strength];
  };

  // Función para manejar el clic en el overlay
  const handleOverlayClick = (e) => {
    // Solo cerrar si el clic fue directamente en el overlay, no en sus hijos
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Función para prevenir la propagación de eventos en el contenido del modal
  const handleModalContentClick = (e) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="auth-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleOverlayClick}
      >
        <motion.div
          className="auth-modal-content"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={handleModalContentClick}
        >
          <button className="auth-modal-close" onClick={onClose}>
            <X size={24} />
          </button>

          <div className="auth-modal-header">
            <h2>{mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>
            <p>
              {mode === 'login' 
                ? 'Accede a tu cuenta para continuar' 
                : 'Únete a nuestra comunidad'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">Nombre *</label>
                  <div className={`input-container ${getFieldStatus('firstName')}`}>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Tu nombre"
                      required
                      disabled={loading}
                    />
                    <User size={18} className="input-icon" />
                    {getFieldStatus('firstName') === 'success' && (
                      <CheckCircle size={18} className="status-icon success" />
                    )}
                    {getFieldStatus('firstName') === 'error' && (
                      <AlertCircle size={18} className="status-icon error" />
                    )}
                  </div>
                  {validationErrors.firstName && (
                    <span className="field-error">
                      <AlertCircle size={14} />
                      {validationErrors.firstName}
                    </span>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="lastName">Apellido *</label>
                  <div className={`input-container ${getFieldStatus('lastName')}`}>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Tu apellido"
                      required
                      disabled={loading}
                    />
                    <User size={18} className="input-icon" />
                    {getFieldStatus('lastName') === 'success' && (
                      <CheckCircle size={18} className="status-icon success" />
                    )}
                    {getFieldStatus('lastName') === 'error' && (
                      <AlertCircle size={18} className="status-icon error" />
                    )}
                  </div>
                  {validationErrors.lastName && (
                    <span className="field-error">
                      <AlertCircle size={14} />
                      {validationErrors.lastName}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <div className={`input-container ${getFieldStatus('email')}`}>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="tu@email.com"
                  required
                  disabled={loading}
                />
                <Mail size={18} className="input-icon" />
                {getFieldStatus('email') === 'success' && (
                  <CheckCircle size={18} className="status-icon success" />
                )}
                {getFieldStatus('email') === 'error' && (
                  <AlertCircle size={18} className="status-icon error" />
                )}
              </div>
              {validationErrors.email && (
                <span className="field-error">
                  <AlertCircle size={14} />
                  {validationErrors.email}
                </span>
              )}
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="role">Tipo de Usuario *</label>
                <div className="input-container">
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className="role-select"
                  >
                    <option value="customer">Cliente</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <User size={18} className="input-icon" />
                </div>
                <div className="role-description">
                  {formData.role === 'customer' ? (
                    <small>Como cliente podrás comprar productos, gestionar tu carrito y ver tu historial de pedidos.</small>
                  ) : (
                    <small>Como administrador podrás gestionar productos, ver todos los pedidos y administrar usuarios.</small>
                  )}
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password">
                Contraseña *
                {mode === 'register' && (
                  <span className="password-hint">
                    (8+ caracteres, mayúscula, minúscula, número, símbolo)
                  </span>
                )}
              </label>
              <div className={`input-container password-field ${getFieldStatus('password')}`}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Tu contraseña"
                  required
                  disabled={loading}
                />
                <Lock size={18} className="input-icon" />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPassword(!showPassword);
                  }}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {getFieldStatus('password') === 'success' && (
                  <CheckCircle size={18} className="status-icon success" />
                )}
                {getFieldStatus('password') === 'error' && (
                  <AlertCircle size={18} className="status-icon error" />
                )}
              </div>
              
              {mode === 'register' && formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill" 
                      style={{ 
                        width: `${(getPasswordStrength().strength / 5) * 100}%`,
                        backgroundColor: getPasswordStrength().color
                      }}
                    ></div>
                  </div>
                  <span 
                    className="strength-label"
                    style={{ color: getPasswordStrength().color }}
                  >
                    {getPasswordStrength().label}
                  </span>
                </div>
              )}
              
              {validationErrors.password && (
                <span className="field-error">
                  <AlertCircle size={14} />
                  {validationErrors.password}
                </span>
              )}
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmar Contraseña *</label>
                <div className={`input-container password-field ${getFieldStatus('confirmPassword')}`}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirma tu contraseña"
                    required
                    disabled={loading}
                  />
                  <Lock size={18} className="input-icon" />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowConfirmPassword(!showConfirmPassword);
                    }}
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  {getFieldStatus('confirmPassword') === 'success' && (
                    <CheckCircle size={18} className="status-icon success" />
                  )}
                  {getFieldStatus('confirmPassword') === 'error' && (
                    <AlertCircle size={18} className="status-icon error" />
                  )}
                </div>
                {validationErrors.confirmPassword && (
                  <span className="field-error">
                    <AlertCircle size={14} />
                    {validationErrors.confirmPassword}
                  </span>
                )}
              </div>
            )}

            {error && (
              <div className="error-message">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {success && (
              <div className="success-message">
                <CheckCircle size={18} />
                {success}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading || Object.keys(validationErrors).length > 0}
            >
              {loading && <Loader size={18} className="spinner" />}
              {loading 
                ? (mode === 'login' ? 'Iniciando sesión...' : 'Creando cuenta...') 
                : (mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta')
              }
            </button>

            {/* Botón temporal de prueba para verificar roles */}
            {mode === 'register' && (
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <small style={{ color: '#888', display: 'block', marginBottom: '0.5rem' }}>
                  Prueba de roles - Revisa la consola después de registrarte
                </small>
                <button
                  type="button"
                  onClick={() => {
                    console.log('🔍 DATOS DEL FORMULARIO:');
                    console.log('Email:', formData.email);
                    console.log('Rol seleccionado:', formData.role);
                    console.log('Nombre:', formData.firstName);
                    console.log('Apellido:', formData.lastName);
                  }}
                  style={{
                    background: 'rgba(255, 107, 53, 0.1)',
                    border: '1px solid rgba(255, 107, 53, 0.3)',
                    color: '#ff6b35',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  🔍 Verificar datos del formulario
                </button>
              </div>
            )}
          </form>

          <div className="auth-switch">
            <p>
              {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
              <button 
                type="button" 
                onClick={switchMode} 
                className="switch-btn"
                disabled={loading}
              >
                {mode === 'login' ? 'Regístrate' : 'Inicia Sesión'}
              </button>
            </p>
          </div>




        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;