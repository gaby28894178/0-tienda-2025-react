import { db as firestore } from '../config/firebaseConfig';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';

export class Cart {
  constructor(data) {
    this.userId = data.userId;
    this.items = data.items || [];
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async getByUserId(userId) {
    try {
      if (!userId) {
        console.error('Error: Se intentó obtener un carrito sin proporcionar un userId');
        throw new Error('userId es requerido para obtener un carrito');
      }

      console.log('🔍 Buscando carrito para usuario:', userId);
      const cartDocRef = doc(firestore, 'carts', userId);
      const cartDocSnap = await getDoc(cartDocRef);
      
      if (cartDocSnap.exists()) {
        // console.log('✅ Carrito encontrado en Firestore');
        return new Cart(cartDocSnap.data());
      }
      
      // Si no existe, crear un carrito vacío
      // console.log('⚠️ Carrito no encontrado, creando uno nuevo'); 
      const newCart = {
        userId,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(cartDocRef, newCart);
      console.log('✅ Nuevo carrito creado para usuario:', userId);
      return new Cart(newCart);
    } catch (error) {
      console.error('❌ Error al obtener carrito:', error);
      // En caso de error, devolver un carrito vacío en memoria
      return new Cart({
        userId: userId || 'unknown',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }

  async addItem(product, quantity = 1) {
    try {
      if (!this.userId) {
        console.error('Error: No se puede añadir un item sin userId en el carrito');
        throw new Error('userId es requerido para añadir items al carrito');
      }

      if (!product || !product.id) {
        console.error('Error: Producto inválido para añadir al carrito');
        throw new Error('Producto inválido');
      }

      console.log('🛒 Añadiendo producto al carrito:', product.name, 'cantidad:', quantity);
      
      // Verificar si el producto ya está en el carrito
      const existingItemIndex = this.items.findIndex(item => item.id === product.id);
      
      if (existingItemIndex >= 0) {
        // Actualizar cantidad
        this.items[existingItemIndex].quantity += quantity;
        console.log('✅ Producto existente, nueva cantidad:', this.items[existingItemIndex].quantity);
      } else {
        // Añadir nuevo item
        this.items.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity
        });
        console.log('✅ Nuevo producto añadido al carrito');
      }
      
      // Actualizar en Firestore
      await this.save();
      
      return this;
    } catch (error) {
      console.error('❌ Error al añadir item al carrito:', error);
      // No lanzar el error, simplemente devolver la instancia actual
      return this;
    }
  }

  async removeItem(productId) {
    try {
      if (!this.userId) {
        console.error('Error: No se puede eliminar un item sin userId en el carrito');
        return this;
      }

      if (!productId) {
        console.error('Error: productId es requerido para eliminar un item');
        return this;
      }

      console.log('🛒 Eliminando producto del carrito:', productId);
      
      // Filtrar el item
      const initialLength = this.items.length;
      this.items = this.items.filter(item => item.id !== productId);
      
      if (this.items.length < initialLength) {
        console.log('✅ Producto eliminado del carrito');
        // Actualizar en Firestore
        await this.save();
      } else {
        console.log('⚠️ El producto no estaba en el carrito');
      }
      
      return this;
    } catch (error) {
      console.error('❌ Error al eliminar item del carrito:', error);
      // No lanzar el error, simplemente devolver la instancia actual
      return this;
    }
  }

  async updateItemQuantity(productId, quantity) {
    try {
      if (!this.userId) {
        console.error('Error: No se puede actualizar un item sin userId en el carrito');
        return this;
      }

      if (!productId) {
        console.error('Error: productId es requerido para actualizar un item');
        return this;
      }

      console.log('🛒 Actualizando cantidad de producto:', productId, 'nueva cantidad:', quantity);
      
      if (quantity <= 0) {
        return this.removeItem(productId);
      }
      
      // Buscar el item
      const itemIndex = this.items.findIndex(item => item.id === productId);
      
      if (itemIndex >= 0) {
        // Actualizar cantidad
        this.items[itemIndex].quantity = quantity;
        console.log('✅ Cantidad actualizada');
        
        // Actualizar en Firestore
        await this.save();
      } else {
        console.log('⚠️ El producto no está en el carrito');
      }
      
      return this;
    } catch (error) {
      console.error('❌ Error al actualizar cantidad en el carrito:', error);
      // No lanzar el error, simplemente devolver la instancia actual
      return this;
    }
  }

  async clear() {
    try {
      if (!this.userId) {
        console.error('Error: No se puede vaciar un carrito sin userId');
        return this;
      }

      console.log('🛒 Vaciando carrito');
      
      // Vaciar carrito
      this.items = [];
      
      // Actualizar en Firestore
      await this.save();
      console.log('✅ Carrito vaciado');
      
      return this;
    } catch (error) {
      console.error('❌ Error al vaciar el carrito:', error);
      // No lanzar el error, simplemente devolver la instancia actual
      return this;
    }
  }

  async save() {
    try {
      if (!this.userId) {
        console.error('Error: No se puede guardar un carrito sin userId');
        throw new Error('userId es requerido para guardar el carrito');
      }

      console.log('🛒 Guardando carrito para usuario:', this.userId);
      
      const cartDocRef = doc(firestore, 'carts', this.userId);
      
      // Verificar si el documento existe
      const cartDocSnap = await getDoc(cartDocRef);
      
      if (cartDocSnap.exists()) {
        // Actualizar documento existente
        await updateDoc(cartDocRef, {
          items: this.items,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Crear nuevo documento
        await setDoc(cartDocRef, {
          userId: this.userId,
          items: this.items,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      // Actualizar instancia local
      this.updatedAt = new Date().toISOString();
      console.log('✅ Carrito guardado correctamente');
      
      return this;
    } catch (error) {
      console.error('❌ Error al guardar carrito:', error);
      // No lanzar el error, simplemente devolver la instancia actual
      return this;
    }
  }

  getTotal() {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getItemsCount() {
    return this.items.reduce((count, item) => count + item.quantity, 0);
  }

  getItem(productId) {
    return this.items.find(item => item.id === productId);
  }

  hasItem(productId) {
    return this.items.some(item => item.id === productId);
  }
}