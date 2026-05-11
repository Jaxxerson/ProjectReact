import React, { useState } from 'react'
import facebookLogo from '../assets/images/Facebook Logo.png'
import instagramLogo from '../assets/images/Instagram Logo.png'
import xLogo from '../assets/images/X logo.png'
import linkedInLogo from '../assets/images/LinkedIn Logo.png'
import tiktokLogo from '../assets/images/Tiktok Logo.png'
import NotificationToast from './NotificationToast'

const socials = [
  { label: "Facebook", image: facebookLogo },
  { label: "Instagram", image: instagramLogo },
  { label: "X", image: xLogo },
  { label: "LinkedIn", image: linkedInLogo },
  { label: "TikTok", image: tiktokLogo },
]

const Footer = () => {
  const [contact, setContact] = useState("")
  const [feedback, setFeedback] = useState("")
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  const sendFeedback = async (e) => {
    e.preventDefault()
    setMessage("")
    setIsSending(true)

    window.setTimeout(() => {
      setMessage("Feedback sent successfully.")
      setContact("")
      setFeedback("")
      setIsSending(false)
    }, 400)
  }

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <section>
          <h2>ShambaSmart</h2>
          <p>Developed by Ryan&copy; 2026 All Rights Reserved.</p>
          <div className="footer-socials">
            {socials.map((social) => (
              <a href={`#${social.label.toLowerCase()}`} onClick={(e) => e.preventDefault()} aria-label={social.label} key={social.label}>
                <img src={social.image} alt="" />
              </a>
            ))}
          </div>
        </section>

        <section>
          <h3>Contact us</h3>
          <p>+254752008404</p>
          <p>wangairyan123@gmail.com</p>
        </section>

        <section className="footer-feedback">
          <h3>Feedback</h3>
          <form onSubmit={sendFeedback}>
            <input
              className="form-control"
              placeholder="Email or phone number"
              value={contact}
              required
              onChange={(e) => setContact(e.target.value)}
            />
            <textarea
              className="form-control"
              placeholder="Write your feedback"
              rows="2"
              value={feedback}
              required
              onChange={(e) => setFeedback(e.target.value)}
            />
            <button className="btn btn-outline-success" disabled={isSending}>{isSending ? "Sending..." : "Send Feedback"}</button>
          </form>
        </section>
      </div>
      <NotificationToast message={message} onClose={() => setMessage("")} />
    </footer>
  )
}

export default Footer
