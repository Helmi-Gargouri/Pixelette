// Topbar.jsx - Updated with dynamic user name, role, and avatar
import ArabianFlag from '@/assets/images/flags/arebian.svg';
import FrenchFlag from '@/assets/images/flags/french.jpg';
import GermanyFlag from '@/assets/images/flags/germany.jpg';
import ItalyFlag from '@/assets/images/flags/italy.jpg';
import JapaneseFlag from '@/assets/images/flags/japanese.svg';
import RussiaFlag from '@/assets/images/flags/russia.jpg';
import SpainFlag from '@/assets/images/flags/spain.jpg';
import UsFlag from '@/assets/images/flags/us.jpg';
import { Link, useNavigate } from 'react-router-dom';
import { TbSearch } from 'react-icons/tb';
import SimpleBar from 'simplebar-react';
import SidenavToggle from './SidenavToggle';
import ThemeModeToggle from './ThemeModeToggle';
import { LuBellRing, LuUser, LuClock, LuGem, LuHeart, LuLogOut, LuMail, LuMessagesSquare, LuMoveRight, LuSettings, LuShoppingBag } from 'react-icons/lu';
import { useAuth } from '@/context/AuthContext';
import avatar1 from '@/assets/images/user/avatar-1.png';
import avatar3 from '@/assets/images/user/avatar-3.png';
import avatar5 from '@/assets/images/user/avatar-5.png';
import avatar7 from '@/assets/images/user/avatar-7.png';

const languages = [{
  src: UsFlag,
  label: 'English'
}, {
  src: SpainFlag,
  label: 'Spanish'
}, {
  src: GermanyFlag,
  label: 'German'
}, {
  src: FrenchFlag,
  label: 'French'
}, {
  src: JapaneseFlag,
  label: 'Japanese'
}, {
  src: ItalyFlag,
  label: 'Italian'
}, {
  src: RussiaFlag,
  label: 'Russian'
}, {
  src: ArabianFlag,
  label: 'Arabic'
}];

const tabs = [{
  id: 'tabsViewall',
  title: 'View all',
  active: true
}, {
  id: 'tabsMentions',
  title: 'Mentions'
}, {
  id: 'tabsFollowers',
  title: 'Followers'
}, {
  id: 'tabsInvites',
  title: 'Invites'
}];

const notifications = {
  tabsViewall: [{
    type: 'follow',
    avatar: avatar3,
    text: <>
          <b>@willie_passem</b> followed you
        </>,
    time: 'Wednesday 03:42 PM',
    ago: '4 sec'
  }, {
    type: 'comment',
    avatar: avatar5,
    text: <>
          <b>@caroline_jessica</b> commented <br />
          on your post
        </>,
    time: 'Wednesday 03:42 PM',
    ago: '15 min',
    comment: 'Amazing! Fast, to the point, professional and really amazing to work with them!!!'
  }, {
    type: 'purchase',
    icon: <LuShoppingBag className="size-5 text-danger" />,
    text: <>
          Successfully purchased a business plan for <span className="text-danger">$199.99</span>
        </>,
    time: 'Monday 11:26 AM',
    ago: 'yesterday'
  }, {
    type: 'like',
    avatar: avatar7,
    icon: <LuHeart className="size-3.5 fill-orange-500" />,
    text: <>
          <b>@scott</b> liked your post
        </>,
    time: 'Thursday 06:59 AM',
    ago: '1 Week'
  }],
  tabsMentions: [{
    type: 'comment',
    avatar: avatar5,
    text: <>
          <b>@caroline_jessica</b> commented <br />
          on your post
        </>,
    time: 'Wednesday 03:42 PM',
    ago: '15 min',
    comment: 'Amazing! Fast, to the point, professional and really amazing to work with them!!!'
  }, {
    type: 'like',
    avatar: avatar7,
    icon: <LuHeart className="size-3.5 fill-orange-500" />,
    text: <>
          <b>@scott</b> liked your post
        </>,
    time: 'Thursday 06:59 AM',
    ago: '1 Week'
  }],
  tabsFollowers: [{
    type: 'follow',
    avatar: avatar3,
    text: <>
          <b>@willie_passem</b> followed you
        </>,
    time: 'Wednesday 03:42 PM',
    ago: '4 sec'
  }],
  tabsInvites: [{
    type: 'purchase',
    icon: <LuShoppingBag className="size-5 text-danger" />,
    text: <>
          Successfully purchased a business plan for <span className="text-danger">$199.99</span>
        </>,
    time: 'Monday 11:26 AM',
    ago: 'yesterday'
  }]
};

const Topbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const MEDIA_BASE = import.meta.env.VITE_MEDIA_URL || 'http://localhost:8000';  

const handleLogout = async () => {
  try {
    await logout();
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
  }
};
 

  // Construis l'URL de l'image correctement
  const getUserImage = () => {
    if (!user?.image) return avatar1;
    // Si c'est déjà une URL complète, retourne-la
    if (user.image.startsWith('http')) {
      return user.image;
    }
    // Sinon, ajoute l'URL de base
    return `${MEDIA_BASE}${user.image}`;
  };

  // Obtiens les initiales de l'utilisateur
  const getUserInitials = () => {
    if (!user?.prenom || !user?.nom) return '?';
    return `${user.prenom[0]}${user.nom[0]}`.toUpperCase();
  };

  const profileMenu = [{
    icon: <LuUser className="size-4" />,
    label: 'Mon Profil',
    to: '/profile'
  }, {
    divider: true
  }, {
    icon: <LuLogOut className="size-4" />,
    label: 'Déconnexion',
    action: handleLogout
  }];

  return (
    <div className="app-header min-h-topbar-height flex items-center sticky top-0 z-30 bg-(--topbar-background) border-b border-default-200">
      <div className="w-full flex items-center justify-between px-6">
        <div className="flex items-center gap-5">
          <SidenavToggle />

          
        </div>

        <div className="flex items-center gap-3">
          <div className="topbar-item hs-dropdown [--placement:bottom-right] relative inline-flex">
            <button className="hs-dropdown-toggle btn btn-icon size-8 hover:bg-default-150 rounded-full relative" type="button">
              <img src={UsFlag} alt="us-flag" className="size-4.5 rounded" />
            </button>
            <div className="hs-dropdown-menu" role="menu">
              {languages.map((lang, i) => (
                <Link key={i} to="#" className="flex items-center gap-x-3.5 py-1.5 px-3 text-default-600 hover:bg-default-150 rounded font-medium">
                  <img src={lang.src} alt={lang.label} className="size-4 rounded-full" />
                  {lang.label}
                </Link>
              ))}
            </div>
          </div>

          <ThemeModeToggle />

          <div className="topbar-item hs-dropdown [--auto-close:inside] relative inline-flex">
            <button type="button" className="hs-dropdown-toggle btn btn-icon size-8 hover:bg-default-150 rounded-full relative" aria-haspopup="dialog" aria-expanded="false" aria-controls="theme-customization" data-hs-overlay="#theme-customization">
              <LuSettings className="size-4.5" />
            </button>
          </div>

          <div className="topbar-item hs-dropdown relative inline-flex">
            <button className="cursor-pointer bg-pink-100 rounded-full">
              <img 
                src={getUserImage()} 
                alt="user" 
                className="hs-dropdown-toggle rounded-full size-9.5 object-cover" 
                onError={(e) => e.target.src = avatar1}
              />
            </button>
            <div className="hs-dropdown-menu min-w-48">
              <div className="p-2">
                <div className="flex gap-3">
                  <div className="relative inline-block">
                    {user?.image ? (
                      <img 
                        src={getUserImage()} 
                        alt={user?.nom || 'User'} 
                        className="size-12 rounded object-cover"
                        onError={(e) => e.target.src = avatar1}
                      />
                    ) : (
                      <div className="size-12 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {getUserInitials()}
                      </div>
                    )}
                    <span className="-top-1 -end-1 absolute w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full"></span>
                  </div>
                  <div>
                    <h6 className="mb-1 text-sm font-semibold text-default-800">
                      {user?.prenom && user?.nom 
                        ? `${user.prenom} ${user.nom}` 
                        : 'Utilisateur'
                      }
                    </h6>
                    <p className="text-default-500 text-xs">
                      {user?.role 
                        ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                        : 'User'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-default-200 -mx-2 my-2"></div>

              <div className="flex flex-col gap-y-1">
                {profileMenu.map((item, i) => item.divider ? (
                  <div key={i} className="border-t border-default-200 -mx-2 my-1"></div>
                ) : item.action ? (
                  <button 
                    key={i} 
                    onClick={item.action}
                    className="flex items-center gap-x-3.5 py-1.5 px-3 text-default-600 hover:bg-default-150 rounded font-medium w-full text-left"
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ) : (
                  <Link 
                    key={i} 
                    to={item.to || '#!'} 
                    className="flex items-center gap-x-3.5 py-1.5 px-3 text-default-600 hover:bg-default-150 rounded font-medium"
                  >
                    {item.icon}
                    {item.label}
                    {item.badge && (
                      <span className="size-4.5 font-semibold bg-danger rounded text-white flex items-center justify-center text-xs">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;