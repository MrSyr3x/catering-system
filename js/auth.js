import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    doc, 
    setDoc 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.innerHTML = `
        <div class="alert alert-error">
            <span class="material-icons">error</span>
            ${message}
        </div>
    `;
}

// Show success message
function showSuccess(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.innerHTML = `
        <div class="alert alert-success">
            <span class="material-icons">check_circle</span>
            ${message}
        </div>
    `;
}

// Register Form
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const fullName = document.getElementById('fullName').value;
        const phone = document.getElementById('phone').value;
        const address = document.getElementById('address').value;
        const userType = document.getElementById('userType').value;

        try {
            // Create user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Save user data to Firestore
            await setDoc(doc(db, 'users', user.uid), {
                fullName,
                email,
                phone,
                address,
                userType,
                createdAt: new Date().toISOString()
            });

            showSuccess('Account created successfully! Redirecting...');
            
            // Redirect based on user type
            setTimeout(() => {
                if (userType === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'user-dashboard.html';
                }
            }, 1500);

        } catch (error) {
            showError(error.message);
        }
    });
}

// Login Form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const userType = document.getElementById('userType').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            
            showSuccess('Login successful! Redirecting...');
            
            // Redirect based on selected user type
            setTimeout(() => {
                if (userType === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'user-dashboard.html';
                }
            }, 1000);

        } catch (error) {
            showError('Invalid email or password');
        }
    });
}
