import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import API_BASE_URL from '../api'
import NotificationToast from './NotificationToast'

const VerifyAccount = ({ onUserUpdate }) => {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [identityType, setIdentityType] = useState("id")
  const [identityNumber, setIdentityNumber] = useState("")
  const [identityDocument, setIdentityDocument] = useState(null)
  const [profilePicture, setProfilePicture] = useState(null)
  const [message, setMessage] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const steps = useMemo(() => [
    {
      kicker: "Step 1 of 4",
      title: "Which document will you use?",
      text: "Choose the document type that best matches what you will upload.",
      control: (
        <select className="form-select auth-input" value={identityType} onChange={(e) => setIdentityType(e.target.value)}>
          <option value="id">National ID</option>
          <option value="passport">Passport</option>
          <option value="driving_license">Driving License</option>
        </select>
      ),
      canContinue: Boolean(identityType),
    },
    {
      kicker: "Step 2 of 4",
      title: "What is the document number?",
      text: "Enter the number exactly as it appears on the document.",
      control: (
        <input
          className="form-control auth-input"
          placeholder="Identifier number"
          value={identityNumber}
          autoFocus
          onChange={(e) => setIdentityNumber(e.target.value)}
        />
      ),
      canContinue: identityNumber.trim().length >= 5,
    },
    {
      kicker: "Step 3 of 4",
      title: "Upload the document.",
      text: "Use a clear image or PDF. Blurry uploads may fail the automated review.",
      control: (
        <input
          className="form-control auth-input"
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setIdentityDocument(e.target.files[0])}
        />
      ),
      canContinue: Boolean(identityDocument),
    },
    {
      kicker: "Step 4 of 4",
      title: "Add your profile picture.",
      text: "This helps farm owners, workers, and buyers recognise real accounts in the platform.",
      control: (
        <input
          className="form-control auth-input"
          type="file"
          accept="image/*"
          onChange={(e) => setProfilePicture(e.target.files[0])}
        />
      ),
      canContinue: Boolean(profilePicture),
    },
  ], [identityType, identityNumber, identityDocument, profilePicture])

  const activeStep = steps[step]

  const submitVerification = async () => {
    setMessage("")
    const token = localStorage.getItem("token")
    const formData = new FormData()
    formData.append("identity_type", identityType)
    formData.append("identity_number", identityNumber)
    formData.append("identity_document", identityDocument)
    formData.append("profile_picture", profilePicture)

    try {
      setIsSaving(true)
      setMessage("AI review is checking your details...")
      const response = await axios.post(`${API_BASE_URL}/verify_account`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      localStorage.setItem("user", JSON.stringify(response.data.user))
      onUserUpdate(response.data.user)
      navigate("/account")
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Could not verify account")
    } finally {
      setIsSaving(false)
    }
  }

  const goNext = () => {
    setMessage("")
    if (step === steps.length - 1) {
      submitVerification()
      return
    }
    setStep((current) => current + 1)
  }

  return (
    <main className="verify-flow-shell">
      <section className="verify-flow-card">
        <div className="verify-progress">
          {steps.map((item, index) => (
            <span className={index <= step ? "active" : ""} key={item.kicker} />
          ))}
        </div>

        <p className="onboarding-kicker">{activeStep.kicker}</p>
        <h1>{activeStep.title}</h1>
        <p>{activeStep.text}</p>

        <div className="verify-control">
          {activeStep.control}
        </div>

        <div className="verify-flow-actions">
          <button type="button" className="btn btn-outline-secondary" disabled={step === 0 || isSaving} onClick={() => setStep((current) => current - 1)}>
            Back
          </button>
          <button type="button" className="btn btn-success" disabled={!activeStep.canContinue || isSaving} onClick={goNext}>
            {isSaving ? "Reviewing..." : step === steps.length - 1 ? "Submit for AI Review" : "Continue"}
          </button>
        </div>

      </section>
      <NotificationToast message={message} onClose={() => setMessage("")} />
    </main>
  )
}

export default VerifyAccount
