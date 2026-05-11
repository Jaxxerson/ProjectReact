import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Modal } from 'react-bootstrap'
import axios from 'axios'
import API_BASE_URL, { authConfig, fileUrl } from '../api'
import NotificationToast from './NotificationToast'

const roleSections = {
  owner: ["Overview", "My Farms", "Logs", "Crops", "Workers", "Costs", "Products", "Orders"],
  worker: ["Overview", "My Farms", "Orders", "Crops", "Products"],
  buyer: ["Overview", "My Orders", "Products"],
}

const emptyCrop = { name: "", variety: "", plot_name: "", planted_date: "", expected_harvest_date: "", notes: "" }
const emptyCost = { product_name: "", category: "", amount: "", cost_date: "", purchase_frequency: "one_time", description: "", receipt_photo: null }
const emptyProduct = { name: "", description: "", category: "", price_per_unit: "", unit: "kg", quantity_available: "", crop_id: "", product_photo: null }
const uniqueById = (items) => Array.from(new Map(items.map((item, index) => [item.id || index, item])).values())
const isMarketplaceProduct = (product) => (
  Number(product?.is_available ?? 1) === 1 && Number(product?.quantity_available || 0) > 0
)
const cleanLogType = (type) => String(type || "worker_change").replace(/_/g, " ")

const logIds = (log) => {
  if (Array.isArray(log.log_ids)) return log.log_ids
  if (Array.isArray(log.ids)) return log.ids
  return [log.id]
}

const logSummaries = (log) => {
  if (Array.isArray(log.summaries) && log.summaries.length > 0) return log.summaries
  return [log.change_summary || "Worker changed farm data"]
}

const appendFields = (formData, fields, skipEmpty = true) => {
  Object.entries(fields).forEach(([key, value]) => {
    if (!skipEmpty || value) formData.append(key, value)
  })
  return formData
}

const Dashboard = () => {
  const savedUser = useMemo(() => {
    const saved = localStorage.getItem("user")
    return saved ? JSON.parse(saved) : null
  }, [])

  const [context, setContext] = useState({ dashboard_role: savedUser?.role || "buyer", owned_farms: [], worker_farms: [] })
  const [activeSection, setActiveSection] = useState("Overview")
  const [selectedFarmId, setSelectedFarmId] = useState("")
  const [loadingMode, setLoadingMode] = useState(Boolean(localStorage.getItem("token")))
  const [message, setMessage] = useState("")
  const [farmData, setFarmData] = useState({ crops: [], products: [], workers: [], applications: [], logs: [], costs: [], orders: [], sales: [] })
  const [buyerData, setBuyerData] = useState({ orders: [], suggestions: [] })
  const [cropForm, setCropForm] = useState(emptyCrop)
  const [costForm, setCostForm] = useState(emptyCost)
  const [productForm, setProductForm] = useState(emptyProduct)
  const [salaryTarget, setSalaryTarget] = useState(null)
  const [contactTarget, setContactTarget] = useState(null)
  const [salaryForm, setSalaryForm] = useState({ salary: "", pay_period: "monthly" })
  const [pendingAction, setPendingAction] = useState("")

  const token = localStorage.getItem("token")
  const role = context.dashboard_role === "admin" ? "owner" : context.dashboard_role || "buyer"
  const currentUser = context.user || savedUser
  const sections = roleSections[role] || roleSections.buyer
  const ownedFarms = context.owned_farms || []
  const workerFarms = context.worker_farms || []
  const farmOptions = role === "owner" ? ownedFarms : workerFarms
  const selectedFarm = farmOptions.find((farm) => String(farm.id) === String(selectedFarmId)) || farmOptions[0]
  const isPending = (key) => pendingAction === key
  const visibleLogs = farmData.logs
  const auth = useMemo(() => authConfig(token), [token])

  const farmFormData = useCallback((fields = {}, skipEmpty = true) => {
    const formData = new FormData()
    formData.append("farm_id", selectedFarm.id)
    return appendFields(formData, fields, skipEmpty)
  }, [selectedFarm?.id])

  const postForm = useCallback((endpoint, formData) => (
    axios.post(`${API_BASE_URL}/${endpoint}`, formData, auth)
  ), [auth])

  const loadContext = useCallback(async () => {
    if (!token) {
      setLoadingMode(false)
      return
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard_context`, auth)
      setContext(response.data)
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user))
      }
      const firstFarm = response.data.owned_farms?.[0]?.id || response.data.worker_farms?.[0]?.id
      if (firstFarm && !selectedFarmId) setSelectedFarmId(String(firstFarm))
    } catch {
      setMessage("Could not refresh dashboard mode")
    } finally {
      setLoadingMode(false)
    }
  }, [auth, selectedFarmId, token])

  const loadFarmData = useCallback(async (farmId) => {
    if (!farmId) return
    try {
      const [crops, products, workers, applications, logs, costs, orders, sales] = await Promise.all([
        axios.get(`${API_BASE_URL}/get_crops/${farmId}`),
        axios.get(`${API_BASE_URL}/get_farm_products/${farmId}`),
        axios.get(`${API_BASE_URL}/get_farm_workers/${farmId}`),
        role === "owner" ? axios.get(`${API_BASE_URL}/get_farm_applications/${farmId}`, auth).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        role === "owner" ? axios.get(`${API_BASE_URL}/get_owner_requests/${farmId}`, auth).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        axios.get(`${API_BASE_URL}/get_costs/${farmId}`),
        axios.get(`${API_BASE_URL}/get_farm_orders/${farmId}`),
        axios.get(`${API_BASE_URL}/get_farm_sales/${farmId}`),
      ])
      setFarmData({
        crops: uniqueById(crops.data),
        products: uniqueById(products.data).filter(isMarketplaceProduct),
        workers: uniqueById(workers.data),
        applications: uniqueById(applications.data),
        logs: uniqueById(logs.data),
        costs: uniqueById(costs.data),
        orders: uniqueById(orders.data).filter((order) => order.status !== "removed"),
        sales: uniqueById(sales.data),
      })
    } catch {
      setMessage("Could not load farm dashboard data")
    }
  }, [auth, role])

  const loadBuyerData = useCallback(async () => {
    const buyerId = currentUser?.id || currentUser?.user_id
    if (!buyerId) return

    try {
      const [orders, products] = await Promise.all([
        axios.get(`${API_BASE_URL}/get_my_orders/${buyerId}`),
        axios.get(`${API_BASE_URL}/get_products`),
      ])
      setBuyerData({
        orders: uniqueById(orders.data).filter((order) => order.status !== "removed"),
        suggestions: uniqueById(products.data).filter(isMarketplaceProduct).slice(0, 6),
      })
    } catch {
      setMessage("Could not load buyer dashboard data")
    }
  }, [currentUser?.id, currentUser?.user_id])

  useEffect(() => {
    loadContext()
  }, [loadContext])

  useEffect(() => {
    if (!sections.includes(activeSection)) setActiveSection(sections[0])
  }, [activeSection, sections])

  useEffect(() => {
    if ((role === "owner" || role === "worker") && selectedFarm?.id) loadFarmData(selectedFarm.id)
  }, [loadFarmData, role, selectedFarm?.id])

  useEffect(() => {
    if (role === "buyer") loadBuyerData()
  }, [loadBuyerData, role])

  const submitCrop = async (e) => {
    e.preventDefault()
    setPendingAction("crop")
    try {
      await postForm("add_crop", farmFormData(cropForm, false))
      setMessage("Crop registered successfully")
      loadFarmData(selectedFarm.id)
      setCropForm(emptyCrop)
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Could not submit crop")
    } finally {
      setPendingAction("")
    }
  }

  const submitCost = async (e) => {
    e.preventDefault()
    setPendingAction("cost")
    try {
      await postForm("add_cost", farmFormData(costForm))
      setCostForm(emptyCost)
      setMessage("Cost recorded successfully")
      loadFarmData(selectedFarm.id)
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Could not record cost")
    } finally {
      setPendingAction("")
    }
  }

  const submitProduct = async (e) => {
    e.preventDefault()
    setPendingAction("product")
    try {
      await postForm("add_product", farmFormData(productForm))
      setMessage("Product listed successfully")
      loadFarmData(selectedFarm.id)
      setProductForm(emptyProduct)
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Could not submit product")
    } finally {
      setPendingAction("")
    }
  }

  const reviewApplication = async (application, action) => {
    const actionKey = `application-${application.id}-${action}`
    setPendingAction(actionKey)
    try {
      const formData = appendFields(new FormData(), {
        application_id: application.id,
        action,
        role_title: "Farm worker",
        pay_period: "monthly",
      }, false)
      await postForm("review_farm_application", formData)
      setMessage(action === "accept" ? "Application accepted" : "Application declined")
      setFarmData((current) => ({
        ...current,
        applications: current.applications.filter((item) => item.id !== application.id),
      }))
      await loadFarmData(selectedFarm.id)
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Could not review application")
    } finally {
      setPendingAction("")
    }
  }

  const revertWorkerLog = async (log) => {
    const actionKey = `log-${log.id}-revert`
    setPendingAction(actionKey)
    try {
      await postForm("revert_worker_log", appendFields(new FormData(), { log_id: log.id }, false))
      setMessage("Change reverted")
      setFarmData((current) => ({
        ...current,
        logs: current.logs.filter((item) => item.id !== log.id),
      }))
      loadFarmData(selectedFarm.id)
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Could not revert change")
    } finally {
      setPendingAction("")
    }
  }

  const approveWorkerLog = async (log) => {
    const ids = logIds(log)
    const actionKey = `log-${ids.join("-")}-approve`
    setPendingAction(actionKey)
    try {
      await postForm("approve_worker_log", appendFields(new FormData(), { log_ids: JSON.stringify(ids) }, false))
      setMessage(ids.length > 1 ? "Logs approved" : "Log approved")
      setFarmData((current) => ({
        ...current,
        logs: current.logs.filter((item) => !logIds(item).some((id) => ids.includes(id))),
      }))
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Could not approve log")
    } finally {
      setPendingAction("")
    }
  }

  const saveSalary = async () => {
    setPendingAction("salary")
    const formData = farmFormData({
      worker_id: salaryTarget.worker_id,
      salary: salaryForm.salary,
      pay_period: salaryForm.pay_period,
    }, false)
    await postForm("update_worker_salary", formData)
    setSalaryTarget(null)
    setMessage("Worker salary updated")
    loadFarmData(selectedFarm.id)
    setPendingAction("")
  }

  const fireWorker = async (worker) => {
    setPendingAction(`fire-${worker.worker_id}`)
    await postForm("remove_farm_worker", farmFormData({ worker_id: worker.worker_id }, false))
    setMessage("Worker removed")
    loadFarmData(selectedFarm.id)
    setPendingAction("")
  }

  const deleteFarm = async () => {
    if (!selectedFarm) return
    setPendingAction("delete-farm")
    try {
      await postForm("delete_farm", farmFormData({}, false))
      setMessage("Farm deleted")
      await loadContext()
      setSelectedFarmId("")
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Could not delete farm")
    } finally {
      setPendingAction("")
    }
  }

  const deleteProduct = async (product) => {
    setPendingAction(`delete-product-${product.id}`)
    try {
      await postForm("delete_product", farmFormData({ product_id: product.id }, false))
      setMessage("Product deleted")
      setFarmData((current) => ({
        ...current,
        products: current.products.filter((item) => item.id !== product.id),
      }))
      await loadFarmData(selectedFarm.id)
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Could not delete product")
    } finally {
      setPendingAction("")
    }
  }

  const deleteCost = async (cost) => {
    setPendingAction(`delete-cost-${cost.id}`)
    try {
      await postForm("delete_cost", farmFormData({ cost_id: cost.id }, false))
      setMessage("Cost deleted")
      loadFarmData(selectedFarm.id)
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Could not delete cost")
    } finally {
      setPendingAction("")
    }
  }

  const updateOrder = async (order, status) => {
    setPendingAction(`order-${order.id}-${status}`)
    const formData = appendFields(new FormData(), { order_id: order.id, status }, false)
    await postForm("update_order_status", formData)
    setMessage(`Order marked as ${status}`)
    loadFarmData(selectedFarm.id)
    setPendingAction("")
  }

  const removeOrderFromPage = async (order) => {
    setPendingAction(`delete-order-${order.id}`)
    try {
      const formData = appendFields(new FormData(), { order_id: order.id, status: "removed" }, false)
      await postForm("update_order_status", formData)
      setMessage(`Order #${order.id} removed from this orders page`)
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Could not remove order")
    } finally {
      setFarmData((current) => ({
        ...current,
        orders: current.orders.filter((item) => item.id !== order.id),
      }))
      setPendingAction("")
    }
  }

  const orderStatusLabel = (status) => {
    if (status === "pending") return "Requested but not paid"
    if (status === "confirmed") return "Paid"
    if (status === "packed") return "Being delivered"
    if (status === "delivered") return "Delivered successfully"
    if (status === "cancelled") return "Cancelled"
    return status || "Requested but not paid"
  }

  const buyerPaidOrders = buyerData.orders.filter((order) => ["confirmed", "packed", "delivered"].includes(order.status))
  const buyerOpenOrders = buyerData.orders.filter((order) => ["pending", "confirmed", "packed"].includes(order.status))

  const monthlySalaryTotal = farmData.workers.reduce((sum, worker) => {
    if (worker.pay_period === "monthly") return sum + Number(worker.salary || 0)
    return sum
  }, 0)
  const monthlyCostTotal = farmData.costs.reduce((sum, cost) => sum + Number(cost.amount || 0), 0) + monthlySalaryTotal
  const monthlySalesTotal = farmData.sales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0)
  const monthlyNetSales = monthlySalesTotal - monthlyCostTotal

  if (loadingMode) {
    return <main className="page-dark dashboard-shell dashboard-page"><section className="dashboard-card">Loading your dashboard...</section></main>
  }

  const renderFarmPicker = () => farmOptions.length > 0 && (
    <section className="dashboard-card dashboard-farm-picker">
      <label>
        <span>Managing farm</span>
        <select className="form-select" value={selectedFarmId || selectedFarm?.id || ""} onChange={(e) => setSelectedFarmId(e.target.value)}>
          {farmOptions.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}
        </select>
      </label>
    </section>
  )

  const renderBuyerOverview = () => (
    <div className="dashboard-stack buyer-dashboard-overview">
      <div className="dashboard-grid dashboard-stat-grid">
        <div className="dashboard-card dashboard-stat-card"><span>Total orders</span><strong>{buyerData.orders.length}</strong><p>Orders you have placed from farms.</p></div>
        <div className="dashboard-card dashboard-stat-card"><span>Active orders</span><strong>{buyerOpenOrders.length}</strong><p>Orders still pending, paid, or being delivered.</p></div>
        <div className="dashboard-card dashboard-stat-card"><span>Paid orders</span><strong>{buyerPaidOrders.length}</strong><p>Orders that are paid, moving, or delivered.</p></div>
        <div className="dashboard-card dashboard-stat-card"><span>Available picks</span><strong>{buyerData.suggestions.length}</strong><p>Fresh marketplace items you can buy now.</p></div>
      </div>

      <section className="dashboard-overview-panels">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <p className="dashboard-kicker">Recent orders</p>
              <h3>Your latest purchases</h3>
            </div>
            <button className="btn btn-outline-light" type="button" onClick={() => setActiveSection("My Orders")}>View Orders</button>
          </div>
          <div className="dashboard-log-stack">
            {buyerData.orders.slice(0, 4).map((order) => (
              <span key={order.id}>Order #{order.id} from {order.farm_name}: KES {order.total_amount} - {orderStatusLabel(order.status)}</span>
            ))}
            {buyerData.orders.length === 0 && <span>No orders yet. Start from the marketplace when you are ready.</span>}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <p className="dashboard-kicker">Suggestions</p>
              <h3>Fresh picks to buy</h3>
            </div>
            <Link className="btn btn-outline-light" to="/product">Browse Marketplace</Link>
          </div>
          <div className="mini-product-list">
            {buyerData.suggestions.slice(0, 4).map((product) => (
              <Link to={`/product/${product.id}`} key={product.id}>{product.name} - KES {product.price_per_unit}/{product.unit}</Link>
            ))}
            {buyerData.suggestions.length === 0 && <span>No product suggestions yet.</span>}
          </div>
        </div>
      </section>
    </div>
  )

  const renderOverview = () => role === "buyer" ? renderBuyerOverview() : (
    <>
      <div className="dashboard-grid dashboard-stat-grid">
        <div className="dashboard-card dashboard-stat-card"><span>Active farms</span><strong>{ownedFarms.length || workerFarms.length}</strong><p>{role === "owner" ? "Farm profiles you own" : "Farms linked to you"}</p></div>
        <div className="dashboard-card dashboard-stat-card"><span>Crops</span><strong>{farmData.crops.length}</strong><p>Registered crop records</p></div>
        <div className="dashboard-card dashboard-stat-card"><span>Products</span><strong>{farmData.products.length}</strong><p>Marketplace listings</p></div>
        <div className="dashboard-card dashboard-stat-card"><span>Orders</span><strong>{farmData.orders.length}</strong><p>Buyer order activity</p></div>
      </div>
      {role === "owner" && selectedFarm && (
        <section className="dashboard-card farm-overview-card">
          <div>
            <p className="dashboard-kicker">Farm overview</p>
            <h3>{selectedFarm.name}</h3>
            <p>{selectedFarm.description || "No farm description added yet."}</p>
            <button className="btn btn-outline-danger" type="button" disabled={pendingAction === "delete-farm"} onClick={deleteFarm}>
              Delete Farm
            </button>
          </div>
          <div className="farm-overview-details">
            <span>{selectedFarm.county || "County not set"}</span>
            <span>{selectedFarm.location || "Location not set"}</span>
            <span>{selectedFarm.size_acres || 0} acres</span>
          </div>
        </section>
      )}
    </>
  )

  const renderCrops = () => (
    <div className="dashboard-stack">
      <form className="dashboard-card dashboard-form" onSubmit={submitCrop}>
        <div className="dashboard-card-header"><h3>Crop Registration</h3><button className="btn btn-success" disabled={pendingAction === "crop"}>Add Crop</button></div>
        <div className="dashboard-form-grid">
          <input className="form-control" placeholder="Crop name" required value={cropForm.name} onChange={(e) => setCropForm({ ...cropForm, name: e.target.value })} />
          <input className="form-control" placeholder="Variety" value={cropForm.variety} onChange={(e) => setCropForm({ ...cropForm, variety: e.target.value })} />
          <input className="form-control" placeholder="Plot name" value={cropForm.plot_name} onChange={(e) => setCropForm({ ...cropForm, plot_name: e.target.value })} />
          <label className="dashboard-field">
            <span>Planting date</span>
            <input className="form-control" type="date" aria-label="Planting date" title="The date this crop was planted" value={cropForm.planted_date} onChange={(e) => setCropForm({ ...cropForm, planted_date: e.target.value })} />
          </label>
          <label className="dashboard-field">
            <span>Expected harvest date</span>
            <input className="form-control" type="date" aria-label="Expected harvest date" title="The date you expect this crop to be ready for harvest" value={cropForm.expected_harvest_date} onChange={(e) => setCropForm({ ...cropForm, expected_harvest_date: e.target.value })} />
          </label>
          <textarea className="form-control" placeholder="Notes" value={cropForm.notes} onChange={(e) => setCropForm({ ...cropForm, notes: e.target.value })}></textarea>
        </div>
      </form>
      <section className="dashboard-grid">
        {farmData.crops.map((crop) => <article className="dashboard-card" key={crop.id}><h3>{crop.name}</h3><p>{crop.variety || "No variety"} - {crop.plot_name || "No plot"}</p><span>{crop.status || "active"}</span></article>)}
      </section>
    </div>
  )

  const renderLogs = () => (
    <div className="dashboard-stack">
      <section className="dashboard-card">
        <p className="dashboard-kicker">Worker logs</p>
        <h3>Worker changes on this farm</h3>
        <div className="dashboard-people-list">
          {visibleLogs.map((log) => {
            const ids = logIds(log)
            const summaries = logSummaries(log)

            return (
              <article className="dashboard-person dashboard-log-item" key={ids.join("-")}>
                <img src={fileUrl(log.profile_picture)} alt={log.full_name} />
                <div>
                  <div className="dashboard-log-heading">
                    <h4>{log.full_name}</h4>
                    {ids.length > 1 && <span>{ids.length} updates</span>}
                  </div>
                  <p>{cleanLogType(log.change_type)}</p>
                  <div className="dashboard-log-stack">
                    {summaries.slice(0, 3).map((summary, index) => (
                      <span key={`${ids[index] || index}-${summary}`}>{summary}</span>
                    ))}
                    {summaries.length > 3 && <span>+{summaries.length - 3} more related updates</span>}
                  </div>
                </div>
                <div className="dashboard-person-actions">
                  <button className="btn btn-outline-success" disabled={isPending(`log-${ids.join("-")}-approve`)} onClick={() => approveWorkerLog(log)}>Approved</button>
                  <button className="btn btn-outline-danger" disabled={isPending(`log-${log.id}-revert`)} onClick={() => revertWorkerLog(log)}>{ids.length > 1 ? "Revert Latest" : "Revert Change"}</button>
                </div>
              </article>
            )
          })}
          {visibleLogs.length === 0 && <p>No worker changes logged yet.</p>}
        </div>
      </section>
    </div>
  )

  const renderWorkers = () => (
    <div className="dashboard-stack">
      <section className="dashboard-card">
        <p className="dashboard-kicker">Worker applications</p>
        <h3>Review applicants before adding them to the farm team.</h3>
        <p>Contact the applicant, check their details, then accept them when you are ready to bring them into this farm.</p>
        <div className="dashboard-people-list">
          {farmData.applications.map((app) => (
            <article className="dashboard-person" key={app.id}>
              <img src={fileUrl(app.profile_picture)} alt={app.full_name} />
              <div><h4>{app.full_name}</h4><p>{app.email}</p><p>{app.phone}</p><span>{app.city || app.county || app.location || "Location not set"}</span></div>
              <div className="dashboard-person-actions">
                <button className="btn btn-outline-danger" disabled={isPending(`application-${app.id}-decline`)} onClick={() => reviewApplication(app, "decline")}>Decline Application</button>
                <button className="btn btn-outline-light" onClick={() => setContactTarget(app)}>Contact Worker</button>
                <button className="btn btn-success" disabled={isPending(`application-${app.id}-accept`)} onClick={() => reviewApplication(app, "accept")}>Accept Application</button>
              </div>
            </article>
          ))}
          {farmData.applications.length === 0 && <p>No pending applications.</p>}
        </div>
      </section>

      <section className="dashboard-card">
        <p className="dashboard-kicker">Current workers</p>
        <h3>Farm team</h3>
        <div className="dashboard-people-list">
          {farmData.workers.map((worker) => (
            <article className="dashboard-person" key={worker.id}>
              <img src={fileUrl(worker.profile_picture)} alt={worker.full_name} />
              <div><h4>{worker.full_name}</h4><p>{worker.email}</p><p>{worker.phone}</p><span>KES {worker.salary || 0} / {worker.pay_period || "month"}</span></div>
              <div className="dashboard-person-actions">
                <button className="btn btn-outline-success" onClick={() => { setSalaryTarget(worker); setSalaryForm({ salary: worker.salary || "", pay_period: worker.pay_period || "monthly" }) }}>Adjust Salary</button>
                <button className="btn btn-outline-danger" disabled={Boolean(pendingAction)} onClick={() => fireWorker(worker)}>Fire Worker</button>
                <button className="btn btn-outline-light" onClick={() => setContactTarget(worker)}>Contact Worker</button>
              </div>
            </article>
          ))}
          {farmData.workers.length === 0 && <p>No active workers yet.</p>}
        </div>
      </section>
    </div>
  )

  const renderCosts = () => (
    <div className="dashboard-stack">
      <form className="dashboard-card dashboard-form" onSubmit={submitCost}>
        <div className="dashboard-card-header"><h3>Add Farm Cost</h3><button className="btn btn-success" disabled={pendingAction === "cost"}>Add Cost</button></div>
        <div className="dashboard-form-grid">
          <input className="form-control" placeholder="Product being bought" required value={costForm.product_name} onChange={(e) => setCostForm({ ...costForm, product_name: e.target.value, category: e.target.value })} />
          <input className="form-control" type="number" min="0" placeholder="Cost" required value={costForm.amount} onChange={(e) => setCostForm({ ...costForm, amount: e.target.value })} />
          <input className="form-control" type="date" required value={costForm.cost_date} onChange={(e) => setCostForm({ ...costForm, cost_date: e.target.value })} />
          <select className="form-select" value={costForm.purchase_frequency} onChange={(e) => setCostForm({ ...costForm, purchase_frequency: e.target.value })}>
            <option value="one_time">One time buy</option>
            <option value="daily">Bought daily</option>
            <option value="weekly">Bought weekly</option>
            <option value="monthly">Bought monthly</option>
            <option value="yearly">Bought yearly</option>
          </select>
          <input className="form-control" type="file" accept="image/*" onChange={(e) => setCostForm({ ...costForm, receipt_photo: e.target.files[0] })} />
          <textarea className="form-control" placeholder="Notes" value={costForm.description} onChange={(e) => setCostForm({ ...costForm, description: e.target.value })}></textarea>
        </div>
      </form>
      <section className="dashboard-grid">
        {farmData.workers.map((worker) => <article className="dashboard-card" key={`salary-${worker.id}`}><h3>{worker.full_name}</h3><p>Salary</p><strong>KES {worker.salary || 0}</strong><span>per {worker.pay_period || "month"}</span></article>)}
        {farmData.costs.map((cost) => (
          <article className="dashboard-card" key={cost.id}>
            <h3>{cost.product_name || cost.category}</h3>
            <p>{cost.purchase_frequency || "one time"}</p>
            <strong>KES {cost.amount}</strong>
            <span>{cost.cost_date}</span>
            <button className="btn btn-outline-danger mt-2" type="button" disabled={Boolean(pendingAction)} onClick={() => deleteCost(cost)}>
              Delete Cost
            </button>
          </article>
        ))}
      </section>
      <section className="dashboard-card">
        <h3>Successful sales</h3>
        {farmData.sales.map((sale) => <p key={sale.id}>{sale.buyer_name}: KES {sale.total_amount} - {sale.status}</p>)}
        <strong className={`sales-total ${monthlyNetSales < 0 ? "negative" : monthlyNetSales > 0 ? "positive" : "neutral"}`}>
          Month total: KES {monthlyNetSales}
        </strong>
      </section>
    </div>
  )

  const renderProducts = () => (
    <div className="dashboard-stack">
      <form className="dashboard-card dashboard-form" onSubmit={submitProduct}>
        <div className="dashboard-card-header"><h3>Add Product</h3><button className="btn btn-success" disabled={pendingAction === "product"}>List Product</button></div>
        <div className="dashboard-form-grid">
          <input className="form-control" placeholder="Product name" required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
          <input className="form-control" placeholder="Category" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} />
          <input className="form-control" type="number" min="0" placeholder="Price per unit" required value={productForm.price_per_unit} onChange={(e) => setProductForm({ ...productForm, price_per_unit: e.target.value })} />
          <input className="form-control" placeholder="Unit" required value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} />
          <input className="form-control" type="number" min="0" placeholder="Quantity available" required value={productForm.quantity_available} onChange={(e) => setProductForm({ ...productForm, quantity_available: e.target.value })} />
          <select className="form-select" value={productForm.crop_id} onChange={(e) => setProductForm({ ...productForm, crop_id: e.target.value })}>
            <option value="">No linked crop</option>
            {farmData.crops.map((crop) => <option key={crop.id} value={crop.id}>{crop.name}</option>)}
          </select>
          <input className="form-control" type="file" accept="image/*" onChange={(e) => setProductForm({ ...productForm, product_photo: e.target.files[0] })} />
          <textarea className="form-control" placeholder="Description" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}></textarea>
        </div>
      </form>
      <section className="browse-items compact">
        {farmData.products.map((product) => (
          <article className="browse-card" key={product.id}>
            <Link to={`/product/${product.id}`} className="dashboard-product-link">
              <img src={fileUrl(product.photo_url)} alt={product.name} />
              <div><h3>{product.name}</h3><p>{product.description}</p><strong>KES {product.price_per_unit} / {product.unit}</strong></div>
            </Link>
            <button className="btn btn-outline-danger m-2" type="button" disabled={Boolean(pendingAction)} onClick={() => deleteProduct(product)}>
              Delete
            </button>
          </article>
        ))}
      </section>
    </div>
  )

  const renderOrders = () => (
    <section className="dashboard-stack">
      {farmData.orders.map((order) => (
        <article className="dashboard-card dashboard-order-card" key={order.id}>
          <div>
            <h3>Order #{order.id}</h3>
            <p>{order.buyer_name} - {order.buyer_phone}</p>
            <span>{orderStatusLabel(order.status)}</span>
            <strong>KES {order.total_amount}</strong>
          </div>
          <div className="dashboard-order-actions">
            <select className="form-select" value={order.status} disabled={Boolean(pendingAction)} onChange={(e) => updateOrder(order, e.target.value)}>
              <option value="pending">Requested but not paid</option>
              <option value="confirmed">Paid</option>
              <option value="packed">Being delivered</option>
              <option value="delivered">Delivered successfully</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button className="btn btn-outline-warning" type="button" disabled={Boolean(pendingAction)} onClick={() => updateOrder(order, "cancelled")}>Mark Cancelled</button>
            <button className="btn btn-outline-danger" type="button" disabled={Boolean(pendingAction)} onClick={() => removeOrderFromPage(order)}>Cancel Order</button>
          </div>
        </article>
      ))}
      {farmData.orders.length === 0 && <div className="dashboard-card">No orders yet.</div>}
    </section>
  )

  const renderBuyerOrders = () => (
    <section className="dashboard-stack">
      {buyerData.orders.map((order) => (
        <article className="dashboard-card dashboard-order-card" key={order.id}>
          <div>
            <h3>Order #{order.id}</h3>
            <p>{order.farm_name || "Farm order"}</p>
            <span>{orderStatusLabel(order.status)}</span>
            <strong>KES {order.total_amount}</strong>
          </div>
          <Link className="btn btn-outline-light" to="/product">Shop Again</Link>
        </article>
      ))}
      {buyerData.orders.length === 0 && (
        <div className="dashboard-card">
          <h3>No orders yet</h3>
          <p>Your purchases will appear here after you buy from the marketplace.</p>
          <Link className="btn btn-success" to="/product">Browse Products</Link>
        </div>
      )}
    </section>
  )

  const renderBuyerProducts = () => (
    <div className="dashboard-stack">
      <section className="dashboard-card">
        <div className="dashboard-card-header">
          <div>
            <p className="dashboard-kicker">Marketplace</p>
            <h3>Recommended fresh produce</h3>
          </div>
          <Link className="btn btn-outline-light" to="/product">Open Marketplace</Link>
        </div>
      </section>
      <section className="browse-items compact">
        {buyerData.suggestions.map((product) => (
          <article className="browse-card" key={product.id}>
            <Link to={`/product/${product.id}`} className="dashboard-product-link">
              <img src={fileUrl(product.photo_url)} alt={product.name} />
              <div>
                <h3>{product.name}</h3>
                <p>{product.description || `${product.category || "Produce"} from ${product.farm_name}`}</p>
                <span>{product.farm_name} - {product.county}</span>
                <strong>KES {product.price_per_unit} / {product.unit}</strong>
              </div>
            </Link>
          </article>
        ))}
      </section>
      {buyerData.suggestions.length === 0 && <div className="dashboard-card">No products listed yet.</div>}
    </div>
  )

  const renderSection = () => {
    if (activeSection === "Overview") return renderOverview()
    if (activeSection === "Logs" && role === "owner") return renderLogs()
    if (activeSection === "Crops" && (role === "owner" || role === "worker")) return renderCrops()
    if (activeSection === "Workers" && role === "owner") return renderWorkers()
    if (activeSection === "Costs" && (role === "owner" || role === "worker")) return renderCosts()
    if (activeSection === "Products" && (role === "owner" || role === "worker")) return renderProducts()
    if (activeSection === "Orders" && (role === "owner" || role === "worker")) return renderOrders()
    if (activeSection === "My Orders" && role === "buyer") return renderBuyerOrders()
    if (activeSection === "Products" && role === "buyer") return renderBuyerProducts()
    if (activeSection === "My Farms") {
      const farms = role === "owner" ? ownedFarms : workerFarms
      return <section className="dashboard-farm-list">{farms.map((farm) => <Link to={`/farms/${farm.id}`} key={farm.id}><strong>{farm.name}</strong><span>{farm.county || farm.location || "Kenya"}</span></Link>)}</section>
    }
    return <div className="dashboard-card"><h3>{activeSection}</h3><p>{activeSection} information will appear here once records are added.</p></div>
  }

  return (
    <main className="page-dark dashboard-shell dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="dashboard-kicker">{role}</p>
          <h1>{role === "owner" ? "Owner Dashboard" : role === "worker" ? "Worker Dashboard" : "Buyer Dashboard"}</h1>
          <p>{role === "owner" ? "Manage farm operations without hopping between scattered tools." : "Keep your ShambaSmart activity organised."}</p>
        </div>
        <div className="dashboard-hero-actions">
          {role === "owner" && <Link to="/farm-registration" className="btn btn-success">Create Farm</Link>}
          <Link to="/account" className="btn btn-outline-light">Account Settings</Link>
        </div>
      </section>

      {(role === "owner" || role === "worker") && renderFarmPicker()}

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          {sections.map((section) => <button type="button" className={section === activeSection ? "active" : ""} key={section} onClick={() => setActiveSection(section)}>{section}</button>)}
        </aside>
        <section className="dashboard-content">
          {renderSection()}
        </section>
      </div>

      <NotificationToast message={message} onClose={() => setMessage("")} />

      <Modal show={Boolean(contactTarget)} onHide={() => setContactTarget(null)} centered>
        <Modal.Header closeButton><Modal.Title>Contact worker</Modal.Title></Modal.Header>
        <Modal.Body>
          <p><strong>Email:</strong> {contactTarget?.email}</p>
          <p><strong>Phone:</strong> {contactTarget?.phone}</p>
        </Modal.Body>
      </Modal>

      <Modal show={Boolean(salaryTarget)} onHide={() => setSalaryTarget(null)} centered>
        <Modal.Header closeButton><Modal.Title>Adjust salary</Modal.Title></Modal.Header>
        <Modal.Body>
          <input className="form-control auth-input" type="number" placeholder="Salary amount" value={salaryForm.salary} onChange={(e) => setSalaryForm({ ...salaryForm, salary: e.target.value })} />
          <select className="form-select" value={salaryForm.pay_period} onChange={(e) => setSalaryForm({ ...salaryForm, pay_period: e.target.value })}>
            <option value="daily">Per day</option>
            <option value="weekly">Per week</option>
            <option value="monthly">Per month</option>
            <option value="yearly">Per year</option>
          </select>
        </Modal.Body>
        <Modal.Footer><Button variant="success" disabled={pendingAction === "salary"} onClick={saveSalary}>Save Salary</Button></Modal.Footer>
      </Modal>
    </main>
  )
}

export default Dashboard
