import Head from 'next/head';
import { useState } from 'react';

const COLORS = { brand: '#FF5722', green: '#22c55e', red: '#ef4444', yellow: '#f59e0b' };

const INITIAL_MENU = [
  { id: 'm1', name: 'Chicken Biryani', category: 'Biryani', price: 299, isVeg: false, isAvailable: true },
  { id: 'm2', name: 'Paneer Tikka', category: 'Starters', price: 249, isVeg: true, isAvailable: true },
  { id: 'm3', name: 'Dal Makhani', category: 'Mains', price: 199, isVeg: true, isAvailable: true },
  { id: 'm4', name: 'Gulab Jamun', category: 'Desserts', price: 99, isVeg: true, isAvailable: true },
  { id: 'm5', name: 'Butter Chicken', category: 'Mains', price: 319, isVeg: false, isAvailable: false },
  { id: 'm6', name: 'Garlic Naan', category: 'Breads', price: 49, isVeg: true, isAvailable: true },
];
const CATEGORIES = ['Starters', 'Mains', 'Biryani', 'Breads', 'Desserts', 'Beverages'];

export default function MenuManagement() {
  const [menu, setMenu] = useState(INITIAL_MENU);
  const [filter, setFilter] = useState('All');
  const [editing, setEditing] = useState(null); // item being edited
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: 'Mains', price: '', isVeg: true });
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const toggleAvailability = (id) => {
    setMenu(m => m.map(item => item.id === id ? { ...item, isAvailable: !item.isAvailable } : item));
    const item = menu.find(i => i.id === id);
    showToast(`${item.name} marked ${item.isAvailable ? 'unavailable' : 'available'}`);
  };

  const saveEdit = () => {
    setMenu(m => m.map(item => item.id === editing.id ? editing : item));
    setEditing(null);
    showToast('Item updated successfully');
  };

  const deleteItem = (id) => {
    if (!confirm('Delete this item?')) return;
    setMenu(m => m.filter(i => i.id !== id));
    showToast('Item deleted');
  };

  const addItem = () => {
    if (!newItem.name || !newItem.price) return;
    setMenu(m => [...m, { ...newItem, id: 'm' + Date.now(), isAvailable: true, price: parseInt(newItem.price) }]);
    setNewItem({ name: '', category: 'Mains', price: '', isVeg: true });
    setShowAdd(false);
    showToast('New item added!');
  };

  const filtered = filter === 'All' ? menu : menu.filter(i => i.category === filter);
  const allCats = ['All', ...CATEGORIES];

  return (
    <>
      <Head><title>Menu Management — F&G Partner Portal</title></Head>
      <div style={s.page}>
        {/* Toast */}
        {toast && <div style={s.toast}>{toast}</div>}

        <div style={s.header}>
          <div>
            <h1 style={s.title}>🍽️ Menu Management</h1>
            <p style={s.sub}>{menu.length} items · {menu.filter(i => i.isAvailable).length} available</p>
          </div>
          <button style={s.addBtn} onClick={() => setShowAdd(!showAdd)}>+ Add Item</button>
        </div>

        {/* Add item form */}
        {showAdd && (
          <div style={s.addForm}>
            <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 800 }}>Add New Menu Item</h3>
            <div style={s.formRow}>
              <input
                style={s.input} placeholder="Item name *"
                value={newItem.name} onChange={e => setNewItem(n => ({ ...n, name: e.target.value }))}
              />
              <input
                style={s.input} placeholder="Price (₹) *" type="number"
                value={newItem.price} onChange={e => setNewItem(n => ({ ...n, price: e.target.value }))}
              />
              <select
                style={s.input} value={newItem.category}
                onChange={e => setNewItem(n => ({ ...n, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <label style={s.vegToggle}>
                <input type="checkbox" checked={newItem.isVeg} onChange={e => setNewItem(n => ({ ...n, isVeg: e.target.checked }))} />
                <span style={{ color: newItem.isVeg ? COLORS.green : COLORS.red, fontWeight: 700, fontSize: 12 }}>
                  {newItem.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                </span>
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button style={s.saveBtn} onClick={addItem}>Add Item</button>
              <button style={s.cancelBtn} onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Category filter */}
        <div style={s.filterRow}>
          {allCats.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              style={{ ...s.filterBtn, ...(filter === cat ? s.filterActive : {}) }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Menu table */}
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {['Item', 'Category', 'Price', 'Type', 'Status', 'Actions'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} style={{ ...s.row, opacity: item.isAvailable ? 1 : 0.5 }}>
                  <td style={s.td}>
                    {editing?.id === item.id
                      ? <input style={{ ...s.input, padding: '4px 8px', fontSize: 12 }} value={editing.name} onChange={e => setEditing(ed => ({ ...ed, name: e.target.value }))} />
                      : <span style={{ fontWeight: 600 }}>{item.name}</span>}
                  </td>
                  <td style={s.td}>
                    {editing?.id === item.id
                      ? <select style={{ ...s.input, padding: '4px 8px', fontSize: 12 }} value={editing.category} onChange={e => setEditing(ed => ({ ...ed, category: e.target.value }))}>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      : <span style={s.catBadge}>{item.category}</span>}
                  </td>
                  <td style={s.td}>
                    {editing?.id === item.id
                      ? <input style={{ ...s.input, padding: '4px 8px', fontSize: 12, width: 80 }} type="number" value={editing.price} onChange={e => setEditing(ed => ({ ...ed, price: parseInt(e.target.value) }))} />
                      : <span style={{ fontWeight: 700, color: COLORS.brand }}>₹{item.price}</span>}
                  </td>
                  <td style={s.td}>
                    <span style={{ color: item.isVeg ? COLORS.green : COLORS.red, fontWeight: 700, fontSize: 11 }}>
                      {item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <button
                      onClick={() => toggleAvailability(item.id)}
                      style={{ ...s.toggleBtn, background: item.isAvailable ? COLORS.green + '22' : COLORS.red + '22', color: item.isAvailable ? COLORS.green : COLORS.red, borderColor: item.isAvailable ? COLORS.green + '44' : COLORS.red + '44' }}>
                      {item.isAvailable ? '● Available' : '○ Unavailable'}
                    </button>
                  </td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {editing?.id === item.id ? (
                        <>
                          <button style={s.editSave} onClick={saveEdit}>Save</button>
                          <button style={s.editCancel} onClick={() => setEditing(null)}>✕</button>
                        </>
                      ) : (
                        <>
                          <button style={s.editBtn} onClick={() => setEditing({ ...item })}>✏️</button>
                          <button style={s.delBtn} onClick={() => deleteItem(item.id)}>🗑️</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div style={s.empty}>No items in this category.</div>}
        </div>
      </div>
    </>
  );
}

const s = {
  page: { padding: 24, position: 'relative' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 900 },
  sub: { color: '#888', fontSize: 12, marginTop: 4 },
  addBtn: { padding: '10px 20px', background: COLORS.brand, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 13 },
  addForm: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 16, padding: 20, marginBottom: 20 },
  formRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  input: { background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, color: '#f0f0f0', padding: '8px 12px', fontSize: 13, outline: 'none', minWidth: 140 },
  vegToggle: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  saveBtn: { padding: '8px 20px', background: COLORS.green, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12 },
  cancelBtn: { padding: '8px 16px', background: 'transparent', color: '#888', border: '1px solid #2a2a2a', borderRadius: 8, fontWeight: 600, fontSize: 12 },
  filterRow: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  filterBtn: { padding: '6px 14px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 20, color: '#888', fontSize: 12, fontWeight: 600 },
  filterActive: { background: '#FF572214', borderColor: COLORS.brand, color: COLORS.brand },
  tableWrap: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 16, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase', borderBottom: '1px solid #222' },
  row: { borderBottom: '1px solid #1a1a1a', transition: 'background 0.15s' },
  td: { padding: '12px 16px', fontSize: 13 },
  catBadge: { background: '#2a2a2a', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#aaa' },
  toggleBtn: { padding: '4px 10px', border: '1px solid', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  editBtn: { border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, padding: 4 },
  delBtn: { border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, padding: 4 },
  editSave: { padding: '4px 10px', background: COLORS.green, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 11 },
  editCancel: { padding: '4px 8px', background: '#2a2a2a', color: '#888', border: 'none', borderRadius: 6, fontSize: 11 },
  empty: { padding: 40, textAlign: 'center', color: '#555' },
  toast: { position: 'fixed', bottom: 24, right: 24, background: '#1a1a1a', border: '1px solid #FF5722', borderRadius: 12, padding: '12px 20px', color: '#f0f0f0', fontSize: 13, fontWeight: 600, zIndex: 999, boxShadow: '0 8px 32px #0008' },
};
