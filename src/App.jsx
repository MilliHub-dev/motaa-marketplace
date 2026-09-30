import { createContext, Fragment, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { glassEnabled } from './utils/platform';
import { lazyPage } from './utils/lazyPage';
import { API_URL, GOOGLE_MAPS_API_KEY, MAINTENANCE_MODE } from './config';
import { createApiClient, toApiError } from './api/client';
import { glassTheme } from './theme/glass';
import { ChakraProvider, ToastProvider, useToast, extendTheme } from '@chakra-ui/react';
import Layout from './pages/Layout';
import ErrorBoundary from './components/error';
import { LoadingState } from './components/states';
import {useJsApiLoader} from "@react-google-maps/api";


// pages — the landing page, site layout and login load up front; everything
// else is split into its own chunk and fetched when first visited.
const HomePage = lazyPage(() => import('./pages/marketplace/HomePage'));
import LandingPage from './pages/LandingPage';
const ComingSoon = lazyPage(() => import('./pages/ComingSoon'));
const PrivacyPolicyPage = lazyPage(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazyPage(() => import('./pages/TermsOfServicePage'));
const AboutPage = lazyPage(() => import('./pages/public/AboutPage'));
const FeaturesPage = lazyPage(() => import('./pages/public/FeaturesPage'));
const BusinessPage = lazyPage(() => import('./pages/public/BusinessPage'));
const SupportPage = lazyPage(() => import('./pages/SupportPage'));
const CheckoutStatus = lazyPage(() => import('./pages/marketplace/checkout/CheckoutStatus'));
const WalletSettingsPage = lazyPage(() => import('./pages/marketplace/wallet/Settings'));
const EditServiceOffering = lazyPage(() => import('./pages/dashboard/mechanic/services/EditServiceOffering'));


const RentListing = lazyPage(() => import('./pages/marketplace/rent/RentListing'));
const RentDetail = lazyPage(() => import('./pages/marketplace/rent/RentDetail'));
const BuyListing = lazyPage(() => import('./pages/marketplace/buy/BuyListing'));
const BuyDetail = lazyPage(() => import('./pages/marketplace/buy/BuyDetail'));
const MechanicSearchPage = lazyPage(() => import('./pages/marketplace/search/MechanicSearch'));
const CarSearchPage = lazyPage(() => import('./pages/marketplace/search/CarSearch'));
const MechanicListPage = lazyPage(() => import('./pages/marketplace/mechanics/MechanicsListing'));
const ConfirmMechanicBookingPage = lazyPage(() => import('./pages/marketplace/mechanics/ConfirmBooking'));
const MechanicDetailPage = lazyPage(() => import('./pages/marketplace/mechanics/MechanicDetail'));
const LoginView = lazyPage(() => import('./pages/auth/Login'));
const SignupView = lazyPage(() => import('./pages/auth/Signup'));
const BusinessSignupView = lazyPage(() => import('./pages/auth/BusinessProfile'));
const ResetPasswordView = lazyPage(() => import('./pages/auth/ResetPassword'));
const ChatLayout = lazyPage(() => import('./pages/marketplace/chat/Layout'));
const ChatRoom = lazyPage(() => import('./pages/marketplace/chat/ChatRoom'));
const CartPage = lazyPage(() => import('./pages/marketplace/CartPage'));
const CheckoutPage = lazyPage(() => import('./pages/marketplace/checkout/CheckoutPage'));
const CheckoutWithInspection = lazyPage(() => import('./pages/marketplace/checkout/CheckoutInspection'));
const DocumentSigningPage = lazyPage(() => import('./pages/marketplace/checkout/DocumentSigningPage'));
const NotificationsPage = lazyPage(() => import('./pages/marketplace/Notifications'));

// Mechanic Dashboard
const MechanicDashboardLayout = lazyPage(() => import('./pages/dashboard/mechanic/Layout'));
const MechanicDashboard = lazyPage(() => import('./pages/dashboard/mechanic/MechanicDashboard'));
const BookingsAdmin = lazyPage(() => import('./pages/dashboard/mechanic/Bookings'));
const ServiceOfferings = lazyPage(() => import('./pages/dashboard/mechanic/services/ServiceOfferings'));
const MechanicAnalytics = lazyPage(() => import('./pages/dashboard/mechanic/Analytics'));
const CreateServiceOffering = lazyPage(() => import('./pages/dashboard/mechanic/services/CreateServiceOffering'));
const BusinessProfile = lazyPage(() => import('./pages/dashboard/mechanic/settings/BusinessProfile'));

// Dealership Dashboard
const DealerProfile = lazyPage(() => import('./pages/marketplace/DealerProfile'));
const DealerDashboardLayout = lazyPage(() => import('./pages/dashboard/dealer/Layout'));
const DealerDashboard = lazyPage(() => import('./pages/dashboard/dealer/Dashboard'));
const ListingsAdmin = lazyPage(() => import('./pages/dashboard/dealer/inventory/Listings'));
const CreateListingAdmin = lazyPage(() => import('./pages/dashboard/dealer/inventory/CreateListing'));
const EditListingAdmin = lazyPage(() => import('./pages/dashboard/dealer/inventory/EditListing'));
const OrderListAdmin = lazyPage(() => import('./pages/dashboard/dealer/orders/OrderList'));
const AnalyticsDashboard = lazyPage(() => import('./pages/dashboard/dealer/analytics/AnalyticsOverview'));
const DealershipSettings = lazyPage(() => import('./pages/dashboard/dealer/settings/Settings'));

// Wallet
const WalletLayout = lazyPage(() => import('./pages/marketplace/wallet/Layout'));
const WalletHomePage = lazyPage(() => import('./pages/marketplace/wallet/Dashboard'));
const WalletDepositPage = lazyPage(() => import('./pages/marketplace/wallet/Deposit'));
const WalletTransactionsPage = lazyPage(() => import('./pages/marketplace/wallet/Transactions'));
const WalletWithdrawalPage = lazyPage(() => import('./pages/marketplace/wallet/Withdraw'));


const BrandColors = extendTheme({
  colors: {
    'primary': '#0065B5',
    'secondary': '#1C3D5A',
    'tertiary': '#FDD153',
    'accent': '#F2F3F5',
    'white': '#FFFFFF',
  }
}, glassEnabled ? glassTheme : {})

export const GlobalStore = createContext({
  notify: undefined,
  notifyError: undefined,
  api: undefined,
  loading: undefined,
  authUser: undefined,
  apiUrl: API_URL,
  getCookie: undefined,
  setCookie: undefined,
  logout: undefined,
  redirect: undefined,
  commaInt: undefined,
  naturalDate: undefined,
});


// Must be a module-level constant — a fresh array each render makes
// useJsApiLoader tear down and re-inject the script on every render.
const GOOGLE_MAPS_LIBRARIES = ['places'];
const AUTH_STORAGE_KEY = 'motaa-auth-user';

function readStoredUser(){
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    const user = raw ? JSON.parse(raw) : null;
    return user?.token ? user : null;
  } catch (e) {
    return null;
  }
}

let lastServerNotice = 0;

  
function App() {
  const notification = useToast();
  const [authUser, setAuthUser] = useState(readStoredUser)
  const isAuthenticated = Boolean(authUser)
  const loading = false
  const [otherContext, setOtherContext] = useState({})
  // the API client reads the token through a ref so it can stay a stable object
  const tokenRef = useRef(authUser?.token)
  tokenRef.current = authUser?.token

  // Loads the Maps script WITHOUT gating the app on it. If Google is
  // unreachable (offline, blocked network, ad-blocker) mapsLoaded stays false
  // and map-dependent widgets degrade instead of the whole site going dark.
  const {isLoaded: mapsLoaded, loadError: mapsError} = useJsApiLoader({
    id: 'script-loader',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });
  // The API client: returns parsed bodies and throws ApiError with a readable
  // message (see src/api/client.js). Use this for all new code.
  const api = useMemo(() => createApiClient({
    baseURL: API_URL,
    getToken: () => tokenRef.current,
    onUnauthorized: () => endSession('Your session has expired. Please log in again.'),
    onConnectionProblem: (error) => notifyServerTrouble(error.message),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  // One toast per burst of failures, not one per request.
  function notifyServerTrouble(message){
    const now = Date.now();
    if (now - lastServerNotice < 8000) return;
    lastServerNotice = now;
    notification({ title: 'Connection problem', description: message, status: 'error', duration: 5000, isClosable: true });
  }

  function reloadApp(){
    // reloads user data including auth tokens
    // use after verification or destructive actions only.
    
  }
  
  function getCookie(name){
    const value = Cookies.get(name)
    try { return value ? JSON.parse(value) : value } catch (e) { return value }
  }

  async function logout(){
    return onLogout();
  }

  function notify({ title, body, icon, color = 'green', duration = 3500 }){
    notification({
      title,
      description: body,
      icon,
      colorScheme: color,
      status: color === 'red' ? 'error' : color === 'green' ? 'success' : 'info',
      duration,
      isClosable: true,
    })
  }

  /** Toast for a failed request; accepts an ApiError or anything thrown. */
  function notifyError(error, title = "That didn't work"){
    const apiError = toApiError(error)
    notify({ title, body: apiError.message, color: 'red', duration: 5000 })
  }

  function redirect(url, timeout){
    if(timeout){
      setTimeout(() => window.location.href = `${url}`, timeout)
    }else{
      window.location.href = `${url}`
    }
  }

  /** Store the logged-in user returned by /accounts/login/ or /accounts/register/. */
  function onAuthenticated(data){
    if (!data?.token) {
      console.error('onAuthenticated called without a token', data)
      return
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({...data}));
    setAuthUser({...data})
  }

  /** Log out locally (and say why, when the server ended the session). */
  const endSession = useCallback((message) => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthUser(null);
    if (message) {
      notification({ title: 'Signed out', description: message, status: 'warning', duration: 5000, isClosable: true, id: 'session-ended' })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function naturalDate (dateObj) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ]
    return (`${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`)
  }

  function naturalTime (dateObj) {
    let time = 'am'
    let hours = dateObj.getHours()
    if (hours >= 12){
      time = 'pm'
      if (hours > 12){
        hours -= 12
      }
    }
    if (hours === 0) hours = 12
    return (`${hours}:${String(dateObj.getMinutes()).padStart(2, '0')} ${time}`)
  }

  function setCookie({name, val, expires}){
    let cookie = Cookies.set(name, val, { expires })
    return cookie
  }


  function onError(message){
    notify({
        'title': 'Error!',
        'body': message || 'Something went wrong!',
        'color': 'red'
    });
  }
  
  function onLogout(){
    endSession();
  }

  // 1234567.5 -> "1,234,567.5"; missing/invalid values show as "0" instead of "NaN"
  function commaInt(number) {
    const value = Number(number);
    if (number === null || number === undefined || number === '' || !Number.isFinite(value)) return '0';
    const [whole, fraction] = (Math.round(value * 100) / 100).toString().split('.');
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return fraction ? `${grouped}.${fraction}` : grouped;
  }

  const context = {
    notify,
    notifyError,
    api,
    maintenanceMode: MAINTENANCE_MODE,
    authUser,
    loading,
    onLogout,
    onError,
    setCookie,
    getCookie,
    onAuthenticated,
    isAuthenticated,
    commaInt,
    redirect,
    logout,
    naturalDate,
    naturalTime,
    setOtherContext,
    otherContext,
    mapsLoaded,
    mapsError,
  }

  // keep tabs in sync: logging in/out in one tab applies to the others
  useEffect(() => {
    function onStorage(event){
      if (event.key === AUTH_STORAGE_KEY) setAuthUser(readStoredUser())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
  
  return (
     <ChakraProvider theme={BrandColors}>
     <ErrorBoundary>
      <Router ErrorBoundary={ErrorBoundary}>
        <GlobalStore.Provider value={context}>
           <Suspense fallback={<LoadingState minH="70vh" label="Loading…" />}>
           <Routes ErrorBoundary={ErrorBoundary}>
            {authUser ? (
                <Fragment>
                  {authUser?.user_type === 'dealer' ? (
                    <Route ErrorBoundary={ErrorBoundary} element={<DealerDashboardLayout />}>
                      <Route ErrorBoundary={ErrorBoundary} path='/dashboard' element={<DealerDashboard />} />
                      <Route ErrorBoundary={ErrorBoundary} path='/orders' element={<OrderListAdmin />} />
                      <Route ErrorBoundary={ErrorBoundary} path='/inventory' element={<><Outlet /></>}>
                        <Route ErrorBoundary={ErrorBoundary} path='edit/:listingId' element={<EditListingAdmin />} />
                        <Route ErrorBoundary={ErrorBoundary} path='add' element={<CreateListingAdmin />} />
                        <Route ErrorBoundary={ErrorBoundary} path='' element={<ListingsAdmin />} />
                      </Route>
                      <Route ErrorBoundary={ErrorBoundary} path='/analytics' element={<AnalyticsDashboard />} />
                      <Route ErrorBoundary={ErrorBoundary} path='/settings' element={<DealershipSettings />} />
                      <Route ErrorBoundary={ErrorBoundary} path='/support' element={<SupportPage />} />
                      <Route ErrorBoundary={ErrorBoundary} path='/notifications' element={<NotificationsPage />} />
                      <Route ErrorBoundary={ErrorBoundary} path='/*' element={<Navigate to={'/dashboard'} />} />
                    </Route>
                    ) : authUser?.user_type === 'mechanic' ? (
                      <Route ErrorBoundary={ErrorBoundary} element={<MechanicDashboardLayout />}>
                        <Route ErrorBoundary={ErrorBoundary} path='/analytics' element={<MechanicAnalytics />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/dashboard' element={<MechanicDashboard />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/bookings' element={<BookingsAdmin />} />
                        
                        <Route ErrorBoundary={ErrorBoundary} path='/services' element={<> <Outlet /> </>}>
                          <Route ErrorBoundary={ErrorBoundary} path='edit/:serviceId' element={<EditServiceOffering />} />
                          <Route ErrorBoundary={ErrorBoundary} path='add' element={<CreateServiceOffering />} />
                          <Route ErrorBoundary={ErrorBoundary} path='' element={<ServiceOfferings />} />
                        </Route>

                        <Route ErrorBoundary={ErrorBoundary} path='/settings' element={<BusinessProfile />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/support' element={<SupportPage />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/notifications' element={<NotificationsPage />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/*' element={<Navigate to={'/dashboard'} />} />
                      </Route>
                    ) : (
                      <Route ErrorBoundary={ErrorBoundary} element={<Layout />}>
                        <Route ErrorBoundary={ErrorBoundary} path='/rent' element={<RentListing />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/rent/:listingId' element={<RentDetail />} />

                        <Route ErrorBoundary={ErrorBoundary} path='/buy' element={<BuyListing />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/buy/:listingId' element={<BuyDetail />} />
                        
                        <Route ErrorBoundary={ErrorBoundary} path='/mechanics' element={<MechanicListPage />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/mechanics/book/:mechId' element={<ConfirmMechanicBookingPage />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/mechanics/:mechId' element={<MechanicDetailPage />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/dealership/:dealerId' element={<DealerProfile />} />
                        
                        <Route ErrorBoundary={ErrorBoundary} path='/cart' element={<CartPage />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/checkout/pay' element={<CheckoutPage />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/checkout/docs' element={<DocumentSigningPage />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/checkout/inspection' element={<CheckoutWithInspection />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/checkout/status' element={<CheckoutStatus />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/checkout/' element={<CheckoutPage />} />
                        
                        <Route ErrorBoundary={ErrorBoundary} path='/search/cars/' element={<CarSearchPage />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/search/mechanics/' element={<MechanicSearchPage />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/notifications' element={<NotificationsPage />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/support' element={<SupportPage />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/about' element={<AboutPage />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/features' element={<FeaturesPage />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/business' element={<BusinessPage />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/privacy-policy' element={<PrivacyPolicyPage />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/terms-of-service' element={<TermsOfServicePage />} />
                    
                        <Route ErrorBoundary={ErrorBoundary} path='/home' element={<HomePage />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/*' element={<Navigate to='/home' />} />
                      </Route>
                    )
                  }

                  {/* Wallet Routes */}
                  <Route ErrorBoundary={ErrorBoundary} element={
                    authUser?.user_type === 'dealer' ? <DealerDashboardLayout hideSidebar={true} hideFooter={true} />
                    : authUser?.user_type === 'mechanic' ? <MechanicDashboardLayout hideFooter={true} hideSidebar={true} />
                    : <Layout hideFooter={true} />
                  }>
                    <Route ErrorBoundary={ErrorBoundary} path={'/wallet'} element={<WalletLayout />}>
                      <Route ErrorBoundary={ErrorBoundary} path='home' element={<WalletHomePage />} />
                      <Route ErrorBoundary={ErrorBoundary} path='transactions' element={<WalletTransactionsPage />} />
                      <Route ErrorBoundary={ErrorBoundary} path='savings' element={<ComingSoon />} />
                      <Route ErrorBoundary={ErrorBoundary} path='deposit' element={<WalletDepositPage />} />
                      <Route ErrorBoundary={ErrorBoundary} path='withdraw' element={<WalletWithdrawalPage />} />
                      <Route ErrorBoundary={ErrorBoundary} path='settings' element={<WalletSettingsPage />} />
                      <Route ErrorBoundary={ErrorBoundary} path='' element={<Navigate to='home' />} />
                      <Route ErrorBoundary={ErrorBoundary} path='*' element={<Navigate to='home' />} />
                    </Route>
                    <Route ErrorBoundary={ErrorBoundary} path={'/chat'} element={<ChatLayout />}>
                      <Route ErrorBoundary={ErrorBoundary} path='/chat/:room' element={<ChatRoom />} />
                    </Route>
                  </Route>
                </Fragment>
              ):(
                <Route element={<Layout />}>
                  <Route ErrorBoundary={ErrorBoundary} path='/login' element={<LoginView />} />
                  <Route ErrorBoundary={ErrorBoundary} path='/signup' element={<SignupView />} />
                  <Route ErrorBoundary={ErrorBoundary} path='/signup/business' element={<BusinessSignupView />} />
                  <Route ErrorBoundary={ErrorBoundary} path='/reset-password/:uid/:token' element={<ResetPasswordView />} />
                  <Route ErrorBoundary={ErrorBoundary} path='/privacy-policy' element={<PrivacyPolicyPage />} />
                  <Route ErrorBoundary={ErrorBoundary} path='/terms-of-service' element={<TermsOfServicePage />} />
                  <Route ErrorBoundary={ErrorBoundary} path='/about' element={<AboutPage />} />
                  <Route ErrorBoundary={ErrorBoundary} path='/features' element={<FeaturesPage />} />
                  <Route ErrorBoundary={ErrorBoundary} path='/business' element={<BusinessPage />} />
                  <Route ErrorBoundary={ErrorBoundary} path='/support' element={<SupportPage />} />
                  <Route ErrorBoundary={ErrorBoundary} path='/' element={<LandingPage />} />
                  {/* deep links need an account: send them to login and come back afterwards */}
                  <Route ErrorBoundary={ErrorBoundary} path='/*' element={<LoginRedirect />} />
                </Route>      
              )              
            }
          </Routes>
           </Suspense>
          <ToastProvider />
        </GlobalStore.Provider>
      </Router>
    </ErrorBoundary>                
    </ChakraProvider>           
  );  
} 

/** Unknown/protected path while logged out → /login?next=<path> (landing for junk paths). */
function LoginRedirect(){
  const path = window.location.pathname + window.location.search
  const appPaths = /^\/(home|buy|rent|mechanics|dealership|cart|checkout|search|notifications|wallet|chat|dashboard|orders|inventory|analytics|settings|bookings|services)(\/|$)/
  if (!appPaths.test(window.location.pathname)) return <Navigate to='/' replace />
  return <Navigate to={`/login?next=${encodeURIComponent(path)}`} replace />
}

export default App;
