import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Video, ArrowRight, Package } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import ProductCard from '../../components/ui/ProductCard'
import api from '../../api'

export default function BuyerHome() {
  const { user } = useAuth()
  const [featured, setFeatured] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    api.get('/products?featured=1&limit=8')
      .then(({ data }) => setFeatured(data.products || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const quickLinks = [
    { to:'/buyer/products', icon:Package,  label:'Browse All',    border:'border-brand-200',  color:'bg-brand-50 text-brand-600'   },
    { to:'/buyer/ar/1',     icon:Sparkles, label:'AR Try-On',     border:'border-purple-200', color:'bg-purple-50 text-purple-600' },
    { to:'/buyer/live',     icon:Video,    label:'Live Sessions', border:'border-red-200',    color:'bg-red-50 text-red-600'       },
    { to:'/buyer/orders',   icon:Package,  label:'My Orders',     border:'border-green-200',  color:'bg-green-50 text-green-600'   },
  ]

  const categories = [
    { id:'clothing',    icon:'👗', label:'Clothing'    },
    { id:'jewelry',     icon:'💍', label:'Jewelry'     },
    { id:'glasses',     icon:'🕶️', label:'Glasses'     },
    { id:'shoes',       icon:'👟', label:'Shoes'       },
    { id:'furniture',   icon:'🛋️', label:'Furniture'   },
    { id:'electronics', icon:'📱', label:'Electronics' },
    { id:'home-decor',  icon:'🏮', label:'Home Decor'  },
    { id:'hats',        icon:'🎩', label:'Hats'        },
  ]

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Greeting */}
      <div className="bg-gradient-to-r from-brand-500 to-orange-600 rounded-2xl p-6 text-white">
        <p className="text-orange-100 text-sm mb-1">Welcome back,</p>
        <h1 className="font-display text-2xl font-bold mb-4">{user?.name} 👋</h1>
        <p className="text-orange-100 text-sm mb-5">Discover products, try them in AR, or join a live shopping session.</p>
        <div className="flex flex-wrap gap-3">
          <Link to="/buyer/products" className="bg-white text-brand-600 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-orange-50 transition-colors inline-flex items-center gap-1.5">
            <Package size={15}/> Browse Products
          </Link>
          <Link to="/buyer/live" className="bg-white/20 text-white font-semibold px-4 py-2 rounded-xl text-sm hover:bg-white/30 transition-colors inline-flex items-center gap-1.5 border border-white/30">
            <span className="w-2 h-2 rounded-full bg-red-300 animate-pulse"/> Join Live
          </Link>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickLinks.map(l => (
          <Link key={l.to} to={l.to} className={`card p-4 flex flex-col gap-2 hover:shadow-md transition-all border ${l.border} hover:-translate-y-0.5`}>
            <div className={`w-9 h-9 rounded-xl ${l.color} flex items-center justify-center`}><l.icon size={18}/></div>
            <span className="text-sm font-semibold text-gray-700">{l.label}</span>
          </Link>
        ))}
      </div>

      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-gray-900">Categories</h2>
          <Link to="/buyer/products" className="text-brand-600 text-sm font-medium hover:text-brand-700 inline-flex items-center gap-1">All <ArrowRight size={14}/></Link>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {categories.map(cat => (
            <Link key={cat.id} to={`/buyer/products?category=${cat.id}`}
              className="card p-3 flex flex-col items-center gap-1.5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-xs text-gray-600 text-center font-medium">{cat.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Live sessions promo */}
      <div className="bg-gray-900 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"/>
            <span className="text-red-400 text-xs font-bold uppercase tracking-widest">Live Now</span>
          </div>
          <h3 className="font-display text-white text-xl font-bold mb-1">Join a Live Shopping Session</h3>
          <p className="text-gray-400 text-sm">Watch sellers demo products live, ask questions, try them in AR — all in real time.</p>
        </div>
        <Link to="/buyer/live" className="btn-primary flex-shrink-0">
          <Video size={16}/> Join Live <ArrowRight size={15}/>
        </Link>
      </div>

      {/* Featured products */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-gray-900">Featured Products</h2>
          <Link to="/buyer/products" className="text-brand-600 text-sm font-medium hover:text-brand-700 inline-flex items-center gap-1">View all <ArrowRight size={14}/></Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_,i) => <div key={i} className="card h-60 animate-pulse bg-gray-100"/>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map(p => <ProductCard key={p.id} product={p}/>)}
          </div>
        )}
      </div>
    </div>
  )
}