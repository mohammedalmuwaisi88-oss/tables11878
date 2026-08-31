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

let PRODUCTS = [];
let cart = JSON.parse(localStorage.getItem('nexus_cart')) || [];

/* ==========================================================================
   2. Fetch Data from Supabase
   ========================================================================== */
async function fetchProductsFromDatabase() {
    try {
        const { data, error } = await supabase.from('products').select('*').order('id', { ascending: false });
        if (error) throw error;
        PRODUCTS = data || [];
    } catch (e) {
        console.error('Error fetching data:', e);
    }
    renderProducts(PRODUCTS);
}

/* ==========================================================================
   3. Render UI Products
   ========================================================================== */
function renderProducts(items) {
    const container = document.getElementById('products-container');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">لا توجد منتجات حالياً. اضغط "إضافة منتج جديد" بالحرية.</p>`;
        return;
    }

    container.innerHTML = items.map(product => `
        <div class="product-card">
            <img class="product-thumb" src="${product.image}" alt="${product.name}" loading="lazy">
            <div class="product-details">
                <span class="product-category">${product.category_name || product.category}</span>
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">${Number(product.price).toFixed(3)} ${CONFIG.currency}</div>
                
                <div class="card-admin-actions">
                    <button class="btn-edit" onclick="openEditProductModal(${product.id})">
                        <i class="fa-solid fa-pen-to-square"></i> تعديل
                    </button>
                    <button class="btn-delete" onclick="deleteProduct(${product.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>

                <button class="btn-add" onclick="addToCart(${product.id})">إضافة إلى السلة</button>
            </div>
        </div>
    `).join('');
}

/* ==========================================================================
   4. Add / Edit / Delete Operations (Supabase CRUD)
   ========================================================================== */
function openAddProductModal() {
    document.getElementById('product-form').reset();
    document.getElementById('prod-id').value = '';
    document.getElementById('modal-form-title').innerText = 'إضافة منتج جديد';
    document.getElementById('product-form-modal').classList.add('open');
}

function openEditProductModal(id) {
    const product = PRODUCTS.find(p => p.id === id);
    if (!product) return;

    document.getElementById('prod-id').value = product.id;
    document.getElementById('prod-name').value = product.name;
    document.getElementById('prod-category').value = product.category;
    document.getElementById('prod-price').value = product.price;
    document.getElementById('prod-image').value = product.image;
    document.getElementById('prod-desc').value = product.description || '';
    document.getElementById('prod-specs').value = product.specs || '';

    document.getElementById('modal-form-title').innerText = 'تعديل المنتج';
    document.getElementById('product-form-modal').classList.add('open');
}

async function handleProductFormSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('save-product-btn');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "جاري الحفظ...";
    submitBtn.disabled = true;

    const id = document.getElementById('prod-id').value;
    const categorySelect = document.getElementById('prod-category');
    
    const payload = {
        name: document.getElementById('prod-name').value.trim(),
        category: categorySelect.value,
        category_name: categorySelect.options[categorySelect.selectedIndex].text,
        price: parseFloat(document.getElementById('prod-price').value),
        image: document.getElementById('prod-image').value.trim(),
        description: document.getElementById('prod-desc').value.trim(),
        specs: document.getElementById('prod-specs').value.trim()
    };

    try {
        let response;
        if (id) {
            // Update Existing Product
            response = await supabase.from('products').update(payload).eq('id', id);
        } else {
            // Insert New Product
            response = await supabase.from('products').insert([payload]);
        }

        if (response.error) {
            alert('خطأ في قاعدة البيانات: ' + response.error.message);
        } else {
            alert(id ? 'تم تعديل المنتج بنجاح!' : 'تمت إضافة المنتج بنجاح!');
            closeModal('product-form-modal');
            await fetchProductsFromDatabase();
        }
    } catch (err) {
        alert('حدث خطأ غير متوقع: ' + err.message);
    } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
}

async function deleteProduct(id) {
    if (!confirm("هل أنت تأكد من إزالة هذا المنتج نهائياً من قاعدة البيانات؟")) return;

    try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
            alert('حدث خطأ أثناء الحذف: ' + error.message);
        } else {
            alert('تم حذف المنتج بنجاح.');
            await fetchProductsFromDatabase();
        }
    } catch (err) {
        alert('حدث خطأ غير متوقع: ' + err.message);
    }
}

/* ==========================================================================
   5. Cart & Order Flow
   ========================================================================== */
function saveCart() {
    localStorage.setItem('nexus_cart', JSON.stringify(cart));
    updateCartUI();
}

function addToCart(productId) {
    const existing = cart.find(item => item.id === productId);
    if (existing) existing.qty += 1;
    else cart.push({ id: productId, qty: 1 });
    saveCart();
    toggleCartDrawer(true);
}

function updateCartQty(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(i => i.id !== productId);
    saveCart();
}

function updateCartUI() {
    const cartBadge = document.getElementById('cart-count');
    if (cartBadge) cartBadge.innerText = cart.reduce((sum, item) => sum + item.qty, 0);

    const container = document.getElementById('cart-items-container');
    let subtotal = 0;

    if (cart.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted); margin-top: 40px;">السلة فارغة حالياً</p>`;
    } else {
        container.innerHTML = cart.map(cartItem => {
            const product = PRODUCTS.find(p => p.id === cartItem.id);
            if (!product) return '';
            const itemTotal = product.price * cartItem.qty;
            subtotal += itemTotal;

            return `
                <div style="display:flex; gap:10px; margin-bottom:15px; align-items:center;">
                    <img src="${product.image}" style="width:50px; height:50px; object-fit:cover; border-radius:6px;">
                    <div style="flex:1;">
                        <div style="font-weight:bold; font-size:0.9rem;">${product.name}</div>
                        <div style="color:var(--accent-primary); font-size:0.85rem;">${Number(product.price).toFixed(3)} ${CONFIG.currency}</div>
                        <div style="display:flex; gap:5px; align-items:center; margin-top:4px;">
                            <button onclick="updateCartQty(${product.id}, -1)">-</button>
                            <span>${cartItem.qty}</span>
                            <button onclick="updateCartQty(${product.id}, 1)">+</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
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

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('open');
}

function processWhatsAppOrder(e) {
    e.preventDefault();
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    const location = document.getElementById('cust-location').value;

    let subtotal = 0;
    let text = "مرحباً، أرغب في تأكيد الطلب التالية:\n\n";

    cart.forEach((item, idx) => {
        const p = PRODUCTS.find(prod => prod.id === item.id);
        if (p) {
            subtotal += p.price * item.qty;
            text += `${idx + 1}. ${p.name} (الكمية: ${item.qty})\n`;
        }
    });

    text += `\nالإجمالي: ${subtotal.toFixed(3)} ${CONFIG.currency}\nالاسم: ${name}\nالهاتف: ${phone}\nالعنوان: ${location}`;

    window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
    cart = [];
    saveCart();
    closeModal('checkout-modal');
}

/* ==========================================================================
   6. Startup & Events Integration
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('cart-toggle-btn').addEventListener('click', () => toggleCartDrawer());
    document.getElementById('close-cart-btn').addEventListener('click', () => toggleCartDrawer(false));
    document.getElementById('drawer-overlay').addEventListener('click', () => toggleCartDrawer(false));

    document.getElementById('admin-add-btn').addEventListener('click', openAddProductModal);
    document.getElementById('close-form-modal').addEventListener('click', () => closeModal('product-form-modal'));
    document.getElementById('product-form').addEventListener('submit', handleProductFormSubmit);

    document.getElementById('checkout-start-btn').addEventListener('click', () => {
        if (cart.length === 0) return alert('السلة فارغة');
        toggleCartDrawer(false);
        document.getElementById('checkout-modal').classList.add('open');
    });
    document.getElementById('close-checkout-modal').addEventListener('click', () => closeModal('checkout-modal'));
    document.getElementById('checkout-form').addEventListener('submit', processWhatsAppOrder);

    document.getElementById('search-input').addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        renderProducts(PRODUCTS.filter(p => p.name.toLowerCase().includes(q)));
    });

    fetchProductsFromDatabase();
    updateCartUI();
});
