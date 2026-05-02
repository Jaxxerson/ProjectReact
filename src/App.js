import logo from '../src/assets/images/logos.png'
import './App.css';
import { BrowserRouter, Link, NavLink, Route, Routes } from 'react-router-dom';
import { Container, Navbar, Nav } from 'react-bootstrap';
import Home from './Components/Home';
import Signin from './Components/Signin';
import About from './Components/About';
import Signup from './Components/Signup';
import Product from './Components/Product';


function App() {
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

                <NavLink to="/about" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>About</NavLink>



              </Nav>
              <Nav className='ms-auto'>
                <nav>
                  <Link to="/signup" className='btn btn-outline-warning me-2'>Sign Up</Link>
                  <Link to="/signin" className='btn btn-outline-danger me-2'>Sign In</Link>
                </nav>
              </Nav>
            </Navbar.Collapse>

          </Container>
         </Navbar>

         <Routes>
          <Route path='/home' element={<Home/>}/>
          <Route path='/about' element={<About/>}/>
          <Route path='/signup' element={<Signup/>}/>
          <Route path='/signin' element={<Signin/>}/>
          <Route path='/product' element={<Product/>}/>
         </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
