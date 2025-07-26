import { db as firestore } from '../config/firebaseConfig';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

export class Product {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.price = data.price;
    this.category = data.category;
    this.image = data.image;
    this.hoverImage = data.hoverImage;
    this.gallery = data.gallery;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async getAll() {
    try {
      // Obtener productos de Firestore
      const productsCollection = collection(firestore, 'products');
      const firestoreProducts = await getDocs(productsCollection);
      
      if (firestoreProducts.docs.length > 0) {
        const products = firestoreProducts.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        return products.map(product => new Product(product));
      }
      
      // Si no hay productos, devolver array vacío
      return [];
    } catch (error) {
      console.error('Error al obtener productos:', error);
      return [];
    }
  }

  static async getById(id) {
    try {
      // Buscar en Firestore
      const docRef = doc(firestore, 'products', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return new Product({ id: docSnap.id, ...docSnap.data() });
      }
      
      // Si no existe, devolver null
      return null;
    } catch (error) {
      console.error('Error al obtener producto:', error);
      return null;
    }
  }

  static async getByCategory(category) {
    try {
      const products = await this.getAll();
      return products.filter(product => product.category === category);
    } catch (error) {
      console.error('Error al obtener productos por categoría:', error);
      return [];
    }
  }

  static async create(productData) {
    try {
      // Crear en Firestore
      const productsCollection = collection(firestore, 'products');
      const docRef = await addDoc(productsCollection, {
        ...productData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // console.log('✅ Producto creado en Firestore:', docRef.id);
      
      return new Product({ id: docRef.id, ...productData });
    } catch (error) {
      console.error('❌ Error al crear producto:', error);
      throw error;
    }
  }

  static async update(id, productData) {
    try {
      // Actualizar en Firestore
      const docRef = doc(firestore, 'products', id);
      await updateDoc(docRef, {
        ...productData,
        updatedAt: new Date().toISOString()
      });
      
      // console.log('✅ Producto actualizado en Firestore:', id);
      return true;
    } catch (error) {
      console.error('❌ Error al actualizar producto:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      // Eliminar de Firestore
      const docRef = doc(firestore, 'products', id);
      await deleteDoc(docRef);
      
      // console.log('✅ Producto eliminado de Firestore:', id);
      return true;
    } catch (error) {
      console.error('❌ Error al eliminar producto:', error);
      throw error;
    }
  }

  async save() {
    try {
      if (this.id) {
        // Update
        await Product.update(this.id, {
          name: this.name,
          description: this.description,
          price: this.price,
          category: this.category,
          image: this.image,
          hoverImage: this.hoverImage,
          gallery: this.gallery
        });
      } else {
        // Create
        const newProduct = await Product.create({
          name: this.name,
          description: this.description,
          price: this.price,
          category: this.category,
          image: this.image,
          hoverImage: this.hoverImage,
          gallery: this.gallery
        });
        this.id = newProduct.id;
      }
      return true;
    } catch (error) {
      console.error('Error al guardar producto:', error);
      return false;
    }
  }

  // Métodos de utilidad
  static getCategories() {
    return ['Premium', 'Especial', 'Exclusivo', 'Básico'];
  }

  static async search(query) {
    try {
      const products = await this.getAll();
      const searchTerm = query.toLowerCase();
      
      return products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Error en búsqueda de productos:', error);
      return [];
    }
  }

  static async getByPriceRange(minPrice, maxPrice) {
    try {
      const products = await this.getAll();
      return products.filter(product => 
        product.price >= minPrice && product.price <= maxPrice
      );
    } catch (error) {
      console.error('Error al filtrar por precio:', error);
      return [];
    }
  }

  // Validaciones
  static validateProductData(data) {
    const errors = [];
    
    if (!data.name || data.name.trim().length < 3) {
      errors.push('El nombre debe tener al menos 3 caracteres');
    }
    
    if (!data.description || data.description.trim().length < 10) {
      errors.push('La descripción debe tener al menos 10 caracteres');
    }
    
    if (!data.price || data.price <= 0) {
      errors.push('El precio debe ser mayor a 0');
    }
    
    if (!data.category || !this.getCategories().includes(data.category)) {
      errors.push('Categoría inválida');
    }
    
    if (!data.image || !this.isValidUrl(data.image)) {
      errors.push('URL de imagen principal inválida');
    }
    
    return errors;
  }

  static isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
}