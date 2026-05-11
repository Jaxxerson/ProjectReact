import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Toast, ToastBody, ToastContainer, ToastHeader } from 'react-bootstrap'
import API_BASE_URL from '../api'
const Signup = () => {
  const navigate=useNavigate()

  const [full_name, setFullName]=useState("")
  const [email,setEmail]=useState("")
  const [password,setPassword]=useState("")
  const [phone, setPhone]=useState("")
  const [profilePicture, setProfilePicture]=useState(null)

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
      setToastMessage("Please wait as we create your account...")

      const formData= new FormData()
      formData.append("full_name", full_name)
      formData.append("email", email)
      formData.append("password", password)
      formData.append("phone", phone)
      if (profilePicture) {
        formData.append("profile_picture", profilePicture)
      }

      try {
        const response= await axios.post(`${API_BASE_URL}/signup`,formData)

        setShowLoading(false)
        setToastMessage(response.data.message)
        setShowSuccess(true)

        sessionStorage.setItem("onboarding_user_id", response.data.user_id)
        setTimeout(()=>navigate("/onboarding", { state: { userId: response.data.user_id } }), 1200)

      } catch (error) {
        setShowLoading(false)
        const msg = error.response?.data?.message || error.message || "Something went wrong"
        setToastMessage(msg)
        setShowError(true)
      }
    }


  return (
    <div className="auth-shell signup-bg">
      <div className="auth-card card shadow p-4">
        <p className="auth-kicker">Join ShambaSmart</p>
        <h2 className='p-1'>Create account</h2>

        <form onSubmit={handleSubmit}>
          <input type='text' placeholder='Enter Your Full name' className='form-control auth-input' required onChange={(e) => setFullName(e.target.value)}/>
          <input type="email" placeholder='Enter Your Email address' className='form-control auth-input' required onChange={(e) => setEmail(e.target.value)}/>
          <input type="password" placeholder='Enter Your Password' className='form-control auth-input' required onChange={(e) => setPassword(e.target.value)}/>
          <input type="text" placeholder='Enter Your Phone number' className='form-control auth-input' required onChange={(e) => setPhone(e.target.value)}/>
          <input type="file" className='form-control auth-input' accept='image/*' onChange={(e) => setProfilePicture(e.target.files[0])}/>
          <input type="submit" value={showLoading ? "Creating..." : "Sign Up"} className='btn btn-success w-100 auth-submit' disabled={showLoading} />
        </form>

        <p className="auth-switch">Already have an account? <Link to='/signin'>Sign in</Link></p>
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

export default Signup
