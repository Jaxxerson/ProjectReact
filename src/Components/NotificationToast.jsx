import React from 'react'
import { Toast, ToastBody, ToastContainer, ToastHeader } from 'react-bootstrap'

const getToastVariant = (message) => {
  const text = String(message || "").toLowerCase()

  if (
    text.includes("could not") ||
    text.includes("failed") ||
    text.includes("error") ||
    text.includes("wrong") ||
    text.includes("invalid") ||
    text.includes("please sign in") ||
    text.includes("action failed")
  ) {
    return "danger"
  }

  if (
    text.includes("please wait") ||
    text.includes("checking") ||
    text.includes("loading") ||
    text.includes("review is")
  ) {
    return "primary"
  }

  return "success"
}

const NotificationToast = ({ message, onClose, delay = 4200, position = "bottom-end" }) => {
  const variant = getToastVariant(message)

  return (
    <ToastContainer position={position} className="p-3 notification-toast-container">
      <Toast bg={variant} show={Boolean(message)} autohide delay={delay} onClose={onClose}>
        <ToastHeader closeButton>
          <strong className="me-auto">ShambaSmart</strong>
          <small>Now</small>
        </ToastHeader>
        <ToastBody className="text-white">{message}</ToastBody>
      </Toast>
    </ToastContainer>
  )
}

export default NotificationToast
