import Footer from '@/components/layouts/Footer';
import Sidebar from '@/components/layouts/SideNav';
import Topbar from '@/components/layouts/topbar';
import Customizer from '@/components/layouts/customizer';
import ProtectedRoute from '@/components/ProtectedRoute';

const Layout = ({
  children
}) => {
  return (
    <ProtectedRoute>
      <div className="wrapper">
        <Sidebar />
        <div className="page-content">
          <Topbar />
          {children}
          <Footer />
        </div>
      </div>
      <Customizer />
    </ProtectedRoute>
  );
};

export default Layout;