import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Sparkles, Star, Heart } from 'lucide-react'
import { useCart } from '../../context/CartContext'

export default function ProductCard({ product, basePath = '/buyer' }) {
  const { addItem } = useCart()
  const [wished, setWished] = useState(false)
  const [added, setAdded]   = useState(false)
  const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : null

  const handleAdd = e => {
    e.preventDefault()
    addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <Link to={`${basePath}/products/${product.id}`} className="card-hover block">
      <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-gray-100">
        <img src={product.image} alt={product.name} loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"/>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discount && <span className="badge bg-brand-500 text-white">-{discount}%</span>}
          {product.badge && <span className="badge-orange">{product.badge}</span>}
        </div>

        {/* Wishlist */}
        <button onClick={e => { e.preventDefault(); setWished(!wished) }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow hover:bg-white transition-all">
          <Heart size={13} className={wished ? 'fill-red-500 text-red-500' : 'text-gray-500'}/>
        </button>

        {/* AR quick button */}
        <div className="absolute bottom-2 left-2 right-2 opacity-0 hover:opacity-100 translate-y-1 hover:translate-y-0 transition-all duration-300 group-hover:opacity-100">
          <Link to={`${basePath}/ar/${product.id}`} onClick={e => e.stopPropagation()}
            className="flex items-center justify-center gap-1.5 w-full bg-white/90 text-brand-600 text-xs font-bold py-1.5 rounded-full shadow hover:bg-white transition-all">
            <Sparkles size={11}/> Try AR
          </Link>
        </div>
      </div>

      <div className="p-3">
        <p className="text-xs text-gray-400 capitalize mb-0.5">{product.category}</p>
        <p className="text-sm font-semibold text-gray-800 truncate mb-1">{product.name}</p>
        <div className="flex items-center gap-1 mb-2">
          <Star size={11} className="fill-amber-400 text-amber-400"/>
          <span className="text-xs text-gray-500">{product.rating} ({product.reviews})</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-gray-900 text-sm">₹{product.price.toLocaleString('en-IN')}</span>
            {product.originalPrice && <span className="text-xs text-gray-400 line-through ml-1.5">₹{product.originalPrice.toLocaleString('en-IN')}</span>}
          </div>
          <button onClick={handleAdd}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${added ? 'bg-green-500' : 'bg-brand-500 hover:bg-brand-600'}`}>
            <ShoppingCart size={12} className="text-white"/>
          </button>
        </div>
      </div>
    </Link>
  )
}
