import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Sparkles } from 'lucide-react'
import ProductCard from '../../components/ui/ProductCard'
import api from '../../api'

const CATEGORIES = [
  { id:'clothing',    icon:'👗', label:'Clothing'    },
  { id:'jewelry',     icon:'💍', label:'Jewelry'     },
  { id:'glasses',     icon:'🕶️', label:'Glasses'     },
  { id:'shoes',       icon:'👟', label:'Shoes'       },
  { id:'furniture',   icon:'🛋️', label:'Furniture'   },
  { id:'electronics', icon:'📱', label:'Electronics' },
  { id:'home-decor',  icon:'🏮', label:'Home Decor'  },
  { id:'hats',        icon:'🎩', label:'Hats'        },
]

export default function BuyerProducts() {
  const [params]              = useSearchParams()
  const [products, setProducts] = useState([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState(params.get('search') || '')
  const [category, setCategory] = useState(params.get('category') || 'all')
  const [sortBy,   setSortBy]   = useState('featured')
  const [arOnly,   setArOnly]   = useState(false)

  const fetchProducts = useCallback(() => {
    setLoading(true)
    const q = new URLSearchParams()
    if (category !== 'all') q.set('category', category)
    if (search)             q.set('search', search)
    if (arOnly)             q.set('arMode', 'body')   // AR-only filter
    q.set('limit', '50')

    api.get(`/products?${q}`)
      .then(({ data }) => {
        let list = data.products || []
        // Client-side sort
        if (sortBy === 'price-asc')  list = [...list].sort((a,b) => a.price - b.price)
        if (sortBy === 'price-desc') list = [...list].sort((a,b) => b.price - a.price)
        if (sortBy === 'rating')     list = [...list].sort((a,b) => b.rating - a.rating)
        setProducts(list)
        setTotal(data.total || list.length)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [category, search, sortBy, arOnly])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(fetchProducts, 400)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="page-title">Products</h1>
        <p className="text-gray-500 text-sm mt-1">{loading ? '...' : `${products.length} products found`}</p>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="input pl-9"/>
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input w-auto cursor-pointer">
          <option value="featured">Featured</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
        <button onClick={() => setArOnly(!arOnly)}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${arOnly ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-200 text-gray-600 hover:border-brand-400'}`}>
          <Sparkles size={14}/> AR Only
        </button>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setCategory('all')}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${category==='all'?'bg-brand-500 text-white':'bg-white border border-gray-200 text-gray-600 hover:border-brand-400'}`}>
          All
        </button>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCategory(c.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${category===c.id?'bg-brand-500 text-white':'bg-white border border-gray-200 text-gray-600 hover:border-brand-400'}`}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_,i) => <div key={i} className="card h-64 animate-pulse bg-gray-100"/>)}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => <ProductCard key={p.id} product={p}/>)}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-500 font-medium">No products found</p>
          <button onClick={() => { setSearch(''); setCategory('all'); setArOnly(false) }} className="btn-secondary mt-4 text-sm">Clear Filters</button>
        </div>
      )}
    </div>
  )
}