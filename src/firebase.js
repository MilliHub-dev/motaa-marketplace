// Google sign-in through Firebase Auth. The API never trusts an email from the
// browser: we send Firebase's signed ID token (`id_token`) and the backend
// verifies it against Google's certificates.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { FIREBASE_CONFIG } from './config';

export const GOOGLE_SIGN_IN_AVAILABLE = Boolean(
  FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.authDomain && FIREBASE_CONFIG.projectId
);

let authInstance = null;

/** Lazily initialised Firebase auth (null when the Firebase env vars are missing). */
export function getFirebaseAuth() {
  if (!GOOGLE_SIGN_IN_AVAILABLE) return null;
  if (!authInstance) {
    const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(FIREBASE_CONFIG);
    authInstance = firebase.auth(app);
  }
  return authInstance;
}

/** Thrown when the person closes the Google window — not an error worth a toast. */
export class GoogleSignInCancelled extends Error {
  constructor() {
    super('Google sign-in was cancelled.');
    this.name = 'GoogleSignInCancelled';
  }
}

const CANCELLED_CODES = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'];
const FRIENDLY_ERRORS = {
  'auth/popup-blocked': 'Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.',
  'auth/network-request-failed': "Can't reach Google right now. Check your internet connection and try again.",
  'auth/unauthorized-domain': "Google sign-in isn't enabled for this web address yet. Use your email and password instead.",
  'auth/operation-not-allowed': "Google sign-in isn't available right now. Use your email and password instead.",
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
};

/**
 * Opens the Google popup and returns what the Motaa API needs.
 * @returns {Promise<{ idToken: string, email: string, firstName: string, lastName: string }>}
 * @throws {GoogleSignInCancelled} when the popup is closed
 * @throws {Error} with a user-readable message otherwise
 */
export async function signInWithGoogle() {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Google sign-in isn't available right now. Use your email and password instead.");

  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const { user } = await auth.signInWithPopup(provider);
    const idToken = await user.getIdToken();
    const [firstName = '', ...rest] = (user.displayName || '').trim().split(/\s+/);
    // Motaa uses its own API token from here on; don't keep a Firebase session around.
    auth.signOut().catch(() => {});
    return { idToken, email: user.email || '', firstName, lastName: rest.join(' ') };
  } catch (error) {
    if (CANCELLED_CODES.includes(error?.code)) throw new GoogleSignInCancelled();
    throw new Error(FRIENDLY_ERRORS[error?.code] || "Google sign-in didn't work. Please try again.");
  }
}
