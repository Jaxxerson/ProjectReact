import axios from 'axios'
import API_BASE_URL from './api'

export const payForCartItems = async ({ items, phone, token }) => {
  const uniqueItems = Array.from(items.reduce((cartItems, item) => {
    const key = `${item.farm_id}-${item.id}`
    const quantity = Math.max(1, Number(item.quantity) || 1)
    const existingItem = cartItems.get(key)

    cartItems.set(key, existingItem
      ? { ...existingItem, quantity: Number(existingItem.quantity || 0) + quantity }
      : { ...item, quantity }
    )

    return cartItems
  }, new Map()).values())

  const groups = uniqueItems.reduce((farmGroups, item) => {
    const farmId = item.farm_id
    if (!farmGroups[farmId]) farmGroups[farmId] = []
    farmGroups[farmId].push(item)
    return farmGroups
  }, {})

  const paidOrders = []

  for (const [farmId, farmItems] of Object.entries(groups)) {
    const formData = new FormData()
    formData.append("farm_id", farmId)
    formData.append("items", JSON.stringify(farmItems.map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
    }))))
    formData.append("notes", `M-Pesa number: ${phone}`)
    formData.append("mpesa_phone", phone)

    const orderResponse = await axios.post(`${API_BASE_URL}/place_order`, formData, {
      headers: { Authorization: `Bearer ${token}` }
    })

    const paymentData = new FormData()
    paymentData.append("order_id", orderResponse.data.order_id)
    paymentData.append("amount", orderResponse.data.total)
    paymentData.append("phone", phone)

    await axios.post(`${API_BASE_URL}/mpesa_payment`, paymentData, {
      headers: { Authorization: `Bearer ${token}` }
    })

    paidOrders.push(orderResponse.data.order_id)
  }

  return paidOrders
}
