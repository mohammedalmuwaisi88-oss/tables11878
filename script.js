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

// Initialize Supabase Client
const supabase = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

// Static Categories
const CATEGORIES = [
    { id: "desks", name: "Gaming Desks", icon: "fa-desktop" },
    { id: "chairs", name: "Gaming Chairs", icon: "fa-chair" },
    { id: "accessories", name: "Accessories", icon: "fa-keyboard" },
    { id: "setups", name: "Gaming Setup", icon: "fa-gamepad" },
    { id: "new", name: "New Arrivals", icon: "fa-sparkles" }
];

// Fallback Backup Products
const FALLBACK_PRODUCTS = [
    {
        id: 1,
        name: "طاولة قيمنق احترافية Apex Pro 140cm",
        category: "desks",
        category_name: "Gaming Desks",
        price: 49.900,
        image: "https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=800&q=80",
        description: "طاولة قيمنق سطح كربون فايبر مقاوم للخدش مع إضاءة RGB مدمجة، وحامل أكواب وسماعات.",
        specs: "الطول: 140 سم | العرض: 60 سم | الارتفاع: 75 سم"
    },
    {
        id: 2,
        name: "كرسي قيمنق فاخر Titan Ergonomic",
        category: "chairs",
        category_name: "Gaming Chairs",
        price: 65.000,
        image: "https://images.unsplash.com/photo-1598550473471-e5d8a0d01402?auto=format&fit=crop&w=800&q=80",
        description: "مصمم من الجلد الفاخر ودعم كامل لأسفل الظهر والرقبة، قابل للتعديل بالكامل لتوفير أقصى درجات الراحة.",
        specs: "إمالة حتى 180 درجة | وسائد طبية مدمجة"
    },
    {
        id: 3,
        name: "ذراع شاشة مزدوج Heavy-Duty Mount",
        category: "accessories",
        category_name: "Accessories",
        price: 18.500,
        image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
        description: "حامل شاشات يدعم شاشتين حتى 32 بوصة مع تنظيم مخفي للكابلات وتحكم كامل بالزوايا.",
        specs: "دعم VESA | حمولة 9 كجم لكل ذراع"
    }
];

let PRODUCTS = [];
let cart = JSON.parse(localStorage.getItem('nexus_cart')) || [];

/* ==========================================================================
   2. Data Fetching From Supabase Database
   ========================================================================== */
async function fetchProductsFromDatabase() {
    try {
        const { data, error } = await supabase.from('products').select('*');
        if (error || !data || data.length === 0) {
            console.warn('تنبيه: تعذر إحضار بيانات Supabase أو الجدول فارغ، تم التبديل تلقائياً للبيانات الاحتياطية.', error);
            PRODUCTS = FALLBACK_PRODUCTS;
        } else {
            PRODUCTS = data;
        }
    } catch (e) {
        console.error('خطأ غير متوقع في الاتصال بقاعدة البيانات:', e);
        PRODUCTS = FALLBACK_PRODUCTS;
    }
    renderProducts(PRODUCTS);
}

/* ==========================================================================
   3. Render UI Components
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
            const catId = card.getAttribute('data-cat');
            filterByCategory(catId);
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
                    <button class="btn-circle quick-view-btn" data-id="${product.id}" aria-label="عرض سريع">
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

    // Attach Event Listeners Safely
    container.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'));
            addToCart(id);
        });
    });

    container.querySelectorAll('.quick-view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'));
            openProductModal(id);
        });
    });
}

/* ==========================================================================
   4. Search & Filter Handlers
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
    const filtered = PRODUCTS.filter(p => p.category === catId);
    renderProducts(filtered);
}

function handleSort() {
    const val = document.getElementById('sort-select').value;
    let sorted = [...PRODUCTS];
    if (val === 'low-high') sorted.sort((a,b) => a.price - b.price);
    else if (val === 'high-low') sorted.sort((a,b) => b.price - a.price);
    renderProducts(sorted);
}

/* ==========================================================================
   5. Cart Operations & LocalStorage Persistence
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
                    <button class="cart-item-remove" data-id="${product.id}" aria-label="حذف">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `;
        }).join('');

        // Attach listeners dynamically for cart items
        container.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                const action = btn.getAttribute('data-action');
                updateCartQty(id, action === 'plus' ? 1 : -1);
            });
        });

        container.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                removeFromCart(id);
            });
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
   6. Modals Management
   ========================================================================== */
function openProductModal(id) {
    const p = PRODUCTS.find(prod => prod.id === id);
    if (!p) return;

    const content = document.getElementById('modal-content');
    content.innerHTML = `
        <div class="modal-gallery">
            <img src="${p.image}" alt="${p.name}">
        </div>
        <div>
            <span style="color: var(--accent-primary); font-size: 0.85rem; font-weight: 700;">${p.category_name || p.category}</span>
            <h2 style="font-size: 1.8rem; margin: 8px 0 16px;">${p.name}</h2>
            <div style="font-size: 1.5rem; font-weight: 800; color: #FFF; margin-bottom: 20px;">${Number(p.price).toFixed(3)} ${CONFIG.currency}</div>
            <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 0.95rem;">${p.description || ''}</p>
            <div style="background: var(--bg-card); padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); margin-bottom: 24px;">
                <span style="color: var(--text-muted); font-size: 0.85rem; display: block; margin-bottom: 4px;">المواصفات:</span>
                <strong style="font-size: 0.9rem;">${p.specs || 'جودة ممتازة وضمان مضمون'}</strong>
            </div>
            <button class="btn btn-primary" id="modal-add-btn" style="width: 100%;">
                <i class="fa-solid fa-cart-shopping"></i>
                <span>إضافة إلى السلة</span>
            </button>
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

/* ==========================================================================
   7. Checkout & WhatsApp Integration
   ========================================================================== */
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
        `━━━━━━━━━━━━\n` +
        `الطلب\n` +
        `━━━━━━━━━━━━\n\n` +
        `${orderItemsText}` +
        `━━━━━━━━━━━━\n` +
        `الإجمالي: ${subtotal.toFixed(3)} ${CONFIG.currency}\n` +
        `━━━━━━━━━━━━\n\n` +
        `الاسم: ${name}\n` +
        `رقم الهاتف: ${phone}\n` +
        `موقع التوصيل: ${location}\n` +
        `ملاحظات: ${notes}\n\n` +
        `أرغب في تأكيد الطلب. شكراً.`;

    const encodedMessage = encodeURIComponent(rawMessage);
    const whatsappUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodedMessage}`;

    cart = [];
    saveCart();
    closeModal('checkout-modal');

    window.open(whatsappUrl, '_blank');
}

/* ==========================================================================
   8. Global Event Listeners & Startup Initialization
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // Bind Static WhatsApp Links
    const waUrl = `https://wa.me/${CONFIG.whatsappNumber}`;
    document.getElementById('floating-wa').href = waUrl;
    document.getElementById('footer-wa-link').href = waUrl;

    // Direct Event Binding
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

    document.getElementById('mobile-cart-btn').addEventListener('click', (e) => {
        e.preventDefault();
        toggleCartDrawer();
    });

    document.getElementById('search-input').addEventListener('input', handleSearch);
    document.getElementById('sort-select').addEventListener('change', handleSort);
    document.getElementById('checkout-form').addEventListener('submit', processWhatsAppOrder);

    // Admin Add Product Modal Listeners
    document.getElementById('admin-add-btn').addEventListener('click', () => {
        document.getElementById('add-product-modal').classList.add('open');
    });

    document.getElementById('close-add-modal').addEventListener('click', () => {
        closeModal('add-product-modal');
    });

    document.getElementById('add-product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const categorySelect = document.getElementById('prod-category');
        const newProduct = {
            name: document.getElementById('prod-name').value,
            category: categorySelect.value,
            category_name: categorySelect.options[categorySelect.selectedIndex].text,
            price: parseFloat(document.getElementById('prod-price').value),
            image: document.getElementById('prod-image').value,
            description: document.getElementById('prod-desc').value,
            specs: document.getElementById('prod-specs').value
        };

        const { data, error } = await supabase.from('products').insert([newProduct]).select();

        if (error) {
            alert('حدث خطأ أثناء الإضافة: ' + error.message);
        } else {
            alert('تمت إضافة المنتج بنجاح!');
            document.getElementById('add-product-form').reset();
            closeModal('add-product-modal');
            fetchProductsFromDatabase();
        }
    });

    // Scroll Effects
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('navbar');
        if (window.scrollY > 50) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
    });

    // Run Core Functions
    renderCategories();
    fetchProductsFromDatabase();
    updateCartUI();
});
