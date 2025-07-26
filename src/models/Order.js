import { db as firestore } from "../config/firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";

export class Order {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.userEmail = data.userEmail;
    this.items = data.items || [];
    this.total = data.total || 0;
    this.status = data.status || "pending";
    this.shippingAddress = data.shippingAddress || {};
    this.paymentMethod = data.paymentMethod || {};
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async getById(id) {
    try {
      if (!id) {
        console.error(
          "Error: Se intentó obtener una orden sin proporcionar un ID"
        );
        return null;
      }

      // console.log('🔍 Buscando orden con ID:', id);
      const orderDocRef = doc(firestore, "orders", id);
      const orderDocSnap = await getDoc(orderDocRef);

      if (orderDocSnap.exists()) {
        // console.log('✅ Orden encontrada en Firestore');
        return new Order({ id: orderDocSnap.id, ...orderDocSnap.data() });
      }

      // console.log('⚠️ Orden no encontrada en Firestore');
      return null;
    } catch (error) {
      console.error("❌ Error al obtener orden por ID:", error);
      return null; // Devolver null en lugar de lanzar el error
    }
  }

  static async getByUserId(userId) {
    try {
      if (!userId) {
        console.error(
          "Error: Se intentó obtener órdenes sin proporcionar un userId"
        );
        return [];
      }

      // console.log('🔍 Buscando órdenes para usuario:', userId);
      const ordersCollection = collection(firestore, "orders");

      // Usar consulta simple para evitar problemas de índices
      console.log("🔄 Cargando órdenes con consulta simple...");
      const simpleQuery = query(
        ordersCollection,
        where("userId", "==", userId)
      );
      const simpleSnapshot = await getDocs(simpleQuery);

      // Ordenar manualmente por fecha
      const orders = simpleSnapshot.docs.map(
        (doc) => new Order({ id: doc.id, ...doc.data() })
      );
      const sortedOrders = orders.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA; // Orden descendente (más reciente primero)
      });

      console.log(`✅ ${sortedOrders.length} órdenes cargadas para el usuario`);
      return sortedOrders;
    } catch (error) {
      console.error("❌ Error al obtener órdenes del usuario:", error);
      return []; // Devolver array vacío en lugar de lanzar el error
    }
  }

  static async create(orderData) {
    try {
      // Validar datos
      if (!orderData.userId) {
        console.error("Error: userId es requerido para crear una orden");
        throw new Error("userId es requerido para crear una orden");
      }

      if (!orderData.items || orderData.items.length === 0) {
        console.error("Error: Se intentó crear una orden sin items");
        throw new Error("La orden debe contener al menos un item");
      }

      console.log("🛒 Creando nueva orden para usuario:", orderData.userId);

      // Calcular total si no se proporciona
      if (!orderData.total) {
        orderData.total = orderData.items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      }

      // Datos por defecto
      const orderToCreate = {
        ...orderData,
        status: orderData.status || "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Crear en Firestore
      const ordersCollection = collection(firestore, "orders");
      const docRef = await addDoc(ordersCollection, orderToCreate);
      console.log("✅ Orden creada con ID:", docRef.id);

      return new Order({ id: docRef.id, ...orderToCreate });
    } catch (error) {
      console.error("❌ Error al crear orden:", error);
      throw error;
    }
  }

  async updateStatus(status) {
    try {
      if (!this.id) {
        console.error("Error: No se puede actualizar una orden sin ID");
        throw new Error("ID de orden es requerido para actualizar el estado");
      }

      console.log(
        "🔄 Actualizando estado de orden:",
        this.id,
        "nuevo estado:",
        status
      );

      const orderDocRef = doc(firestore, "orders", this.id);

      // Actualizar en Firestore
      await updateDoc(orderDocRef, {
        status,
        updatedAt: new Date().toISOString(),
      });

      // Actualizar instancia local
      this.status = status;
      this.updatedAt = new Date().toISOString();
      console.log("✅ Estado de orden actualizado correctamente");

      return this;
    } catch (error) {
      console.error("❌ Error al actualizar estado de la orden:", error);
      // No lanzar el error, simplemente devolver la instancia actual
      return this;
    }
  }

  async update(updates) {
    try {
      if (!this.id) {
        console.error("Error: No se puede actualizar una orden sin ID");
        throw new Error("ID de orden es requerido para actualizar");
      }

      console.log("🔄 Actualizando orden:", this.id);

      const orderDocRef = doc(firestore, "orders", this.id);

      // Actualizar en Firestore
      await updateDoc(orderDocRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      // Actualizar instancia local
      Object.assign(this, updates);
      this.updatedAt = new Date().toISOString();
      console.log("✅ Orden actualizada correctamente");

      return this;
    } catch (error) {
      console.error("❌ Error al actualizar orden:", error);
      // No lanzar el error, simplemente devolver la instancia actual
      return this;
    }
  }

  // Funciones para administradores
  static async getAll() {
    try {
      console.log("🔍 Obteniendo todas las órdenes para administrador");
      const ordersCollection = collection(firestore, "orders");

      try {
        const q = query(ordersCollection, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        console.log(
          `✅ Se encontraron ${querySnapshot.docs.length} órdenes totales`
        );

        return querySnapshot.docs.map(
          (doc) => new Order({ id: doc.id, ...doc.data() })
        );
      } catch (queryError) {
        console.error(
          "❌ Error en la consulta de todas las órdenes:",
          queryError
        );

        // Intentar sin el orderBy si hay un error de índice
        if (queryError.code === "failed-precondition") {
          console.log(
            "⚠️ Intentando consulta sin orderBy (posible falta de índice)"
          );
          const simpleSnapshot = await getDocs(ordersCollection);

          // Ordenar manualmente
          const orders = simpleSnapshot.docs.map(
            (doc) => new Order({ id: doc.id, ...doc.data() })
          );
          return orders.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA; // Orden descendente
          });
        }

        throw queryError;
      }
    } catch (error) {
      console.error("❌ Error al obtener todas las órdenes:", error);
      return [];
    }
  }

  static async updateStatus(orderId, newStatus) {
    try {
      if (!orderId) {
        throw new Error("ID de orden es requerido");
      }

      console.log(
        "🔄 Actualizando estado de orden:",
        orderId,
        "nuevo estado:",
        newStatus
      );

      const orderDocRef = doc(firestore, "orders", orderId);

      // Actualizar en Firestore
      await updateDoc(orderDocRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      console.log("✅ Estado de orden actualizado correctamente");
      return true;
    } catch (error) {
      console.error("❌ Error al actualizar estado de la orden:", error);
      throw error;
    }
  }

  static async getByStatus(status) {
    try {
      console.log("🔍 Obteniendo órdenes por estado:", status);
      const ordersCollection = collection(firestore, "orders");

      const q = query(
        ordersCollection,
        where("status", "==", status),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      console.log(
        `✅ Se encontraron ${querySnapshot.docs.length} órdenes con estado ${status}`
      );

      return querySnapshot.docs.map(
        (doc) => new Order({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      console.error("❌ Error al obtener órdenes por estado:", error);
      return [];
    }
  }

  static async getOrdersStats() {
    try {
      const allOrders = await this.getAll();

      const stats = {
        total: allOrders.length,
        pending: allOrders.filter((o) => o.status === "pending").length,
        processing: allOrders.filter((o) => o.status === "processing").length,
        shipped: allOrders.filter((o) => o.status === "shipped").length,
        delivered: allOrders.filter((o) => o.status === "delivered").length,
        cancelled: allOrders.filter((o) => o.status === "cancelled").length,
        totalRevenue: allOrders.reduce(
          (sum, order) => sum + (order.total || 0),
          0
        ),
      };

      console.log("📊 Estadísticas de órdenes:", stats);
      return stats;
    } catch (error) {
      console.error("❌ Error al obtener estadísticas de órdenes:", error);
      return {
        total: 0,
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        totalRevenue: 0,
      };
    }
  }
}
