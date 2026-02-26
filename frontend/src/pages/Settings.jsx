import { useTheme } from '../context/ThemeContext';
import { Palette, Check, Store, Phone, Clock, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
    const { theme, setTheme, THEMES } = useTheme();

    return (
        <>
            {/* Shop Info Card */}
            <div className="card mb-6">
                <div className="card-header" style={{ marginBottom: 20 }}>
                    <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Store size={18} /> Shop Information
                    </h2>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Shop Name</label>
                        <input className="form-input" defaultValue="Venkatesh Kitchen" readOnly style={{ opacity: 0.7, cursor: 'not-allowed' }} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">WhatsApp Number</label>
                        <input className="form-input" defaultValue="Linked via QR Code" readOnly style={{ opacity: 0.7, cursor: 'not-allowed' }} />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Opening Hours</label>
                        <input className="form-input" defaultValue="9:00 AM – 10:00 PM" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Address</label>
                        <input className="form-input" placeholder="Enter shop address..." />
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" onClick={() => toast.success('Settings saved!')}>Save Changes</button>
                </div>
            </div>

            {/* Theme Picker Card */}
            <div className="card mb-6">
                <div className="card-header" style={{ marginBottom: 16 }}>
                    <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Palette size={18} /> Color Theme
                    </h2>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Pick your admin panel accent color</span>
                </div>

                <div className="theme-grid">
                    {THEMES.map(t => (
                        <div key={t.id} style={{ textAlign: 'center' }}>
                            <div
                                className={`theme-swatch${theme === t.id ? ' active' : ''}`}
                                style={{ background: t.color }}
                                onClick={() => {
                                    setTheme(t.id);
                                    toast.success(`Theme changed to ${t.label}!`);
                                }}
                                title={t.label}
                            />
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>{t.label}</div>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: 24, padding: '16px 20px', background: 'var(--bg-dark)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 8 }}>Preview</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <button className="btn btn-primary btn-sm">Primary Button</button>
                        <button className="btn btn-outline btn-sm">Outline Button</button>
                        <span style={{ padding: '4px 12px', background: 'var(--primary-light)', color: 'var(--primary-dark)', borderRadius: 99, fontSize: '0.78rem', fontWeight: 700 }}>Badge</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem' }}>₹1,500</span>
                    </div>
                </div>
            </div>

            {/* WhatsApp Bot Config */}
            <div className="card">
                <div className="card-header" style={{ marginBottom: 16 }}>
                    <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Phone size={18} /> WhatsApp Bot Messages
                    </h2>
                </div>
                <div className="form-group">
                    <label className="form-label">Welcome Message</label>
                    <textarea className="form-textarea" defaultValue="👋 Welcome to Venkatesh Kitchen! Type 'hi' or 'menu' to start ordering. 🍽️" style={{ minHeight: 70 }} />
                </div>
                <div className="form-group">
                    <label className="form-label">Order Confirmed Message</label>
                    <textarea className="form-textarea" defaultValue="✅ Your order has been confirmed! We are getting it ready." style={{ minHeight: 70 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" onClick={() => toast.success('Bot config saved!')}>Save Bot Config</button>
                </div>
            </div>
        </>
    );
}
