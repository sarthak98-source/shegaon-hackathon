import React, { useState, useEffect } from 'react'
import { Package, Users, ShoppingBag, TrendingUp, Store, CheckCircle, XCircle, Trash2, Eye, Shield } from 'lucide-react'
import api from '../../api'

// ─── Admin Dashboard ──────────────────────────────────────────────
export function AdminDashboard() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/users/stats/admin')
      .then(({ data }) => setStats(data.stats))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label:'Total Revenue',   value: stats ? `₹${(stats.revenue/100000).toFixed(1)}L` : '...', icon:TrendingUp, color:'bg-green-50 text-green-600'   },
    { label:'Total Orders',    value: stats?.orders   ?? '...', icon:ShoppingBag, color:'bg-blue-50 text-blue-600'    },
    { label:'Active Sellers',  value: stats?.sellers  ?? '...', icon:Store,       color:'bg-orange-50 text-orange-600' },
    { label:'Registered Users',value: stats?.buyers   ?? '...', icon:Users,       color:'bg-purple-50 text-purple-600' },
  ]

  return (
    <div className="max-w-6xl space-y-6">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2"><Shield size={16} className="text-brand-400"/><span className="text-brand-400 text-xs font-semibold uppercase tracking-wide">Admin Panel</span></div>
          <h1 className="font-display text-2xl font-bold">Platform Overview</h1>
          <p className="text-gray-400 text-sm mt-1">All metrics as of today</p>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="card p-4">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}><s.icon size={18}/></div>
            <p className="font-display text-2xl font-bold text-gray-900">{loading ? <span className="animate-pulse">...</span> : s.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Admin Products ───────────────────────────────────────────────
export function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    api.get('/products?limit=100')
      .then(({ data }) => setProducts(data.products || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Remove this product?')) return
    await api.delete(`/products/${id}`)
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">All Products</h1><p className="text-sm text-gray-500 mt-1">{products.length} total</p></div>
      </div>
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(5)].map((_,i)=><div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Product','Category','Seller','Price','Status','Actions'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.image_url} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0"/>
                      <p className="text-sm font-medium text-gray-800 truncate max-w-[140px]">{p.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="badge-gray capitalize">{p.category}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.seller_name}</td>
                  <td className="px-4 py-3 font-bold text-sm text-gray-900">₹{Number(p.price).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3"><span className="badge-green">Active</span></td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-500"><Trash2 size={13}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── Admin Users ──────────────────────────────────────────────────
export function AdminUsers() {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const roleColors = { buyer:'badge-blue', seller:'badge-orange', admin:'badge-red' }

  useEffect(() => {
    api.get('/users')
      .then(({ data }) => setUsers(data.users || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const updateStatus = async (id, status) => {
    await api.put(`/users/${id}/status`, { status })
    setUsers(prev => prev.map(u => u.id === id ? {...u, status} : u))
  }

  return (
    <div className="max-w-5xl space-y-5">
      <div><h1 className="page-title">User Management</h1><p className="text-sm text-gray-500 mt-1">{users.length} users</p></div>
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(5)].map((_,i)=><div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['User','Email','Role','Joined','Status','Actions'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-sm flex items-center justify-center flex-shrink-0">{u.name.charAt(0)}</div>
                      <p className="text-sm font-medium text-gray-800">{u.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{u.email}</td>
                  <td className="px-4 py-3"><span className={roleColors[u.role]||'badge-gray'}>{u.role}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3"><span className={u.status==='active'?'badge-green':'badge-orange'}>{u.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {u.status==='suspended'
                        ? <button onClick={() => updateStatus(u.id,'active')}   className="p-1.5 hover:bg-green-50 rounded-lg text-gray-500 hover:text-green-600" title="Activate"><CheckCircle size={13}/></button>
                        : <button onClick={() => updateStatus(u.id,'suspended')} className="p-1.5 hover:bg-red-50   rounded-lg text-gray-500 hover:text-red-500"   title="Suspend"><XCircle size={13}/></button>
                      }
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── Admin Orders ─────────────────────────────────────────────────
export function AdminOrders() {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const sc = { delivered:'badge-green', shipped:'badge-blue', confirmed:'badge-orange', pending:'badge-orange', cancelled:'badge-red' }

  useEffect(() => {
    api.get('/orders')
      .then(({ data }) => setOrders(data.orders || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-6xl space-y-5">
      <div><h1 className="page-title">All Orders</h1><p className="text-sm text-gray-500 mt-1">{orders.length} orders</p></div>
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(4)].map((_,i)=><div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Order ID','Buyer','Product','Amount','Date','Status'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(o => {
                const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items
                return (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">ORD-{o.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{o.buyer_name || `User #${o.buyer_id}`}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-[120px] truncate">{items[0]?.name}</td>
                    <td className="px-4 py-3 font-bold text-sm text-gray-900">₹{Number(o.total).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3"><span className={sc[o.status]||'badge-gray'}>{o.status}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── Admin Sellers ─────────────────────────────────────────────────
export function AdminSellers() {
  const [sellers, setSellers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/users?role=seller')
      .then(({ data }) => setSellers(data.users || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const updateStatus = async (id, status) => {
    await api.put(`/users/${id}/status`, { status })
    setSellers(prev => prev.map(s => s.id === id ? {...s, status} : s))
  }

  return (
    <div className="max-w-5xl space-y-5">
      <div><h1 className="page-title">Seller Management</h1><p className="text-sm text-gray-500 mt-1">{sellers.length} sellers</p></div>
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(4)].map((_,i)=><div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Seller','Email','Joined','Status','Actions'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sellers.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">{s.name.charAt(0)}</div>
                      <p className="text-sm font-medium text-gray-800">{s.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{s.email}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(s.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3"><span className={s.status==='active'?'badge-green':'badge-orange'}>{s.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {s.status==='active'
                        ? <button onClick={() => updateStatus(s.id,'suspended')} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-500" title="Suspend"><XCircle size={13}/></button>
                        : <button onClick={() => updateStatus(s.id,'active')}    className="p-1.5 hover:bg-green-50 rounded-lg text-gray-500 hover:text-green-600" title="Activate"><CheckCircle size={13}/></button>
                      }
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard