import { createContext, Fragment, useEffect, useState } from 'react';
import {Outlet, redirect, RouterProvider, BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { Axios, } from 'axios';
import { ChakraProvider, ToastProvider, useToast, extendTheme, Fade } from '@chakra-ui/react';
import Layout from './pages/Layout';
import { Navbar } from './components/nav';
import { ErrorPage } from './components/error';
import {APIProvider} from '@vis.gl/react-google-maps';


// pages
import HomePage from './pages/marketplace/HomePage';
import LandingPage from './pages/LandingPage';
import RentListing from './pages/marketplace/rent/RentListing';
import RentDetail from './pages/marketplace/rent/RentDetail';
import BuyListing from './pages/marketplace/buy/BuyListing';
import BuyDetail from './pages/marketplace/buy/BuyDetail';
import MechanicSearchPage from './pages/marketplace/search/MechanicSearch';
import CarSearchPage from './pages/marketplace/search/CarSearch';
import MechanicListPage from './pages/marketplace/mechanics/MechanicsListing';
import MechanicDetailPage from './pages/marketplace/mechanics/MechanicDetail';
import LoginView from './pages/auth/Login';
import SignupView from './pages/auth/Signup';
import ChatRoom from './pages/marketplace/chat/ChatRoom';
import CartPage from './pages/marketplace/CartPage';
import WalletPage from './pages/marketplace/WalletPage';
import CheckoutPage from './pages/marketplace/checkout/CheckoutPage';
import NotificationsPage from './pages/marketplace/Notifications';

// Dealership Dashboard

import DealerProfile from './pages/marketplace/DealerProfile';
import DealerDashboardLayout from './pages/dashboard/dealer/Layout';
import DealerDashboard from './pages/dashboard/dealer/Dashboard';
import ListingsAdmin from './pages/dashboard/dealer/inventory/Listings';
import CreateListingAdmin from './pages/dashboard/dealer/inventory/CreateListing';
// import WalletPage from './pages/marketplace/WalletPage';
// import WalletPage from './pages/marketplace/WalletPage';


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
  // apiUrl: 'http://localhost:8000/api/v1',
  apiUrl: 'https://motaadev.pythonanywhere.com/api/v1',
  getCookie: undefined,
  setCookie: undefined,
  axios: Axios,
  logout: undefined,
  redirect: undefined,
  commaInt: undefined,
});

  
function App() {
  const notification = useToast();
  const [authUser, setAuthUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setAuthState] = useState(false)
  const axiosClient =  new Axios({
   baseURL: 'https://motaadev.pythonanywhere.com/api/v1',
    // baseURL: 'http://localhost:8000/api/v1',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authUser ? `Token ${authUser?.token}` : null
    },
  });
  
  function getCookie(name){
    let cookie = Cookies.getJSON(name)
    return cookie
  }

  function logout(){
    onLogout();
    redirect('/');
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


  function setCookie({name, val, expires}){
    let cookie = Cookies.set(name, val, { expires })
    return cookie
  }


  function getAuthUser(){
    const user = localStorage.getItem('motaa-auth-user')
    if (user === null){
    }else{
      setAuthUser(JSON.parse(user));
      setAuthState(true)
    }
  }
  
  function init(){
    // try to authenticate the user else redirect to login screen
    getAuthUser();

    // show loading screen for 3.5 seconds
    setTimeout(() => setLoading(false), 1500);

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
  }

  useEffect(() => {
    init();

  }, [isAuthenticated,])


  if (loading){
    return null
  }

  if (authUser && authUser.user_type === 'dealer'){
    return(
      <APIProvider
       apiKey={process.env.REACT_APP_GCP_MAP_API_TOKEN}
       onLoad={() => console.log('Maps API has loaded.')}
      >
      <ChakraProvider theme={BrandColors}>
        <Router>
          <GlobalStore.Provider value={context}>
            <Layout hideFooter={true}>
              <Routes>
                <Route ErrorBoundary={ErrorPage} element={<DealerDashboardLayout />}>
                  <Route ErrorBoundary={ErrorPage} path='/dashboard' element={<DealerDashboard />} />
                  <Route ErrorBoundary={ErrorPage} path='/inventory' element={<><Outlet /></>}>
                    <Route ErrorBoundary={ErrorPage} path='add' element={<CreateListingAdmin />} />
                    <Route ErrorBoundary={ErrorPage} path='discounts' element={<DealerDashboard />} />
                    <Route ErrorBoundary={ErrorPage} path='' element={<ListingsAdmin />} />
                    {/*<Outlet />*/}
                  </Route>

                  <Route ErrorBoundary={ErrorPage} path='/orders' element={<DealerDashboard />} />
                  <Route ErrorBoundary={ErrorPage} path='/wallet' element={<WalletPage />} />
                  <Route ErrorBoundary={ErrorPage} path='/analytics' element={<DealerDashboard />} />
                  <Route ErrorBoundary={ErrorPage} path='/settings' element={<DealerDashboard />} />
                  <Route ErrorBoundary={ErrorPage} path='/support' element={<DealerDashboard />} />
                  <Route ErrorBoundary={ErrorPage} path='/notifications' element={<NotificationsPage />} />
                </Route>
                <Route ErrorBoundary={ErrorPage} path='/chat' element={<ChatRoom />} />
                <Route ErrorBoundary={ErrorPage} path='/*' element={<Navigate to={'/dashboard'} />} />
              </Routes>
            </Layout>
          </GlobalStore.Provider>
        </Router>
      </ChakraProvider>
      </APIProvider>
    )
  }

  if (authUser && authUser.user_type === 'mechanic'){
    return(
      <APIProvider
       apiKey={process.env.REACT_APP_GCP_MAP_API_TOKEN}
       onLoad={() => console.log('Maps API has loaded.')}
      >
      <ChakraProvider theme={BrandColors}>
        <Router>
          <GlobalStore.Provider value={context}>
            <Layout hideFooter={true}>
              <Routes>
                <Route ErrorBoundary={ErrorPage} path='/home' element={<RentListing />} />
                <Route ErrorBoundary={ErrorPage} path='/*' element={<Navigate to={'/home'} />} />
              </Routes>
            </Layout>
          </GlobalStore.Provider>
        </Router>
      </ChakraProvider>
      </APIProvider>
    )
  }
  
  return (
    <APIProvider
     apiKey={process.env.REACT_APP_GCP_MAP_API_TOKEN}
     onLoad={() => console.log('Maps API has loaded.')}
    >
    <ChakraProvider theme={BrandColors}>
      <Router>
      <GlobalStore.Provider value={context}>
        <Layout>
          <Routes>
            <Route ErrorBoundary={ErrorPage} path='/rent' element={<RentListing />} />
            <Route ErrorBoundary={ErrorPage} path='/rent/:listingId' element={<RentDetail />} />

            <Route ErrorBoundary={ErrorPage} path='/buy' element={<BuyListing />} />
            <Route ErrorBoundary={ErrorPage} path='/buy/:listingId' element={<BuyDetail />} />
            
            <Route ErrorBoundary={ErrorPage} path='/mechanics' element={<MechanicListPage />} />
            <Route ErrorBoundary={ErrorPage} path='/mechanics/:mechId' element={<MechanicDetailPage />} />
            <Route ErrorBoundary={ErrorPage} path='/dealers/:dealerId' element={<DealerProfile />} />
            
            <Route ErrorBoundary={ErrorPage} path='/chat' element={<ChatRoom />} />
            
            <Route ErrorBoundary={ErrorPage} path='/cart' element={<CartPage />} />
            <Route ErrorBoundary={ErrorPage} path='/checkout/pay' element={<CheckoutPage />} />
            <Route ErrorBoundary={ErrorPage} path='/checkout/docs' element={<CheckoutPage />} />
            <Route ErrorBoundary={ErrorPage} path='/checkout/inspection' element={<CheckoutPage />} />
            <Route ErrorBoundary={ErrorPage} path='/checkout/' element={<CheckoutPage />} />
            
            <Route ErrorBoundary={ErrorPage} path='/search/cars/' element={<CarSearchPage />} />
            <Route ErrorBoundary={ErrorPage} path='/search/mechanics/' element={<MechanicSearchPage />} />
            <Route ErrorBoundary={ErrorPage} path='/notifications' element={<NotificationsPage />} />
            <Route ErrorBoundary={ErrorPage} path='/wallet' element={<WalletPage />} />
            
            <Route ErrorBoundary={ErrorPage} path='/login' element={<LoginView />} />
            <Route ErrorBoundary={ErrorPage} path='/signup' element={<SignupView />} />
            <Route ErrorBoundary={ErrorPage} path='/signup/business' element={<SignupView type={'business'} />} />
            
            <Route ErrorBoundary={ErrorPage} path='/home' element={<HomePage />} />
            <Route ErrorBoundary={ErrorPage} path='/*' element={<LandingPage />} />
            {/*<Route ErrorBoundary={ErrorPage} path='/*' element={<Navigate to={'/home'} />} />*/}
          </Routes>
          <ToastProvider />
        </Layout>
      </GlobalStore.Provider>
      </Router>
    </ChakraProvider>
    </APIProvider>
  );
}

export default App;
