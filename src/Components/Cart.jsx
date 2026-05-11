import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fileUrl } from '../api'
import { cartTotal, clearCart, getCartItems, removeCartItem, updateCartItemQuantity } from '../cartUtils'
import { payForCartItems } from '../checkoutUtils'
import NotificationToast from './NotificationToast'

const Cart = () => {
  const token = localStorage.getItem("token")
  const [items, setItems] = useState(() => getCartItems())
  const [mpesaPhone, setMpesaPhone] = useState("")
  const [message, setMessage] = useState("")
  const [isPaying, setIsPaying] = useState(false)

  const total = useMemo(() => cartTotal(items), [items])

  const updateQuantity = (lineId, quantity) => {
    setItems(updateCartItemQuantity(lineId, quantity))
  }

  const removeItem = (lineId) => {
    setItems(removeCartItem(lineId))
    setMessage("Item removed from cart")
  }

  const payForCart = async (e) => {
    e.preventDefault()
    if (!token) {
      setMessage("Please sign in before paying.")
      return
    }
    if (items.length === 0) {
      setMessage("Your cart is empty.")
      return
    }

    try {
      setIsPaying(true)
      const orderIds = await payForCartItems({ items, phone: mpesaPhone, token })
      clearCart()
      setItems([])
      setMpesaPhone("")
      setMessage(`Payment requested. Check your phone for M-Pesa. Orders: ${orderIds.join(", ")}`)
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Could not request payment")
    } finally {
      setIsPaying(false)
    }
  }

  if (!token) {
    return (
      <main className="page-dark dashboard-shell cart-page">
        <section className="dashboard-card cart-empty">
          <p className="dashboard-kicker">Cart</p>
          <h2>Please sign in to use your cart.</h2>
          <p>Your cart is saved separately for each account.</p>
          <Link to="/signin" className="btn btn-success">Sign In</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="page-dark dashboard-shell cart-page">
      <section className="cart-hero dashboard-card">
        <div>
          <p className="dashboard-kicker">Cart</p>
          <h1>Your market basket</h1>
          <p>Review produce from your selected farms, adjust quantities, then pay once with M-Pesa.</p>
        </div>
        <Link to="/product" className="btn btn-outline-light">Continue Shopping</Link>
      </section>

      {items.length === 0 ? (
        <section className="dashboard-card cart-empty">
          <h2>Your cart is empty.</h2>
          <p>Add products from the marketplace and they will appear here.</p>
          <Link to="/product" className="btn btn-success">Browse Products</Link>
        </section>
      ) : (
        <section className="cart-layout">
          <div className="cart-list">
            {items.map((item) => (
              <article className="cart-row" key={item.lineId}>
                <Link to={`/product/${item.id}`} className="cart-row-image">
                  <img src={fileUrl(item.photo_url)} alt={item.name} />
                </Link>
                <div className="cart-row-details">
                  <p className="dashboard-kicker">{item.farm_name || "Farm product"}</p>
                  <h3>{item.name}</h3>
                  <span>{item.county || item.category || "Kenya"} - KES {item.price_per_unit} / {item.unit}</span>
                </div>
                <div className="cart-row-controls">
                  <label>
                    <span>Qty</span>
                    <input
                      className="form-control"
                      type="number"
                      min="1"
                      max={item.quantity_available || undefined}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.lineId, e.target.value)}
                    />
                  </label>
                  <strong>KES {(Number(item.price_per_unit || 0) * Number(item.quantity || 0)).toLocaleString()}</strong>
                  <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => removeItem(item.lineId)}>Remove</button>
                </div>
              </article>
            ))}
          </div>

          <aside className="cart-summary dashboard-card">
            <p className="dashboard-kicker">Checkout</p>
            <h2>Total</h2>
            <strong>KES {total.toLocaleString()}</strong>
            <form onSubmit={payForCart} className="dashboard-form mt-3">
              <input
                className="form-control"
                placeholder="M-Pesa phone number"
                required
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
              />
              <button className="btn btn-success" disabled={isPaying}>{isPaying ? "Requesting..." : "Pay with M-Pesa"}</button>
            </form>
          </aside>
        </section>
      )}

      <NotificationToast message={message} onClose={() => setMessage("")} />
    </main>
  )
}

export default Cart
