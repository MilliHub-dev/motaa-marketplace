// AppRouter.js
import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginView from "./pages/auth/Login";
import SignupView from "./pages/auth/Signup";
import HomePage from "./pages/Homepage";
import BuyListing from "./pages/marketplace/buy/BuyListing";
import BuyDetail from "./pages/marketplace/buy/BuyDetail";
import { ErrorPage } from "./components/error";
import RentDetail from "./pages/marketplace/rent/RentDetail";
import RentListing from "./pages/marketplace/rent/RentListing";
// import SellListing from "./pages/marketplace/sell/SellListing";
// import SellDetail from "./pages/marketplace/sell/SellDetail";
// import RentListing from "./pages/marketplace/rent/RentListing";
// import RentDetail from "./pages/marketplace/rent/RentDetail";
import MechanicSearchPage from "./pages/marketplace/search/MechanicSearch";
import CarSearchPage from "./pages/marketplace/search/CarSearch";
import MechanicsListPage from "./pages/marketplace/mechanics/MechanicsListing";
import MechanicDetailPage from "./pages/marketplace/mechanics/MechanicDetail";
// import Dashboard from "./pages/dashboard/Dashboard";

export const AppRouter = createBrowserRouter(
  [
    {
      path: '/',
      errorElement: <ErrorPage />,
      element: <Navigate to="/home" replace />,
    },
    {
      path: '/home',
      errorElement: <ErrorPage />,
      element: <HomePage />
    },
    {
      path: '/login',
      errorElement: <ErrorPage />,
      element: <LoginView />
    },
    {
      path: '/signup',
      errorElement: <ErrorPage />,
      element: <SignupView />
    },
    {
      path: '/rent',
      errorElement: <ErrorPage />,
      children: [
        {
          path: '',
          element: <RentListing />
        },
        {
          path: ':listingId',
          element: <RentDetail />
        }
      ]
    },  
    {
      path: '/buy',
      errorElement: <ErrorPage />,
      children: [
        {
          path: '',
          element: <BuyListing />
        },
        {
          path: ':listingId',
          element: <BuyDetail />
        }
      ]
    },
    {
      path: '/mechanics',
      errorElement: <ErrorPage />,
      children: [
        {
          path: '',
          element: <MechanicsListPage />
        },
        {
          path: ':uuid',
          element: <MechanicDetailPage />
        }
      ]
    },
    {
      path: '/search',
      errorElement: <ErrorPage />,
      children: [
        {
          path: 'cars',
          element: <CarSearchPage />
        },
        {
          path: 'mechanics',
          element: <MechanicSearchPage />
        }
      ]
    }
  ],
  {
    basename: '/',
  });

export default AppRouter;
