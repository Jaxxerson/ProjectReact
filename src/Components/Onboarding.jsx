import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import API_BASE_URL from '../api'
import NotificationToast from './NotificationToast'

const Onboarding = () => {
  const navigate = useNavigate()
  const routeLocation = useLocation()
  const userId = routeLocation.state?.userId || sessionStorage.getItem("onboarding_user_id")

  const [addressLine1, setAddressLine1] = useState("")
  const [addressLine2, setAddressLine2] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [city, setCity] = useState("")
  const [county, setCounty] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")

  const submitAddress = async (e) => {
    e.preventDefault()
    setMessage("")

    if (!userId) {
      setMessage("Please sign up again so we can save your address.")
      return
    }

    setIsSaving(true)
    const formData = new FormData()
    formData.append("user_id", userId)
    formData.append("address_line1", addressLine1)
    formData.append("address_line2", addressLine2)
    formData.append("postal_code", postalCode)
    formData.append("city", city)
    formData.append("county", county)

    try {
      await axios.post(`${API_BASE_URL}/save_location`, formData)
      sessionStorage.removeItem("onboarding_user_id")
      navigate("/signin")
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Could not save address")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="onboarding-shell">
      <section className="onboarding-card fade-in">
        <p className="onboarding-kicker">Address details</p>
        <h2>Where are you located?</h2>

        <form onSubmit={submitAddress}>
          <input
            type="text"
            className="form-control auth-input"
            placeholder="Address line 1"
            value={addressLine1}
            required
            onChange={(e) => setAddressLine1(e.target.value)}
          />
          <input
            type="text"
            className="form-control auth-input"
            placeholder="Address line 2"
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
          />
          <div className="address-form-grid">
            <input
              type="text"
              className="form-control auth-input"
              placeholder="Postal code"
              value={postalCode}
              required
              onChange={(e) => setPostalCode(e.target.value)}
            />
            <input
              type="text"
              className="form-control auth-input"
              placeholder="City"
              value={city}
              required
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <input
            type="text"
            className="form-control auth-input"
            placeholder="County"
            value={county}
            required
            onChange={(e) => setCounty(e.target.value)}
          />

          <button type="submit" className="btn btn-success w-100 auth-submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Continue to Sign In"}
          </button>
        </form>
      </section>
      <NotificationToast message={message} onClose={() => setMessage("")} />
    </main>
  )
}

export default Onboarding
