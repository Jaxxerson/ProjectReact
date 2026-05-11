import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import API_BASE_URL, { fileUrl } from '../api'
import NotificationToast from './NotificationToast'

const uniqueById = (items) => Array.from(new Map(items.map((item) => [item.id, item])).values())

const Farms = () => {
  const navigate = useNavigate()
  const [farms, setFarms] = useState([])
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [layout, setLayout] = useState("grid")
  const [message, setMessage] = useState("")

  useEffect(() => {
    axios.get(`${API_BASE_URL}/get_farms`)
      .then((response) => setFarms(uniqueById(response.data)))
      .catch(() => setMessage("Could not load farms"))
  }, [])

  const visibleFarms = useMemo(() => {
    const text = search.toLowerCase()
    const filtered = farms.filter((farm) =>
      `${farm.name} ${farm.county} ${farm.location} ${farm.description}`.toLowerCase().includes(text)
    )

    return filtered.sort((a, b) => {
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "")
      if (sortBy === "county") return (a.county || "").localeCompare(b.county || "")
      return (b.id || 0) - (a.id || 0)
    })
  }, [farms, search, sortBy])

  return (
    <main className="page-dark dashboard-shell">
      <section className="browse-hero dashboard-card">
        <p className="dashboard-kicker">Farms</p>
        <h1>Find farms, work opportunities, and trusted produce sources.</h1>
        <p>Workers can apply for farm jobs, while buyers can open a farm profile to see products, ratings, and farm details.</p>
      </section>

      <section className="browse-controls">
        <input className="form-control" placeholder="Search farms" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="name">Farm name</option>
          <option value="county">County</option>
        </select>
        <div className="btn-group">
          <button className={`btn ${layout === "grid" ? "btn-success" : "btn-outline-success"}`} onClick={() => setLayout("grid")}>Grid</button>
          <button className={`btn ${layout === "compact" ? "btn-success" : "btn-outline-success"}`} onClick={() => setLayout("compact")}>Compact</button>
        </div>
      </section>

      <section className={`browse-items ${layout}`}>
        {visibleFarms.map((farm) => (
          <article className="browse-card" key={farm.id} onClick={() => navigate(`/farms/${farm.id}`)}>
            <img src={fileUrl(farm.profile_photo)} alt={farm.name} />
            <div>
              <h3>{farm.name}</h3>
              <p>{farm.county || farm.location || "Kenya"}</p>
              <span>{farm.size_acres || 0} acres</span>
            </div>
          </article>
        ))}
      </section>

      {visibleFarms.length === 0 && !message && <div className="dashboard-card">No farms found.</div>}
      <NotificationToast message={message} onClose={() => setMessage("")} />
    </main>
  )
}

export default Farms
