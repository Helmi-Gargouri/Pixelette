import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import MainLayout from './layouts/MainLayout'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Blog from './pages/Blog'
import BlogDetails from './pages/BlogDetails'
import Event from './pages/Event'
import EventDetails from './pages/EventDetails'
import Shop from './pages/Shop'
import ShopDetails from './pages/ShopDetails'
import Team from './pages/Team'
import TeamDetails from './pages/TeamDetails'
import OpeningHour from './pages/OpeningHour'
import Location from './pages/Location'
import Error from './pages/Error'
import Register from './pages/Auth/Register';
import Login from './pages/Auth/Login';
import Profile from './pages/Auth/Profile';
import UsersList from './pages/UsersList';
import RequestReset from './pages/Auth/RequestReset';
import ResetPassword from './pages/Auth/ResetPassword';
import AdminDemands from './pages/AdminDemands';
import ForgotPassword from './pages/Auth/ForgotPassword';
import CodeVerification from './pages/Auth/CodeVerification';
import TwoFactorAuth from './pages/Auth/TwoFactorAuth'
import OeuvresList from './pages/Oeuvres/OeuvresList';
import OeuvreCreate from './pages/Oeuvres/OeuvreCreate';
import OeuvreEdit from './pages/Oeuvres/OeuvreEdit';
import OeuvreDetails from './pages/Oeuvres/OeuvreDetails';
import MesOeuvres from './pages/Oeuvres/MesOeuvres';
import OeuvreAIGenerator from './pages/Oeuvres/OeuvreAIGenerator';
import GaleriesList from './pages/Galeries/GaleriesList';
import GalerieCreate from './pages/Galeries/GalerieCreate';
import GalerieEdit from './pages/Galeries/GalerieEdit';
import GalerieDetails from './pages/Galeries/GalerieDetails';
import GalerieManageOeuvres from './pages/Galeries/GalerieManageOeuvres';
import MesGaleries from './pages/Galeries/MesGaleries';
import AcceptInvite from './pages/Galeries/AcceptInvite';
import ArtistesList from './pages/ArtistesList' 
import Recommendations from './pages/Oeuvres/Recommendations'
function App() {
  useEffect(() => {
    // Load jQuery and other scripts
    const loadScripts = () => {
      const scripts = [
        '/assets/js/vendor/jquery-3.7.1.min.js',
        '/assets/js/slick.min.js',
        '/assets/js/bootstrap.min.js',
        '/assets/js/jquery.magnific-popup.min.js',
        '/assets/js/jquery.counterup.min.js',
        '/assets/js/jquery-ui.min.js',
        '/assets/js/imagesloaded.pkgd.min.js',
        '/assets/js/isotope.pkgd.min.js',
        '/assets/js/gsap.min.js',
        '/assets/js/ScrollTrigger.min.js',
        '/assets/js/ScrollSmoother.min.js',
        '/assets/js/ScrollToPlugin.min.js',
        '/assets/js/SplitText.min.js',
        '/assets/js/waypoints.js',
        '/assets/js/wow.js',
        '/assets/js/main.js'
      ]

      scripts.forEach((src, index) => {
        const script = document.createElement('script')
        script.src = src
        script.async = false
        if (index === scripts.length - 1) {
          script.onload = () => {
            // Initialize plugins after all scripts are loaded
            if (window.$ && window.$.fn) {
              console.log('Scripts loaded successfully')
            }
          }
        }
        document.body.appendChild(script)
      })
    }

    loadScripts()
  }, [])

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog-details" element={<BlogDetails />} />
          <Route path="event" element={<Event />} />
          <Route path="event-details" element={<EventDetails />} />
          <Route path="oeuvres" element={<OeuvresList />} />
          <Route path="oeuvres/:id" element={<OeuvreDetails />} />
          <Route path="shop" element={<Shop />} />
          <Route path="shop-details" element={<ShopDetails />} />
          <Route path="team" element={<Team />} />
          <Route path="team-details" element={<TeamDetails />} />
          <Route path="opening-hour" element={<OpeningHour />} />
          <Route path="location" element={<Location />} />


          
            {/* Routes User */}
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/users" element={<UsersList />} />
            <Route path="/request-reset" element={<RequestReset />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/demandes" element={<AdminDemands />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/code-verification" element={<CodeVerification />} />
            <Route path="/two-factor" element={<TwoFactorAuth />} />
            <Route path="/artistes" element={<ArtistesList />} />
            
            {/* Routes Oeuvres */}
            <Route path="/oeuvres/create" element={<OeuvreCreate />} />
            <Route path="/oeuvres/ai-generator" element={<OeuvreAIGenerator />} />
            <Route path="/oeuvres/:id/edit" element={<OeuvreEdit />} />
            <Route path="/mes-oeuvres" element={<MesOeuvres />} />
            <Route path="/recommendations" element={<Recommendations />} />

            
            {/* Routes Galeries */}
            <Route path="/galeries" element={<GaleriesList />} />
            <Route path="/galeries/create" element={<GalerieCreate />} />
            <Route path="/galeries/:id" element={<GalerieDetails />} />
            <Route path="/galeries/:id/edit" element={<GalerieEdit />} />
            <Route path="/galeries/:id/oeuvres" element={<GalerieManageOeuvres />} />
            <Route path="/galeries/:id/accept-invite/:token" element={<AcceptInvite />} />
            <Route path="/mes-galeries" element={<MesGaleries />} />

            <Route path="*" element={<Error />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
