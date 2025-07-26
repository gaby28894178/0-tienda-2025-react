import { db as firestore } from "../config/firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";

export class User {
  constructor(data) {
    this.uid = data.uid;
    this.email = data.email;
    this.displayName = data.displayName;
    this.firstName = data.firstName || "";
    this.lastName = data.lastName || "";
    this.role = data.role || "customer";
    this.phone = data.phone || "";
    this.address = data.address || "";
    this.favorites = data.favorites || [];
    this.orders = data.orders || [];
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.lastLogin = data.lastLogin;
    this.emailVerified = data.emailVerified || false;
    this.avatar =
      data.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        this.displayName || this.email
      )}&background=ff6b35&color=fff&size=128`;
  }

  static async getById(uid) {
    try {
      if (!uid) {
        console.error(
          "Error: Se intentó obtener un usuario sin proporcionar un UID"
        );
        return null;
      }

      console.log("🔍 Buscando usuario con UID:", uid);
      const userDocRef = doc(firestore, "users", uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        console.log("✅ Usuario encontrado en Firestore");
        return new User({ uid: userDocSnap.id, ...userDocSnap.data() });
      }

      console.log("⚠️ Usuario no encontrado en Firestore, se devolverá null");
      return null;
    } catch (error) {
      console.error("❌ Error al obtener usuario por ID:", error);
      return null; // Devolver null en lugar de lanzar el error
    }
  }

  static async getByEmail(email) {
    try {
      if (!email) {
        console.error(
          "Error: Se intentó obtener un usuario sin proporcionar un email"
        );
        return null;
      }

      const usersCollection = collection(firestore, "users");
      const q = query(usersCollection, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return new User({ uid: userDoc.id, ...userDoc.data() });
      }

      return null;
    } catch (error) {
      console.error("Error al obtener usuario por email:", error);
      return null; // Devolver null en lugar de lanzar el error
    }
  }

  static async getAll() {
    try {
      const usersCollection = collection(firestore, "users");
      const querySnapshot = await getDocs(usersCollection);

      return querySnapshot.docs.map(
        (doc) => new User({ uid: doc.id, ...doc.data() })
      );
    } catch (error) {
      console.error("Error al obtener todos los usuarios:", error);
      return []; // Devolver array vacío en lugar de lanzar el error
    }
  }

  static async create(userData) {
    try {
      // Validar datos
      if (!userData.uid || !userData.email) {
        console.error(
          "Error: UID y email son requeridos para crear un usuario"
        );
        throw new Error("UID y email son requeridos para crear un usuario");
      }

      const userDocRef = doc(firestore, "users", userData.uid);

      // Verificar si ya existe
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        console.log(
          `Usuario con UID ${userData.uid} ya existe, actualizando datos`
        );
        // En lugar de lanzar error, actualizar el usuario existente
        const existingData = userDocSnap.data();
        const updatedData = {
          ...existingData,
          ...userData,
          updatedAt: new Date().toISOString(),
        };

        await updateDoc(userDocRef, updatedData);
        return new User({ uid: userData.uid, ...updatedData });
      }

      // Datos por defecto
      const defaultData = {
        email: userData.email,
        displayName: userData.displayName || userData.email.split("@")[0],
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        role: userData.role || "customer",
        phone: userData.phone || "",
        address: userData.address || "",
        favorites: userData.favorites || [],
        orders: userData.orders || [],
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emailVerified: userData.emailVerified || false,
      };

      console.log("🔄 Datos a guardar en Firestore:", {
        uid: userData.uid,
        email: defaultData.email,
        role: defaultData.role,
        firstName: defaultData.firstName,
        lastName: defaultData.lastName,
      });

      // Crear en Firestore
      await setDoc(userDocRef, defaultData);
      console.log(`✅ Usuario ${userData.email} creado correctamente`);

      // Verificar que se guardó correctamente
      const verifyDoc = await getDoc(userDocRef);
      if (verifyDoc.exists()) {
        const savedData = verifyDoc.data();
        console.log("✅ Verificación - Datos guardados en Firestore:", {
          email: savedData.email,
          role: savedData.role,
          firstName: savedData.firstName,
          lastName: savedData.lastName,
        });
      }

      return new User({ uid: userData.uid, ...defaultData });
    } catch (error) {
      console.error("Error al crear usuario:", error);
      throw error;
    }
  }

  async update(updates) {
    try {
      if (!this.uid) {
        throw new Error("No se puede actualizar un usuario sin UID");
      }

      const userDocRef = doc(firestore, "users", this.uid);

      // Verificar si el usuario existe
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        console.error(
          `Usuario con UID ${this.uid} no existe, no se puede actualizar`
        );
        throw new Error(`Usuario con UID ${this.uid} no existe`);
      }

      // Actualizar en Firestore
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(userDocRef, updatedData);
      console.log(`✅ Usuario ${this.email} actualizado correctamente`);

      // Actualizar instancia local
      Object.assign(this, updates);
      this.updatedAt = new Date().toISOString();

      return this;
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      throw error;
    }
  }

  async addToFavorites(productId) {
    try {
      if (!this.uid) {
        throw new Error("No se puede actualizar favoritos sin UID de usuario");
      }

      // Verificar si ya está en favoritos
      if (this.favorites.includes(productId)) {
        return this; // Ya está en favoritos
      }

      const userDocRef = doc(firestore, "users", this.uid);

      // Actualizar en Firestore
      const newFavorites = [...this.favorites, productId];
      await updateDoc(userDocRef, {
        favorites: newFavorites,
        updatedAt: new Date().toISOString(),
      });
      console.log(`✅ Producto ${productId} añadido a favoritos`);

      // Actualizar instancia local
      this.favorites = newFavorites;
      this.updatedAt = new Date().toISOString();

      return this;
    } catch (error) {
      console.error("Error al añadir a favoritos:", error);
      // No lanzar el error, simplemente devolver la instancia actual
      return this;
    }
  }

  async removeFromFavorites(productId) {
    try {
      if (!this.uid) {
        throw new Error("No se puede actualizar favoritos sin UID de usuario");
      }

      const userDocRef = doc(firestore, "users", this.uid);

      // Actualizar en Firestore
      const newFavorites = this.favorites.filter((id) => id !== productId);
      await updateDoc(userDocRef, {
        favorites: newFavorites,
        updatedAt: new Date().toISOString(),
      });
      console.log(`✅ Producto ${productId} eliminado de favoritos`);

      // Actualizar instancia local
      this.favorites = newFavorites;
      this.updatedAt = new Date().toISOString();

      return this;
    } catch (error) {
      console.error("Error al eliminar de favoritos:", error);
      // No lanzar el error, simplemente devolver la instancia actual
      return this;
    }
  }

  async addOrder(orderId) {
    try {
      if (!this.uid) {
        throw new Error("No se puede actualizar órdenes sin UID de usuario");
      }

      const userDocRef = doc(firestore, "users", this.uid);

      // Actualizar en Firestore
      const newOrders = [...this.orders, orderId];
      await updateDoc(userDocRef, {
        orders: newOrders,
        updatedAt: new Date().toISOString(),
      });
      console.log(`✅ Orden ${orderId} añadida al usuario`);

      // Actualizar instancia local
      this.orders = newOrders;
      this.updatedAt = new Date().toISOString();

      return this;
    } catch (error) {
      console.error("Error al añadir orden:", error);
      // No lanzar el error, simplemente devolver la instancia actual
      return this;
    }
  }

  async updateLastLogin() {
    try {
      if (!this.uid) {
        throw new Error(
          "No se puede actualizar último login sin UID de usuario"
        );
      }

      const userDocRef = doc(firestore, "users", this.uid);
      const lastLogin = new Date().toISOString();

      // Actualizar en Firestore
      await updateDoc(userDocRef, {
        lastLogin,
        updatedAt: new Date().toISOString(),
      });
      console.log(`✅ Último login actualizado para usuario ${this.email}`);

      // Actualizar instancia local
      this.lastLogin = lastLogin;
      this.updatedAt = new Date().toISOString();

      return this;
    } catch (error) {
      console.error("Error al actualizar último login:", error);
      // No lanzar el error, simplemente devolver la instancia actual
      return this;
    }
  }
}
