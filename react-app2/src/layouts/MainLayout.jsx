import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Sidebar from '../components/Sidebar'
import MobileMenu from '../components/MobileMenu'
import Preloader from '../components/Preloader'
import Cursor from '../components/Cursor'
import ScrollTop from '../components/ScrollTop'
import useTemplateInit from '../hooks/useTemplateInit'

const MainLayout = () => {
  // Reinitialize template scripts on route change
  useTemplateInit()

  return (
    <>
      <Cursor />
      <Preloader />
      <Sidebar />
      <MobileMenu />
      <Header />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <Outlet />
          <Footer />
        </div>
      </div>
      <ScrollTop />
    </>
  )
}

export default MainLayout

