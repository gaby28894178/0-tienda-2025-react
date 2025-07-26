import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { Cart } from '../models/Cart';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { Product } from '../models/Product';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser, userProfile } = useAuth();

  // Cargar datos del usuario cuando inicia sesión
  useEffect(() => {
    if (currentUser) {
      loadUserData();
    } else {
      // Limpiar datos al cerrar sesión
      setCartItems([]);
      setFavorites([]);
      setOrders([]);
    }
  }, [currentUser]);

  // Cargar datos del usuario desde Firestore
  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      // console.log('🔄 Cargando datos del usuario:', currentUser?.email);
      
      if (!currentUser || !currentUser.uid) {
        console.warn('⚠️ No hay usuario autenticado para cargar datos');
        return;
      }
      
      // Cargar carrito usando nuestro modelo
      try {
        const cart = await Cart.getByUserId(currentUser.uid);
        setCartItems(cart.items || []);
        // console.log('✅ Carrito cargado:', cart.items.length, 'productos');
      } catch (cartError) {
        console.error('❌ Error al cargar carrito:', cartError);
        // Usar localStorage como fallback
        const savedCart = localStorage.getItem(`cart_${currentUser.uid}`);
        if (savedCart) {
          try {
            const parsedCart = JSON.parse(savedCart);
            setCartItems(parsedCart);
            // console.log('✅ Carrito cargado desde localStorage:', parsedCart.length, 'productos');
          } catch (parseError) {
            console.error('❌ Error al parsear carrito de localStorage:', parseError);
            setCartItems([]);
          }
        } else {
          setCartItems([]);
        }
      }
      
      // Cargar favoritos desde el perfil de usuario
      try {
        if (userProfile) {
          setFavorites(userProfile.favorites || []);
          // console.log('✅ Favoritos cargados:', userProfile.favorites?.length || 0, 'productos');
          
          // Si hay IDs de favoritos, cargar los productos completos
          if (userProfile.favorites && userProfile.favorites.length > 0) {
            try {
              const favoriteProducts = [];
              for (const productId of userProfile.favorites) {
                try {
                  const product = await Product.getById(productId);
                  if (product) {
                    favoriteProducts.push(product);
                  }
                } catch (productError) {
                  console.error(`❌ Error al cargar producto favorito ${productId}:`, productError);
                }
              }
              
              if (favoriteProducts.length > 0) {
                setFavorites(favoriteProducts);
                // console.log('✅ Productos favoritos cargados:', favoriteProducts.length);
              }
            } catch (favProductsError) {
              console.error('❌ Error al cargar productos favoritos:', favProductsError);
            }
          }
        }
      } catch (favError) {
        console.error('❌ Error al cargar favoritos:', favError);
        // Usar localStorage como fallback
        const savedFavorites = localStorage.getItem(`favorites_${currentUser.uid}`);
        if (savedFavorites) {
          try {
            const parsedFavorites = JSON.parse(savedFavorites);
            setFavorites(parsedFavorites);
            // console.log('✅ Favoritos cargados desde localStorage:', parsedFavorites.length);
          } catch (parseError) {
            console.error('❌ Error al parsear favoritos de localStorage:', parseError);
            setFavorites([]);
          }
        } else {
          setFavorites([]);
        }
      }
      
      // Cargar órdenes usando nuestro modelo
      try {
        const userOrders = await Order.getByUserId(currentUser.uid);
        setOrders(userOrders);
        // console.log('✅ Órdenes cargadas:', userOrders.length, 'pedidos');
      } catch (ordersError) {
        console.error('❌ Error al cargar órdenes:', ordersError);
        // Usar localStorage como fallback
        const savedOrders = localStorage.getItem(`orders_${currentUser.uid}`);
        if (savedOrders) {
          try {
            const parsedOrders = JSON.parse(savedOrders);
            setOrders(parsedOrders);
            // console.log('✅ Órdenes cargadas desde localStorage:', parsedOrders.length);
          } catch (parseError) {
            console.error('❌ Error al parsear órdenes de localStorage:', parseError);
            setOrders([]);
          }
        } else {
          setOrders([]);
        }
      }
    } catch (error) {
      console.error('❌ Error al cargar datos del usuario:', error);
      setError('Error al cargar datos del usuario');
    } finally {
      setLoading(false);
    }
  };

  // Funciones del carrito
  const addToCart = async (product, quantity = 1) => {
    try {
      setError(null);
      
      if (!currentUser) {
        const errorMsg = 'Debes iniciar sesión para agregar productos al carrito';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      if (!product || !product.id) {
        const errorMsg = 'Producto inválido';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log('🛒 Agregando producto al carrito:', product.name, 'cantidad:', quantity);
      
      // Usar nuestro modelo de carrito
      try {
        const cart = await Cart.getByUserId(currentUser.uid);
        await cart.addItem(product, quantity);
        
        // Actualizar estado local
        setCartItems(cart.items);
        console.log('✅ Producto agregado al carrito');
        
        // Guardar en localStorage como respaldo
        localStorage.setItem(`cart_${currentUser.uid}`, JSON.stringify(cart.items));
        
        return true;
      } catch (cartError) {
        console.error('❌ Error al usar modelo de carrito:', cartError);
        
        // Fallback: actualizar el estado local directamente
        const newItems = [...cartItems];
        const existingItem = newItems.find(item => item.id === product.id);
        
        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          newItems.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity
          });
        }
        
        setCartItems(newItems);
        
        // Guardar en localStorage como respaldo
        localStorage.setItem(`cart_${currentUser.uid}`, JSON.stringify(newItems));
        
        console.log('✅ Producto agregado al carrito (modo fallback)');
        return true;
      }
    } catch (error) {
      console.error('❌ Error al agregar producto al carrito:', error);
      setError(error.message || 'Error al agregar producto al carrito');
      throw error;
    }
  };

  const removeFromCart = async (productId) => {
    try {
      setError(null);
      
      if (!currentUser) {
        console.warn('⚠️ No hay usuario autenticado para eliminar del carrito');
        return false;
      }
      
      if (!productId) {
        console.warn('⚠️ ID de producto no proporcionado');
        return false;
      }
      
      console.log('🛒 Eliminando producto del carrito:', productId);
      
      // Usar nuestro modelo de carrito
      try {
        const cart = await Cart.getByUserId(currentUser.uid);
        await cart.removeItem(productId);
        
        // Actualizar estado local
        setCartItems(cart.items);
        console.log('✅ Producto eliminado del carrito');
        
        // Guardar en localStorage como respaldo
        localStorage.setItem(`cart_${currentUser.uid}`, JSON.stringify(cart.items));
        
        return true;
      } catch (cartError) {
        console.error('❌ Error al usar modelo de carrito:', cartError);
        
        // Fallback: actualizar el estado local directamente
        const newItems = cartItems.filter(item => item.id !== productId);
        setCartItems(newItems);
        
        // Guardar en localStorage como respaldo
        localStorage.setItem(`cart_${currentUser.uid}`, JSON.stringify(newItems));
        
        console.log('✅ Producto eliminado del carrito (modo fallback)');
        return true;
      }
    } catch (error) {
      console.error('❌ Error al eliminar producto del carrito:', error);
      setError(error.message || 'Error al eliminar producto del carrito');
      return false;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      setError(null);
      
      if (!currentUser) {
        console.warn('⚠️ No hay usuario autenticado para actualizar cantidad');
        return false;
      }
      
      if (!productId) {
        console.warn('⚠️ ID de producto no proporcionado');
        return false;
      }
      
      if (quantity <= 0) {
        return removeFromCart(productId);
      }
      
      console.log('🛒 Actualizando cantidad de producto:', productId, 'nueva cantidad:', quantity);
      
      // Usar nuestro modelo de carrito
      try {
        const cart = await Cart.getByUserId(currentUser.uid);
        await cart.updateItemQuantity(productId, quantity);
        
        // Actualizar estado local
        setCartItems(cart.items);
        console.log('✅ Cantidad actualizada');
        
        // Guardar en localStorage como respaldo
        localStorage.setItem(`cart_${currentUser.uid}`, JSON.stringify(cart.items));
        
        return true;
      } catch (cartError) {
        console.error('❌ Error al usar modelo de carrito:', cartError);
        
        // Fallback: actualizar el estado local directamente
        const newItems = cartItems.map(item =>
          item.id === productId
            ? { ...item, quantity }
            : item
        );
        
        setCartItems(newItems);
        
        // Guardar en localStorage como respaldo
        localStorage.setItem(`cart_${currentUser.uid}`, JSON.stringify(newItems));
        
        console.log('✅ Cantidad actualizada (modo fallback)');
        return true;
      }
    } catch (error) {
      console.error('❌ Error al actualizar cantidad:', error);
      setError(error.message || 'Error al actualizar cantidad');
      return false;
    }
  };

  const clearCart = async () => {
    try {
      setError(null);
      
      if (!currentUser) {
        console.warn('⚠️ No hay usuario autenticado para vaciar carrito');
        return false;
      }
      
      console.log('🛒 Vaciando carrito');
      
      // Usar nuestro modelo de carrito
      try {
        const cart = await Cart.getByUserId(currentUser.uid);
        await cart.clear();
        
        // Actualizar estado local
        setCartItems([]);
        console.log('✅ Carrito vaciado');
        
        // Guardar en localStorage como respaldo
        localStorage.setItem(`cart_${currentUser.uid}`, JSON.stringify([]));
        
        return true;
      } catch (cartError) {
        console.error('❌ Error al usar modelo de carrito:', cartError);
        
        // Fallback: actualizar el estado local directamente
        setCartItems([]);
        
        // Guardar en localStorage como respaldo
        localStorage.setItem(`cart_${currentUser.uid}`, JSON.stringify([]));
        
        console.log('✅ Carrito vaciado (modo fallback)');
        return true;
      }
    } catch (error) {
      console.error('❌ Error al vaciar carrito:', error);
      setError(error.message || 'Error al vaciar carrito');
      return false;
    }
  };

  // Funciones de favoritos
  const addToFavorites = async (product) => {
    try {
      setError(null);
      
      if (!currentUser) {
        const errorMsg = 'Debes iniciar sesión para agregar favoritos';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      if (!product || !product.id) {
        const errorMsg = 'Producto inválido';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log('❤️ Agregando producto a favoritos:', product.name);
      
      // Verificar si ya está en favoritos
      if (isFavorite(product.id)) {
        console.log('⚠️ El producto ya está en favoritos');
        return true;
      }
      
      // Usar nuestro modelo de usuario
      if (userProfile && typeof userProfile.addToFavorites === 'function') {
        try {
          await userProfile.addToFavorites(product.id);
          console.log('✅ Producto añadido a favoritos en Firestore');
          
          // Actualizar estado local
          setFavorites([...favorites, product]);
          
          // Guardar en localStorage como respaldo
          localStorage.setItem(`favorites_${currentUser.uid}`, JSON.stringify([...favorites, product]));
          
          return true;
        } catch (userError) {
          console.error('❌ Error al usar modelo de usuario:', userError);
          
          // Fallback: actualizar el estado local directamente
          setFavorites([...favorites, product]);
          
          // Guardar en localStorage como respaldo
          localStorage.setItem(`favorites_${currentUser.uid}`, JSON.stringify([...favorites, product]));
          
          console.log('✅ Producto añadido a favoritos (modo fallback)');
          return true;
        }
      } else {
        console.warn('⚠️ No hay perfil de usuario disponible, usando modo fallback');
        
        // Fallback: actualizar el estado local directamente
        setFavorites([...favorites, product]);
        
        // Guardar en localStorage como respaldo
        localStorage.setItem(`favorites_${currentUser.uid}`, JSON.stringify([...favorites, product]));
        
        console.log('✅ Producto añadido a favoritos (modo fallback)');
        return true;
      }
    } catch (error) {
      console.error('❌ Error al añadir a favoritos:', error);
      setError(error.message || 'Error al añadir a favoritos');
      return false;
    }
  };

  const removeFromFavorites = async (productId) => {
    try {
      setError(null);
      
      if (!currentUser) {
        console.warn('⚠️ No hay usuario autenticado para eliminar de favoritos');
        return false;
      }
      
      if (!productId) {
        console.warn('⚠️ ID de producto no proporcionado');
        return false;
      }
      
      console.log('❤️ Eliminando producto de favoritos:', productId);
      
      // Usar nuestro modelo de usuario
      if (userProfile && typeof userProfile.removeFromFavorites === 'function') {
        try {
          await userProfile.removeFromFavorites(productId);
          console.log('✅ Producto eliminado de favoritos en Firestore');
          
          // Actualizar estado local
          const newFavorites = favorites.filter(item => item.id !== productId);
          setFavorites(newFavorites);
          
          // Guardar en localStorage como respaldo
          localStorage.setItem(`favorites_${currentUser.uid}`, JSON.stringify(newFavorites));
          
          return true;
        } catch (userError) {
          console.error('❌ Error al usar modelo de usuario:', userError);
          
          // Fallback: actualizar el estado local directamente
          const newFavorites = favorites.filter(item => item.id !== productId);
          setFavorites(newFavorites);
          
          // Guardar en localStorage como respaldo
          localStorage.setItem(`favorites_${currentUser.uid}`, JSON.stringify(newFavorites));
          
          console.log('✅ Producto eliminado de favoritos (modo fallback)');
          return true;
        }
      } else {
        console.warn('⚠️ No hay perfil de usuario disponible, usando modo fallback');
        
        // Fallback: actualizar el estado local directamente
        const newFavorites = favorites.filter(item => item.id !== productId);
        setFavorites(newFavorites);
        
        // Guardar en localStorage como respaldo
        localStorage.setItem(`favorites_${currentUser.uid}`, JSON.stringify(newFavorites));
        
        console.log('✅ Producto eliminado de favoritos (modo fallback)');
        return true;
      }
    } catch (error) {
      console.error('❌ Error al eliminar de favoritos:', error);
      setError(error.message || 'Error al eliminar de favoritos');
      return false;
    }
  };

  // Función para crear una orden
  const createOrder = async (orderData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!currentUser) {
        const errorMsg = 'Debes iniciar sesión para realizar un pedido';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      if (!cartItems || cartItems.length === 0) {
        const errorMsg = 'El carrito está vacío';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log('🔄 Creando pedido para usuario:', currentUser.email);
      
      // Usar nuestro modelo de orden
      try {
        const order = await Order.create({
          userId: currentUser.uid,
          userEmail: currentUser.email,
          items: cartItems,
          total: getCartTotal(),
          status: 'pending',
          ...orderData
        });
        
        console.log('✅ Orden creada con ID:', order.id);
        
        // Actualizar lista de órdenes
        setOrders([...orders, order]);
        
        // Añadir orden al perfil del usuario
        if (userProfile && typeof userProfile.addOrder === 'function') {
          try {
            await userProfile.addOrder(order.id);
            console.log('✅ Orden añadida al perfil de usuario');
          } catch (profileError) {
            console.error('❌ Error al añadir orden al perfil:', profileError);
          }
        }
        
        // Limpiar carrito
        await clearCart();
        
        return { success: true, orderId: order.id };
      } catch (orderError) {
        console.error('❌ Error al crear orden en Firestore:', orderError);
        
        // Fallback: crear orden en localStorage
        const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const newOrder = {
          id: orderId,
          userId: currentUser.uid,
          userEmail: currentUser.email,
          items: cartItems,
          total: getCartTotal(),
          status: 'pending',
          createdAt: new Date().toISOString(),
          ...orderData
        };
        
        // Actualizar estado local
        setOrders([...orders, newOrder]);
        
        // Guardar en localStorage
        const savedOrders = localStorage.getItem(`orders_${currentUser.uid}`);
        const userOrders = savedOrders ? JSON.parse(savedOrders) : [];
        userOrders.push(newOrder);
        localStorage.setItem(`orders_${currentUser.uid}`, JSON.stringify(userOrders));
        
        // Limpiar carrito
        await clearCart();
        
        console.log('✅ Orden creada en localStorage con ID:', orderId);
        return { success: true, orderId };
      }
    } catch (error) {
      console.error('❌ Error al crear orden:', error);
      setError(error.message || 'Error al crear orden');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Funciones de utilidad
  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 0)), 0);
  };

  const isFavorite = (productId) => {
    return favorites.some(item => item.id === productId);
  };

  const isInCart = (productId) => {
    return cartItems.some(item => item.id === productId);
  };

  const getCartItem = (productId) => {
    return cartItems.find(item => item.id === productId);
  };

  const value = {
    cartItems,
    favorites,
    orders,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartItemsCount,
    getCartTotal,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    isInCart,
    getCartItem,
    createOrder,
    reloadData: loadUserData
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;