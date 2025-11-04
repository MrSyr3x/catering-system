import { auth, db } from './firebase-config.js';
import { signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    collection, 
    getDocs, 
    addDoc, 
    doc, 
    getDoc,
    query,
    where
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let cart = [];
let currentUser = null;

// Check authentication
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'login.html';
    } else {
        currentUser = user;
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            document.getElementById('userGreeting').textContent = `Hello, ${userData.fullName}`;
        }
        loadProducts();
        loadOrders();
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = 'login.html';
});

// Load products
async function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    productsGrid.innerHTML = '<p style="color: var(--subtle);">Loading products...</p>';
    
    try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        
        if (querySnapshot.empty) {
            productsGrid.innerHTML = '<p style="color: var(--subtle);">No products available yet.</p>';
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
                        <p class="product-price">₹${product.price}</p>
                        <button class="btn-cart" onclick="addToCart('${doc.id}', '${product.name}', ${product.price})">
                            <span class="material-icons">add_shopping_cart</span>
                            Add to Cart
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

// Add to cart
window.addToCart = function(productId, productName, productPrice) {
    cart.push({ id: productId, name: productName, price: productPrice });
    updateCartCount();
    showAlert('Product added to cart!', 'success');
}

// Update cart count
function updateCartCount() {
    document.getElementById('cartCount').textContent = cart.length;
}

// View cart
document.getElementById('viewCartBtn').addEventListener('click', () => {
    const modal = document.getElementById('cartModal');
    const cartItems = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="color: var(--subtle);">Your cart is empty</p>';
        document.getElementById('cartTotal').textContent = '0';
    } else {
        let total = 0;
        cartItems.innerHTML = '';
        
        cart.forEach((item, index) => {
            total += item.price;
            cartItems.innerHTML += `
                <div class="cart-item">
                    <div>
                        <h3>${item.name}</h3>
                        <p style="color: var(--pine); font-weight: 600;">₹${item.price}</p>
                    </div>
                    <button class="btn-danger" onclick="removeFromCart(${index})">Remove</button>
                </div>
            `;
        });
        
        document.getElementById('cartTotal').textContent = total;
    }
    
    modal.style.display = 'flex';
});

// Remove from cart
window.removeFromCart = function(index) {
    cart.splice(index, 1);
    updateCartCount();
    document.getElementById('viewCartBtn').click();
}

// Close cart modal
window.closeCartModal = function() {
    document.getElementById('cartModal').style.display = 'none';
}

// Place order
document.getElementById('placeOrderBtn').addEventListener('click', async () => {
    if (cart.length === 0) {
        showAlert('Your cart is empty!', 'error');
        return;
    }

    try {
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        
        await addDoc(collection(db, 'orders'), {
            userId: currentUser.uid,
            items: cart,
            total: total,
            status: 'Pending',
            orderDate: new Date().toISOString()
        });

        showAlert('Order placed successfully!', 'success');
        cart = [];
        updateCartCount();
        closeCartModal();
        loadOrders();
    } catch (error) {
        showAlert('Error placing order', 'error');
    }
});

// View orders
document.getElementById('viewOrdersBtn').addEventListener('click', () => {
    document.getElementById('ordersModal').style.display = 'flex';
});

// Close orders modal
window.closeOrdersModal = function() {
    document.getElementById('ordersModal').style.display = 'none';
}

// Load orders
async function loadOrders() {
    const ordersList = document.getElementById('ordersList');
    
    try {
        const q = query(collection(db, 'orders'), where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            ordersList.innerHTML = '<p style="color: var(--subtle);">No orders yet</p>';
            return;
        }

        ordersList.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const order = doc.data();
            const orderDate = new Date(order.orderDate).toLocaleDateString();
            
            ordersList.innerHTML += `
                <div class="cart-item" style="flex-direction: column; align-items: flex-start;">
                    <div style="width: 100%; display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <strong>Order Date: ${orderDate}</strong>
                        <span style="background: var(--pine); color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.875rem;">
                            ${order.status}
                        </span>
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
