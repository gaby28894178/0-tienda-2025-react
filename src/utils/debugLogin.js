import { auth, db } from '../config/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Script de diagnóstico para problemas de login
 */
export const debugLogin = async (email, password) => {
  console.log('🔍 INICIANDO DIAGNÓSTICO DE LOGIN');
  console.log('=====================================');
  
  try {
    // 1. Verificar configuración de Firebase
    console.log('1️⃣ Verificando configuración de Firebase...');
    if (!auth) {
      console.error('❌ Firebase Auth no está inicializado');
      return false;
    }
    console.log('✅ Firebase Auth inicializado correctamente');
    
    if (!db) {
      console.error('❌ Firebase Firestore no está inicializado');
      return false;
    }
    console.log('✅ Firebase Firestore inicializado correctamente');
    
    // 2. Verificar si el usuario existe en Firestore
    console.log('2️⃣ Verificando usuario en Firestore...');
    const usersCollection = collection(db, 'users');
    const userQuery = query(usersCollection, where('email', '==', email));
    const userSnapshot = await getDocs(userQuery);
    
    if (userSnapshot.empty) {
      console.warn('⚠️ Usuario no encontrado en Firestore:', email);
      console.log('📝 Usuarios disponibles en Firestore:');
      
      // Listar todos los usuarios
      const allUsersSnapshot = await getDocs(usersCollection);
      allUsersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        console.log(`   👤 ${userData.email} - Rol: ${userData.role}`);
      });
    } else {
      const userData = userSnapshot.docs[0].data();
      console.log('✅ Usuario encontrado en Firestore:');
      console.log('   📧 Email:', userData.email);
      console.log('   👤 Nombre:', userData.displayName);
      console.log('   🏷️ Rol:', userData.role);
      console.log('   📅 Creado:', userData.createdAt);
    }
    
    // 3. Intentar autenticación con Firebase Auth
    console.log('3️⃣ Intentando autenticación con Firebase Auth...');
    console.log('   📧 Email:', email);
    console.log('   🔑 Password:', '*'.repeat(password.length));
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Autenticación exitosa con Firebase Auth');
      console.log('   🆔 UID:', userCredential.user.uid);
      console.log('   📧 Email verificado:', userCredential.user.emailVerified);
      console.log('   📱 Proveedor:', userCredential.user.providerData[0]?.providerId);
      
      return true;
      
    } catch (authError) {
      console.error('❌ Error en autenticación Firebase Auth:');
      console.error('   🔴 Código:', authError.code);
      console.error('   📝 Mensaje:', authError.message);
      
      // Mapear errores comunes
      const errorMessages = {
        'auth/user-not-found': 'El usuario no existe en Firebase Auth',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/invalid-email': 'Formato de email inválido',
        'auth/user-disabled': 'La cuenta de usuario está deshabilitada',
        'auth/too-many-requests': 'Demasiados intentos fallidos',
        'auth/network-request-failed': 'Error de conexión de red',
        'auth/invalid-credential': 'Credenciales inválidas'
      };
      
      const friendlyMessage = errorMessages[authError.code] || 'Error desconocido';
      console.error('   💡 Explicación:', friendlyMessage);
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error general en diagnóstico:', error);
    return false;
  }
};

/**
 * Verifica si los usuarios de prueba existen
 */
export const checkTestUsers = async () => {
  console.log('🔍 VERIFICANDO USUARIOS DE PRUEBA');
  console.log('==================================');
  
  const testUsers = [
    { email: 'admin@demo.com', role: 'admin' },
    { email: 'superadmin@demo.com', role: 'admin' },
    { email: 'cliente@demo.com', role: 'customer' },
    { email: 'usuario@demo.com', role: 'customer' }
  ];
  
  try {
    const usersCollection = collection(db, 'users');
    
    for (const testUser of testUsers) {
      const userQuery = query(usersCollection, where('email', '==', testUser.email));
      const userSnapshot = await getDocs(userQuery);
      
      if (userSnapshot.empty) {
        console.log(`❌ ${testUser.email} - NO EXISTE`);
      } else {
        const userData = userSnapshot.docs[0].data();
        const roleMatch = userData.role === testUser.role;
        console.log(`✅ ${testUser.email} - EXISTE (Rol: ${userData.role}) ${roleMatch ? '✅' : '❌'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error al verificar usuarios de prueba:', error);
  }
};

/**
 * Función para probar login con credenciales específicas
 */
export const testLogin = async () => {
  console.log('🧪 PROBANDO LOGIN CON CREDENCIALES DE PRUEBA');
  console.log('=============================================');
  
  const testCredentials = [
    { email: 'admin@demo.com', password: 'Admin123@demo' },
    { email: 'superadmin@demo.com', password: 'SuperAdmin123@demo' }
  ];
  
  for (const cred of testCredentials) {
    console.log(`\n🔄 Probando: ${cred.email}`);
    const result = await debugLogin(cred.email, cred.password);
    console.log(`Resultado: ${result ? '✅ ÉXITO' : '❌ FALLO'}`);
  }
};

export default { debugLogin, checkTestUsers, testLogin };