import { auth, db } from '../config/firebaseConfig';
import { createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

/**
 * Crea usuarios de prueba AHORA MISMO - sin verificaciones previas
 */
export const createUsersNow = async () => {
  console.log('🚀 CREANDO USUARIOS DE PRUEBA AHORA MISMO');
  console.log('==========================================');
  
  const users = [
    {
      email: 'admin@demo.com',
      password: 'Admin123@demo',
      firstName: 'Admin',
      lastName: 'Demo',
      role: 'admin'
    },
    {
      email: 'cliente@demo.com',
      password: 'Cliente123@demo',
      firstName: 'Cliente',
      lastName: 'Demo',
      role: 'customer'
    }
  ];

  for (const userData of users) {
    try {
      console.log(`\n🔄 Creando: ${userData.email}`);
      
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      
      const user = userCredential.user;
      console.log(`✅ Usuario creado en Auth: ${user.uid}`);
      
      // Actualizar perfil
      await updateProfile(user, {
        displayName: `${userData.firstName} ${userData.lastName}`
      });
      console.log(`✅ Perfil actualizado en Auth`);
      
      // Crear documento en Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: userData.email,
        displayName: `${userData.firstName} ${userData.lastName}`,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        phone: '',
        address: '',
        favorites: [],
        orders: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emailVerified: false
      });
      console.log(`✅ Documento creado en Firestore`);
      
      // Cerrar sesión para no interferir
      await signOut(auth);
      console.log(`✅ Sesión cerrada`);
      
      console.log(`🎯 LISTO: ${userData.email} | ${userData.password} (${userData.role})`);
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️ Usuario ya existe: ${userData.email}`);
      } else {
        console.error(`❌ Error creando ${userData.email}:`, error.code, error.message);
      }
    }
  }
  
  console.log('\n🎯 USUARIOS LISTOS PARA USAR:');
  console.log('📧 admin@demo.com | 🔑 Admin123@demo (ADMIN)');
  console.log('📧 cliente@demo.com | 🔑 Cliente123@demo (CLIENTE)');
  console.log('\n✅ ¡Intenta hacer login ahora!');
};

export default createUsersNow;