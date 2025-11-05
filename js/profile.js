import { auth, db } from './firebase-config.js';
import { signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'login.html';
    } else {
        currentUser = user;
        loadProfile();
    }
});

async function loadProfile() {
    try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            document.getElementById('fullName').value = userData.fullName || '';
            document.getElementById('email').value = userData.email || '';
            document.getElementById('phone').value = userData.phone || '';
            document.getElementById('address').value = userData.address || '';
        }
    } catch (error) {
        showAlert('Error loading profile', 'error');
    }
}

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
        showAlert('Profile updated successfully!', 'success');
        setTimeout(() => window.location.href = 'user-dashboard.html', 1500);
    } catch (error) {
        showAlert('Error updating profile', 'error');
    }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = 'login.html';
});

window.goBack = function() {
    window.location.href = 'user-dashboard.html';
};

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
