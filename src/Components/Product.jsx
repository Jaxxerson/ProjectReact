import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from 'react-bootstrap'
import axios from 'axios'
import API_BASE_URL, { fileUrl } from '../api'
import { addCartItem } from '../cartUtils'
import { payForCartItems } from '../checkoutUtils'
import NotificationToast from './NotificationToast'

const uniqueById = (items) => Array.from(new Map(items.map((item) => [item.id, item])).values())

const Product = () => {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [layout, setLayout] = useState("grid")
  const [message, setMessage] = useState("")
  const [buyTarget, setBuyTarget] = useState(null)
  const [mpesaPhone, setMpesaPhone] = useState("")
  const [isPaying, setIsPaying] = useState(false)

  useEffect(() => {
    axios.get(`${API_BASE_URL}/get_products`)
      .then((response) => setProducts(uniqueById(response.data)))
      .catch(() => setMessage("Could not load products"))
  }, [])

  const visibleProducts = useMemo(() => {
    const text = search.toLowerCase()
    const filtered = products.filter((product) =>
      `${product.name} ${product.category} ${product.farm_name} ${product.county}`.toLowerCase().includes(text)
    )

    return filtered.sort((a, b) => {
      if (sortBy === "price-low") return Number(a.price_per_unit || 0) - Number(b.price_per_unit || 0)
      if (sortBy === "price-high") return Number(b.price_per_unit || 0) - Number(a.price_per_unit || 0)
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "")
      return (b.id || 0) - (a.id || 0)
    })
  }, [products, search, sortBy])

  const addToCart = (product) => {
    if (!localStorage.getItem("token")) {
      setMessage("Please sign in before adding items to your cart.")
      return
    }

    addCartItem(product, 1)
    setMessage(`${product.name} added to cart`)
  }

  const openBuyNow = (product) => {
    if (!localStorage.getItem("token")) {
      setMessage("Please sign in before buying.")
      return
    }

    setBuyTarget(product)
  }

  const buyNow = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem("token")
    if (!token) {
      setMessage("Please sign in before buying.")
      return
    }

    try {
      setIsPaying(true)
      const orderIds = await payForCartItems({
        items: [{ ...buyTarget, lineId: String(buyTarget.id), quantity: 1 }],
        phone: mpesaPhone,
        token,
      })
      setMessage(`Payment requested. Check your phone for M-Pesa. Order #${orderIds.join(", ")}`)
      setBuyTarget(null)
      setMpesaPhone("")
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Could not request payment")
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <main className="page-dark dashboard-shell">
      <section className="browse-hero dashboard-card">
        <p className="dashboard-kicker">Marketplace</p>
        <h1>Fresh produce directly from farms.</h1>
        <p>Search farm products, compare prices, and discover produce listed by farmers across Kenya. Buyers get fresher food, farmers keep more of what they earn.</p>
      </section>

      <section className="browse-controls">
        <input className="form-control" placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="name">Name</option>
          <option value="price-low">Price: low to high</option>
          <option value="price-high">Price: high to low</option>
        </select>
        <div className="btn-group">
          <button className={`btn ${layout === "grid" ? "btn-success" : "btn-outline-success"}`} onClick={() => setLayout("grid")}>Grid</button>
          <button className={`btn ${layout === "compact" ? "btn-success" : "btn-outline-success"}`} onClick={() => setLayout("compact")}>Compact</button>
        </div>
      </section>

      <section className={`browse-items ${layout}`}>
        {visibleProducts.map((product) => (
          <article className="browse-card product-card-with-actions" key={product.id}>
            <Link className="product-card-link" to={`/product/${product.id}`}>
              <img src={fileUrl(product.photo_url)} alt={product.name} />
            </Link>
            <div className="product-card-body">
              <Link className="product-card-title" to={`/product/${product.id}`}>
                <h3>{product.name}</h3>
              </Link>
              <p>{product.description || `${product.category || "Produce"} from ${product.farm_name}`}</p>
              <span>{product.farm_name} - {product.county}</span>
              <strong>KES {product.price_per_unit} / {product.unit}</strong>
              <div className="product-card-actions">
                <button type="button" className="btn btn-outline-light" onClick={() => addToCart(product)}>Add to cart</button>
                <button type="button" className="btn btn-success" onClick={() => openBuyNow(product)}>Buy now</button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <Modal show={Boolean(buyTarget)} onHide={() => setBuyTarget(null)} centered className="checkout-modal">
        <Modal.Header closeButton>
          <Modal.Title>Buy now</Modal.Title>
        </Modal.Header>
        <form onSubmit={buyNow}>
          <Modal.Body>
            {buyTarget && (
              <div className="checkout-modal-product">
                <img src={fileUrl(buyTarget.photo_url)} alt={buyTarget.name} />
                <div>
                  <h3>{buyTarget.name}</h3>
                  <p>{buyTarget.farm_name}</p>
                  <strong>KES {buyTarget.price_per_unit} / {buyTarget.unit}</strong>
                </div>
              </div>
            )}
            <input
              className="form-control"
              placeholder="M-Pesa phone number"
              required
              value={mpesaPhone}
              onChange={(e) => setMpesaPhone(e.target.value)}
            />
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setBuyTarget(null)}>Cancel</button>
            <button className="btn btn-success" disabled={isPaying}>{isPaying ? "Requesting..." : "Pay with M-Pesa"}</button>
          </Modal.Footer>
        </form>
      </Modal>

      {visibleProducts.length === 0 && !message && <div className="dashboard-card">No products listed yet.</div>}
      <NotificationToast message={message} onClose={() => setMessage("")} />
    </main>
  )
}

export default Product
