import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X, Sparkles } from 'lucide-react'
import ProductCard from '../../components/ui/ProductCard'
import { products, categories } from '../../data/products'

export default function BuyerProducts() {
  const [params] = useSearchParams()
  const [search,    setSearch]    = useState(params.get('search') || '')
  const [category,  setCategory]  = useState(params.get('category') || 'all')
  const [sortBy,    setSortBy]    = useState('featured')
  const [arOnly,    setArOnly]    = useState(false)

  const filtered = useMemo(() => {
    let r = [...products]
    if (category !== 'all') r = r.filter(p => p.category === category)
    if (search) { const q = search.toLowerCase(); r = r.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)) }
    if (arOnly) r = r.filter(p => p.arMode)
    if (sortBy === 'price-asc')  r.sort((a,b) => a.price - b.price)
    if (sortBy === 'price-desc') r.sort((a,b) => b.price - a.price)
    if (sortBy === 'rating')     r.sort((a,b) => b.rating - a.rating)
    return r
  }, [category, search, sortBy, arOnly])

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="page-title">Products</h1>
        <p className="text-gray-500 text-sm mt-1">{filtered.length} products found</p>
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
        {categories.map(c => (
          <button key={c.id} onClick={() => setCategory(c.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${category===c.id?'bg-brand-500 text-white':'bg-white border border-gray-200 text-gray-600 hover:border-brand-400'}`}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(p => <ProductCard key={p.id} product={p}/>)}
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
