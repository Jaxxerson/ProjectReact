import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Modal } from 'react-bootstrap'
import axios from 'axios'
import API_BASE_URL, { fileUrl } from '../api'
import { addCartItem } from '../cartUtils'
import { payForCartItems } from '../checkoutUtils'
import NotificationToast from './NotificationToast'

const ProductDetails = () => {
  const { productId } = useParams()
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState("1")
  const [mpesaPhone, setMpesaPhone] = useState("")
  const [message, setMessage] = useState("")
  const [isPaying, setIsPaying] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)

  useEffect(() => {
    axios.get(`${API_BASE_URL}/get_product/${productId}`)
      .then((response) => setProduct(response.data))
      .catch(() => setMessage("Could not load product"))
  }, [productId])

  const addToCart = () => {
    if (!localStorage.getItem("token")) {
      setMessage("Please sign in before adding items to your cart.")
      return
    }

    addCartItem(product, quantity)
    setMessage(`${product.name} added to cart`)
  }

  const openCheckout = () => {
    if (!localStorage.getItem("token")) {
      setMessage("Please sign in before buying.")
      return
    }

    setShowCheckout(true)
  }

  const payForProduct = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem("token")
    if (!token) {
      setMessage("Please sign in before buying.")
      return
    }

    try {
      setIsPaying(true)
      const orderIds = await payForCartItems({
        items: [{ ...product, lineId: String(product.id), quantity }],
        phone: mpesaPhone,
        token,
      })
      setMessage(`Payment requested. Check your phone for the M-Pesa prompt. Order #${orderIds.join(", ")}`)
      setShowCheckout(false)
      setMpesaPhone("")
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Could not request payment")
    } finally {
      setIsPaying(false)
    }
  }

  if (!product) {
    return <main className="page-dark dashboard-shell"><div className="dashboard-card">{message || "Loading product..."}</div></main>
  }

  return (
    <main className="page-dark dashboard-shell product-detail-page">
      <Link to="/product" className="btn btn-outline-light mb-3">Back to Products</Link>
      <section className="product-detail-hero">
        <img src={fileUrl(product.photo_url)} alt={product.name} />
        <div className="dashboard-card product-purchase-card">
          <p className="dashboard-kicker">{product.farm_name}</p>
          <h1>{product.name}</h1>
          <p>{product.description || `${product.category || "Produce"} from ${product.farm_name}`}</p>
          <strong>KES {product.price_per_unit} / {product.unit}</strong>
          <span>{product.quantity_available} {product.unit} available</span>

          <div className="dashboard-form mt-3">
            <input className="form-control" type="number" min="1" max={product.quantity_available} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            <div className="product-detail-actions">
              <button type="button" className="btn btn-outline-light" onClick={addToCart}>Add to cart</button>
              <button type="button" className="btn btn-success" onClick={openCheckout}>Buy now</button>
            </div>
          </div>
        </div>
      </section>

      <Modal show={showCheckout} onHide={() => setShowCheckout(false)} centered className="checkout-modal">
        <Modal.Header closeButton>
          <Modal.Title>Pay with M-Pesa</Modal.Title>
        </Modal.Header>
        <form onSubmit={payForProduct}>
          <Modal.Body>
            <div className="checkout-modal-product">
              <img src={fileUrl(product.photo_url)} alt={product.name} />
              <div>
                <h3>{product.name}</h3>
                <p>{quantity} {product.unit} from {product.farm_name}</p>
                <strong>KES {(Number(product.price_per_unit || 0) * Number(quantity || 0)).toLocaleString()}</strong>
              </div>
            </div>
            <input className="form-control" placeholder="M-Pesa phone number" required value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} />
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCheckout(false)}>Cancel</button>
            <button className="btn btn-success" disabled={isPaying}>{isPaying ? "Requesting..." : "Pay with M-Pesa"}</button>
          </Modal.Footer>
        </form>
      </Modal>
      <NotificationToast message={message} onClose={() => setMessage("")} />
    </main>
  )
}

export default ProductDetails
