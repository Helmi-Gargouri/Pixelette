import { LuCalendar1, LuCircuitBoard, LuClipboardList, LuCodesandbox, LuFileText, LuFingerprint, LuLayoutPanelLeft, LuLock, LuMail, LuMessagesSquare, LuMonitorDot, LuPackage, LuPictureInPicture2, LuShare2, LuShieldCheck, LuShoppingBag, LuSquareUserRound, LuSquarePen,LuImage, LuPalette, LuLayoutDashboard } from 'react-icons/lu';
export const menuItemsData = [{
  key: 'Dashboard-Section',
  label: 'Dashboard',
  isTitle: true
}, {
  key: 'Dashboard',
  label: 'Dashboard',
  icon: LuLayoutDashboard,
  href: '/dashboard'
}, {
  key: 'UsersList',
  label: 'Users',
  icon: LuSquareUserRound,
  href: '/users-list',
}, {
  key: 'UsersGrid',
  label: 'Users',
  icon: LuSquareUserRound,
  href: '/users-grid',
},{
    key: 'DemandesRoles',  // NEW: Separate section
    label: 'Demandes Rôles',
    icon: LuSquarePen,
    href: '/demandes-roles'
  },{
  key: 'Nos Gestion',
  label: 'Nos Gestion',
  isTitle: true
}, {
  key: 'Oeuvres',
  label: 'Œuvres',
  icon: LuImage,
  href: '/oeuvres-grid'
}, {
  key: 'Galeries',
  label: 'Galeries',
  icon: LuPalette,
  href: '/galeries-list'
}, {
  key: 'GestionInteractions',
  label: 'Gestion Interactions',
  icon: LuMessagesSquare,
  href: '/gestion-interactions'
},];