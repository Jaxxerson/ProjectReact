import React from 'react'

const Signup = () => {
  return (
    <div className="row justify-content-center mt-4">
      <div className="col-md-6 card shadow p-4">
        <h2 className='p-1'>Sign Up</h2>

        <form>
          <input type='text' placeholder='Enter Usermame' className='form-control' required/><br/>
          <input type="text" placeholder='Enter Email' className='form-control' required/><br/>
          <input type="password" placeholder='Enter Password' className='form-control' required /><br/>
          <input type="text" placeholder='Enter Phone Number' className='form-control' required /><br/>
          <input type="submit" value="Sign Up" className='btn btn-outline-danger w-100' />
        </form>
      </div>
    </div>
  )
}

export default Signup