/* ==========================================================================
   1. Dynamic Configuration & Supabase Initialization
   ========================================================================== */
const CONFIG = {
    storeName: "NEXUS GAMING",
    whatsappNumber: "96872420073",
    currency: "ر.ع",
    supabaseUrl: "https://gtynotqcwgdeynzmgbly.supabase.co",
    supabaseKey: "sb_publishable_2c6dYLHIeaR6ohv7Tl5bQQ_QkDAOwsq"
};

const supabase = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

const CATEGORIES = [
    { id: "desks", name: "Gaming Desks", icon: "fa-desktop" },
    { id: "chairs", name: "Gaming Chairs", icon: "fa-chair" },
    { id: "accessories", name: "Accessories", icon: "fa-keyboard" },
    { id: "setups", name: "Gaming Setup", icon: "fa-gamepad" },
    { id: "new", name: "New Arrivals", icon: "fa-sparkles" }
];

const FALLBACK_PRODUCTS = [
    {
        id: 1,
        name: "طاولة قيمنق احترافية Apex Pro 140cm",
        category: "desks",
        category_name: "Gaming Desks",
        price: 49.900,
        image: "https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=800&q=80",
        description: "طاولة قيمنق سطح كربون فايبر مقاوم للخدش مع إضاءة RGB مدمجة.",
        specs: "الطول: 140 سم | العرض: 60 سم"
    },
    {
        id: 2,
        name: "كرسي قيمنق فاخر Titan Ergonomic",
        category: "chairs",
        category_name: "Gaming Chairs",
        price: 65.000,
        image: "https://images.unsplash.com/photo-1598550473471-e5d8a0d01402?auto=format&fit=crop&w=800&q=80",
        description: "مصمم من الجلد الفاخر ودعم كامل لأسفل الظهر والرقبة.",
        specs: "إمالة حتى 180 درجة"
    }
];

let PRODUCTS = [];
let cart = JSON.parse(localStorage.getItem('nexus_cart')) || [];

/* ==========================================================================
   2. Data Fetching
   ========================================================================== */
async function fetchProductsFromDatabase() {
    try {
        const { data, error } = await supabase.from('products').select('*');
        if (error || !data || data.length === 0) {
            PRODUCTS = FALLBACK_PRODUCTS;
        } else {
            PRODUCTS = data;
        }
    } catch (e) {
        PRODUCTS = FALLBACK_PRODUCTS;
    }
    renderProducts(PRODUCTS);
}

/* ==========================================================================
   3. Render UI
   ========================================================================== */
function renderCategories() {
    const container = document.getElementById('categories-container');
    if (!container) return;
    
    container.innerHTML = CATEGORIES.map(cat => `
        <div class="category-card" data-cat="${cat.id}">
            <div class="category-icon"><i class="fa-solid ${cat.icon}"></i></div>
            <div class="category-title">${cat.name}</div>
        </div>
    `).join('');

    container.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            filterByCategory(card.getAttribute('data-cat'));
        });
    });
}

function renderProducts(items) {
    const container = document.getElementById('products-container');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">لا توجد منتجات متوفرة حالياً.</p>`;
        return;
    }

    container.innerHTML = items.map(product => `
        <div class="product-card">
            <div class="product-thumb">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                <div class="product-actions">
                    <button class="btn-circle quick-view-btn" data-id="${product.id}">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </div>
            </div>
            <div class="product-details">
                <span class="product-category">${product.category_name || product.category}</span>
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">${Number(product.price).toFixed(3)} ${CONFIG.currency}</div>
                <button class="btn-add add-to-cart-btn" data-id="${product.id}">إضافة إلى السلة</button>
            </div>
        </div>
    `).join('');

    container.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', () => addToCart(parseInt(btn.getAttribute('data-id'))));
    });

    container.querySelectorAll('.quick-view-btn').forEach(btn => {
        btn.addEventListener('click', () => openProductModal(parseInt(btn.getAttribute('data-id'))));
    });
}

/* ==========================================================================
   4. Search & Filter
   ========================================================================== */
function handleSearch() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const filtered = PRODUCTS.filter(p => 
        p.name.toLowerCase().includes(query) || 
        (p.description && p.description.toLowerCase().includes(query))
    );
    renderProducts(filtered);
}

function filterByCategory(catId) {
    if (catId === 'new') {
        renderProducts(PRODUCTS);
        return;
    }
    renderProducts(PRODUCTS.filter(p => p.category === catId));
}

function handleSort() {
    const val = document.getElementById('sort-select').value;
    let sorted = [...PRODUCTS];
    if (val === 'low-high') sorted.sort((a,b) => a.price - b.price);
    else if (val === 'high-low') sorted.sort((a,b) => b.price - a.price);
    renderProducts(sorted);
}

/* ==========================================================================
   5. Cart Operations
   ========================================================================== */
function saveCart() {
    localStorage.setItem('nexus_cart', JSON.stringify(cart));
    updateCartUI();
}

function addToCart(productId) {
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ id: productId, qty: 1 });
    }
    saveCart();
    toggleCartDrawer(true);
}

function updateCartQty(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
        cart = cart.filter(i => i.id !== productId);
    }
    saveCart();
}

function removeFromCart(productId) {
    cart = cart.filter(i => i.id !== productId);
    saveCart();
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    const cartBadge = document.getElementById('cart-count');
    if (cartBadge) cartBadge.innerText = totalItems;

    const container = document.getElementById('cart-items-container');
    let subtotal = 0;

    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted); margin-top: 40px;">السلة فارغة حالياً</p>`;
    } else {
        container.innerHTML = cart.map(cartItem => {
            const product = PRODUCTS.find(p => p.id === cartItem.id);
            if (!product) return '';
            const itemTotal = product.price * cartItem.qty;
            subtotal += itemTotal;

            return `
                <div class="cart-item">
                    <img src="${product.image}" alt="${product.name}">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${product.name}</div>
                        <div class="cart-item-price">${Number(product.price).toFixed(3)} ${CONFIG.currency}</div>
                        <div class="qty-controls">
                            <button class="qty-btn" data-id="${product.id}" data-action="minus">-</button>
                            <span>${cartItem.qty}</span>
                            <button class="qty-btn" data-id="${product.id}" data-action="plus">+</button>
                        </div>
                    </div>
                    <button class="cart-item-remove" data-id="${product.id}"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `;
        }).join('');

        container.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                const action = btn.getAttribute('data-action');
                updateCartQty(id, action === 'plus' ? 1 : -1);
            });
        });

        container.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', () => removeFromCart(parseInt(btn.getAttribute('data-id'))));
        });
    }

    document.getElementById('cart-subtotal').innerText = `${subtotal.toFixed(3)} ${CONFIG.currency}`;
    document.getElementById('checkout-total').innerText = `${subtotal.toFixed(3)} ${CONFIG.currency}`;
}

function toggleCartDrawer(forceOpen = false) {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('drawer-overlay');
    if (forceOpen || !drawer.classList.contains('open')) {
        drawer.classList.add('open');
        overlay.classList.add('open');
    } else {
        drawer.classList.remove('open');
        overlay.classList.remove('open');
    }
}

/* ==========================================================================
   6. Modals & Handlers
   ========================================================================== */
function openProductModal(id) {
    const p = PRODUCTS.find(prod => prod.id === id);
    if (!p) return;

    const content = document.getElementById('modal-content');
    content.innerHTML = `
        <div class="modal-gallery" style="margin-bottom: 15px;">
            <img src="${p.image}" alt="${p.name}" style="width:100%; height:200px; object-fit:cover; border-radius:8px;">
        </div>
        <div>
            <span style="color: var(--accent-primary); font-size: 0.85rem; font-weight: 700;">${p.category_name || p.category}</span>
            <h2 style="font-size: 1.5rem; margin: 8px 0;">${p.name}</h2>
            <div style="font-size: 1.3rem; font-weight: 800; color: #FFF; margin-bottom: 15px;">${Number(p.price).toFixed(3)} ${CONFIG.currency}</div>
            <p style="color: var(--text-muted); margin-bottom: 15px; font-size: 0.95rem;">${p.description || ''}</p>
            <button class="btn btn-primary" id="modal-add-btn" style="width: 100%;">إضافة إلى السلة</button>
        </div>
    `;

    document.getElementById('modal-add-btn').addEventListener('click', () => {
        addToCart(p.id);
        closeModal('product-modal');
    });

    document.getElementById('product-modal').classList.add('open');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('open');
}

function openCheckout() {
    if (cart.length === 0) {
        alert("السلة فارغة. يرجى إضافة منتجات أولاً.");
        return;
    }
    toggleCartDrawer(false);
    document.getElementById('checkout-modal').classList.add('open');
}

function processWhatsAppOrder(e) {
    e.preventDefault();

    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    const location = document.getElementById('cust-location').value;
    const notes = document.getElementById('cust-notes').value || "لا يوجد";

    let subtotal = 0;
    let orderItemsText = "";

    cart.forEach((cartItem, index) => {
        const product = PRODUCTS.find(p => p.id === cartItem.id);
        if (product) {
            const itemTotal = product.price * cartItem.qty;
            subtotal += itemTotal;
            orderItemsText += `${index + 1}. ${product.name}\nالكمية: ${cartItem.qty}\nالسعر: ${itemTotal.toFixed(3)} ${CONFIG.currency}\n\n`;
        }
    });

    const rawMessage = `مرحباً، أرغب في طلب المنتجات التالية:\n\n` +
        `━━━━━━━━━━━━\nالطلب\n━━━━━━━━━━━━\n\n` +
        `${orderItemsText}` +
        `━━━━━━━━━━━━\nالإجمالي: ${subtotal.toFixed(3)} ${CONFIG.currency}\n━━━━━━━━━━━━\n\n` +
        `الاسم: ${name}\nرقم الهاتف: ${phone}\nموقع التوصيل: ${location}\nملاحظات: ${notes}\n\n` +
        `أرغب في تأكيد الطلب. شكراً.`;

    const encodedMessage = encodeURIComponent(rawMessage);
    const whatsappUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodedMessage}`;

    cart = [];
    saveCart();
    closeModal('checkout-modal');

    window.open(whatsappUrl, '_blank');
}

/* ==========================================================================
   7. Startup & Event Listeners
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const waUrl = `https://wa.me/${CONFIG.whatsappNumber}`;
    document.getElementById('floating-wa').href = waUrl;
    document.getElementById('footer-wa-link').href = waUrl;

    document.getElementById('cart-toggle-btn').addEventListener('click', () => toggleCartDrawer());
    document.getElementById('close-cart-btn').addEventListener('click', () => toggleCartDrawer(false));
    document.getElementById('drawer-overlay').addEventListener('click', () => toggleCartDrawer(false));
    
    document.getElementById('checkout-start-btn').addEventListener('click', openCheckout);
    document.getElementById('footer-checkout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        openCheckout();
    });

    document.getElementById('close-product-modal').addEventListener('click', () => closeModal('product-modal'));
    document.getElementById('close-checkout-modal').addEventListener('click', () => closeModal('checkout-modal'));

    document.getElementById('search-input').addEventListener('input', handleSearch);
    document.getElementById('sort-select').addEventListener('change', handleSort);
    document.getElementById('checkout-form').addEventListener('submit', processWhatsAppOrder);

    // Add Product Modal Events
    document.getElementById('admin-add-btn').addEventListener('click', () => {
        document.getElementById('add-product-modal').classList.add('open');
    });

    document.getElementById('close-add-modal').addEventListener('click', () => {
        closeModal('add-product-modal');
    });

    document.getElementById('add-product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = "جاري الإضافة...";
        submitBtn.disabled = true;

        try {
            const categorySelect = document.getElementById('prod-category');
            
            const newProduct = {
                name: document.getElementById('prod-name').value.trim(),
                category: categorySelect.value,
                category_name: categorySelect.options[categorySelect.selectedIndex].text,
                price: parseFloat(document.getElementById('prod-price').value),
                image: document.getElementById('prod-image').value.trim(),
                description: document.getElementById('prod-desc').value.trim() || '',
                specs: document.getElementById('prod-specs').value.trim() || ''
            };

            const { data, error } = await supabase
                .from('products')
                .insert([newProduct])
                .select();

            if (error) {
                console.error('Supabase Error:', error);
                alert('حدث خطأ أثناء الإضافة: ' + error.message);
            } else {
                alert('تمت إضافة المنتج بنجاح!');
                document.getElementById('add-product-form').reset();
                closeModal('add-product-modal');
                await fetchProductsFromDatabase();
            }
        } catch (err) {
            console.error('Unexpected Exception:', err);
            alert('حدث خطأ غير متوقع: ' + err.message);
        } finally {
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        }
    });

    // Run Initial Operations
    renderCategories();
    fetchProductsFromDatabase();
    updateCartUI();
});
