import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import { Product } from '../models/Product';
import './ProductGrid.css';

const ProductGrid = ({ onAuthRequired }) => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Cargando productos...');
      
      const productsData = await Product.getAll();
      console.log('📦 Productos cargados:', productsData);
      
      if (productsData && productsData.length > 0) {
        setProducts(productsData);
        console.log(`✅ ${productsData.length} productos cargados correctamente`);
      } else {
        console.log('⚠️ No se encontraron productos');
        setProducts([]);
        
        // Intentar recargar después de un momento para dar tiempo a Firebase
        setTimeout(async () => {
          try {
            console.log('🔄 Reintentando cargar productos...');
            const retryProducts = await Product.getAll();
            if (retryProducts && retryProducts.length > 0) {
              setProducts(retryProducts);
              console.log(`✅ ${retryProducts.length} productos cargados en el segundo intento`);
            }
          } catch (retryError) {
            console.error('❌ Error al reintentar cargar productos:', retryError);
          }
        }, 3000);
      }
    } catch (error) {
      console.error('❌ Error al cargar productos:', error);
      setError('Error al cargar productos. Por favor, recarga la página.');
    } finally {
      setLoading(false);
    }
  };



  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  if (loading) {
    return (
      <section className="products-section" id="productos">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando productos desde Firebase...</p>
            <small>Esto puede tomar unos segundos la primera vez</small>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="products-section" id="productos">
        <div className="container">
          <div className="error-container">
            <h3>Error al cargar productos</h3>
            <p>{error}</p>
            <button onClick={loadProducts} className="retry-button">
              Reintentar
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="products-section" id="productos">
        <div className="container">
          <div className="empty-container">
            <h3>No hay productos disponibles</h3>
            <p>Los productos se están cargando automáticamente. Por favor, espera un momento.</p>
            <button onClick={loadProducts} className="retry-button">
              Recargar productos
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="products-section" id="productos">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2>Nuestros Productos</h2>
          <p>Descubre nuestra selección de productos premium</p>
        </motion.div>

        <motion.div
          className="products-grid"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, staggerChildren: 0.2 }}
          viewport={{ once: true }}
        >
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <ProductCard
                product={product}
                onViewDetails={handleViewDetails}
                onAuthRequired={onAuthRequired}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </section>
  );
};

export default ProductGrid;