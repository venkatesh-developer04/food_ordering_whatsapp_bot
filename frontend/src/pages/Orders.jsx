import { useState, useEffect, useCallback } from 'react';
import { orderAPI } from '../api';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import { RefreshCw, Filter, ShoppingBag, ChevronDown, X } from 'lucide-react';
import Pagination from '../components/Pagination';

const STATUSES = ['all', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];

const STATUS_MAP = {
    pending: { label: 'Pending', cls: 'status-pending' },
    confirmed: { label: 'Confirmed', cls: 'status-confirmed' },
    preparing: { label: 'Preparing', cls: 'status-preparing' },
    ready: { label: 'Ready', cls: 'status-ready' },
    delivered: { label: 'Delivered', cls: 'status-delivered' },
    cancelled: { label: 'Cancelled', cls: 'status-cancelled' },
};

function OrderDetailModal({ order, onClose, onStatusChange }) {
    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <h2 className="modal-title">Order #{order._id.slice(-6).toUpperCase()}</h2>
                    <button className="btn btn-icon" onClick={onClose}><X size={16} /></button>
                </div>
                <div className="modal-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                        <div>
                            <div className="form-label">Customer</div>
                            <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{order.customerPhone.replace('@c.us', '')}</div>
                        </div>
                        <div>
                            <div className="form-label">Ordered At</div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{new Date(order.createdAt).toLocaleString('en-IN')}</div>
                        </div>
                    </div>
                    <div className="form-label">Items</div>
                    <div className="table-wrapper" style={{ marginBottom: 20 }}>
                        <table>
                            <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                            <tbody>
                                {order.items.map((it, i) => (
                                    <tr key={i}>
                                        <td>{it.name}</td>
                                        <td>{it.quantity}</td>
                                        <td>₹{it.price}</td>
                                        <td style={{ fontWeight: 700 }}>₹{it.price * it.quantity}</td>
                                    </tr>
                                ))}
                                <tr style={{ borderTop: '2px solid var(--border)' }}>
                                    <td colSpan={3} style={{ fontWeight: 700, textAlign: 'right' }}>Total</td>
                                    <td style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>₹{order.totalAmount}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Update Status</label>
                        <select className="form-select" value={order.status} onChange={e => onStatusChange(order._id, e.target.value)}>
                            {STATUSES.filter(s => s !== 'all').map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-outline" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}

export default function Orders() {
    const { socket } = useSocket();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const loadOrders = useCallback(async () => {
        try {
            const params = { page, limit: 10 };
            if (filter !== 'all') params.status = filter;
            const res = await orderAPI.getAll(params);
            setOrders(res.data.data || res.data); // Support both old and new API response formats
            setTotalPages(res.data.totalPages || 1);
        } catch { toast.error('Failed to load orders'); }
        finally { setLoading(false); }
    }, [filter, page]);

    useEffect(() => { loadOrders(); }, [loadOrders]);

    useEffect(() => {
        if (!socket) return;
        const onNew = (order) => {
            toast.success(`New order from ${order.customerName}!`, { duration: 6000 });
            loadOrders();
        };
        const onUpdate = () => loadOrders();
        socket.on('new-order', onNew);
        socket.on('order-status-update', onUpdate);
        return () => { socket.off('new-order', onNew); socket.off('order-status-update', onUpdate); };
    }, [socket, loadOrders]);

    const handleStatusChange = async (id, status) => {
        try {
            await orderAPI.updateStatus(id, status);
            toast.success(`Order status → ${status}`);
            loadOrders();
            if (selectedOrder?._id === id) setSelectedOrder(prev => ({ ...prev, status }));
        } catch { toast.error('Failed to update status'); }
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {STATUSES.map(s => (
                        <button
                            key={s}
                            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setFilter(s)}
                        >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
                <button className="btn btn-outline" onClick={loadOrders}>
                    <RefreshCw size={15} /> Refresh
                </button>
            </div>

            {loading ? (
                <div className="flex-center" style={{ height: '40vh' }}><p className="text-muted">Loading orders...</p></div>
            ) : orders.length === 0 ? (
                <div className="empty-state">
                    <ShoppingBag size={48} />
                    <h3>No orders found</h3>
                    <p>Orders placed via WhatsApp will appear here in real-time.</p>
                </div>
            ) : (
                <div className="card" style={{ padding: 0 }}>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Phone</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Time</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order._id}>
                                        <td>
                                            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: 'var(--bg-dark)', padding: '3px 8px', borderRadius: 4 }}>
                                                #{order._id.slice(-6).toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{order.customerName}</td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{order.customerPhone.replace('@c.us', '')}</td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{order.items.length} items</td>
                                        <td style={{ fontWeight: 800, color: 'var(--primary)' }}>₹{order.totalAmount}</td>
                                        <td>
                                            <select
                                                value={order.status}
                                                onChange={e => handleStatusChange(order._id, e.target.value)}
                                                style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '4px 8px', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer' }}
                                            >
                                                {STATUSES.filter(s => s !== 'all').map(s => <option key={s}>{s}</option>)}
                                            </select>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                            {new Date(order.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td>
                                            <button className="btn btn-sm btn-outline" onClick={() => setSelectedOrder(order)}>View</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
            )}

            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onStatusChange={handleStatusChange}
                />
            )}
        </>
    );
}
