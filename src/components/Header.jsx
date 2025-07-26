import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../config/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import './Header.css';

const Header = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [headerImages, setHeaderImages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar imágenes del header desde Firebase
  useEffect(() => {
    const loadHeaderImages = async () => {
      try {
        setLoading(true);
        // Usar la sintaxis moderna de Firebase v9
        const headerImagesCollectionRef = collection(db, 'headerImages');
        const imagesSnapshot = await getDocs(headerImagesCollectionRef);
        
        if (!imagesSnapshot.empty) {
          const images = imagesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })).sort((a, b) => {
            // Ordenar por ID si es numérico, o por createdAt
            const aId = parseInt(a.id);
            const bId = parseInt(b.id);
            if (!isNaN(aId) && !isNaN(bId)) {
              return aId - bId;
            }
            return (a.createdAt || '').localeCompare(b.createdAt || '');
          });
          
          setHeaderImages(images);
          console.log('✅ Imágenes del header cargadas desde Firebase:', images.length);
        } else {
          console.log('⚠️ No hay imágenes en Firebase');
          // Crear imágenes de placeholder si no hay ninguna
          setHeaderImages([
            {
              id: 'placeholder1',
              url: 'https://via.placeholder.com/1200x400?text=Imagen+de+Header+1',
              alt: 'Imagen de placeholder 1'
            },
            {
              id: 'placeholder2',
              url: 'https://via.placeholder.com/1200x400?text=Imagen+de+Header+2',
              alt: 'Imagen de placeholder 2'
            }
          ]);
        }
      } catch (error) {
        console.error('❌ Error al cargar imágenes del header:', error);
        // Usar imágenes de placeholder en caso de error
        setHeaderImages([
          {
            id: 'error1',
            url: 'https://via.placeholder.com/1200x400?text=Error+al+cargar+imágenes',
            alt: 'Error al cargar imágenes'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    loadHeaderImages();
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || !headerImages.length) return;

    const carouselInterval = parseInt(import.meta.env.VITE_CAROUSEL_INTERVAL) || 5000;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === headerImages.length - 1 ? 0 : prevIndex + 1
      );
    }, carouselInterval);

    return () => clearInterval(interval);
  }, [isAutoPlaying, headerImages.length]);

  const goToPrevious = () => {
    if (!headerImages.length) return;
    setCurrentIndex(currentIndex === 0 ? headerImages.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    if (!headerImages.length) return;
    setCurrentIndex(currentIndex === headerImages.length - 1 ? 0 : currentIndex + 1);
  };

  const goToSlide = (index) => {
    if (index >= 0 && index < headerImages.length) {
      setCurrentIndex(index);
    }
  };

  if (loading) {
    return (
      <header className="header">
        <div className="carousel-container loading">
          <div className="loading-spinner"></div>
          <p>Cargando imágenes...</p>
        </div>
      </header>
    );
  }

  if (!headerImages.length) {
    return (
      <header className="header">
        <div className="carousel-container empty">
          <p>No hay imágenes disponibles</p>
        </div>
      </header>
    );
  }

  return (
    <header className="header">
      <div className="carousel-container">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="carousel-slide"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <img
              src={headerImages[currentIndex]?.url || 'https://via.placeholder.com/1200x400?text=Imagen+no+disponible'}
              alt={headerImages[currentIndex]?.alt || 'Imagen no disponible'}
              className="carousel-image"
            />
            <div className="carousel-overlay">
              <div className="carousel-content">
                <motion.h1
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  Bienvenido a Mi Sitio
                </motion.h1>
                <motion.p
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                >
                  Descubre productos increíbles con la mejor calidad
                </motion.p>
                <motion.button
                  className="cta-button"
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Ver Productos
                </motion.button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {headerImages.length > 1 && (
          <>
            <button className="carousel-button prev" onClick={goToPrevious}>
              <ChevronLeft size={24} />
            </button>
            <button className="carousel-button next" onClick={goToNext}>
              <ChevronRight size={24} />
            </button>

            <div className="carousel-indicators">
              {headerImages.map((_, index) => (
                <button
                  key={index}
                  className={`indicator ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => goToSlide(index)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;