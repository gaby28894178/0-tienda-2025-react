import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, ShoppingCart, Heart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { showSuccess, showError } from "./Toast";
import "./ProductCard.css";

const ProductCard = ({ product, onViewDetails, onAuthRequired }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart, addToFavorites, removeFromFavorites, isFavorite } =
    useCart();
  const { currentUser } = useAuth();

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      onAuthRequired();
      return;
    }

    try {
      await addToCart(product);
      showSuccess(`${product.name} agregado al carrito`);
    } catch (error) {
      showError(error.message || "Error al agregar al carrito");
    }
  };

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      onAuthRequired();
      return;
    }

    try {
      if (isFavorite(product.id)) {
        await removeFromFavorites(product.id);
        showSuccess(`${product.name} removido de favoritos`);
      } else {
        await addToFavorites(product);
        showSuccess(`${product.name} agregado a favoritos`);
      }
    } catch (error) {
      showError(error.message || "Error al actualizar favoritos");
    }
  };

  return (
    <motion.div
      className="product-card"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -10 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="product-image-container">
        <motion.img
          src={isHovered ? product.hoverImage : product.image}
          alt={product.name}
          className="product-image"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />

        <button
          className={`favorite-btn ${isFavorite(product.id) ? "active" : ""}`}
          onClick={handleToggleFavorite}
        >
          <Heart size={18} fill={isFavorite(product.id) ? "#ff6b35" : "none"} />
        </button>

        <div className="product-overlay">
          <button
            className="product-action-btn view-btn"
            onClick={() => onViewDetails(product)}
          >
            <Eye size={20} />
            Ver Detalles
          </button>
          <button
            className="product-action-btn cart-btn"
            onClick={handleAddToCart}
          >
            <ShoppingCart size={20} />
            Agregar
          </button>
        </div>

        <div className="product-category">{product.category}</div>
      </div>

      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-price">${product.price}</div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
