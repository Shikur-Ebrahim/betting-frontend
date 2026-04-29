'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DepositMethodsPage() {
  const [view, setView] = useState<'create' | 'list'>('create');
  const [methodType, setMethodType] = useState<'bank' | 'telebirr'>('bank');
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    minDeposit: '500',
    phoneNumber: '',
    name: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [methods, setMethods] = useState<any[]>([]);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (role !== 'admin') router.push('/');
    fetchMethods();
  }, [router]);

  const fetchMethods = async () => {
    try {
      const res = await fetch('/api/admin/deposit-methods/list');
      const data = await res.json();
      if (data.success) setMethods(data.methods);
    } catch (err) {
      console.error('Fetch methods error:', err);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const uploadToCloudinary = async (file: File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dqzvvscvp'; 
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'tipico_presets'; 

    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', uploadPreset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: data
      });
      const result = await res.json();
      if (result.secure_url) return result.secure_url;
      throw new Error(result.error?.message || 'Upload failed');
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      let logoUrl = editingId ? (methods.find(m => m.id === editingId)?.logoUrl || '') : '';
      if (logo) {
        logoUrl = await uploadToCloudinary(logo);
      }

      const methodData = {
        type: methodType,
        logoUrl,
        ...(methodType === 'bank' ? {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountName: formData.accountName,
          minDeposit: Number(formData.minDeposit),
        } : {
          phoneNumber: formData.phoneNumber,
          name: formData.name,
          minDeposit: Number(formData.minDeposit),
        })
      };

      const url = editingId ? '/api/admin/deposit-methods/update' : '/api/admin/deposit-methods/create';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, methodData } : { methodData })
      });

      if (!res.ok) throw new Error('Failed to save deposit method');

      setMessage({ type: 'success', text: `Method ${editingId ? 'updated' : 'created'} successfully!` });
      resetForm();
      fetchMethods();
      setTimeout(() => setView('list'), 1500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ bankName: '', accountNumber: '', accountName: '', minDeposit: '', phoneNumber: '', name: '' });
    setLogo(null);
    setLogoPreview(null);
    setEditingId(null);
  };

  const handleEdit = (m: any) => {
    setEditingId(m.id);
    setMethodType(m.type);
    setFormData({
      bankName: m.bankName || '',
      accountNumber: m.accountNumber || '',
      accountName: m.accountName || '',
      minDeposit: m.minDeposit?.toString() || '',
      phoneNumber: m.phoneNumber || '',
      name: m.name || '',
    });
    setLogoPreview(m.logoUrl);
    setView('create');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this method?')) return;
    try {
      const res = await fetch(`/api/admin/deposit-methods/delete?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMethods(methods.filter(m => m.id !== id));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <Link href="/admin" className="back-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </Link>
        <h1>Manage Deposit Methods</h1>
        <button 
          className="view-toggle-btn"
          onClick={() => {
            if (view === 'create') setView('list');
            else { setView('create'); resetForm(); }
          }}
        >
          {view === 'create' ? 'See Methods' : 'Add New Method'}
        </button>
      </div>

      <div className="admin-form-card">
        {view === 'create' ? (
          <>
            <div className="type-selector">
              <button 
                className={methodType === 'bank' ? 'active' : ''} 
                onClick={() => setMethodType('bank')}
              >Bank Transfer</button>
              <button 
                className={methodType === 'telebirr' ? 'active' : ''} 
                onClick={() => setMethodType('telebirr')}
              >Telebirr</button>
            </div>

            <form onSubmit={handleSubmit}>
              {methodType === 'bank' ? (
                <>
                  <div className="form-group">
                    <label>Ethiopian Bank Name</label>
                    <select 
                      value={formData.bankName} 
                      onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                      required
                    >
                      <option value="">Select Bank</option>
                      <option value="Commercial Bank of Ethiopia">Commercial Bank of Ethiopia (CBE)</option>
                      <option value="Abyssinia Bank">Abyssinia Bank</option>
                      <option value="Dashen Bank">Dashen Bank</option>
                      <option value="Awash Bank">Awash Bank</option>
                      <option value="United Bank">United Bank</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Account Number</label>
                    <input 
                      type="text" 
                      value={formData.accountNumber} 
                      onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Account Name</label>
                    <input 
                      type="text" 
                      value={formData.accountName} 
                      onChange={(e) => setFormData({...formData, accountName: e.target.value})}
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Telebirr Phone Number</label>
                    <input 
                      type="tel" 
                      value={formData.phoneNumber} 
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                      placeholder="09..."
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Name</label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Minimum Deposit Amount (Birr)</label>
                <input 
                  type="number" 
                  value={formData.minDeposit} 
                  onChange={(e) => setFormData({...formData, minDeposit: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Logo Upload</label>
                <div className="logo-upload-wrapper">
                  <input type="file" accept="image/*" onChange={handleLogoChange} id="logo-input" hidden />
                  <label htmlFor="logo-input" className="upload-area">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="preview-img" />
                    ) : (
                      <div className="upload-placeholder">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                        <span>Click to upload Logo</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {message && (
                <div className={`form-message ${message.type}`}>
                  {message.text}
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Processing...' : (editingId ? 'Update Method' : 'Create Method')}
              </button>
            </form>
          </>
        ) : (
          <div className="methods-list">
            {methods.length === 0 ? (
              <div className="empty-state">No deposit methods found.</div>
            ) : (
              methods.map(m => (
                <div key={m.id} className="method-item-card">
                  <div className="method-logo-small">
                    {m.logoUrl ? <img src={m.logoUrl} alt="Logo" /> : <div className="no-logo">?</div>}
                  </div>
                  <div className="method-info">
                    <div className="method-name">{m.type === 'bank' ? m.bankName : 'Telebirr'}</div>
                    <div className="method-sub">
                      {m.type === 'bank' ? `${m.accountNumber} - ${m.accountName}` : `${m.phoneNumber} - ${m.name}`}
                    </div>
                    <div className="method-min">Min: {m.minDeposit} Birr</div>
                  </div>
                  <div className="method-actions">
                    <button className="edit-btn" onClick={() => handleEdit(m)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(m.id)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-page-container {
          padding: 16px; background: #fff; min-height: 100vh; position: fixed; inset: 0; z-index: 20001; overflow-y: auto; color: #333;
        }
        .admin-page-header {
          display: flex; align-items: center; gap: 12px; margin-bottom: 24px; flex-wrap: wrap;
        }
        .view-toggle-btn {
          margin-left: auto; padding: 8px 14px; background: #f0f0f0; border: none; border-radius: 8px; font-weight: 700; font-size: 11px; cursor: pointer; color: #111;
        }
        .view-toggle-btn:hover { background: #e5e5e5; }
        .back-btn { color: #333; padding: 6px; border-radius: 50%; background: #f0f0f0; display: flex; }
        h1 { font-size: 18px; font-weight: 800; }
        .admin-form-card { max-width: 500px; margin: 0 auto; }
        .type-selector {
          display: flex; gap: 8px; margin-bottom: 24px; background: #f0f0f0; padding: 5px; border-radius: 10px;
        }
        .type-selector button {
          flex: 1; padding: 10px; border: none; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; transition: 0.2s; background: transparent; color: #666;
        }
        .type-selector button.active {
          background: white; color: #111; box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
        .form-group { margin-bottom: 16px; }
        label {
          display: block; font-size: 11px; font-weight: 700; color: #666; margin-bottom: 6px; text-transform: uppercase;
        }
        input, select {
          width: 100%; padding: 12px; background: #f9f9f9; border: 1px solid #eee; border-radius: 10px; font-size: 14px; outline: none; color: #333;
        }
        .logo-upload-wrapper { width: 100%; }
        .upload-area {
          width: 100%; height: 120px; border: 2px dashed #ddd; border-radius: 10px;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          overflow: hidden; background: #fcfcfc;
        }
        .preview-img { width: 100%; height: 100%; object-fit: contain; }
        .submit-btn {
          width: 100%; padding: 16px; background: #111; color: white;
          border: none; border-radius: 10px; font-weight: 800; font-size: 15px;
          cursor: pointer; margin-top: 16px; transition: 0.2s;
        }
        .submit-btn:disabled { opacity: 0.5; }
        .form-message {
          padding: 10px; border-radius: 8px; margin-bottom: 16px;
          font-size: 13px; text-align: center; font-weight: 600;
        }
        .form-message.success { background: #dcfce7; color: #15803d; }
        .form-message.error { background: #fee2e2; color: #b91c1c; }

        .methods-list { display: flex; flex-direction: column; gap: 12px; }
        .method-item-card {
          display: flex; align-items: center; padding: 12px; background: #f9f9f9;
          border: 1px solid #eee; border-radius: 14px; gap: 12px;
        }
        .method-logo-small {
          width: 50px; height: 50px; background: white; border-radius: 10px;
          display: flex; align-items: center; justify-content: center; overflow: hidden;
          border: 1px solid #eee;
        }
        .method-logo-small img { width: 100%; height: 100%; object-fit: contain; }
        .method-info { flex: 1; }
        .method-name { font-weight: 800; font-size: 14px; color: #111; }
        .method-sub { font-size: 12px; color: #666; margin-top: 1px; }
        .method-min { font-size: 11px; font-weight: 700; color: #111; margin-top: 2px; }
        .method-actions { display: flex; gap: 6px; }
        .method-actions button {
          width: 32px; height: 32px; border-radius: 7px; border: none;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          transition: 0.2s;
        }
        .edit-btn { background: #e3f2fd; color: #1976d2; }
        .delete-btn { background: #ffebee; color: #d32f2f; }
        .empty-state { text-align: center; color: #999; padding: 40px; font-weight: 600; font-size: 13px; }
      `}</style>
    </div>
  );
}
