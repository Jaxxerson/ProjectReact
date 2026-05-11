import React, { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import API_BASE_URL, { fileUrl } from '../api'
import NotificationToast from './NotificationToast'

const uniqueById = (items) => Array.from(new Map(items.map((item, index) => [item.id || index, item])).values())

const FarmDetails = () => {
  const { farmId } = useParams()
  const [farm, setFarm] = useState(null)
  const [farmProducts, setFarmProducts] = useState([])
  const [ratings, setRatings] = useState([])
  const [ratingSummary, setRatingSummary] = useState({})
  const [activeSection, setActiveSection] = useState("overview")
  const [ratingValue, setRatingValue] = useState("5")
  const [comment, setComment] = useState("")
  const [message, setMessage] = useState("")
  const signedInUser = (() => {
    const saved = localStorage.getItem("user")
    return saved ? JSON.parse(saved) : null
  })()
  const signedInUserId = signedInUser?.id ?? signedInUser?.user_id
  const isOwnRating = (rating) => (
    signedInUserId && String(signedInUserId) === String(rating.user_id)
  )

  const loadFarmDetails = useCallback(async () => {
    const [farmResponse, productsResponse, ratingsResponse] = await Promise.all([
      axios.get(`${API_BASE_URL}/get_farm/${farmId}`),
      axios.get(`${API_BASE_URL}/get_farm_products/${farmId}`),
      axios.get(`${API_BASE_URL}/get_farm_ratings/${farmId}`),
    ])
    setFarm(farmResponse.data)
    setFarmProducts(uniqueById(productsResponse.data))
    setRatings(uniqueById(ratingsResponse.data.ratings || []))
    setRatingSummary(ratingsResponse.data.summary || {})
  }, [farmId])

  useEffect(() => {
    loadFarmDetails().catch(() => setMessage("Could not load farm details"))
  }, [loadFarmDetails])

  const applyNow = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      setMessage("Please sign in before applying.")
      return
    }

    const formData = new FormData()
    formData.append("farm_id", farmId)

    try {
      const response = await axios.post(`${API_BASE_URL}/apply_farm_job`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessage(response.data.message)
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Could not send application")
    }
  }

  const rateFarm = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem("token")
    if (!token) {
      setMessage("Please sign in before rating.")
      return
    }

    const formData = new FormData()
    formData.append("farm_id", farmId)
    formData.append("rating", ratingValue)
    formData.append("comment", comment)

    try {
      await axios.post(`${API_BASE_URL}/rate_farm`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setComment("")
      await loadFarmDetails()
      setMessage("Rating saved")
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Could not save rating")
    }
  }

  const deleteRating = async (ratingId) => {
    const token = localStorage.getItem("token")
    if (!token) {
      setMessage("Please sign in before deleting a review.")
      return
    }

    try {
      await axios.post(`${API_BASE_URL}/delete_farm_rating`, (() => {
        const formData = new FormData()
        formData.append("rating_id", ratingId)
        return formData
      })(), {
        headers: { Authorization: `Bearer ${token}` }
      })
      await loadFarmDetails()
      setMessage("Review deleted")
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Could not delete review")
    }
  }

  const renderPanel = () => {
    if (!farm) return <div className="dashboard-card">Select a farm to view details.</div>

    if (activeSection === "products") {
      return (
        <div className="browse-items compact">
          {farmProducts.map((product) => (
            <article className="browse-card" key={product.id}>
              <img src={fileUrl(product.photo_url)} alt={product.name} />
              <div>
                <h3>{product.name}</h3>
                <p>{product.description || "Fresh produce from this farm."}</p>
                <strong>KES {product.price_per_unit} / {product.unit}</strong>
              </div>
            </article>
          ))}
        </div>
      )
    }

    if (activeSection === "apply") {
      return (
        <div className="dashboard-card">
          <h2>Apply Now</h2>
          <p>This sends your account information to the farm owner so they can review you for available work.</p>
          <button type="button" className="btn btn-outline-success" onClick={applyNow}>Apply Now</button>
        </div>
      )
    }

    if (activeSection === "ratings") {
      return (
        <div className="dashboard-card">
          <h2>Ratings</h2>
          <form onSubmit={rateFarm} className="rating-form">
            <select className="form-select" value={ratingValue} onChange={(e) => setRatingValue(e.target.value)}>
              {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}
            </select>
            <textarea className="form-control" rows="3" placeholder="Write a short review" value={comment} onChange={(e) => setComment(e.target.value)}></textarea>
            <button className="btn btn-success">Submit Rating</button>
          </form>
          <div className="rating-list">
            {ratings.map((rating) => (
              <div className="rating-item" key={rating.id || `${rating.full_name}-${rating.created_at}`}>
                <p><strong>{rating.rating}/5</strong> {rating.comment || "No comment"} by {rating.full_name}</p>
                {isOwnRating(rating) && (
                  <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => deleteRating(rating.id)}>Delete Review</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="dashboard-card">
        <h2>{farm.name}</h2>
        <p>{farm.description || "A ShambaSmart farm growing fresh produce for Kenyan buyers."}</p>
        <p>{farm.location || farm.county}</p>
        <div className="farm-stats">
          <span>Rating: {Number(ratingSummary.average_rating || 0).toFixed(1)} / 5</span>
          <span>{ratingSummary.rating_count || 0} ratings</span>
          <span>{farmProducts.length} products</span>
        </div>
        <h3>Most favourited products</h3>
        <div className="mini-product-list">
          {farmProducts.slice(0, 3).map((product) => <span key={product.id}>{product.name}</span>)}
        </div>
      </div>
    )
  }

  return (
    <main className="page-dark dashboard-shell">
      <Link to="/farms" className="btn btn-outline-light mb-3">Back to Farms</Link>
      {farm && (
        <section className="farm-detail-hero dashboard-card">
          <img src={fileUrl(farm.profile_photo)} alt={farm.name} />
          <div>
            <p className="dashboard-kicker">Farm</p>
            <h1>{farm.name}</h1>
            <p>{farm.county || farm.location || "Kenya"}</p>
          </div>
        </section>
      )}

      <section className="farm-page-layout">
        <aside className="dashboard-sidebar">
          {["overview", "products", "apply", "ratings"].map((section) => (
            <button className={activeSection === section ? "active" : ""} key={section} onClick={() => setActiveSection(section)}>
              {section === "apply" ? "Apply Now" : section[0].toUpperCase() + section.slice(1)}
            </button>
          ))}
        </aside>
        <div>{renderPanel()}</div>
      </section>

      <NotificationToast message={message} onClose={() => setMessage("")} />
    </main>
  )
}

export default FarmDetails
