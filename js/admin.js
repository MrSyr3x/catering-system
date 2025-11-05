import { auth, db } from './firebase-config.js';
import { signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    collection, 
    addDoc, 
    getDocs,
    doc,
    getDoc,
    updateDoc,
    deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let currentAdmin = null;

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'login.html';
    } else {
        currentAdmin = user;
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            document.getElementById('adminGreeting').textContent = `Admin: ${userData.fullName}`;
        }
        loadProducts();
        loadOrders();
    }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = 'login.html';
});

document.getElementById('addProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('productName').value;
    const description = document.getElementById('productDescription').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const category = document.getElementById('productCategory').value;

    try {
        await addDoc(collection(db, 'products'), {
            name,
            description,
            price,
            category,
            addedBy: currentAdmin.uid,
            addedAt: new Date().toISOString()
        });

        showAlert('Product added successfully!', 'success');
        document.getElementById('addProductForm').reset();
        loadProducts();
    } catch (error) {
        showAlert('Error adding product', 'error');
    }
});

async function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    productsGrid.innerHTML = '<p style="color: var(--subtle);">Loading products...</p>';
    
    try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        
        if (querySnapshot.empty) {
            productsGrid.innerHTML = '<p style="color: var(--subtle);">No products added yet.</p>';
            return;
        }

        productsGrid.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const product = doc.data();
            const productCard = `
                <div class="product-card">
                    <div class="product-image">
                        <span class="material-icons">fastfood</span>
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-description">${product.description}</p>
                        <p style="color: var(--subtle); font-size: 0.9rem; margin-bottom: 0.5rem;">Category: ${product.category}</p>
                        <p class="product-price">₹${product.price}</p>
                        <button class="btn-danger" onclick="deleteProduct('${doc.id}')" style="width: 100%; margin-top: 0.5rem;">
                            Delete Product
                        </button>
                    </div>
                </div>
            `;
            productsGrid.innerHTML += productCard;
        });
    } catch (error) {
        productsGrid.innerHTML = '<p style="color: var(--love);">Error loading products</p>';
    }
}

window.deleteProduct = async function(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await deleteDoc(doc(db, 'products', productId));
            showAlert('Product deleted successfully!', 'success');
            loadProducts();
        } catch (error) {
            showAlert('Error deleting product', 'error');
        }
    }
}

async function loadOrders() {
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = '<p style="color: var(--subtle);">Loading orders...</p>';
    
    try {
        const querySnapshot = await getDocs(collection(db, 'orders'));
        
        if (querySnapshot.empty) {
            ordersList.innerHTML = '<p style="color: var(--subtle);">No orders yet.</p>';
            return;
        }

        ordersList.innerHTML = '';
        
        querySnapshot.forEach((docSnap) => {
            const order = docSnap.data();
            const orderDate = new Date(order.orderDate).toLocaleDateString();
            
            ordersList.innerHTML += `
                <div class="cart-item" style="flex-direction: column; align-items: flex-start; margin-bottom: 1rem;">
                    <div style="width: 100%; display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <strong>Order Date: ${orderDate}</strong>
                        <select onchange="updateOrderStatus('${docSnap.id}', this.value)" style="padding: 0.25rem 0.5rem; border-radius: 8px; border: 1px solid var(--pine);">
                            <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                            <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Completed</option>
                            <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                    <p style="color: var(--subtle); margin-bottom: 0.5rem;">
                        Items: ${order.items.map(item => item.name).join(', ')}
                    </p>
                    <p style="color: var(--pine); font-weight: 700; font-size: 1.25rem;">Total: ₹${order.total}</p>
                </div>
            `;
        });
    } catch (error) {
        ordersList.innerHTML = '<p style="color: var(--love);">Error loading orders</p>';
    }
}

window.updateOrderStatus = async function(orderId, newStatus) {
    try {
        await updateDoc(doc(db, 'orders', orderId), {
            status: newStatus
        });
        showAlert('Order status updated!', 'success');
    } catch (error) {
        showAlert('Error updating status', 'error');
    }
}

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
