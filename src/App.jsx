import { createContext, Fragment, useEffect, useState } from 'react';
import {Outlet, redirect, BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { Axios, } from 'axios';
import { ChakraProvider, ToastProvider, useToast, extendTheme, Fade } from '@chakra-ui/react';
import Layout from './pages/Layout';
import ErrorBoundary from './components/error';
import {AppLoadingScreen} from './components/loaders';
import {APIProvider} from '@vis.gl/react-google-maps';
import {Autocomplete, LoadScript} from "@react-google-maps/api";


// pages
import HomePage from './pages/marketplace/HomePage';
import LandingPage from './pages/LandingPage';
import ComingSoon from './pages/ComingSoon';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';


import RentListing from './pages/marketplace/rent/RentListing';
import RentDetail from './pages/marketplace/rent/RentDetail';
import BuyListing from './pages/marketplace/buy/BuyListing';
import BuyDetail from './pages/marketplace/buy/BuyDetail';
import MechanicSearchPage from './pages/marketplace/search/MechanicSearch';
import CarSearchPage from './pages/marketplace/search/CarSearch';
import MechanicListPage from './pages/marketplace/mechanics/MechanicsListing';
import ConfirmMechanicBookingPage from './pages/marketplace/mechanics/ConfirmBooking';
import MechanicDetailPage from './pages/marketplace/mechanics/MechanicDetail';
import LoginView from './pages/auth/Login';
import SignupView from './pages/auth/Signup';
import BusinessSignupView from './pages/auth/BusinessProfile';
import ChatLayout from './pages/marketplace/chat/Layout';
import ChatRoom from './pages/marketplace/chat/ChatRoom';
import CartPage from './pages/marketplace/CartPage';
import CheckoutPage from './pages/marketplace/checkout/CheckoutPage';
import CheckoutWithInspection from './pages/marketplace/checkout/CheckoutInspection';
import DocumentSigningPage from './pages/marketplace/checkout/DocumentSigningPage';
import NotificationsPage from './pages/marketplace/Notifications';

// Mechanic Dashboard
import MechanicDashboardLayout from './pages/dashboard/mechanic/Layout';
import MechanicDashboard from './pages/dashboard/mechanic/MechanicDashboard';
import BookingsAdmin from './pages/dashboard/mechanic/Bookings';
import ServiceOfferings from './pages/dashboard/mechanic/services/ServiceOfferings';
import MechanicAnalytics from './pages/dashboard/mechanic/Analytics';
import CreateServiceOffering from './pages/dashboard/mechanic/services/CreateServiceOffering';
import BusinessProfile from './pages/dashboard/mechanic/settings/BusinessProfile';

// Dealership Dashboard
import DealerProfile from './pages/marketplace/DealerProfile';
import DealerDashboardLayout from './pages/dashboard/dealer/Layout';
import DealerDashboard from './pages/dashboard/dealer/Dashboard';
import ListingsAdmin from './pages/dashboard/dealer/inventory/Listings';
import CreateListingAdmin from './pages/dashboard/dealer/inventory/CreateListing';
import EditListingAdmin from './pages/dashboard/dealer/inventory/EditListing';
import OrderListAdmin from './pages/dashboard/dealer/orders/OrderList';
import AnalyticsDashboard from './pages/dashboard/dealer/analytics/AnalyticsOverview';
import DealershipSettings from './pages/dashboard/dealer/settings/Settings';

// Wallet
import WalletLayout from './pages/marketplace/wallet/Layout';
import WalletHomePage from './pages/marketplace/wallet/Dashboard';
import WalletDepositPage from './pages/marketplace/wallet/Deposit';
import WalletTransactionsPage from './pages/marketplace/wallet/Transactions';
import WalletWithdrawalPage from './pages/marketplace/wallet/Withdraw';


const BrandColors = extendTheme({
  colors: {
    'primary': '#0065B5',
    'secondary': '#1C3D5A',
    'tertiary': '#FDD153',
    'accent': '#F2F3F5',
    'white': '#FFFFFF',
  }
})

export const GlobalStore = createContext({
  notify: undefined,
  loading: undefined,
  authUser: undefined,
  apiUrl: '',
  getCookie: undefined,
  setCookie: undefined,
  axios: Axios,
  logout: undefined,
  redirect: undefined,
  commaInt: undefined,
  naturalDate: undefined,
});

//const IS_DEBUG = JSON.parse(import.meta.env.VITE_DEBUG) || false;

  
function App() {
  const notification = useToast();
  const [authUser, setAuthUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setAuthState] = useState(false)
  const [otherContext, setOtherContext] = useState({})
  const axiosClient =  new Axios({
     baseURL: 'https://server.motaa.net/api/v1',
    // baseURL: 'http://localhost:8000/api/v1',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authUser ? `Token ${authUser?.token}` : null
    },
  });

  function reloadApp(){
    // reloads user data including auth tokens
    // use after verification or destructive actions only.
    
  }
  
  function getCookie(name){
    let cookie = Cookies.getJSON(name)
    return cookie
  }

  async function logout(){
    return onLogout();
  }

  function notify({ title, body, icon, color = 'green', duration = 2500 }){
    notification({
      title,
      description: body,
      icon,
      colorScheme: color,
      duration
    })
  }

  function redirect(url, timeout){
    if(timeout){
      setTimeout(() => window.location.href = `${url}`, timeout)
    }else{
      window.location.href = `${url}`
    }
  }

  function onAuthenticated(data){
    localStorage.setItem('motaa-auth-user', JSON.stringify({...data}));
    setAuthState(true)
  }

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
    return (`${hours}:${dateObj.getMinutes()} ${time}`)
  }

  function setCookie({name, val, expires}){
    let cookie = Cookies.set(name, val, { expires })
    return cookie
  }

  function getAuthUser(){
    const user = localStorage.getItem('motaa-auth-user')
    if (user === null){
    }else{
      const userData = JSON.parse(user)
      setAuthUser(userData);
      setAuthState(true)
    }
  }
  
  function init(){
    if (!loading){
      setLoading(true);
    }

    // try to authenticate the user else redirect to login screen
    getAuthUser();

    // show loading screen for 3.5 seconds
    setTimeout(() => setLoading(false), 5000);

    // TODO: try to refresh the auth token if expired - for jwt
  }

  
  function onError(message){
    notify({
        'title': 'Error!',
        'body': message || 'Something went wrong!',
        'color': 'red'
    });
  }
  
  function onLogout(){
    setAuthState(false);
    setAuthUser(null);
    localStorage.removeItem('motaa-auth-user', null);
  }

  function commaInt(number) {
    if (typeof number !== Number){
      number = Number(number)
    }
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  const context = {
    notify,
    authUser,
    loading,
    onLogout,
    onError,
    axios: axiosClient,
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
  }

  useEffect(() => {
    init();
  }, [isAuthenticated,])


  if (loading){
    return null
    // return <ErrorBoundary> <AppLoadingScreen /> </ErrorBoundary>
  }  
  
  return (
     <ChakraProvider theme={BrandColors}>
     <ErrorBoundary>
     <LoadScript googleMapsApiKey="AIzaSyBcwRVb-mzVQuHVJyaOkgbGXtmFT-c_II0" libraries={['places', 'maps']}> 
      <Router ErrorBoundary={ErrorBoundary}>
        <GlobalStore.Provider value={context}>
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
                        <Route ErrorBoundary={ErrorBoundary} path='discounts' element={<DealerDashboard />} />
                        <Route ErrorBoundary={ErrorBoundary} path='' element={<ListingsAdmin />} />
                      </Route>
                      <Route ErrorBoundary={ErrorBoundary} path='/orders' element={<DealerDashboard />} />
                      <Route ErrorBoundary={ErrorBoundary} path='/analytics' element={<AnalyticsDashboard />} />
                      <Route ErrorBoundary={ErrorBoundary} path='/settings' element={<DealershipSettings />} />
                      <Route ErrorBoundary={ErrorBoundary} path='/support' element={<DealerDashboard />} />
                      <Route ErrorBoundary={ErrorBoundary} path='/notifications' element={<NotificationsPage />} />
                      <Route ErrorBoundary={ErrorBoundary} path='/*' element={<Navigate to={'/dashboard'} />} />
                    </Route>
                    ) : authUser?.user_type === 'mechanic' ? (
                      <Route ErrorBoundary={ErrorBoundary} element={<MechanicDashboardLayout />}>
                        <Route ErrorBoundary={ErrorBoundary} path='/analytics' element={<MechanicAnalytics />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/dashboard' element={<MechanicDashboard />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/bookings' element={<BookingsAdmin />} />
                        
                        <Route ErrorBoundary={ErrorBoundary} path='/services' element={<> <Outlet /> </>}>
                          <Route ErrorBoundary={ErrorBoundary} path='edit/:serviceId' element={<ServiceOfferings />} />
                          <Route ErrorBoundary={ErrorBoundary} path='add' element={<CreateServiceOffering />} />
                          <Route ErrorBoundary={ErrorBoundary} path='' element={<ServiceOfferings />} />
                        </Route>

                        <Route ErrorBoundary={ErrorBoundary} path='/settings' element={<BusinessProfile />} />
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
                        <Route ErrorBoundary={ErrorBoundary} path='/checkout/' element={<CheckoutPage />} />
                        
                        <Route ErrorBoundary={ErrorBoundary} path='/search/cars/' element={<CarSearchPage />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/search/mechanics/' element={<MechanicSearchPage />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/notifications' element={<NotificationsPage />} />
                    
                        <Route ErrorBoundary={ErrorBoundary} path='/home' element={<HomePage />} />
                        <Route ErrorBoundary={ErrorBoundary} path='/*' element={<Navigate to='/home' />} />
                      </Route>
                    )
                  }* 

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
                      <Route ErrorBoundary={ErrorBoundary} path='settings' element={<WalletHomePage />} />
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
                  <Route ErrorBoundary={ErrorBoundary} path='/privacy-policy' element={<PrivacyPolicyPage />} />
                  <Route ErrorBoundary={ErrorBoundary} path='/terms-of-service' element={<TermsOfServicePage />} />
                  <Route ErrorBoundary={ErrorBoundary} path='/*' element={<LandingPage />} />
                </Route>      
              )              
            }
          </Routes>
          <ToastProvider />
        </GlobalStore.Provider>
      </Router>
      </LoadScript>
    </ErrorBoundary>                
    </ChakraProvider>           
  );  
} 

export default App;
