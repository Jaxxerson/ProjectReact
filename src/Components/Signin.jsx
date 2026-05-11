import React, { useState } from 'react'
import { Toast, ToastBody, ToastContainer, ToastHeader } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import API_BASE_URL from '../api'

const Signin = ({ onSignin }) => {
  const navigate=useNavigate()

  const [email,setEmail]=useState("")
  const [password,setPassword]=useState("")

  const[showLoading, setShowLoading]=useState(false)
  const[showSuccess, setShowSuccess]=useState(false)
  const[showError, setShowError]=useState(false)

  const[toastMessage, setToastMessage]=useState("")

  const handleSubmit=async(e)=>{
    e.preventDefault()

    setShowLoading(false)
    setShowSuccess(false)
    setShowError(false)
    setToastMessage("")

    setShowLoading(true)
    setToastMessage("Please wait as we sign you in...")

    const formData= new FormData()
    formData.append("email", email)
    formData.append("password", password)

    try {
      const response=await axios.post(`${API_BASE_URL}/signin`,formData)

      if (response.data.user) {
        setShowLoading(false)
        setToastMessage(response.data.message)
        setShowSuccess(true)
        localStorage.setItem("token", response.data.token)
        localStorage.setItem("user", JSON.stringify(response.data.user))
        onSignin(response.data.user)

        setTimeout(()=> navigate("/dashboard"), 1200)
      }
      else{
        setShowLoading(false)
        setToastMessage(response.data.message)
        setShowError(true)
      }
    } catch (error){

      setShowLoading(false)
      const msg = error.response?.data?.message || error.message || "Something went wrong"
      setToastMessage(msg)
      setShowError(true)

    }
  }
  return (
    <div className="auth-shell signin-bg">
      <div className="auth-card card shadow p-4">
        <p className="auth-kicker">Welcome back</p>
        <h2 className='p-1 text-center'>Sign In</h2>

        <form onSubmit={handleSubmit}>
          <input type="email" placeholder='Email address' className='form-control auth-input' required onChange={(e)=>setEmail(e.target.value)} />
          <input type="password" placeholder='Password' className='form-control auth-input' required  onChange={(e)=>setPassword(e.target.value)} />
          <input type="submit" value={showLoading ? "Signing in..." : "Sign In"} className='btn btn-success w-100 auth-submit' disabled={showLoading}/>
        </form>
        <p className='auth-switch'>Don't have an account? <Link to="/signup">Sign up</Link></p>
      </div>

      {/* toast container */}
      <ToastContainer position='bottom-center' className='p-3'>
        {/* Loading toast */}
        <Toast
        show={showLoading}
        autohide={true}
        delay={4000}
        onClose={()=>setShowLoading (false)}
        className='bg-primary text-white border-0 shadow'
        >
          <ToastHeader closeButton>
            <strong className='me-auto'>Processing</strong>
            <small>Just now</small>
          </ToastHeader>
          <ToastBody>
            {toastMessage}
          </ToastBody>
        </Toast>

        {/* Success Toast */}
         <Toast
          show={showSuccess}
          autohide={true}
          delay={4000}
          onClose={() => setShowSuccess(false)}
          className="bg-success text-white border-0 shadow"
        >
          <ToastHeader closeButton>
            <strong className="me-auto">Success</strong>
            <small>Just now</small>
          </ToastHeader>
          <ToastBody>
            {toastMessage}
          </ToastBody>
        </Toast>

        {/* Error Toast */}
        <Toast
          show={showError}
          autohide={true}
          delay={4000}
          onClose={() => setShowError(false)}
          className="bg-danger text-white border-0 shadow"
        >
          <ToastHeader closeButton>
            <strong className="me-auto">Error</strong>
            <small>Just now</small>
          </ToastHeader>
          <ToastBody>
            {toastMessage}
          </ToastBody>
        </Toast>

      </ToastContainer>
    </div>
  )
}

export default Signin
