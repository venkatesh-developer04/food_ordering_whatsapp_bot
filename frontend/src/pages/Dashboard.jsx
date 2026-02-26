import { useState, useEffect, useCallback } from 'react';
import { orderAPI } from '../api';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import {
    ShoppingBag, Clock, ChefHat, TrendingUp, PackageCheck, IndianRupee
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
    <div className="stat-card">
        <div className="stat-icon" style={{ background: bg }}>
            <Icon size={24} color={color} />
        </div>
        <div className="stat-info">
            <div className="label">{label}</div>
            <div className="value">{value}</div>
        </div>
    </div>
);

const STATUS_MAP = {
    pending: { label: 'Pending', cls: 'status-pending' },
    confirmed: { label: 'Confirmed', cls: 'status-confirmed' },
    preparing: { label: 'Preparing', cls: 'status-preparing' },
    ready: { label: 'Ready', cls: 'status-ready' },
    delivered: { label: 'Delivered', cls: 'status-delivered' },
    cancelled: { label: 'Cancelled', cls: 'status-cancelled' },
};

export default function Dashboard() {
    const { socket } = useSocket();
    const [stats, setStats] = useState({ total: 0, pending: 0, preparing: 0, delivered: 0, revenue: 0, dailyRevenue: [] });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const [statsRes, ordersRes] = await Promise.all([
                orderAPI.getStats(),
                orderAPI.getAll(),
            ]);
            setStats(statsRes.data);
            setRecentOrders(ordersRes.data.slice(0, 8));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => {
        if (!socket) return;
        const handleNewOrder = (order) => {
            toast.success(`🛍️ New order from ${order.customerName}!`, { duration: 5000 });
            loadData();
        };
        const handleStatusUpdate = () => loadData();
        socket.on('new-order', handleNewOrder);
        socket.on('order-status-update', handleStatusUpdate);
        return () => {
            socket.off('new-order', handleNewOrder);
            socket.off('order-status-update', handleStatusUpdate);
        };
    }, [socket, loadData]);

    const chartData = stats.dailyRevenue.map(d => ({
        date: new Date(d._id).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        revenue: d.revenue,
        orders: d.count,
    }));

    if (loading) return (
        <div className="flex-center" style={{ height: '50vh' }}>
            <div style={{ color: 'var(--text-muted)' }}>Loading dashboard...</div>
        </div>
    );

    return (
        <>
            <div className="stats-grid">
                <StatCard icon={ShoppingBag} label="Total Orders" value={stats.total} color="#f97316" bg="rgba(249,115,22,0.15)" />
                <StatCard icon={Clock} label="Pending" value={stats.pending} color="#f59e0b" bg="rgba(245,158,11,0.15)" />
                <StatCard icon={ChefHat} label="Preparing" value={stats.preparing} color="#8b5cf6" bg="rgba(139,92,246,0.15)" />
                <StatCard icon={PackageCheck} label="Delivered" value={stats.delivered} color="#22c55e" bg="rgba(34,197,94,0.15)" />
                <StatCard icon={IndianRupee} label="Revenue" value={`₹${stats.revenue.toLocaleString('en-IN')}`} color="#06b6d4" bg="rgba(6,182,212,0.15)" />
            </div>

            <div className="grid-2 mb-6">
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Revenue (Last 7 Days)</h2>
                    </div>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                                    labelStyle={{ color: 'var(--text-primary)' }}
                                    formatter={(v) => [`₹${v}`, 'Revenue']}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fill="url(#revGrad)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state" style={{ padding: '40px 0' }}>
                            <TrendingUp size={32} />
                            <p>No revenue data yet</p>
                        </div>
                    )}
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Recent Orders</h2>
                    </div>
                    {recentOrders.length === 0 ? (
                        <div className="empty-state" style={{ padding: '40px 0' }}>
                            <ShoppingBag size={32} />
                            <p>No orders yet</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Customer</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Amount</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentOrders.map(o => (
                                        <tr key={o._id} style={{ borderTop: '1px solid var(--border)' }}>
                                            <td style={{ padding: '10px 12px' }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{o.customerName}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.customerPhone.replace('@c.us', '')}</div>
                                            </td>
                                            <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--primary)' }}>₹{o.totalAmount}</td>
                                            <td style={{ padding: '10px 12px' }}>
                                                <span className={`status-badge ${STATUS_MAP[o.status]?.cls}`}>{STATUS_MAP[o.status]?.label}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
