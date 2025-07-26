import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile as updateAuthProfile,
} from "firebase/auth";
import {
  auth,
  firebaseOnAuthStateChanged,
  getAuthErrorMessage,
} from "../config/firebaseConfig";
import { User } from "../models/User";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [authError, setAuthError] = useState(null);

  // Función mejorada para cargar el perfil del usuario
  const loadUserProfile = async (user) => {
    try {
      if (!user?.uid) {
        console.error("❌ Usuario no válido para cargar perfil");
        return null;
      }

      // Intentar obtener el perfil existente
      let userModel = await User.getById(user.uid);

      // Si no existe, crear uno nuevo
      if (!userModel) {
        // console.log('⚠️ Creando nuevo perfil para usuario:', user.email);

        try {
          userModel = await User.create({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split("@")[0],
            role: "customer",
            firstName: "",
            lastName: "",
            phone: "",
            address: "",
            favorites: [],
            orders: [],
            createdAt: new Date().toISOString(),
            emailVerified: user.emailVerified || false,
          });
          // console.log('✅ Perfil creado correctamente');
        } catch (createError) {
          console.error("❌ Error al crear perfil:", createError);

          // Crear un perfil básico en memoria si falla la creación en Firestore
          userModel = new User({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split("@")[0],
            role: "customer",
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        // console.log('✅ Perfil cargado correctamente');
      }

      return userModel;
    } catch (error) {
      console.error("❌ Error al cargar perfil:", error);

      // Crear un perfil básico en memoria si falla la carga
      return new User({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split("@")[0],
        role: "customer",
        createdAt: new Date().toISOString(),
      });
    }
  };

  // Efecto mejorado con verificación de inicialización
  useEffect(() => {
    let unsubscribe = () => {};

    const setupAuthListener = async () => {
      try {
        setLoading(true);
        setAuthError(null);

        if (!auth) {
          console.error("❌ Firebase Auth no está inicializado");
          setAuthError("Firebase Auth no está inicializado");
          setLoading(false);
          return;
        }

        // console.log('🔄 Configurando listener de autenticación...');

        unsubscribe = firebaseOnAuthStateChanged(auth, async (user) => {
          // console.log('🔄 Estado de autenticación:', user ? user.email : 'No autenticado');

          try {
            if (user) {
              // console.log('✅ Usuario autenticado:', user.email);

              // Intentar cargar el perfil del usuario
              try {
                const profile = await loadUserProfile(user);

                if (profile) {
                  // console.log('✅ Perfil cargado correctamente:', profile.email);

                  setCurrentUser({
                    ...user,
                    role: profile.role || "customer",
                  });
                  setUserProfile(profile);
                } else {
                  console.error("❌ No se pudo cargar el perfil");

                  // Crear un perfil básico si no se pudo cargar
                  setCurrentUser({
                    ...user,
                    role: "customer",
                  });

                  setUserProfile({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || user.email.split("@")[0],
                    role: "customer",
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.displayName || user.email
                    )}&background=ff6b35&color=fff&size=128`,
                  });
                }
              } catch (profileError) {
                console.error("❌ Error al cargar perfil:", profileError);

                // Crear un perfil básico si no se pudo cargar
                setCurrentUser({
                  ...user,
                  role: "customer",
                });

                setUserProfile({
                  uid: user.uid,
                  email: user.email,
                  displayName: user.displayName || user.email.split("@")[0],
                  role: "customer",
                  avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user.displayName || user.email
                  )}&background=ff6b35&color=fff&size=128`,
                });
              }
            } else {
              setCurrentUser(null);
              setUserProfile(null);
            }

            setAuthError(null);
          } catch (error) {
            console.error("❌ Error en onAuthStateChanged:", error);
            setAuthError(error.message);

            if (user) {
              // Asegurarse de que al menos el currentUser esté establecido
              setCurrentUser(user);

              // Crear un perfil básico en caso de error
              setUserProfile({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email.split("@")[0],
                role: "customer",
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user.displayName || user.email
                )}&background=ff6b35&color=fff&size=128`,
              });
            } else {
              setCurrentUser(null);
              setUserProfile(null);
            }
          } finally {
            setLoading(false);
          }
        });
      } catch (error) {
        console.error(
          "❌ Error al configurar listener de autenticación:",
          error
        );
        setAuthError(error.message);
        setLoading(false);
      }
    };

    setupAuthListener();

    return () => {
      // console.log('🔄 Limpiando listener de autenticación');
      unsubscribe();
    };
  }, []);

  // Función de registro mejorada
  const register = async (email, password, firstName, lastName, role = 'customer') => {
    try {
      setLoading(true);
      setAuthError(null);

      // Validaciones mejoradas
      const errors = validateRegistrationData(
        email,
        password,
        firstName,
        lastName,
        role
      );
      if (errors.length > 0) {
        throw new Error(errors.join(". "));
      }

      // Verificar inicialización de auth
      if (!auth) {
        throw new Error("Error de configuración. Por favor recarga la página.");
      }

      // Crear usuario con email y contraseña
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Actualizar perfil de autenticación
      const displayName = `${firstName} ${lastName}`.trim();
      await updateAuthProfile(user, { displayName });

      // Crear usuario en Firestore usando nuestro modelo
      try {
        console.log('🔄 Creando usuario con rol:', role);
        const userModel = await User.create({
          uid: user.uid,
          email: user.email,
          displayName,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role: role || "customer",
          phone: "",
          address: "",
          favorites: [],
          orders: [],
          createdAt: new Date().toISOString(),
          emailVerified: false,
        });
        console.log('✅ Usuario creado en Firestore con rol:', userModel.role);

        // Actualizar estado local
        setCurrentUser({
          ...user,
          role: role || "customer",
        });
        setUserProfile(userModel);
      } catch (firestoreError) {
        console.error(
          "❌ Error al crear usuario en Firestore:",
          firestoreError
        );

        // Actualizar estado local con datos básicos
        setCurrentUser({
          ...user,
          role: role || "customer",
        });
        setUserProfile({
          uid: user.uid,
          email: user.email,
          displayName,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role: role || "customer",
        });
      }

      return userCredential;
    } catch (error) {
      console.error("❌ Error en registro:", error.code, error.message);
      setAuthError(error.message);

      // Manejo especial para errores de configuración
      if (error.code === "auth/configuration-not-found") {
        console.error("Configuración no encontrada. Verifica firebase.js");
        throw new Error("Error de configuración. Por favor recarga la página.");
      }

      throw new Error(
        getAuthErrorMessage(error.code) || "Error al registrar usuario"
      );
    } finally {
      setLoading(false);
    }
  };

  // Función de login mejorada con manejo de errores específico
  const login = async (email, password) => {
    try {
      setLoading(true);
      setAuthError(null);

      console.log('🔄 Iniciando proceso de login...');
      console.log('📧 Email:', email);
      console.log('🔑 Password length:', password.length);

      // Validaciones básicas
      if (!email || !password) {
        throw new Error("Email y contraseña son requeridos");
      }

      // Verificar inicialización de auth
      if (!auth) {
        console.error('❌ Firebase Auth no inicializado');
        throw new Error("Error de configuración. Por favor recarga la página.");
      }

      console.log('✅ Firebase Auth inicializado correctamente');

      // Autenticación con Firebase
      console.log('🔄 Intentando autenticación con Firebase...');
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      
      console.log('✅ Autenticación exitosa:', userCredential.user.email);

      // Cargar perfil completo usando nuestro modelo
      try {
        const userModel = await User.getById(userCredential.user.uid);

        // Actualizar último login
        if (userModel) {
          await userModel.updateLastLogin();

          // Actualizar estado local
          setCurrentUser({
            ...userCredential.user,
            role: userModel.role || "customer",
          });
          setUserProfile(userModel);
        } else {
          console.warn(
            "⚠️ No se encontró perfil de usuario, creando uno nuevo"
          );

          // Crear un nuevo perfil si no existe
          const newUserModel = await User.create({
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName:
              userCredential.user.displayName ||
              userCredential.user.email.split("@")[0],
            role: "customer",
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          });

          // Actualizar estado local
          setCurrentUser({
            ...userCredential.user,
            role: "customer",
          });
          setUserProfile(newUserModel);
        }
      } catch (profileError) {
        console.error("❌ Error al cargar/crear perfil:", profileError);

        // Actualizar estado local con datos básicos
        setCurrentUser({
          ...userCredential.user,
          role: "customer",
        });
        setUserProfile({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName:
            userCredential.user.displayName ||
            userCredential.user.email.split("@")[0],
          role: "customer",
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
            userCredential.user.displayName || userCredential.user.email
          )}&background=ff6b35&color=fff&size=128`,
        });
      }

      return userCredential;
    } catch (error) {
      console.error("❌ Error en login:", error.code, error.message);
      setAuthError(error.message);

      // Manejo especial para errores de configuración
      if (error.code === "auth/configuration-not-found") {
        console.error("Configuración no encontrada. Verifica firebase.js");
        throw new Error("Error de configuración. Por favor recarga la página.");
      }

      // Mapeo de errores comunes
      const errorMap = {
        "auth/invalid-email": "Email inválido",
        "auth/user-not-found": "Usuario no encontrado",
        "auth/wrong-password": "Contraseña incorrecta",
        "auth/too-many-requests": "Demasiados intentos. Intenta más tarde",
      };

      throw new Error(errorMap[error.code] || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  // Función de logout
  const logout = async () => {
    try {
      setLoading(true);
      setAuthError(null);

      if (!auth) {
        console.warn("Auth no inicializado al intentar logout");
        setCurrentUser(null);
        setUserProfile(null);
        return;
      }

      await signOut(auth);

      setCurrentUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error("❌ Error en logout:", error);
      setAuthError(error.message);

      // Forzar cierre de sesión en el estado local aunque falle en Firebase
      setCurrentUser(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar perfil
  const updateUserProfile = async (updates) => {
    try {
      setLoading(true);
      setAuthError(null);

      if (!currentUser?.uid) {
        throw new Error("No autenticado");
      }

      // Actualizar usando nuestro modelo
      if (userProfile && typeof userProfile.update === "function") {
        try {
          await userProfile.update(updates);
        } catch (updateError) {
          console.error(
            "❌ Error al actualizar perfil en Firestore:",
            updateError
          );
          // Continuar con la actualización local aunque falle en Firestore
        }
      } else {
        console.warn(
          "⚠️ No se puede actualizar el perfil en Firestore, solo se actualizará localmente"
        );
      }

      // Si incluye displayName, actualizar auth
      if (updates.displayName && auth.currentUser) {
        try {
          await updateAuthProfile(auth.currentUser, {
            displayName: updates.displayName,
          });
        } catch (authUpdateError) {
          console.error(
            "❌ Error al actualizar displayName en Auth:",
            authUpdateError
          );
        }
      }

      // Actualizar estado local
      setUserProfile((prev) => ({
        ...prev,
        ...updates,
        updatedAt: new Date().toISOString(),
      }));

      return true;
    } catch (error) {
      console.error("❌ Error al actualizar perfil:", error);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Valor del contexto
  const value = {
    currentUser,
    userProfile,
    loading,
    authError,
    login,
    register,
    logout,
    updateUserProfile,
    isAdmin: () =>
      currentUser?.role === "admin" || userProfile?.role === "admin",
    isCustomer: () =>
      currentUser?.role === "customer" || userProfile?.role === "customer",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Función de validación mejorada
const validateRegistrationData = (email, password, firstName, lastName, role = 'customer') => {
  const errors = [];

  if (!email) errors.push("Email es requerido");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Email inválido");

  // Validación estándar para todas las contraseñas
  const isTestPassword = false;
  if (
    !isTestPassword &&
    !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      password
    )
  ) {
    errors.push(
      "La contraseña debe tener 8+ caracteres, mayúscula, minúscula, número y símbolo"
    );
  }

  if (!firstName) errors.push("Nombre es requerido");
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,30}$/.test(firstName)) {
    errors.push("Nombre solo puede contener letras (2-30 caracteres)");
  }

  if (!lastName) errors.push("Apellido es requerido");
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,30}$/.test(lastName)) {
    errors.push("Apellido solo puede contener letras (2-30 caracteres)");
  }

  // Validar rol
  if (!role || !['customer', 'admin'].includes(role)) {
    errors.push("Rol inválido");
  }

  return errors;
};

export { validateRegistrationData };
