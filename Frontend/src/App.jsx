import { useEffect, useMemo, useState } from 'react';

const API_BASE_URL = '/api';

const emptyForm = {
  name: '',
  price: '',
  description: ''
};

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.detail || payload?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

function normalizeItems(payload) {
  const data = payload?.data || {};
  return Object.entries(data).map(([id, item]) => ({
    id: Number(id),
    name: item.name,
    price: item.price,
    description: item.description || ''
  }));
}

export default function App() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadItems() {
    setLoading(true);
    setError('');
    try {
      const payload = await requestJson('/items');
      const nextItems = normalizeItems(payload);
      setItems(nextItems);
      if (selectedItem) {
        const refreshed = nextItems.find((item) => item.id === selectedItem.id);
        if (refreshed) {
          setSelectedItem(refreshed);
          setForm({
            name: refreshed.name,
            price: String(refreshed.price),
            description: refreshed.description || ''
          });
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  const totalValue = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price || 0), 0).toFixed(2),
    [items]
  );

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setSelectedItem(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      description: form.description.trim() || null
    };

    if (!payload.name || Number.isNaN(payload.price)) {
      setError('Please enter a valid name and price.');
      setSaving(false);
      return;
    }

    try {
      if (selectedItem) {
        await requestJson(`/items/${selectedItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setSuccess('Item updated successfully.');
      } else {
        await requestJson('/items', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setSuccess('Item created successfully.');
      }

      resetForm();
      await loadItems();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(item) {
    setSelectedItem(item);
    setForm({
      name: item.name,
      price: String(item.price),
      description: item.description || ''
    });
    setSuccess('');
    setError('');
  }

  async function handleDelete(itemId) {
    const confirmed = window.confirm('Delete this item?');
    if (!confirmed) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await requestJson(`/items/${itemId}`, { method: 'DELETE' });
      setSuccess('Item deleted successfully.');
      if (selectedItem?.id === itemId) {
        resetForm();
      }
      await loadItems();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="backdrop backdrop-a" />
      <div className="backdrop backdrop-b" />

      <main className="layout">
        <section className="hero card">
          <div>
            <p className="eyebrow">HTTPS React frontend</p>
            <h1>Chaters Shop Admin</h1>
            <p className="hero-copy">
              Basic CRUD interface for the FastAPI backend at {API_BASE_URL}.
            </p>
          </div>
          <div className="stats">
            <div>
              <span>Total items</span>
              <strong>{items.length}</strong>
            </div>
            <div>
              <span>Total value</span>
              <strong>${totalValue}</strong>
            </div>
          </div>
        </section>

        <section className="content-grid">
          <form className="card form-card" onSubmit={handleSubmit}>
            <div className="card-header">
              <div>
                <p className="eyebrow">{selectedItem ? 'Edit item' : 'Create item'}</p>
                <h2>{selectedItem ? `Item #${selectedItem.id}` : 'New item'}</h2>
              </div>
              {selectedItem && (
                <button type="button" className="ghost-button" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>

            <label>
              <span>Name</span>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Product name" />
            </label>

            <label>
              <span>Price</span>
              <input
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="0.00"
                inputMode="decimal"
              />
            </label>

            <label>
              <span>Description</span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Optional note"
                rows="5"
              />
            </label>

            {error && <p className="message error">{error}</p>}
            {success && <p className="message success">{success}</p>}

            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'Saving...' : selectedItem ? 'Update item' : 'Create item'}
            </button>
          </form>
          <h1>ehhee</h1>
          <section className="card table-card">
            <div className="card-header">
              <div>
                <p className="eyebrow">Inventory</p>
                <h2>Items</h2>
              </div>
              <button type="button" className="ghost-button" onClick={loadItems} disabled={loading}>
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="state-block">Loading items...</div>
            ) : items.length === 0 ? (
              <div className="state-block">No items found yet.</div>
            ) : (
              <div className="item-list">
                {items.map((item) => (
                  <article key={item.id} className="item-row">
                    <div>
                      <div className="item-title">
                        <h3>{item.name}</h3>
                        <span>#{item.id}</span>
                      </div>
                      <p className="item-meta">${Number(item.price).toFixed(2)}</p>
                      {item.description && <p className="item-description">{item.description}</p>}
                    </div>

                    <div className="row-actions">
                      <button type="button" className="secondary-button" onClick={() => startEdit(item)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => handleDelete(item.id)}
                        disabled={saving}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}
