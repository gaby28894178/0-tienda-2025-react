import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './polyfills.js'
import './index.css'
import App from './App.jsx'

// Crear usuario administrador automáticamente
import('./utils/createAdminUser.js').then(() => {
  console.log('✅ Script de usuario administrador ejecutado');
}).catch(error => {
  console.error('❌ Error al ejecutar script de admin:', error);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
