import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit, Save, X, IndianRupee, Users, Clock, ShieldCheck, LogOut, ArrowRightCircle, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import './index.css';

const api = axios.create({ baseURL: '/api/admin' });

function Login({ onLogin }) {
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/login', { username: user, password: pass });
            onLogin();
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        }
    };

    return (
        <div className="flex-center">
            <form onSubmit={handleLogin} className="login-box">
                <h2><ShieldCheck size={32} color="#3b82f6" style={{ verticalAlign: 'middle', marginRight: 8 }}/> Admin Login</h2>
                {error && <div style={{ color: '#ef4444', marginBottom: 16, fontSize: '0.9rem', textAlign: 'center', fontWeight: '500' }}>{error}</div>}
                <div className="form-group">
                    <label>Username</label>
                    <input autoFocus required value={user} onChange={e => setUser(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input type="password" required value={pass} onChange={e => setPass(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>Login Securely</button>
            </form>
        </div>
    );
}

export default function App() {
    const [auth, setAuth] = useState(sessionStorage.getItem('waAuth') === 'true');
    const [tenants, setTenants] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editTenant, setEditTenant] = useState(null);

    const [formData, setFormData] = useState({
        name: '', subdomain: '', email: '', phone: '', status: 'active',
        subscription: { plan: 'basic', endDate: '' }
    });

    const loadTenants = async () => {
        if (!auth) return;
        try {
            const { data } = await api.get('/tenants');
            setTenants(data);
        } catch (e) {
            console.error('Failed to load tenants');
        }
    };

    useEffect(() => { loadTenants(); }, [auth]);

    const handlePlanChange = (plan) => {
        const today = new Date();
        const endDate = new Date(today);
        if (plan === 'basic') endDate.setMonth(today.getMonth() + 1);
        else if (plan === 'pro') endDate.setMonth(today.getMonth() + 3);
        else if (plan === 'enterprise') endDate.setFullYear(today.getFullYear() + 1);

        setFormData({
            ...formData,
            subscription: { plan, endDate: endDate.toISOString().split('T')[0] }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editTenant) await api.put(`/tenants/${editTenant._id}`, formData);
            else await api.post('/tenants', formData);
            setShowModal(false);
            loadTenants();
        } catch (err) {
            alert(`Failed to save tenant: ${err.response?.data?.error || err.message}`);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this tenant?')) return;
        try {
            await api.delete(`/tenants/${id}`);
            loadTenants();
        } catch (err) { alert('Delete failed'); }
    };

    const copyPaymentLink = (t) => {
        const link = `http://localhost:3001/?checkout=${t._id}`;
        navigator.clipboard.writeText(link);
        alert(`Payment link copied for ${t.name}!\n\n${link}`);
    };

    const openEdit = (t) => {
        setEditTenant(t);
        setFormData({
            name: t.name, subdomain: t.subdomain, email: t.email, phone: t.phone, status: t.status,
            subscription: {
                plan: t.subscription?.plan || 'basic',
                endDate: t.subscription?.endDate ? new Date(t.subscription.endDate).toISOString().split('T')[0] : ''
            }
        });
        setShowModal(true);
    };

    const openAdd = () => {
        setEditTenant(null);
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        setFormData({ name: '', subdomain: '', email: '', phone: '', status: 'active', subscription: { plan: 'basic', endDate: nextMonth.toISOString().split('T')[0] } });
        setShowModal(true);
    };

    if (!auth) {
        return <Login onLogin={() => {
            sessionStorage.setItem('waAuth', 'true');
            setAuth(true);
        }} />;
    }

    // Dashboard calculations
    const activeCount = tenants.filter(t => t.status === 'active').length;
    const inactiveCount = tenants.filter(t => t.status !== 'active').length;
    const rev = tenants.filter(t => t.status === 'active').reduce((acc, t) => {
        if (t.subscription?.plan === 'basic') return acc + 499;
        if (t.subscription?.plan === 'pro') return acc + 1299;
        return acc;
    }, 0);

    return (
        <div className="admin-container">
            <header className="header">
                <h1><ShieldCheck size={28} color="#3b82f6"/> Master Control Panel</h1>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-primary" onClick={openAdd}>
                        <Plus size={18} /> Add New Tenant
                    </button>
                    <button className="btn btn-outline" onClick={() => { sessionStorage.removeItem('waAuth'); setAuth(false); }}>
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </header>

            <div className="dash-grid">
                <div className="dash-card">
                    <div className="dash-icon" style={{ background: '#dcfce7', color: '#16a34a' }}><Users size={24}/></div>
                    <div className="dash-info">
                        <div className="label">Active Tenants</div>
                        <div className="value">{activeCount}</div>
                    </div>
                </div>
                <div className="dash-card">
                    <div className="dash-icon" style={{ background: '#fee2e2', color: '#ef4444' }}><Clock size={24}/></div>
                    <div className="dash-info">
                        <div className="label">Pending / Inactive</div>
                        <div className="value">{inactiveCount}</div>
                    </div>
                </div>
                <div className="dash-card">
                    <div className="dash-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}><IndianRupee size={24}/></div>
                    <div className="dash-info">
                        <div className="label">Active Revenue</div>
                        <div className="value">₹{rev.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            <main className="content">
                <div className="card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Contact</th>
                                <th>Plan</th>
                                <th>Expiry</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tenants.map(t => (
                                <tr key={t._id}>
                                    <td className="fw-600">{t.name}<br/><small className="text-muted">{t.subdomain}</small></td>
                                    <td>{t.email}<br/><small className="text-muted">{t.phone}</small></td>
                                    <td><span className={`badge plan-${t.subscription?.plan}`}>{t.subscription?.plan}</span></td>
                                    <td style={{ fontWeight: 500 }}>{new Date(t.subscription?.endDate).toLocaleDateString('en-GB')}</td>
                                    <td><span className={`badge status-${t.status}`}>{t.status}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {t.status === 'inactive' && (
                                                <button className="btn-icon" onClick={() => copyPaymentLink(t)} title="Copy Payment Link" style={{ color: '#8b5cf6' }}>
                                                    <LinkIcon size={18}/>
                                                </button>
                                            )}
                                            <a href={`http://${t.subdomain}.localhost:5174/`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                                                <ArrowRightCircle size={14} /> Open
                                            </a>
                                            <button className="btn-icon" onClick={() => openEdit(t)} title="Edit Tenant"><Edit size={18}/></button>
                                            <button className="btn-icon text-danger" onClick={() => handleDelete(t._id)} title="Delete Tenant"><Trash2 size={18}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {tenants.length === 0 && <div className="text-muted text-center" style={{ padding: '40px' }}>No tenants provisioned yet. Create your first tenant!</div>}
                </div>
            </main>

            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>{editTenant ? 'Edit Subscriber' : 'Provision New Tenant'}</h2>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><X size={24}/></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Business Name</label>
                                        <input required placeholder="Enter restaurant name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Subdomain (URL Slug)</label>
                                        <input required pattern="^[a-z0-9-]+$" placeholder="my-restaurant" value={formData.subdomain} onChange={e => setFormData({...formData, subdomain: e.target.value})} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <input required type="email" pattern="[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-zA-Z]{2,4}" placeholder="contact@business.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>WhatsApp Number</label>
                                        <input required type="tel" pattern="[0-9]{10}" placeholder="10 digit mobile number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} title="Must be exactly 10 digits" />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Subscription Tier</label>
                                        <select value={formData.subscription.plan} onChange={e => handlePlanChange(e.target.value)}>
                                            <option value="basic">Basic Plan (1 Month - ₹499)</option>
                                            <option value="pro">Pro Plan (3 Months - ₹1299)</option>
                                            <option value="enterprise">Enterprise Plan (Custom)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Billing End Date</label>
                                        <input required type="date" value={formData.subscription.endDate} onChange={e => setFormData({...formData, subscription: { ...formData.subscription, endDate: e.target.value }})} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Account Status</label>
                                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                        <option value="active">Active - Online</option>
                                        <option value="inactive">Inactive - Pending setup</option>
                                        <option value="suspended">Suspended - Billing disabled</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary"><Save size={18}/> {editTenant ? 'Update Records' : 'Save & Provision'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
