// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// YOUR Firebase configuration (REPLACE THIS WITH YOUR CONFIG FROM STEP 2)
const firebaseConfig = {
  apiKey: "AIzaSyDAp_mY_RY9wG5RdEq7JQesTXNNTgtHgXU",
  authDomain: "catering-system-fe8e5.firebaseapp.com",
  projectId: "catering-system-fe8e5",
  storageBucket: "catering-system-fe8e5.firebasestorage.app",
  messagingSenderId: "316161489581",
  appId: "1:316161489581:web:5ce61c099682cad10e2424",
  measurementId: "G-LDED2E9SJZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
