import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import API_BASE_URL from '../api'
import NotificationToast from './NotificationToast'

const FarmRegistration = () => {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [county, setCounty] = useState("")
  const [location, setLocation] = useState("")
  const [sizeAcres, setSizeAcres] = useState("")
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [message, setMessage] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const submitFarm = async (e) => {
    e.preventDefault()
    setMessage("")

    const token = localStorage.getItem("token")
    const formData = new FormData()
    formData.append("name", name)
    formData.append("description", description)
    formData.append("county", county)
    formData.append("location", location)
    formData.append("size_acres", sizeAcres)
    if (profilePhoto) {
      formData.append("profile_photo", profilePhoto)
    }

    try {
      setIsSaving(true)
      await axios.post(`${API_BASE_URL}/add_farm`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const savedUser = localStorage.getItem("user")
      if (savedUser) {
        const user = JSON.parse(savedUser)
        localStorage.setItem("user", JSON.stringify({ ...user, role: "owner" }))
      }
      navigate("/dashboard")
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Could not create farm")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="page-dark dashboard-shell">
      <section className="dashboard-card verify-card">
        <p className="dashboard-kicker">Farm registration</p>
        <h1>Create a Farm</h1>
        <form onSubmit={submitFarm}>
          <input className="form-control auth-input" placeholder="Farm name" required value={name} onChange={(e) => setName(e.target.value)} />
          <textarea className="form-control auth-input" rows="3" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
          <input className="form-control auth-input" placeholder="County" required value={county} onChange={(e) => setCounty(e.target.value)} />
          <input className="form-control auth-input" placeholder="Location" required value={location} onChange={(e) => setLocation(e.target.value)} />
          <input className="form-control auth-input" type="number" min="0" step="0.01" placeholder="Size in acres" required value={sizeAcres} onChange={(e) => setSizeAcres(e.target.value)} />
          <input className="form-control auth-input" type="file" accept="image/*" onChange={(e) => setProfilePhoto(e.target.files[0])} />
          <button className="btn btn-success w-100" disabled={isSaving}>{isSaving ? "Creating..." : "Create Farm"}</button>
        </form>
      </section>
      <NotificationToast message={message} onClose={() => setMessage("")} />
    </main>
  )
}

export default FarmRegistration
