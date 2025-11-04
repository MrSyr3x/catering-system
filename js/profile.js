import { auth, db } from './firebase-config.js';
import { signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let currentUser = null;

// Check authentication
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'login.html';
    } else {
        currentUser = user;
        console.log('🔐 User authenticated:', user.email); // Logging
        loadProfile();
    }
});

// Load user profile
async function loadProfile() {
    try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            document.getElementById('fullName').value = userData.fullName || '';
            document.getElementById('email').value = userData.email || '';
            document.getElementById('phone').value = userData.phone || '';
            document.getElementById('address').value = userData.address || '';
            console.log('✅ Profile loaded successfully'); // Logging
        }
    } catch (error) {
        console.error('❌ Error loading profile:', error); // Logging
        showAlert('Error loading profile', 'error');
    }
}

// Update profile
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;

    try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
            fullName,
            phone,
            address
        });
        console.log('✅ Profile updated:', { fullName, phone }); // Logging
        showAlert('Profile updated successfully!', 'success');
        setTimeout(() => window.location.href = 'user-dashboard.html', 1500);
    } catch (error) {
        console.error('❌ Error updating profile:', error); // Logging
        showAlert('Error updating profile', 'error');
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    console.log('🚪 User logging out'); // Logging
    await signOut(auth);
    window.location.href = 'login.html';
});

// Go back
window.goBack = function() {
    window.location.href = 'user-dashboard.html';
};

// Show alert
function showAlert(message, type) {
    const alertDiv = document.getElementById('alertMessage');
    alertDiv.innerHTML = `
        <div class="alert alert-${type}">
            <span class="material-icons">${type === 'success' ? 'check_circle' : 'error'}</span>
            ${message}
        </div>
    `;
    setTimeout(() => {
        alertDiv.innerHTML = '';
    }, 3000);
}
