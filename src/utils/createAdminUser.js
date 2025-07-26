import { auth, db } from '../config/firebaseConfig';
import { createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

/**
 * Crea un usuario administrador específico
 */
export const createAdminUser = async () => {
  const adminData = {
    email: 'admin@tienda.com',
    password: 'AdminTienda123@',
    firstName: 'Administrador',
    lastName: 'Principal',
    role: 'admin'
  };

  try {
    console.log('🔧 Creando usuario administrador...');
    
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      adminData.email,
      adminData.password
    );
    
    const user = userCredential.user;
    console.log(`✅ Usuario creado en Auth: ${adminData.email} (UID: ${user.uid})`);
    
    // Actualizar perfil en Auth
    await updateProfile(user, {
      displayName: `${adminData.firstName} ${adminData.lastName}`
    });
    
    // Crear documento en Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: adminData.email,
      displayName: `${adminData.firstName} ${adminData.lastName}`,
      firstName: adminData.firstName,
      lastName: adminData.lastName,
      role: 'admin',
      phone: '+1-555-ADMIN',
      address: 'Oficina Principal, Calle Administración 123',
      favorites: [],
      orders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerified: false
    });
    
    console.log(`✅ Perfil creado en Firestore: ${adminData.email}`);
    
    // Cerrar sesión para no interferir
    await signOut(auth);
    
    console.log('🎯 USUARIO ADMINISTRADOR CREADO:');
    console.log(`📧 Email: ${adminData.email}`);
    console.log(`🔑 Contraseña: ${adminData.password}`);
    console.log('👑 Rol: Administrador');
    console.log('');
    console.log('✅ Puedes hacer login con estas credenciales');
    
    return true;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('⚠️ El usuario administrador ya existe');
      console.log('📧 Email: admin@tienda.com');
      console.log('🔑 Contraseña: AdminTienda123@');
      return true;
    } else {
      console.error('❌ Error al crear usuario administrador:', error);
      return false;
    }
  }
};

// Ejecutar automáticamente al importar
createAdminUser();

export default createAdminUser;