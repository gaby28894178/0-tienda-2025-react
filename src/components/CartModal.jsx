import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { showSuccess, showError, showInfo } from './Toast';
import { db } from '../config/firebaseConfig';
import './CartModal.css';

const CartModal = ({ isOpen, onClose }) => {
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    getCartTotal,
    getCartItemsCount,
    createOrder
  } = useCart();
  const { currentUser } = useAuth();

  const handleQuantityChange = async (productId, newQuantity) => {
    try {
      if (newQuantity < 1) {
        await removeFromCart(productId);
        showInfo('Producto removido del carrito');
      } else {
        await updateQuantity(productId, newQuantity);
      }
    } catch (error) {
      showError('Error al actualizar cantidad');
    }
  };

  const handleCheckout = async () => {
    if (!currentUser) {
      showError('Debes iniciar sesión para enviar tu pedido');
      return;
    }
    
    if (cartItems.length === 0) {
      showError('Tu carrito está vacío');
      return;
    }
    
    try {
      showInfo('Enviando pedido al administrador...');
      const result = await createOrder({
        shippingAddress: currentUser.address || 'Dirección por defecto',
        paymentMethod: 'Pago contra entrega',
        notes: 'Pedido enviado al administrador para su revisión',
        status: 'pending_admin_review'
      });
      
      if (result.success) {
        showSuccess(`¡Pedido enviado exitosamente! El administrador lo revisará pronto. ID: ${result.orderId.slice(-8)}`);
        
        // Notificar al administrador
        try {
          // Crear notificación para el admin usando la sintaxis moderna de Firebase v9
          const { collection, addDoc } = await import('firebase/firestore');
          const notificationsCollectionRef = collection(db, 'notifications');
          
          await addDoc(notificationsCollectionRef, {
            type: 'new_order',
            title: 'Nuevo pedido recibido',
            message: `El usuario ${currentUser.email} ha realizado un nuevo pedido (ID: ${result.orderId.slice(-8)})`,
            orderId: result.orderId,
            read: false,
            createdAt: new Date().toISOString()
          });
          
          console.log('✅ Notificación enviada al administrador');
        } catch (notifError) {
          console.error('Error al notificar al administrador:', notifError);
        }
        
        onClose();
      }
    } catch (error) {
      console.error('Error al enviar pedido:', error);
      showError('Error al enviar el pedido. Intenta nuevamente.');
    }
  };

  const handleClearCart = async () => {
    if (cartItems.length === 0) {
      showInfo('El carrito ya está vacío');
      return;
    }
    
    try {
      await clearCart();
      showSuccess('Carrito vaciado');
    } catch (error) {
      showError('Error al vaciar el carrito');
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      await removeFromCart(productId);
      showInfo('Producto removido del carrito');
    } catch (error) {
      showError('Error al remover producto');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="cart-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="cart-modal-content"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="cart-modal-header">
            <h2>
              <ShoppingBag size={24} />
              Carrito de Compras
              {getCartItemsCount() > 0 && (
                <span className="cart-count">({getCartItemsCount()})</span>
              )}
            </h2>
            <button className="cart-modal-close" onClick={onClose}>
              <X size={34} />
            </button>
          </div>

          <div className="cart-modal-body">
            {cartItems.length === 0 ? (
              <div className="empty-cart">
                <ShoppingBag size={64} />
                <h3>Tu carrito está vacío</h3>
                <p>Agrega algunos productos para comenzar</p>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cartItems.map((item) => (
                    <motion.div
                      key={item.id}
                      className="cart-item"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      layout
                    >
                      <div className="cart-item-image">
                        <img src={item.image} alt={item.name} />
                      </div>
                      
                      <div className="cart-item-details">
                        <h4>{item.name}</h4>
                        <p className="cart-item-category">{item.category}</p>
                        <div className="cart-item-price">
                          {formatPrice(item.price)}
                        </div>
                      </div>
                      
                      <div className="cart-item-controls">
                        <div className="quantity-controls">
                          <button
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="quantity">{item.quantity}</span>
                          <button
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        
                        <button
                          className="remove-btn"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="cart-item-total">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="cart-summary">
                  <div className="cart-total">
                    <div className="total-row">
                      <span>Subtotal:</span>
                      <span>{formatPrice(getCartTotal())}</span>
                    </div>
                    <div className="total-row">
                      <span>Envío:</span>
                      <span>Gratis</span>
                    </div>
                    <div className="total-row total-final">
                      <span>Total:</span>
                      <span>{formatPrice(getCartTotal())}</span>
                    </div>
                  </div>

                  <div className="cart-actions">
                    <button
                      className="clear-cart-btn"
                      onClick={handleClearCart}
                    >
                      Vaciar Carrito
                    </button>
                    <button
                      className="checkout-btn"
                      onClick={handleCheckout}
                    >
                      Enviar Pedido
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CartModal;