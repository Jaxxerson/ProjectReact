import logo from '../src/assets/images/logos.png'
import './App.css';
import { useEffect, useState } from 'react';
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { Container, Navbar, Nav, Dropdown } from 'react-bootstrap';
import Home from './Components/Home';
import Signin from './Components/Signin';
import About from './Components/About';
import Signup from './Components/Signup';
import Product from './Components/Product';
import ProductDetails from './Components/ProductDetails';
import Dashboard from './Components/Dashboard';
import Onboarding from './Components/Onboarding';
import Account from './Components/Account';
import VerifyAccount from './Components/VerifyAccount';
import FarmRegistration from './Components/FarmRegistration';
import Farms from './Components/Farms';
import FarmDetails from './Components/FarmDetails';
import Footer from './Components/Footer';
import Cart from './Components/Cart';
import { getCartItems } from './cartUtils';


function App() {
  const [signedInUser, setSignedInUser] = useState(() => {
    const savedUser = localStorage.getItem("user")
    return savedUser ? JSON.parse(savedUser) : null
  })
  const [cartCount, setCartCount] = useState(() => getCartItems().reduce((total, item) => total + Number(item.quantity || 0), 0))

  const refreshCartCount = () => {
    setCartCount(getCartItems().reduce((total, item) => total + Number(item.quantity || 0), 0))
  }

  useEffect(() => {
    window.addEventListener("cart-updated", refreshCartCount)
    window.addEventListener("storage", refreshCartCount)
    return () => {
      window.removeEventListener("cart-updated", refreshCartCount)
      window.removeEventListener("storage", refreshCartCount)
    }
  }, [])

  useEffect(() => {
    refreshCartCount()
  }, [signedInUser])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setSignedInUser(null)
    setCartCount(0)
    window.location.href = "/home"
  }

  return (
    <BrowserRouter>
      <div>
         <Navbar expand="lg"  bg='success' data-bs-theme='dark'>
          <Container fluid>
            <Link to='/home' className='text-decoration-none'>
            <Navbar.Brand><img src={logo} alt='farm logo' height='45px'className='m-1'/>ShambaSmart</Navbar.Brand></Link>
            <Navbar.Toggle aria-controls="basic-navbar-nav justify-content-start" />
            <Navbar.Collapse id="basic-navbar-nav justify-content-start">
              <Nav className="me-auto">
                <NavLink to="/home" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Home</NavLink>
                <NavLink to="/product" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Products</NavLink>
                <NavLink to="/farms" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Farms</NavLink>
                <NavLink to="/about" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>About</NavLink>



              </Nav>
              <Nav className='ms-auto'>
            {signedInUser ? (
              <>
                <NavLink to="/cart" className={({ isActive }) => isActive ? "nav-link cart-nav-link active" : "nav-link cart-nav-link"} aria-label={`Cart with ${cartCount} items`}>
                  <span className="cart-icon" aria-hidden="true">
                    <span className="cart-icon-basket"></span>
                    <span className="cart-icon-handle"></span>
                    <span className="cart-icon-wheel left"></span>
                    <span className="cart-icon-wheel right"></span>
                  </span>
                  {cartCount > 0 && <span className="cart-count-badge">{cartCount}</span>}
                </NavLink>
                <Dropdown align="end">
                  <Dropdown.Toggle variant="link" className="profile-toggle">
                    <img
                      src={signedInUser.profile_picture_url || "/logo192.png"}
                      alt={signedInUser.full_name}
                      className="navbar-profile-picture"
                    />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item as={Link} to="/dashboard">Dashboard</Dropdown.Item>
                    <Dropdown.Item as={Link} to="/account">Settings</Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/signup">Sign Up</Nav.Link>
                <Nav.Link as={Link} to="/signin">Sign In</Nav.Link>
              </>
            )}
              </Nav>
            </Navbar.Collapse>

          </Container>
         </Navbar>

         <Routes>
          <Route path='/' element={<Navigate to="/home" replace/>}/>
          <Route path='/home' element={<Home/>}/>
          <Route path='/about' element={<About/>}/>
          <Route path='/signup' element={<Signup/>}/>
          <Route path='/signin' element={<Signin onSignin={setSignedInUser}/>}/>
          <Route path='/onboarding' element={<Onboarding/>}/>
          <Route path='/product' element={<Product/>}/>
          <Route path='/product/:productId' element={<ProductDetails/>}/>
          <Route path='/cart' element={<Cart/>}/>
          <Route path='/dashboard' element={<Dashboard/>}/>
          <Route path='/account' element={<Account onUserUpdate={setSignedInUser} onLogout={handleLogout}/>}/>
          <Route path='/verify-account' element={<VerifyAccount onUserUpdate={setSignedInUser}/>}/>
          <Route path='/farm-registration' element={<FarmRegistration/>}/>
          <Route path='/farms' element={<Farms/>}/>
          <Route path='/farms/:farmId' element={<FarmDetails/>}/>
          <Route path='*' element={<Navigate to="/home" replace/>}/>
         </Routes>
         <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
