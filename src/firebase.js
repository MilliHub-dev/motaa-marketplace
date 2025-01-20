import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCaxl0WWPcu12eRqT05ZcraY7IMZbAM45I",
  authDomain: "motaa-501bf.firebaseapp.com",
  projectId: "motaa-501bf",
  storageBucket: "motaa-501bf.appspot.com",
  messagingSenderId: "111373168202",
  appId: "1:111373168202:web:dd034624adb6e68b9900b3",
  measurementId: "G-SX7L9QFQTR"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Get a reference to the authentication service
const auth = firebase.auth();

export { auth };
