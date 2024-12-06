import { createContext, Fragment, useEffect, useState } from 'react';
import {Outlet, redirect, RouterProvider, BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { Axios, } from 'axios';
import { ChakraProvider, ToastProvider, useToast, extendTheme, Fade } from '@chakra-ui/react';
import Layout from './pages/Layout';
import AppRouter from './routing';
import { Navbar } from './components/nav';
import { ErrorPage } from './components/error';
import HomePage from './pages/Homepage';
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
  // apiUrl: 'http://localhost:8000/api',
  apiUrl: 'https://motaadev.pythonanywhere.com/api',
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
    baseURL: 'https://motaadev.pythonanywhere.com/api',
    // baseURL: 'http://localhost:8000/api',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authUser ? `Token ${authUser?.token}` : null
    },
  });

  if (!authUser){
    // delete axiosClient.defaults.headers.common['Authorization']
    // axiosClient.defaults
    // axiosClient.options
  }
  
  
  function getCookie(name){
    let cookie = Cookies.getJSON(name)
    return cookie
  }

  function logout(){
    localStorage.removeItem('motaa-auth-user');
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
    // show loading screen for 3.5 seconds
    setTimeout(() => setLoading(false), 3500);

    // try to authenticate the user else redirect to login screen
    getAuthUser();
    
    // try to refresh the auth token if expired
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
    localStorage.setItem('motaa-auth-user', null);
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
    commaInt,
    redirect,
    logout,
  }

  useEffect(() => {
    init();

  }, [isAuthenticated,])


  // if (loading){
  //   return null
  // }

  
  return (
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
            
            <Route ErrorBoundary={ErrorPage} path='/sell' element={<ErrorPage />} />
            
            <Route ErrorBoundary={ErrorPage} path='/chat' element={<ChatRoom />} />
            
            <Route ErrorBoundary={ErrorPage} path='/search/cars/' element={<CarSearchPage />} />
            <Route ErrorBoundary={ErrorPage} path='/search/mechanics/' element={<MechanicSearchPage />} />
            
            <Route ErrorBoundary={ErrorPage} path='/login' element={<LoginView />} />
            <Route ErrorBoundary={ErrorPage} path='/signup' element={<SignupView />} />
            
            <Route ErrorBoundary={ErrorPage} path='/home' element={<HomePage />} />
            <Route ErrorBoundary={ErrorPage} path='/*' element={<Navigate to={'/home'} />} />
          </Routes>
          <ToastProvider />
        </Layout>
      </GlobalStore.Provider>
      </Router>
    </ChakraProvider>
  );
}

export default App;
