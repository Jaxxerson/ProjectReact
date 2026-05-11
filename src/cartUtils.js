export const CART_STORAGE_KEY = "shambasmart_cart"

const getSignedInUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"))
  } catch {
    return null
  }
}

export const getCartStorageKey = () => {
  const user = getSignedInUser()
  if (!user?.id) return null
  return `${CART_STORAGE_KEY}_${user.id}`
}

export const getCartItems = () => {
  const storageKey = getCartStorageKey()
  if (!storageKey) return []

  try {
    return dedupeCartItems(JSON.parse(localStorage.getItem(storageKey)) || [])
  } catch {
    return []
  }
}

const dedupeCartItems = (items) => {
  const cartItems = new Map()

  items.forEach((item) => {
    const lineId = item.lineId || cartLineId(item)
    const quantity = Math.max(1, Number(item.quantity) || 1)
    const existingItem = cartItems.get(lineId)

    if (existingItem) {
      existingItem.quantity = Math.min(
        Number(existingItem.quantity_available || existingItem.quantity + quantity),
        Number(existingItem.quantity || 0) + quantity
      )
    } else {
      cartItems.set(lineId, { ...item, lineId, quantity })
    }
  })

  return Array.from(cartItems.values())
}

export const saveCartItems = (items) => {
  const storageKey = getCartStorageKey()
  if (!storageKey) return

  localStorage.setItem(storageKey, JSON.stringify(dedupeCartItems(items)))
  window.dispatchEvent(new Event("cart-updated"))
}

export const cartLineId = (product) => String(product.id)

export const addCartItem = (product, quantity = 1) => {
  const cartItems = getCartItems()
  const lineId = cartLineId(product)
  const existingItem = cartItems.find((item) => item.lineId === lineId)
  const nextQuantity = Math.max(1, Number(quantity) || 1)

  if (existingItem) {
    existingItem.quantity = Math.min(
      Number(product.quantity_available || existingItem.quantity + nextQuantity),
      Number(existingItem.quantity || 0) + nextQuantity
    )
  } else {
    cartItems.push({
      lineId,
      id: product.id,
      farm_id: product.farm_id,
      farm_name: product.farm_name,
      county: product.county,
      name: product.name,
      description: product.description,
      category: product.category,
      price_per_unit: product.price_per_unit,
      unit: product.unit,
      quantity_available: product.quantity_available,
      photo_url: product.photo_url,
      quantity: nextQuantity,
    })
  }

  saveCartItems(cartItems)
  return cartItems
}

export const updateCartItemQuantity = (lineId, quantity) => {
  const nextQuantity = Math.max(1, Number(quantity) || 1)
  const cartItems = getCartItems().map((item) => (
    item.lineId === lineId
      ? { ...item, quantity: Math.min(Number(item.quantity_available || nextQuantity), nextQuantity) }
      : item
  ))
  saveCartItems(cartItems)
  return cartItems
}

export const removeCartItem = (lineId) => {
  const cartItems = getCartItems().filter((item) => item.lineId !== lineId)
  saveCartItems(cartItems)
  return cartItems
}

export const clearCart = () => saveCartItems([])

export const cartTotal = (items) => items.reduce((total, item) => (
  total + (Number(item.price_per_unit || 0) * Number(item.quantity || 0))
), 0)
