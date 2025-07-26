import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged as firebaseOnAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// 🔍 Verifica que las variables de entorno estén cargadas correctamente
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validación mínima para evitar errores comunes
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('undefined')) {
  console.error("❌ Error: Las variables de entorno no están configuradas correctamente.");
  throw new Error("Faltan valores en firebaseConfig. Verificá tu archivo .env y reiniciá el servidor.");
}

console.log("✅ Firebase Config cargada correctamente:");
console.table(firebaseConfig);

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Función para obtener mensajes de error de autenticación
const getAuthErrorMessage = (errorCode) => {
  const errorMap = {
    "auth/invalid-email": "Email inválido",
    "auth/user-not-found": "Usuario no encontrado",
    "auth/wrong-password": "Contraseña incorrecta",
    "auth/email-already-in-use": "Este email ya está registrado",
    "auth/weak-password": "La contraseña es demasiado débil",
    "auth/too-many-requests": "Demasiados intentos fallidos. Intenta más tarde",
    "auth/network-request-failed": "Error de red. Verifica tu conexión",
    "auth/internal-error": "Error interno del servidor",
    "auth/configuration-not-found": "Error de configuración de Firebase. Verifica la configuración del proyecto.",
    "auth/invalid-credential": "Credenciales inválidas. Verifica tu email y contraseña.",
  };

  return errorMap[errorCode] || "Error de autenticación";
};

// Exporta los servicios necesarios
export { auth, db, storage, firebaseOnAuthStateChanged, getAuthErrorMessage };
export default app;