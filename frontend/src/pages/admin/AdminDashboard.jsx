import React, { useState } from 'react'
import { Package, Users, ShoppingBag, TrendingUp, Store, CheckCircle, XCircle, Trash2, Eye, Edit2, Shield } from 'lucide-react'
import { products as allProducts } from '../../data/products'

// ─── Admin Dashboard ──────────────────────────────────────────────
export function AdminDashboard() {
  const stats = [
    { label:'Total Revenue',  value:'₹12.4L', icon:TrendingUp, color:'bg-green-50 text-green-600', change:'+18%' },
    { label:'Total Orders',   value:'1,284',  icon:ShoppingBag, color:'bg-blue-50 text-blue-600',  change:'+12%' },
    { label:'Active Sellers', value:'342',    icon:Store,       color:'bg-orange-50 text-orange-600', change:'+5%' },
    { label:'Registered Users',value:'48,210',icon:Users,       color:'bg-purple-50 text-purple-600', change:'+22%' },
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
        {stats.map(s => (
          <div key={s.label} className="card p-4">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}><s.icon size={18}/></div>
            <p className="font-display text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
            <p className="text-green-600 text-xs font-semibold mt-1">{s.change} this month</p>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="font-semibold text-gray-800 mb-3">Recent Orders</p>
          {[{id:'ORD-128',buyer:'Rahul M.',amount:'₹45,999',status:'Delivered'},{id:'ORD-129',buyer:'Priya S.',amount:'₹12,999',status:'Processing'},{id:'ORD-130',buyer:'Ananya K.',amount:'₹8,999',status:'Shipped'}].map(o=>(
            <div key={o.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
              <div><p className="text-sm font-medium text-gray-800">{o.id}</p><p className="text-xs text-gray-500">{o.buyer}</p></div>
              <div className="text-right"><p className="text-sm font-bold">{o.amount}</p><span className={o.status==='Delivered'?'badge-green':o.status==='Shipped'?'badge-blue':'badge-orange'}>{o.status}</span></div>
            </div>
          ))}
        </div>
        <div className="card p-5">
          <p className="font-semibold text-gray-800 mb-3">Top Sellers</p>
          {[{name:'FashionHouse',sales:'₹2.4L',orders:48},{name:'TechZone',sales:'₹1.9L',orders:31},{name:'GemCraft',sales:'₹1.5L',orders:22}].map(s=>(
            <div key={s.name} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
              <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center text-brand-700 font-bold text-xs">{s.name.charAt(0)}</div>
              <div className="flex-1"><p className="text-sm font-medium text-gray-800">{s.name}</p><p className="text-xs text-gray-500">{s.orders} orders</p></div>
              <p className="font-bold text-sm text-gray-900">{s.sales}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Admin Products ───────────────────────────────────────────────
export function AdminProducts() {
  const [products, setProducts] = useState(allProducts)
  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">All Products</h1><p className="text-sm text-gray-500 mt-1">{products.length} total</p></div>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['Product','Category','Seller','Price','Status','Actions'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0"/>
                    <p className="text-sm font-medium text-gray-800 truncate max-w-[140px]">{p.name}</p>
                  </div>
                </td>
                <td className="px-4 py-3"><span className="badge-gray capitalize">{p.category}</span></td>
                <td className="px-4 py-3 text-sm text-gray-600">{p.seller}</td>
                <td className="px-4 py-3 font-bold text-sm text-gray-900">₹{p.price.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3"><span className="badge-green">Active</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600"><Eye size={13}/></button>
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-brand-600"><Edit2 size={13}/></button>
                    <button onClick={() => setProducts(prev=>prev.filter(x=>x.id!==p.id))} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-500"><Trash2 size={13}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Admin Users ──────────────────────────────────────────────────
export function AdminUsers() {
  const users = [
    { id:1, name:'Rahul Mehta',  email:'rahul@email.com',  role:'buyer',  joined:'Mar 1',  status:'Active',   orders:12 },
    { id:2, name:'Priya Singh',  email:'priya@email.com',  role:'buyer',  joined:'Feb 20', status:'Active',   orders:8 },
    { id:3, name:'Raj Kumar',    email:'raj@email.com',    role:'seller', joined:'Jan 15', status:'Active',   orders:0 },
    { id:4, name:'Arun Patel',   email:'arun@email.com',   role:'seller', joined:'Feb 5',  status:'Pending',  orders:0 },
    { id:5, name:'Demo Admin',   email:'admin@demo.com',   role:'admin',  joined:'Jan 1',  status:'Active',   orders:0 },
  ]
  const roleColors = { buyer:'badge-blue', seller:'badge-orange', admin:'badge-red' }
  return (
    <div className="max-w-5xl space-y-5">
      <div><h1 className="page-title">User Management</h1><p className="text-sm text-gray-500 mt-1">{users.length} users</p></div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['User','Email','Role','Joined','Orders','Status','Actions'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
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
                <td className="px-4 py-3 text-xs text-gray-500">{u.joined}</td>
                <td className="px-4 py-3 text-sm text-gray-700 text-center">{u.orders}</td>
                <td className="px-4 py-3"><span className={u.status==='Active'?'badge-green':'badge-orange'}>{u.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {u.status==='Pending' && <button className="p-1.5 hover:bg-green-50 rounded-lg text-gray-500 hover:text-green-600" title="Approve"><CheckCircle size={13}/></button>}
                    <button className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-500" title="Block"><XCircle size={13}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Admin Orders ─────────────────────────────────────────────────
export function AdminOrders() {
  const orders = [
    { id:'ORD-128', buyer:'Rahul Mehta',  seller:'FashionHouse', product:'Luxe Silk Blazer',    amount:12999, date:'Mar 15', status:'Delivered' },
    { id:'ORD-129', buyer:'Priya Singh',  seller:'GemCraft',     product:'Diamond Halo Ring',   amount:45999, date:'Mar 14', status:'Processing' },
    { id:'ORD-130', buyer:'Ananya K.',    seller:'TechZone',     product:'iPhone 15 Pro Max',   amount:134900,date:'Mar 13', status:'Shipped' },
    { id:'ORD-131', buyer:'Deepak R.',    seller:'EyeStyle',     product:'Aviator Sunglasses',  amount:5999,  date:'Mar 12', status:'Delivered' },
  ]
  const sc = { Delivered:'badge-green', Shipped:'badge-blue', Processing:'badge-orange', Cancelled:'badge-red' }
  return (
    <div className="max-w-6xl space-y-5">
      <div><h1 className="page-title">All Orders</h1><p className="text-sm text-gray-500 mt-1">{orders.length} orders</p></div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['Order ID','Buyer','Seller','Product','Amount','Date','Status'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map(o => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{o.id}</td>
                <td className="px-4 py-3 text-sm text-gray-800">{o.buyer}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{o.seller}</td>
                <td className="px-4 py-3 text-sm text-gray-700 max-w-[120px] truncate">{o.product}</td>
                <td className="px-4 py-3 font-bold text-sm text-gray-900">₹{o.amount.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{o.date}</td>
                <td className="px-4 py-3"><span className={sc[o.status]||'badge-gray'}>{o.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Admin Sellers ─────────────────────────────────────────────────
export function AdminSellers() {
  const sellers = [
    { id:1, name:'Raj Kumar',    shop:'FashionHouse', email:'raj@email.com',   products:12, revenue:'₹2.4L', status:'Active',  joined:'Jan 15' },
    { id:2, name:'Priya Mehta',  shop:'GemCraft',     email:'priya@email.com', products:8,  revenue:'₹1.5L', status:'Active',  joined:'Feb 5'  },
    { id:3, name:'Arun Patel',   shop:'TechZone',     email:'arun@email.com',  products:5,  revenue:'₹1.9L', status:'Pending', joined:'Mar 1'  },
    { id:4, name:'Sunita Rao',   shop:'HomeLux',      email:'sunita@email.com',products:15, revenue:'₹0.8L', status:'Active',  joined:'Dec 20' },
  ]
  return (
    <div className="max-w-5xl space-y-5">
      <div><h1 className="page-title">Seller Management</h1><p className="text-sm text-gray-500 mt-1">{sellers.length} sellers</p></div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['Seller','Shop','Email','Products','Revenue','Joined','Status','Actions'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
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
                <td className="px-4 py-3 text-sm font-semibold text-gray-700">{s.shop}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{s.email}</td>
                <td className="px-4 py-3 text-sm text-center text-gray-700">{s.products}</td>
                <td className="px-4 py-3 font-bold text-sm text-gray-900">{s.revenue}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{s.joined}</td>
                <td className="px-4 py-3"><span className={s.status==='Active'?'badge-green':'badge-orange'}>{s.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {s.status==='Pending'&&<button className="p-1.5 hover:bg-green-50 rounded-lg text-gray-500 hover:text-green-600" title="Approve"><CheckCircle size={13}/></button>}
                    <button className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-500" title="Suspend"><XCircle size={13}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminDashboard
