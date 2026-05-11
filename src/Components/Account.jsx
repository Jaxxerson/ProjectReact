import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Modal } from 'react-bootstrap'
import axios from 'axios'
import API_BASE_URL from '../api'
import NotificationToast from './NotificationToast'

const getProfileCompletion = (user) => {
  const fields = [
    user?.full_name,
    user?.email,
    user?.phone,
    user?.address_line1,
    user?.city,
    user?.county,
    user?.profile_picture_url,
  ]
  return Math.round((fields.filter(Boolean).length / fields.length) * 100)
}

const Account = ({ onUserUpdate, onLogout }) => {
  const initialUser = useMemo(() => {
    const savedUser = localStorage.getItem("user")
    return savedUser ? JSON.parse(savedUser) : null
  }, [])

  const [user, setUser] = useState(initialUser)
  const [fullName, setFullName] = useState(initialUser?.full_name || "")
  const [email, setEmail] = useState(initialUser?.email || "")
  const [phone, setPhone] = useState(initialUser?.phone || "")
  const [addressLine1, setAddressLine1] = useState(initialUser?.address_line1 || "")
  const [addressLine2, setAddressLine2] = useState(initialUser?.address_line2 || "")
  const [postalCode, setPostalCode] = useState(initialUser?.postal_code || "")
  const [city, setCity] = useState(initialUser?.city || "")
  const [county, setCounty] = useState(initialUser?.county || "")
  const [profilePicture, setProfilePicture] = useState(null)
  const [actionPassword, setActionPassword] = useState("")
  const [pendingAction, setPendingAction] = useState("")
  const [message, setMessage] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [dashboardContext, setDashboardContext] = useState({
    owned_farms: [],
    worker_farms: [],
  })

  const token = localStorage.getItem("token")

  useEffect(() => {
    if (!token) return

    axios.get(`${API_BASE_URL}/dashboard_context`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((response) => {
        setDashboardContext(response.data)
        if (response.data.user) {
          setUser(response.data.user)
          localStorage.setItem("user", JSON.stringify(response.data.user))
          onUserUpdate(response.data.user)
        }
      })
      .catch(() => {})
  }, [onUserUpdate, token])

  const saveAccount = async (e) => {
    e.preventDefault()
    setMessage("")

    const formData = new FormData()
    formData.append("full_name", fullName)
    formData.append("email", email)
    formData.append("phone", phone)
    formData.append("address_line1", addressLine1)
    formData.append("address_line2", addressLine2)
    formData.append("postal_code", postalCode)
    formData.append("city", city)
    formData.append("county", county)
    if (profilePicture) {
      formData.append("profile_picture", profilePicture)
    }

    try {
      setIsSaving(true)
      const response = await axios.post(`${API_BASE_URL}/update_account`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(response.data.user)
      localStorage.setItem("user", JSON.stringify(response.data.user))
      onUserUpdate(response.data.user)
      setMessage(response.data.message)
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Could not update account")
    } finally {
      setIsSaving(false)
    }
  }

  const accountAction = async () => {
    setMessage("")
    const formData = new FormData()
    formData.append("password", actionPassword)

    try {
      const endpoint = pendingAction === "delete" ? "delete_account" : "disable_account"
      const response = await axios.post(`${API_BASE_URL}/${endpoint}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessage(response.data.message)
      setPendingAction("")
      onLogout()
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Action failed")
    }
  }

  if (!user) {
    return <main className="page-dark dashboard-shell">Please sign in to view your account.</main>
  }

  const completion = getProfileCompletion(user)
  const hasOwnedFarm = (dashboardContext.owned_farms || []).length > 0
  const hasWorkerFarm = (dashboardContext.worker_farms || []).length > 0

  return (
    <main className="page-dark dashboard-shell account-page">
      <section className="account-hero account-hero-polished">
        <div className="account-identity">
          <img
            src={user.profile_picture_url || "/logo192.png"}
            alt={user.full_name}
            className="account-profile-picture"
          />
          <div className="account-hero-details">
            <p className="dashboard-kicker">Account Settings</p>
            <h1>{user.full_name}</h1>
            <p>Keep your contact, delivery, and farm profile details ready so ShambaSmart can work harder for you.</p>
            <div className="account-detail-grid">
              <span>{user.email}</span>
              <span>{user.phone}</span>
              <span>{user.role || "buyer"}</span>
              <span>{user.county || user.location || "Location not set"}</span>
            </div>
          </div>
        </div>
        <div className="account-completion-card">
          <span>{completion}%</span>
          <p>Profile completion</p>
          <div className="account-progress"><i style={{ width: `${completion}%` }} /></div>
        </div>
      </section>

      <section className="account-layout">
        <form className="dashboard-card account-editor-card" onSubmit={saveAccount}>
          <div className="dashboard-card-header">
            <div>
              <p className="dashboard-kicker">Profile</p>
              <h2>Personal details</h2>
            </div>
            <button className="btn btn-success" disabled={isSaving}>{isSaving ? "Saving..." : "Save Changes"}</button>
          </div>

          <div className="account-fieldset">
            <h3>Public identity</h3>
            <div className="account-form-grid">
              <label>
                <span>Full name</span>
                <input className="form-control auth-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </label>
              <label>
                <span>Profile picture</span>
                <input className="form-control auth-input" type="file" accept="image/*" onChange={(e) => setProfilePicture(e.target.files[0])} />
              </label>
            </div>
          </div>

          <div className="account-fieldset">
            <h3>Contact</h3>
            <div className="account-form-grid">
              <label>
                <span>Email</span>
                <input className="form-control auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label>
                <span>Phone</span>
                <input className="form-control auth-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
            </div>
          </div>

          <div className="account-fieldset">
            <h3>Address</h3>
            <div className="account-form-grid">
              <label>
                <span>Address line 1</span>
                <input className="form-control auth-input" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
              </label>
              <label>
                <span>Address line 2</span>
                <input className="form-control auth-input" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
              </label>
              <label>
                <span>Postal code</span>
                <input className="form-control auth-input" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
              </label>
              <label>
                <span>City</span>
                <input className="form-control auth-input" value={city} onChange={(e) => setCity(e.target.value)} />
              </label>
              <label>
                <span>County</span>
                <input className="form-control auth-input" value={county} onChange={(e) => setCounty(e.target.value)} />
              </label>
            </div>
          </div>
        </form>

        <aside className="account-side-stack">
          <section className="dashboard-card account-status-card">
            <p className="dashboard-kicker">Status</p>
            <h2>{user.is_verified ? "Verified account" : "Verification needed"}</h2>
            <p>{user.is_verified ? "You can use farm owner and worker tools." : "Verify your account to unlock farm owner and farm worker tools."}</p>
            {!user.is_verified && <Link to="/verify-account" className="btn btn-outline-light">Verify Account</Link>}
          </section>

          <section className="dashboard-card account-tips-card">
            <p className="dashboard-kicker">Profile tips</p>
            <ul>
              <li>Add a clear profile photo.</li>
              <li>Keep your phone number current.</li>
              <li>Use accurate county and city details.</li>
            </ul>
          </section>
        </aside>
      </section>

      {user.is_verified && hasOwnedFarm && (
        <section className="verified-actions single-action">
          <div className="dashboard-card verified-action-card">
            <h2>Owner tools are ready</h2>
            <p>Open your owner dashboard to manage farms, crops, workers, costs, products, and orders.</p>
            <Link to="/dashboard" className="btn btn-outline-success">Go to Owner Dashboard</Link>
          </div>
        </section>
      )}

      {user.is_verified && !hasOwnedFarm && hasWorkerFarm && (
        <section className="verified-actions single-action">
          <div className="dashboard-card verified-action-card">
            <h2>Worker tools are ready</h2>
            <p>Open your worker dashboard to see farms where you have been accepted to work.</p>
            <Link to="/dashboard" className="btn btn-outline-success">Go to Worker Dashboard</Link>
          </div>
        </section>
      )}

      {user.is_verified && !hasOwnedFarm && !hasWorkerFarm && (
        <section className="verified-actions">
          <div className="dashboard-card verified-action-card">
            <h2>Do you own a farm?</h2>
            <p>Create a farm profile and start managing crops, workers, products, and orders.</p>
            <Link to="/farm-registration" className="btn btn-outline-success">Create a Farm</Link>
          </div>
          <div className="dashboard-card verified-action-card">
            <h2>Do you work on a farm?</h2>
            <p>Browse farms and connect with farm teams.</p>
            <Link to="/farms" className="btn btn-outline-success">Browse Farms</Link>
          </div>
        </section>
      )}

      <section className="dashboard-card danger-zone">
        <h2>Danger Zone</h2>
        <div className="danger-actions">
          <button type="button" className="btn btn-outline-warning" onClick={() => setPendingAction("disable")}>
            Disable Account
          </button>
          <button type="button" className="btn btn-outline-danger" onClick={() => setPendingAction("delete")}>
            Delete Account
          </button>
        </div>
      </section>

      <NotificationToast message={message} onClose={() => setMessage("")} />

      <Modal show={Boolean(pendingAction)} onHide={() => setPendingAction("")} centered>
        <Modal.Header closeButton>
          <Modal.Title>{pendingAction === "delete" ? "Delete Account" : "Disable Account"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Enter your password to continue.</p>
          <input
            className="form-control"
            type="password"
            value={actionPassword}
            onChange={(e) => setActionPassword(e.target.value)}
            autoFocus
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setPendingAction("")}>Cancel</Button>
          <Button variant={pendingAction === "delete" ? "danger" : "warning"} onClick={accountAction}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </main>
  )
}

export default Account
