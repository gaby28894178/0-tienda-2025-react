import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Package, 
  CreditCard, 
  Truck, 
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import { db } from '../config/firebaseConfig';
import { collection, getDocs, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import './AdminOrdersPanel.css';

const AdminOrdersPanel = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'Todos los estados', color: '#666' },
    { value: 'pending', label: 'Pendiente', color: '#ffa500' },
    { value: 'processing', label: 'Procesando', color: '#2196f3' },
    { value: 'shipped', label: 'Enviado', color: '#9c27b0' },
    { value: 'delivered', label: 'Entregado', color: '#4caf50' },
    { value: 'cancelled', label: 'Cancelado', color: '#f44336' }
  ];

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter, dateFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      const ordersCollection = collection(db, 'orders');
      // Usar consulta simple para evitar problemas de índices
      const ordersSnapshot = await getDocs(ordersCollection);
      
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Ordenar manualmente por fecha (más reciente primero)
      ordersData.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      // Enriquecer datos con información del usuario
      const enrichedOrders = await Promise.all(
        ordersData.map(async (order) => {
          try {
            // Obtener información del usuario
            const usersCollection = collection(db, 'users');
            const userQuery = query(usersCollection, where('email', '==', order.userEmail));
            const userSnapshot = await getDocs(userQuery);
            
            let userData = null;
            if (!userSnapshot.empty) {
              userData = userSnapshot.docs[0].data();
            }
            
            return {
              ...order,
              userData: userData || { displayName: 'Usuario desconocido', phone: '', address: '' }
            };
          } catch (error) {
            console.error('Error al obtener datos del usuario:', error);
            return {
              ...order,
              userData: { displayName: 'Usuario desconocido', phone: '', address: '' }
            };
          }
        })
      );
      
      setOrders(enrichedOrders);
      console.log(`✅ ${enrichedOrders.length} pedidos cargados`);
      
    } catch (error) {
      console.error('❌ Error al cargar pedidos:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filtro por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(search) ||
        order.userEmail.toLowerCase().includes(search) ||
        order.userData?.displayName?.toLowerCase().includes(search) ||
        order.items?.some(item => item.name.toLowerCase().includes(search))
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filtro por fecha
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(order => new Date(order.createdAt) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(order => new Date(order.createdAt) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(order => new Date(order.createdAt) >= filterDate);
          break;
      }
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      // Actualizar estado local
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
          : order
      ));

      console.log(`✅ Estado actualizado: ${orderId} -> ${newStatus}`);
    } catch (error) {
      console.error('❌ Error al actualizar estado:', error);
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption ? statusOption.color : '#666';
  };

  const getStatusLabel = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption ? statusOption.label : status;
  };

  const exportOrders = () => {
    // Crear CSV con los pedidos filtrados
    const csvContent = [
      ['ID', 'Cliente', 'Email', 'Fecha', 'Estado', 'Total', 'Items'].join(','),
      ...filteredOrders.map(order => [
        order.id,
        order.userData?.displayName || 'N/A',
        order.userEmail,
        formatDate(order.createdAt),
        getStatusLabel(order.status),
        order.total,
        order.items?.length || 0
      ].join(','))
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedidos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="admin-orders-loading">
        <RefreshCw size={32} className="spinner" />
        <p>Cargando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="admin-orders-panel">
      <div className="orders-header">
        <div className="header-title">
          <h3>Panel de Pedidos de Clientes</h3>
          <p>Gestiona todos los pedidos realizados por los clientes</p>
        </div>
        
        <div className="header-actions">
          <button className="refresh-btn" onClick={loadOrders}>
            <RefreshCw size={16} />
            Actualizar
          </button>
          <button className="export-btn" onClick={exportOrders}>
            <Download size={16} />
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="orders-filters">
        <div className="search-filter">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por ID, cliente, email o producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="status-filter">
          <Filter size={16} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="date-filter">
          <Calendar size={16} />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">Todas las fechas</option>
            <option value="today">Hoy</option>
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
          </select>
        </div>
      </div>

      <div className="orders-stats">
        <div className="stat-card">
          <div className="stat-number">{filteredOrders.length}</div>
          <div className="stat-label">Total Pedidos</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {formatPrice(filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0))}
          </div>
          <div className="stat-label">Valor Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {filteredOrders.filter(order => order.status === 'pending').length}
          </div>
          <div className="stat-label">Pendientes</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {filteredOrders.filter(order => order.status === 'delivered').length}
          </div>
          <div className="stat-label">Entregados</div>
        </div>
      </div>

      <div className="orders-table">
        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            <Package size={48} />
            <h4>No hay pedidos</h4>
            <p>No se encontraron pedidos con los filtros aplicados</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <motion.div
              key={order.id}
              className="order-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="order-main-info">
                <div className="order-id">
                  <strong>#{order.id.slice(-8)}</strong>
                </div>
                
                <div className="order-customer">
                  <User size={16} />
                  <div>
                    <div className="customer-name">
                      {order.userData?.displayName || 'Cliente desconocido'}
                    </div>
                    <div className="customer-email">{order.userEmail}</div>
                  </div>
                </div>

                <div className="order-date">
                  <Calendar size={16} />
                  {formatDate(order.createdAt)}
                </div>

                <div className="order-total">
                  <CreditCard size={16} />
                  {formatPrice(order.total || 0)}
                </div>

                <div className="order-items">
                  <Package size={16} />
                  {order.items?.length || 0} productos
                </div>
              </div>

              <div className="order-status-section">
                <div className="current-status">
                  <Truck size={16} />
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                <select
                  className="status-selector"
                  value={order.status}
                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                >
                  <option value="pending">Pendiente</option>
                  <option value="processing">Procesando</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              <div className="order-actions">
                <button
                  className="view-details-btn"
                  onClick={() => viewOrderDetails(order)}
                >
                  <Eye size={16} />
                  Ver Detalles
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal de detalles del pedido */}
      {showOrderDetails && selectedOrder && (
        <div className="order-details-modal" onClick={() => setShowOrderDetails(false)}>
          <div className="order-details-content" onClick={(e) => e.stopPropagation()}>
            <div className="details-header">
              <h3>Detalles del Pedido #{selectedOrder.id.slice(-8)}</h3>
              <button onClick={() => setShowOrderDetails(false)}>×</button>
            </div>

            <div className="details-body">
              <div className="customer-details">
                <h4>Información del Cliente</h4>
                <p><strong>Nombre:</strong> {selectedOrder.userData?.displayName}</p>
                <p><strong>Email:</strong> {selectedOrder.userEmail}</p>
                <p><strong>Teléfono:</strong> {selectedOrder.userData?.phone || 'No especificado'}</p>
                <p><strong>Dirección:</strong> {selectedOrder.userData?.address || 'No especificada'}</p>
              </div>

              <div className="order-details">
                <h4>Detalles del Pedido</h4>
                <p><strong>Fecha:</strong> {formatDate(selectedOrder.createdAt)}</p>
                <p><strong>Estado:</strong> 
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(selectedOrder.status) }}
                  >
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                </p>
                <p><strong>Total:</strong> {formatPrice(selectedOrder.total || 0)}</p>
              </div>

              <div className="items-details">
                <h4>Productos ({selectedOrder.items?.length || 0})</h4>
                <div className="items-list">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="item-row">
                      <img src={item.image} alt={item.name} />
                      <div className="item-info">
                        <h5>{item.name}</h5>
                        <p>Cantidad: {item.quantity}</p>
                        <p>Precio: {formatPrice(item.price)}</p>
                      </div>
                      <div className="item-total">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPanel;