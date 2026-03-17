// ─── BuyerCart ────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Sparkles, Tag, Check } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'

export function BuyerCart() {
  const { items, removeItem, updateQty, total, count, clearCart } = useCart()
  const navigate = useNavigate()
  const shipping = total > 999 ? 0 : 99
  const tax      = Math.round(total * 0.18)
  const grand    = total + shipping + tax

  if (!items.length) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center"><ShoppingBag size={36} className="text-gray-400"/></div>
      <p className="font-display text-xl font-bold text-gray-700">Your cart is empty</p>
      <p className="text-gray-500 text-sm">Add products to get started</p>
      <Link to="/buyer/products" className="btn-primary mt-2">Browse Products</Link>
    </div>
  )

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">My Cart</h1><p className="text-gray-500 text-sm mt-1">{count} items</p></div>
        <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"><Trash2 size={14}/> Clear all</button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => (
            <div key={item._key||item.id} className="card p-4 flex gap-4">
              <Link to={`/buyer/products/${item.id}`}>
                <img src={item.image_url || item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0"/>
              </Link>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 capitalize mb-0.5">{item.category}</p>
                <Link to={`/buyer/products/${item.id}`} className="font-semibold text-gray-800 text-sm hover:text-brand-600 line-clamp-1">{item.name}</Link>
                {item.selectedSize && <p className="text-xs text-gray-500 mt-0.5">Size: {item.selectedSize}</p>}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <button onClick={() => updateQty(item.id, item.qty-1)} className="px-2.5 py-1.5 hover:bg-gray-100 transition-colors"><Minus size={12}/></button>
                    <span className="px-3 text-sm font-semibold">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty+1)} className="px-2.5 py-1.5 hover:bg-gray-100 transition-colors"><Plus size={12}/></button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900 text-sm">₹{(item.price*item.qty).toLocaleString('en-IN')}</span>
                    <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="card p-4">
            <p className="text-sm text-gray-600 mb-2 flex items-center gap-2"><Tag size={14} className="text-brand-500"/> Apply Coupon</p>
            <div className="flex gap-2">
              <input placeholder="Enter code" className="input flex-1 text-sm"/>
              <button className="btn-secondary text-sm px-4">Apply</button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Order Summary</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-500"><span>Subtotal ({count})</span><span className="text-gray-800">₹{total.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-gray-500"><span>Shipping</span><span className={shipping===0?'text-green-600 font-semibold':'text-gray-800'}>{shipping===0?'FREE':'₹'+shipping}</span></div>
              <div className="flex justify-between text-gray-500"><span>GST (18%)</span><span className="text-gray-800">₹{tax.toLocaleString('en-IN')}</span></div>
              {shipping===0 && <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">🎉 You qualify for free shipping!</p>}
              <div className="border-t border-gray-100 pt-2.5 flex justify-between font-bold text-gray-900">
                <span>Total</span><span>₹{grand.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <button onClick={() => navigate('/buyer/checkout')} className="btn-primary w-full justify-center py-3 mt-4">
              Checkout <ArrowRight size={16}/>
            </button>
            <Link to="/buyer/products" className="block text-center text-gray-500 text-sm mt-3 hover:text-brand-600 transition-colors">← Continue Shopping</Link>
          </div>
          <div className="card p-4 border-brand-200 bg-brand-50">
            <p className="text-xs font-semibold text-brand-700 mb-1 flex items-center gap-1.5"><Sparkles size={12}/> Not sure yet?</p>
            <p className="text-xs text-brand-600">Try items in AR before checkout to make sure you'll love them.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── BuyerCheckout ────────────────────────────────────────────────
export function BuyerCheckout() {
  const { items, total, clearCart } = useCart()
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [step,     setStep]    = useState(0)
  const [placing,  setPlacing] = useState(false)
  const [placed,   setPlaced]  = useState(false)
  const [orderId,  setOrderId] = useState(null)
  const [error,    setError]   = useState('')
  const [payMethod, setPay]    = useState('upi')
  const [address, setAddress]  = useState({ fullName:'', phone:'', line1:'', city:'', state:'', pincode:'' })

  const shipping = total > 999 ? 0 : 99
  const tax      = Math.round(total * 0.18)
  const grand    = total + shipping + tax

  const placeOrder = async () => {
    setPlacing(true)
    setError('')
    try {
      const { data } = await api.post('/orders', {
        items: items.map(i => ({
          id:       i.id,
          name:     i.name,
          price:    i.price,
          qty:      i.qty,
          sellerId: i.seller_id || i.sellerId,
          image:    i.image_url || i.image,
        })),
        address,
        paymentMethod: payMethod,
        subtotal: total,
        shipping,
        tax,
        total: grand,
      })
      if (data.success) {
        setOrderId(data.orderId)
        setPlaced(true)
        clearCart()
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  if (placed) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center"><Check size={32} className="text-green-600"/></div>
      <h1 className="font-display text-2xl font-bold text-gray-900">Order Placed! 🎉</h1>
      <p className="text-gray-500 text-sm">Order #{orderId}</p>
      <div className="flex gap-3 mt-2">
        <Link to="/buyer/orders" className="btn-primary">View Orders</Link>
        <Link to="/buyer/products" className="btn-secondary">Continue Shopping</Link>
      </div>
    </div>
  )

  const steps = ['Delivery', 'Payment', 'Review']

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="page-title">Checkout</h1>
        <div className="flex items-center gap-2 mt-3">
          {steps.map((s,i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-1.5 ${i<=step?'text-brand-600':'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${i<step?'bg-green-500 text-white':i===step?'bg-brand-500 text-white':'bg-gray-200 text-gray-500'}`}>
                  {i<step?<Check size={12}/>:i+1}
                </div>
                <span className="text-sm hidden sm:block">{s}</span>
              </div>
              {i<steps.length-1&&<div className={`flex-1 h-px ${i<step?'bg-brand-400':'bg-gray-200'}`}/>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {step===0 && (
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-gray-800">Delivery Address</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {[['fullName','Full Name'],['phone','Phone'],['line1','Address'],['city','City'],['state','State'],['pincode','PIN Code']].map(([k,l])=>(
                  <div key={k} className={k==='line1'?'sm:col-span-2':''}>
                    <label className="label">{l}</label>
                    <input value={address[k]} onChange={e=>setAddress(a=>({...a,[k]:e.target.value}))} className="input" placeholder={l}/>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep(1)} className="btn-primary w-full justify-center py-3">Continue to Payment →</button>
            </div>
          )}
          {step===1 && (
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-gray-800">Payment Method</h3>
              {[{id:'upi',label:'UPI / GPay',icon:'💳'},{id:'card',label:'Credit / Debit Card',icon:'🏦'},{id:'cod',label:'Cash on Delivery',icon:'💵'}].map(m=>(
                <button key={m.id} onClick={()=>setPay(m.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${payMethod===m.id?'border-brand-500 bg-brand-50':'border-gray-200 hover:border-gray-300'}`}>
                  <span className="text-2xl">{m.icon}</span><span className="font-medium text-sm text-gray-800">{m.label}</span>
                  <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${payMethod===m.id?'border-brand-500 bg-brand-500':'border-gray-300'}`}>
                    {payMethod===m.id&&<div className="w-2 h-2 bg-white rounded-full"/>}
                  </div>
                </button>
              ))}
              <div className="flex gap-3">
                <button onClick={()=>setStep(0)} className="btn-secondary px-5">Back</button>
                <button onClick={()=>setStep(2)} className="btn-primary flex-1 justify-center py-3">Review Order →</button>
              </div>
            </div>
          )}
          {step===2 && (
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-gray-800">Review Order</h3>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}
              {items.map(item=>(
                <div key={item.id} className="flex gap-3 items-center">
                  <img src={item.image_url||item.image} alt="" className="w-12 h-12 rounded-xl object-cover"/>
                  <div className="flex-1"><p className="text-sm font-medium text-gray-800">{item.name}</p><p className="text-xs text-gray-500">×{item.qty}</p></div>
                  <p className="font-semibold text-sm">₹{(item.price*item.qty).toLocaleString('en-IN')}</p>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-3 text-sm space-y-1">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{total.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between text-gray-500"><span>Shipping</span><span>{shipping===0?'FREE':'₹'+shipping}</span></div>
                <div className="flex justify-between font-bold text-gray-900 pt-1"><span>Total</span><span>₹{grand.toLocaleString('en-IN')}</span></div>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setStep(1)} className="btn-secondary px-5">Back</button>
                <button onClick={placeOrder} disabled={placing} className="btn-primary flex-1 justify-center py-3 disabled:opacity-60">
                  {placing?<div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>:`Place Order · ₹${grand.toLocaleString('en-IN')}`}
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="card p-5 h-fit">
          <p className="font-semibold text-sm text-gray-700 mb-3">Order ({items.length})</p>
          {items.slice(0,3).map(item=>(
            <div key={item.id} className="flex gap-2 mb-2">
              <img src={item.image_url||item.image} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0"/>
              <div className="flex-1 min-w-0"><p className="text-xs truncate text-gray-700">{item.name}</p><p className="text-xs text-gray-400">×{item.qty}</p></div>
              <p className="text-xs font-semibold text-gray-700 flex-shrink-0">₹{(item.price*item.qty).toLocaleString('en-IN')}</p>
            </div>
          ))}
          <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between font-bold text-sm">
            <span>Total</span><span>₹{grand.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── BuyerOrders ──────────────────────────────────────────────────
export function BuyerOrders() {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const statusColors = { delivered:'badge-green', shipped:'badge-blue', confirmed:'badge-orange', pending:'badge-orange', cancelled:'badge-red' }

  useEffect(() => {
    api.get('/orders')
      .then(({ data }) => setOrders(data.orders || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })

  if (loading) return (
    <div className="max-w-4xl space-y-4">
      <h1 className="page-title">My Orders</h1>
      {[...Array(3)].map((_,i) => <div key={i} className="card h-28 animate-pulse bg-gray-100"/>)}
    </div>
  )

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="page-title">My Orders</h1>
      {orders.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-gray-500">No orders yet.</p>
          <Link to="/buyer/products" className="btn-primary mt-4">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items
            return (
              <div key={order.id} className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold text-gray-900">ORD-{order.id}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDate(order.created_at)}</p>
                  </div>
                  <span className={statusColors[order.status] || 'badge-gray'}>{order.status}</span>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2">
                      {item.image && <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover"/>}
                      <div>
                        <p className="text-xs font-medium text-gray-700">{item.name}</p>
                        <p className="text-xs text-brand-600 font-bold">₹{item.price?.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <span className="text-sm font-bold text-gray-800">Total: ₹{Number(order.total).toLocaleString('en-IN')}</span>
                  <span className="badge-gray text-xs">{order.payment_method?.toUpperCase()}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default BuyerCart