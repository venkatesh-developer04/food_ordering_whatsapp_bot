import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { Palette, Check, Store, Phone, Clock, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

export default function Settings() {
    const { theme, setTheme, THEMES } = useTheme();
    const { settings, updateSettings, isLoaded } = useSettings();
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (settings) {
            setFormData(settings);
        }
    }, [settings]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSaveShop = async () => {
        try {
            await updateSettings({
                shopName: formData.shopName,
                address: formData.address,
                openingHours: formData.openingHours,
            });
            toast.success('Settings saved!');
        } catch (err) {
            toast.error('Failed to save settings');
        }
    };

    const handleSaveBot = async () => {
        try {
            await updateSettings({
                welcomeMessage: formData.welcomeMessage,
                orderConfirmMessage: formData.orderConfirmMessage,
                fallbackMessage: formData.fallbackMessage,
            });
            toast.success('Bot config saved!');
        } catch (err) {
            toast.error('Failed to save config');
        }
    };

    if (!isLoaded) return <div style={{ padding: 20 }}>Loading settings...</div>;

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
                        <input name="shopName" value={formData.shopName || ''} onChange={handleChange} className="form-input" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">WhatsApp Number</label>
                        <input className="form-input" value="Linked via QR Code" readOnly style={{ opacity: 0.7, cursor: 'not-allowed' }} />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Opening Hours</label>
                        <input name="openingHours" value={formData.openingHours || ''} onChange={handleChange} className="form-input" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Address</label>
                        <input name="address" value={formData.address || ''} onChange={handleChange} className="form-input" placeholder="Enter shop address..." />
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" onClick={handleSaveShop}>Save Changes</button>
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
                    <label className="form-label">Welcome Message (Use {"{{restaurant_name}}"}, {"{{customer_name}}"})</label>
                    <textarea name="welcomeMessage" value={formData.welcomeMessage || ''} onChange={handleChange} className="form-textarea" style={{ minHeight: 70 }} />
                </div>
                <div className="form-group">
                    <label className="form-label">Order Confirmed Message (Use {"{{order_id}}"}, {"{{total_price}}"})</label>
                    <textarea name="orderConfirmMessage" value={formData.orderConfirmMessage || ''} onChange={handleChange} className="form-textarea" style={{ minHeight: 70 }} />
                </div>
                <div className="form-group">
                    <label className="form-label">Fallback Message (Use {"{{restaurant_name}}"})</label>
                    <textarea name="fallbackMessage" value={formData.fallbackMessage || ''} onChange={handleChange} className="form-textarea" style={{ minHeight: 70 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" onClick={handleSaveBot}>Save Bot Config</button>
                </div>
            </div>
        </>
    );
}
