import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Sparkles, ArrowLeft, ShoppingCart, Check } from 'lucide-react'
import { getProductById } from '../../data/products'
import { BodyTryOn, FaceTryOn, RoomPlacement, ProductViewer3D } from '../../components/ar/ARComponents'
import { useCart } from '../../context/CartContext'

const arModeMap = {
  body:  { label:'Body Try-On',    Component: BodyTryOn,       desc:'Stand back so your full torso is visible',   color:'bg-purple-50 text-purple-600 border-purple-200' },
  face:  { label:'Face Try-On',    Component: FaceTryOn,       desc:'Face the camera directly for best results',  color:'bg-blue-50 text-blue-600 border-blue-200' },
  room:  { label:'Room Placement', Component: RoomPlacement,   desc:'Drag to orbit, scroll to zoom',              color:'bg-green-50 text-green-600 border-green-200' },
  '3d':  { label:'3D Viewer',      Component: ProductViewer3D, desc:'Drag to rotate, scroll to zoom',             color:'bg-orange-50 text-orange-600 border-orange-200' },
  shoes: { label:'Try On',         Component: BodyTryOn,       desc:'Stand back so your feet are visible',        color:'bg-pink-50 text-pink-600 border-pink-200' },
}

export default function BuyerARTryOn() {
  const { id } = useParams()
  const product = getProductById(id)
  const { addItem } = useCart()
  const [active, setActive] = useState(false)
  const [added, setAdded]   = useState(false)

  if (!product) return <div className="flex items-center justify-center py-20"><p className="text-gray-500">Product not found</p></div>

  const config = arModeMap[product.arMode] || arModeMap['3d']
  const { label, Component, desc, color } = config

  const handleAdd = () => { addItem(product); setAdded(true); setTimeout(()=>setAdded(false),2000) }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to={`/buyer/products/${product.id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors">
        <ArrowLeft size={15}/> Back to Product
      </Link>

      {/* Product bar */}
      <div className="card p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src={product.image} alt={product.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0"/>
          <div>
            <p className="text-xs text-gray-400 capitalize mb-0.5">{product.category}</p>
            <p className="font-semibold text-gray-900">{product.name}</p>
            <p className="text-brand-600 font-bold text-sm">₹{product.price.toLocaleString('en-IN')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}>{label}</span>
          <button onClick={handleAdd} className={`btn-primary text-xs py-2 px-3 ${added?'bg-green-500':''}`}>
            {added ? <><Check size={13}/> Added</> : <><ShoppingCart size={13}/> Add</>}
          </button>
        </div>
      </div>

      {/* AR launch */}
      {!active ? (
        <div className="card p-10 text-center">
          <div className="w-20 h-20 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-5">
            <Sparkles size={36} className="text-brand-500"/>
          </div>
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">{label}</h2>
          <p className="text-gray-500 text-sm mb-2">{product.name}</p>
          <p className="text-gray-400 text-sm mb-8">{desc}</p>

          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-8">
            {product.arMode === 'body'  && ['Camera required','Stand back','Good lighting'].map(t => <div key={t} className="bg-gray-50 rounded-xl p-2.5 text-xs text-gray-500 font-medium">{t}</div>)}
            {product.arMode === 'face'  && ['Camera required','Face forward','Even lighting'].map(t => <div key={t} className="bg-gray-50 rounded-xl p-2.5 text-xs text-gray-500 font-medium">{t}</div>)}
            {(product.arMode === 'room' || product.arMode === '3d') && ['No camera needed','Any device','Interactive 3D'].map(t => <div key={t} className="bg-gray-50 rounded-xl p-2.5 text-xs text-gray-500 font-medium">{t}</div>)}
          </div>

          <button onClick={() => setActive(true)} className="btn-primary px-8 py-3 text-base">
            <Sparkles size={18}/> Launch {label}
          </button>
        </div>
      ) : (
        <div className="card p-6">
          <Component product={product} onClose={() => setActive(false)}/>
        </div>
      )}

      {/* Tips */}
      <div className="card p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Tips for Best Results</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {[['Good Lighting','Natural or bright indoor light improves accuracy.'],['Plain Background','A simple background helps AI detect you better.'],['Stay Still','Hold position briefly for the overlay to settle.']].map(([t,d])=>(
            <div key={t}><p className="text-sm font-semibold text-gray-700 mb-0.5">{t}</p><p className="text-xs text-gray-500">{d}</p></div>
          ))}
        </div>
      </div>
    </div>
  )
}
