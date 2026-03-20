import { useState, useEffect, useCallback } from 'react';
import { menuAPI } from '../api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, UtensilsCrossed, Search, X, Image as ImageIcon } from 'lucide-react';
import Pagination from '../components/Pagination';

const CATEGORIES = ['Starters', 'Main Course', 'Rice & Biryani', 'Breads', 'Desserts', 'Beverages', 'Snacks', 'Combos'];

function MenuModal({ item, onClose, onSave }) {
    const [form, setForm] = useState({
        name: item?.name || '',
        description: item?.description || '',
        price: item?.price || '',
        category: item?.category || CATEGORIES[0],
        isAvailable: item?.isAvailable !== false,
    });
    const [imageFile, setImageFile] = useState(null);
    const [preview, setPreview] = useState(item?.image ? item.image : '');
    const [saving, setSaving] = useState(false);

    const handleImageChange = (e) => {
        const f = e.target.files[0];
        if (f) {
            setImageFile(f);
            setPreview(URL.createObjectURL(f));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.price || !form.category) return toast.error('Please fill all required fields');
        setSaving(true);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => fd.append(k, v));
            if (imageFile) fd.append('image', imageFile);
            if (item) {
                await menuAPI.update(item._id, fd);
                toast.success('Menu item updated!');
            } else {
                await menuAPI.create(fd);
                toast.success('Menu item added!');
            }
            onSave();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error saving item');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <h2 className="modal-title">{item ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
                    <button className="btn-icon btn" onClick={onClose}><X size={16} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Image</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                {preview && <img src={preview} alt="preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />}
                                <input type="file" accept="image/*" onChange={handleImageChange} style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Item Name *</label>
                                <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Chicken Biryani" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Price (₹) *</label>
                                <input className="form-input" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="150" min="0" required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Category *</label>
                            <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description of the item..." />
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                <input type="checkbox" checked={form.isAvailable} onChange={e => setForm(f => ({ ...f, isAvailable: e.target.checked }))}
                                    style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Available for ordering</span>
                            </label>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function MenuManagement() {
    const [items, setItems] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);

    const loadItems = useCallback(async () => {
        setLoading(true);
        try {
            const res = await menuAPI.getAll({ page, limit: 10 });
            setItems(res.data.data || res.data);
            setTotalPages(res.data.totalPages || 1);
        } catch {
            toast.error('Failed to load menu');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => { loadItems(); }, [loadItems]);

    useEffect(() => {
        let result = items;
        if (selectedCategory !== 'All') result = result.filter(i => i.category === selectedCategory);
        if (search) result = result.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
        setFiltered(result);
    }, [items, search, selectedCategory]);

    const handleDelete = async (id) => {
        if (!confirm('Delete this menu item?')) return;
        try {
            await menuAPI.delete(id);
            toast.success('Item deleted');
            loadItems();
        } catch {
            toast.error('Failed to delete');
        }
    };

    const categories = ['All', ...new Set(items.map(i => i.category))];

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div className="search-bar">
                        <Search size={16} />
                        <input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className="form-select" style={{ width: 'auto', padding: '9px 14px' }}
                        value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                        {categories.map(c => <option key={c}>{c}</option>)}
                    </select>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditItem(null); setModalOpen(true); }}>
                    <Plus size={16} /> Add Item
                </button>
            </div>

            {loading ? (
                <div className="flex-center" style={{ height: '40vh' }}><p className="text-muted">Loading menu...</p></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <UtensilsCrossed size={48} />
                    <h3>No menu items found</h3>
                    <p>Add your first item to get started</p>
                    <button className="btn btn-primary" onClick={() => { setEditItem(null); setModalOpen(true); }}><Plus size={16} />Add Item</button>
                </div>
            ) : (
                <div className="menu-grid">
                    {filtered.map(item => (
                        <div key={item._id} className="menu-card">
                            {item.image
                                ? <img className="menu-card-img" src={item.image} alt={item.name} />
                                : <div className="menu-card-img-placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={32} color="var(--text-muted)" /></div>
                            }
                            <div className="menu-card-body">
                                <div className="category-tag">{item.category}</div>
                                <div className="menu-card-name">{item.name}</div>
                                <div className="menu-card-desc">{item.description || 'No description'}</div>
                                <div className="menu-card-footer">
                                    <div>
                                        <div className="menu-card-price">₹{item.price}</div>
                                        <div style={{ fontSize: '0.72rem', color: item.isAvailable ? 'var(--success)' : 'var(--danger)', marginTop: 4, fontWeight: 600 }}>
                                            {item.isAvailable ? '● Available' : '● Unavailable'}
                                        </div>
                                    </div>
                                    <div className="menu-card-actions">
                                        <button className="btn btn-icon" title="Edit" onClick={() => { setEditItem(item); setModalOpen(true); }}>
                                            <Pencil size={14} />
                                        </button>
                                        <button className="btn btn-icon btn-danger" title="Delete" onClick={() => handleDelete(item._id)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {!loading && filtered.length > 0 && (
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            )}

            {modalOpen && (
                <MenuModal
                    item={editItem}
                    onClose={() => setModalOpen(false)}
                    onSave={() => { setModalOpen(false); loadItems(); }}
                />
            )}
        </>
    );
}
