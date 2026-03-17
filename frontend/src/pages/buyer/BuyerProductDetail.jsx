import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Sparkles, Star, Heart, Share2, ChevronRight, Check, Plus, Minus, Video } from 'lucide-react'
import { getProductById, products } from '../../data/products'
import { useCart } from '../../context/CartContext'
import ProductCard from '../../components/ui/ProductCard'

export default function BuyerProductDetail() {
  const { id } = useParams()
  const product = getProductById(id)
  const { addItem } = useCart()
  const navigate = useNavigate()
  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0])
  const [selectedSize,  setSelectedSize]  = useState(product?.sizes?.[0])
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  if (!product) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <p className="text-gray-500">Product not found</p>
      <Link to="/buyer/products" className="btn-primary">Back to Products</Link>
    </div>
  )

  const discount  = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : null
  const related   = products.filter(p => p.category === product.category && p.id !== product.id).slice(0,4)

  const handleAdd = () => {
    addItem({ ...product, selectedColor, selectedSize }, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="max-w-6xl space-y-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400">
        <Link to="/buyer" className="hover:text-brand-600">Home</Link><ChevronRight size={12}/>
        <Link to="/buyer/products" className="hover:text-brand-600">Products</Link><ChevronRight size={12}/>
        <span className="text-gray-600 capitalize">{product.category}</span><ChevronRight size={12}/>
        <span className="text-gray-800 truncate max-w-[120px]">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Image */}
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden aspect-square bg-gray-100">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover"/>
            {discount && <span className="absolute top-3 left-3 badge bg-brand-500 text-white text-xs">-{discount}%</span>}
          </div>
          <div className="flex gap-2">
            {[product.image, product.image, product.image].map((img,i) => (
              <div key={i} className={`w-20 h-20 rounded-xl overflow-hidden border-2 cursor-pointer ${i===0?'border-brand-500':'border-gray-200'}`}>
                <img src={img} alt="" className="w-full h-full object-cover"/>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1.5 capitalize">{product.category} · by {product.seller}</p>
            <h1 className="font-display text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>
            <div className="flex items-center gap-3">
              <div className="flex gap-0.5">{[1,2,3,4,5].map(s=><Star key={s} size={13} className={s<=Math.round(product.rating)?'fill-amber-400 text-amber-400':'text-gray-300'}/>)}</div>
              <span className="text-sm text-gray-500">{product.rating} ({product.reviews} reviews)</span>
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="font-display text-4xl font-bold text-gray-900">₹{product.price.toLocaleString('en-IN')}</span>
            {product.originalPrice && <span className="text-gray-400 line-through text-lg">₹{product.originalPrice.toLocaleString('en-IN')}</span>}
            {discount && <span className="badge-green">{discount}% off</span>}
          </div>

          <p className="text-gray-600 text-sm leading-relaxed">{product.description || `Premium quality ${product.name}. Carefully crafted for style and durability.`}</p>

          {/* AR CTA */}
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5 mb-0.5"><Sparkles size={14} className="text-brand-500"/> AR Try-On Available</p>
              <p className="text-xs text-gray-500">See exactly how it looks before buying</p>
            </div>
            <Link to={`/buyer/ar/${product.id}`} className="btn-primary flex-shrink-0 text-xs py-2 px-3">
              Try AR
            </Link>
          </div>

          {/* Colors */}
          {product.colors?.length > 0 && (
            <div>
              <p className="label">Color</p>
              <div className="flex gap-2">{product.colors.map(c => (
                <button key={c} onClick={() => setSelectedColor(c)} style={{ backgroundColor:c }}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor===c?'border-brand-500 scale-110':'border-gray-200'}`}/>
              ))}</div>
            </div>
          )}

          {/* Sizes */}
          {product.sizes?.length > 0 && (
            <div>
              <p className="label">Size</p>
              <div className="flex flex-wrap gap-2">{product.sizes.map(s => (
                <button key={s} onClick={() => setSelectedSize(s)}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${selectedSize===s?'bg-brand-500 text-white border-brand-500':'border-gray-200 text-gray-600 hover:border-brand-400'}`}>
                  {s}
                </button>
              ))}</div>
            </div>
          )}

          {/* Qty + Add */}
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => setQty(q => Math.max(1,q-1))} className="px-3 py-2.5 hover:bg-gray-100 transition-colors"><Minus size={14}/></button>
              <span className="px-4 py-2.5 text-sm font-semibold">{qty}</span>
              <button onClick={() => setQty(q => q+1)} className="px-3 py-2.5 hover:bg-gray-100 transition-colors"><Plus size={14}/></button>
            </div>
            <button onClick={handleAdd}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${added?'bg-green-500 text-white':'bg-brand-500 hover:bg-brand-600 text-white'}`}>
              {added ? <><Check size={16}/> Added!</> : <><ShoppingCart size={16}/> Add to Cart</>}
            </button>
            <button className="p-3 border border-gray-200 rounded-xl hover:border-gray-300 text-gray-500"><Share2 size={16}/></button>
          </div>

          <button onClick={() => { handleAdd(); navigate('/buyer/checkout') }}
            className="w-full py-3 rounded-xl border-2 border-brand-500 text-brand-600 font-semibold text-sm hover:bg-brand-50 transition-colors">
            Buy Now
          </button>

          {/* Ask seller */}
          <Link to="/buyer/live" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-all">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <Video size={14} className="text-brand-600"/>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Ask the seller live</p>
              <p className="text-xs text-gray-500">Join a live session to see this product in action</p>
            </div>
            <ChevronRight size={16} className="ml-auto text-gray-400"/>
          </Link>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900 mb-4">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map(p => <ProductCard key={p.id} product={p}/>)}
          </div>
        </div>
      )}
    </div>
  )
}
