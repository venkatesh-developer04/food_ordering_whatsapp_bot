import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, ClipboardList, QrCode, Settings, ChefHat } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useSettings } from '../context/SettingsContext';
import { useState, useEffect } from 'react';
import { orderAPI } from '../api';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/menu', icon: UtensilsCrossed, label: 'Menu Management' },
    { to: '/orders', icon: ClipboardList, label: 'Orders' },
    { to: '/qr', icon: QrCode, label: 'WhatsApp QR' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
    const { waStatus } = useSocket();
    const { settings } = useSettings();
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        orderAPI.getStats().then(r => setPendingCount(r.data.pending)).catch(() => { });
    }, []);

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: 38, height: 38, borderRadius: 10,
                        background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <ChefHat size={20} color="white" />
                    </div>
                    <div>
                        <div className="logo-name">{settings?.shopName || 'Shop Name'}</div>
                        <div className="logo-sub">Admin Panel</div>
                    </div>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section-label">Navigation</div>
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                    >
                        <Icon size={18} />
                        <span>{label}</span>
                        {label === 'Orders' && pendingCount > 0 && (
                            <span className="badge">{pendingCount}</span>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="wa-status">
                    <div className={`wa-dot ${waStatus === 'connected' ? 'connected' : waStatus === 'disconnected' ? 'disconnected' : ''}`} />
                    <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>WhatsApp</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{waStatus}</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
