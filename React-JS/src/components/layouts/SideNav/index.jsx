import { Link } from 'react-router';
import SimplebarClient from '@/components/client-wrapper/SimplebarClient';
import AppMenu from './AppMenu';
import HoverToggle from './HoverToggle';
import logoDark from '@/assets/images/logo-dark.png';
import logoLight from '@/assets/images/logo-light.png';
import logoSm from '@/assets/images/logo-sm.png';
const Sidebar = () => {
  return <aside id="app-menu" className="app-menu">
      <Link to="/index" className="logo-box sticky top-0 flex min-h-topbar-height items-center justify-start px-6 backdrop-blur-xs">
        <div className="logo-light">
          <img src={logoLight} className="logo-lg h-12 w-auto mt-4" alt="Light logo" />
          <img src={logoSm} className="logo-sm w-6" alt="Small logo" />
        </div>

        <div className="logo-dark">
          <img src={logoDark} className="logo-lg h-12 w-auto mt-4" alt="Dark logo"  />
          <img src={logoSm} className="logo-sm w-6" alt="Small logo" /> 
        </div>
      </Link>

      <HoverToggle />

      <div className="relative min-h-0 flex-grow">
        <SimplebarClient className="size-full">
          <AppMenu />
        </SimplebarClient>
      </div>
    </aside>;
};
export default Sidebar;