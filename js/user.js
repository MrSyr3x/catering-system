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
        console.log('❌ No user authenticated, redirecting to login');
        window.location.href = 'login.html';
    } else {
        currentUser = user;
        console.log('✅ User authenticated successfully:', user.email);
        
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                console.log('👤 User data loaded:', { name: userData.fullName, email: userData.email });
                
                // Display greeting with profile link
                const userGreeting = document.getElementById('userGreeting');
                userGreeting.innerHTML = `
                    Hello, <strong>${userData.fullName}</strong> 👋
                    <a href="profile.html" style="margin-left: 1rem; color: var(--peach); text-decoration: none; font-weight: 600; font-size: 0.95rem;">✏️ Edit Profile</a>
                `;
            }
            
            loadProducts();
            loadOrders();
        } catch (error) {
            console.error('❌ Error loading user data:', error);
        }
    }
});


// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    console.log('🚪 User initiating logout:', currentUser.email);
    try {
        await signOut(auth);
        console.log('✅ Logout successful, redirecting to login');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('❌ Error during logout:', error);
    }
});


// Load products
async function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    productsGrid.innerHTML = '<p style="color: var(--text-secondary);">📦 Loading products...</p>';
    
    try {
        console.log('🔄 Loading products from database...');
        const querySnapshot = await getDocs(collection(db, 'products'));
        
        if (querySnapshot.empty) {
            console.log('⚠️ No products available in database');
            productsGrid.innerHTML = '<p style="color: var(--text-secondary);">No products available yet. Check back soon! 🍛</p>';
            return;
        }

        console.log(`✅ ${querySnapshot.size} products loaded successfully`);
        productsGrid.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const product = doc.data();
            console.log('📋 Product loaded:', { id: doc.id, name: product.name, price: product.price });
            
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
        console.error('❌ Error loading products:', error);
        productsGrid.innerHTML = '<p style="color: var(--love);">❌ Error loading products. Please refresh the page.</p>';
    }
}


// Add to cart
window.addToCart = function(productId, productName, productPrice) {
    console.log('🛒 Adding item to cart:', { 
        productId, 
        productName, 
        productPrice,
        cartSizeBefore: cart.length 
    });
    
    cart.push({ id: productId, name: productName, price: productPrice });
    console.log('✅ Item added. New cart size:', cart.length);
    
    updateCartCount();
    showAlert('Product added to cart! 🎉', 'success');
}


// Update cart count
function updateCartCount() {
    const count = cart.length;
    document.getElementById('cartCount').textContent = count;
    console.log('📊 Cart count updated to:', count);
}


// View cart
document.getElementById('viewCartBtn').addEventListener('click', () => {
    console.log('👁️ Opening cart modal, items in cart:', cart.length);
    
    const modal = document.getElementById('cartModal');
    const cartItems = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        console.log('⚠️ Cart is empty');
        cartItems.innerHTML = '<p style="color: var(--text-secondary);">🛒 Your cart is empty. Start adding items! 🍛</p>';
        document.getElementById('cartTotal').textContent = '0';
    } else {
        let total = 0;
        cartItems.innerHTML = '';
        
        cart.forEach((item, index) => {
            total += item.price;
            console.log(`📦 Cart item ${index + 1}:`, { name: item.name, price: item.price });
            
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
        
        console.log('💰 Cart total:', total);
        document.getElementById('cartTotal').textContent = total;
    }
    
    modal.style.display = 'flex';
});


// Remove from cart
window.removeFromCart = function(index) {
    const removedItem = cart[index];
    console.log('🗑️ Removing item from cart:', { index, item: removedItem.name, price: removedItem.price });
    
    cart.splice(index, 1);
    console.log('✅ Item removed. New cart size:', cart.length);
    
    updateCartCount();
    document.getElementById('viewCartBtn').click();
}


// Close cart modal
window.closeCartModal = function() {
    console.log('❌ Closing cart modal');
    document.getElementById('cartModal').style.display = 'none';
}


// Place order
document.getElementById('placeOrderBtn').addEventListener('click', async () => {
    console.log('📝 Attempting to place order, items:', cart.length);
    
    if (cart.length === 0) {
        console.log('⚠️ Cannot place order - cart is empty');
        showAlert('Your cart is empty! 🛒', 'error');
        return;
    }

    try {
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        
        console.log('💳 Processing order:', {
            userId: currentUser.uid,
            itemCount: cart.length,
            total: total,
            items: cart.map(item => item.name)
        });
        
        const orderRef = await addDoc(collection(db, 'orders'), {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            items: cart,
            total: total,
            status: 'Pending',
            orderDate: new Date().toISOString()
        });
        
        console.log('✅ Order placed successfully!', { orderId: orderRef.id, total: total });
        showAlert('Order placed successfully! 🎉 Order ID: ' + orderRef.id.substring(0, 8), 'success');
        
        cart = [];
        updateCartCount();
        closeCartModal();
        loadOrders();
    } catch (error) {
        console.error('❌ Error placing order:', error);
        showAlert('Error placing order. Please try again.', 'error');
    }
});


// View orders
document.getElementById('viewOrdersBtn').addEventListener('click', () => {
    console.log('👁️ Opening orders modal');
    document.getElementById('ordersModal').style.display = 'flex';
});


// Close orders modal
window.closeOrdersModal = function() {
    console.log('❌ Closing orders modal');
    document.getElementById('ordersModal').style.display = 'none';
}


// Load orders
async function loadOrders() {
    const ordersList = document.getElementById('ordersList');
    
    try {
        console.log('🔄 Loading user orders for:', currentUser.uid);
        const q = query(collection(db, 'orders'), where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            console.log('⚠️ No orders found for this user');
            ordersList.innerHTML = '<p style="color: var(--text-secondary);">📭 No orders yet. Start placing orders! 🍛</p>';
            return;
        }

        console.log(`✅ ${querySnapshot.size} orders loaded successfully`);
        ordersList.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const order = doc.data();
            const orderDate = new Date(order.orderDate).toLocaleDateString();
            
            console.log('📋 Order loaded:', {
                orderId: doc.id,
                date: orderDate,
                status: order.status,
                total: order.total,
                itemCount: order.items.length
            });
            
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
        console.error('❌ Error loading orders:', error);
        ordersList.innerHTML = '<p style="color: var(--love);">❌ Error loading orders</p>';
    }
}


// Show alert
function showAlert(message, type) {
    console.log(`📢 Alert displayed [${type.toUpperCase()}]:`, message);
    
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


// Log initial load
console.log('✅ User.js module loaded successfully');
