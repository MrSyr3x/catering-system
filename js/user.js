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


onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'login.html';
    } else {
        currentUser = user;
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const userGreeting = document.getElementById('userGreeting');
                userGreeting.innerHTML = `
                    Hello, <strong>${userData.fullName}</strong> 👋
                    <a href="profile.html" style="margin-left: 1rem; color: var(--peach); text-decoration: none; font-weight: 600; font-size: 0.95rem;">✏️ Edit Profile</a>
                `;
            }
            loadProducts();
            loadOrders();
        } catch (error) {
        }
    }
});


document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
    }
});


async function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    productsGrid.innerHTML = '<p style="color: var(--text-secondary);">📦 Loading products...</p>';
    
    try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        
        if (querySnapshot.empty) {
            productsGrid.innerHTML = '<p style="color: var(--text-secondary);">No products available yet. Check back soon! 🍛</p>';
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
        productsGrid.innerHTML = '<p style="color: var(--love);">❌ Error loading products. Please refresh the page.</p>';
    }
}


window.addToCart = function(productId, productName, productPrice) {
    cart.push({ id: productId, name: productName, price: productPrice });
    updateCartCount();
    showAlert('Product added to cart! 🎉', 'success');
}


function updateCartCount() {
    const count = cart.length;
    document.getElementById('cartCount').textContent = count;
}


document.getElementById('viewCartBtn').addEventListener('click', () => {
    const modal = document.getElementById('cartModal');
    const cartItems = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="color: var(--text-secondary);">🛒 Your cart is empty. Start adding items! 🍛</p>';
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
                        <p style="color: var(--peach); font-weight: 600;">₹${item.price}</p>
                    </div>
                    <button class="btn-danger" onclick="removeFromCart(${index})">Remove</button>
                </div>
            `;
        });
        document.getElementById('cartTotal').textContent = total;
    }
    modal.style.display = 'flex';
});


window.removeFromCart = function(index) {
    cart.splice(index, 1);
    updateCartCount();
    document.getElementById('viewCartBtn').click();
}


window.closeCartModal = function() {
    document.getElementById('cartModal').style.display = 'none';
}


document.getElementById('placeOrderBtn').addEventListener('click', async () => {
    if (cart.length === 0) {
        showAlert('Your cart is empty! 🛒', 'error');
        return;
    }

    try {
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        const orderRef = await addDoc(collection(db, 'orders'), {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            items: cart,
            total: total,
            status: 'Pending',
            orderDate: new Date().toISOString()
        });
        showAlert('Order placed successfully! 🎉 Order ID: ' + orderRef.id.substring(0, 8), 'success');
        cart = [];
        updateCartCount();
        closeCartModal();
        loadOrders();
    } catch (error) {
        showAlert('Error placing order. Please try again.', 'error');
    }
});


document.getElementById('viewOrdersBtn').addEventListener('click', () => {
    document.getElementById('ordersModal').style.display = 'flex';
});


window.closeOrdersModal = function() {
    document.getElementById('ordersModal').style.display = 'none';
}


async function loadOrders() {
    const ordersList = document.getElementById('ordersList');
    
    try {
        const q = query(collection(db, 'orders'), where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            ordersList.innerHTML = '<p style="color: var(--text-secondary);">📭 No orders yet. Start placing orders! 🍛</p>';
            return;
        }

        ordersList.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const order = doc.data();
            const orderDate = new Date(order.orderDate).toLocaleDateString();
            ordersList.innerHTML += `
                <div class="cart-item" style="flex-direction: column; align-items: flex-start;">
                    <div style="width: 100%; display: flex; justify-content: space-between; margin-bottom: 0.5rem; align-items: center;">
                        <strong>📅 ${orderDate}</strong>
                        <span style="background: var(--peach); color: white; padding: 0.35rem 1rem; border-radius: 12px; font-size: 0.875rem; font-weight: 600;">
                            ${order.status}
                        </span>
                    </div>
                    <p style="color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.95rem;">
                        📦 Items: ${order.items.map(item => item.name).join(', ')}
                    </p>
                    <p style="color: var(--peach); font-weight: 700; font-size: 1.25rem;">💰 Total: ₹${order.total}</p>
                </div>
            `;
        });
    } catch (error) {
        ordersList.innerHTML = '<p style="color: var(--love);">❌ Error loading orders</p>';
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
