const SUPABASE_URL = "https://gtynotqcwgdeynzmgbly.supabase.co";
const SUPABASE_KEY = "sb_publishable_2c6dYLHIeaR6ohv7Tl5bQQ_QkDAOwsq";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let productsList = [];

// عناصر النافذة
const modal = document.getElementById('modal-overlay');
const openBtn = document.getElementById('open-add-btn');
const closeBtn = document.getElementById('close-modal-btn');
const form = document.getElementById('product-form');

// 1. فتح وإغلاق النافذة
openBtn.onclick = () => {
    form.reset();
    document.getElementById('prod-id').value = '';
    document.getElementById('modal-title').innerText = 'إضافة منتج';
    modal.classList.remove('hidden');
};

closeBtn.onclick = () => modal.classList.add('hidden');

// 2. جلب المنتجات
async function loadProducts() {
    const { data, error } = await db.from('products').select('*').order('id', { ascending: false });
    if (error) return console.error(error);
    productsList = data || [];
    
    const container = document.getElementById('products-container');
    container.innerHTML = productsList.map(p => `
        <div class="card">
            <img src="${p.image}">
            <h3>${p.name}</h3>
            <p>${p.price} ر.ع</p>
            <div class="card-actions">
                <button class="btn-edit" onclick="editProduct(${p.id})">تعديل</button>
                <button class="btn-del" onclick="deleteProduct(${p.id})">حذف</button>
            </div>
        </div>
    `).join('');
}

// 3. الإضافة أو التعديل
form.onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    
    const payload = {
        name: document.getElementById('prod-name').value,
        price: parseFloat(document.getElementById('prod-price').value),
        category: document.getElementById('prod-category').value,
        image: document.getElementById('prod-image').value
    };

    if (id) {
        await db.from('products').update(payload).eq('id', id);
    } else {
        await db.from('products').insert([payload]);
    }

    modal.classList.add('hidden');
    loadProducts();
};

// 4. إعداد التعديل
window.editProduct = (id) => {
    const p = productsList.find(item => item.id === id);
    if (!p) return;
    document.getElementById('prod-id').value = p.id;
    document.getElementById('prod-name').value = p.name;
    document.getElementById('prod-price').value = p.price;
    document.getElementById('prod-category').value = p.category;
    document.getElementById('prod-image').value = p.image;
    
    document.getElementById('modal-title').innerText = 'تعديل المنتج';
    modal.classList.remove('hidden');
};

// 5. الحذف
window.deleteProduct = async (id) => {
    if (confirm('تأكيد الحذف؟')) {
        await db.from('products').delete().eq('id', id);
        loadProducts();
    }
};

loadProducts();
