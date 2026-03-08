// Initialize Lucide Icons
lucide.createIcons();

// State
let currentCategory = 'all';
let searchQuery = '';
let currentSort = 'default';
let basket = [];
let currentModalProduct = null;

// DOM Elements
const productGrid = document.getElementById('productGrid');
const categoryContainer = document.getElementById('categoryContainer');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const resultCount = document.getElementById('resultCount');
const allCount = document.getElementById('allCount');
const emptyState = document.getElementById('emptyState');
const marqueeContent = document.querySelector('.marquee-content');

// Initialize App
function init() {
    renderMarquee();
    renderCategories();
    renderProducts();
    setupEventListeners();
    setupIntersectionObserver();
}

// Extract unique brands for marquee
function renderMarquee() {
    const brands = [...new Set(productsData.products.map(p => p.brand))].filter(Boolean);
    const marqueeBrands = [...brands, ...brands, ...brands, ...brands];

    let html = '';
    marqueeBrands.forEach(brand => {
        html += `
            <span class="marquee-item">${brand}</span>
            <span class="marquee-dot">•</span>
        `;
    });

    marqueeContent.innerHTML = html;
}

// Render Categories
function renderCategories() {
    allCount.textContent = productsData.products.length;

    productsData.categories.forEach(cat => {
        const count = productsData.products.filter(p => p.category === cat.id).length;

        if (count === 0) return;

        const btn = document.createElement('button');
        btn.className = 'category-pill';
        btn.dataset.id = cat.id;
        btn.innerHTML = `
            <span class="icon">${cat.icon}</span>
            <span>${cat.name}</span>
            <span class="count">${count}</span>
        `;

        categoryContainer.appendChild(btn);
    });
}

// Filter and Sort Logic
function getFilteredProducts() {
    let filtered = productsData.products;

    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category === currentCategory);
    }

    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(query) ||
            (p.brand && p.brand.toLowerCase().includes(query))
        );
    }

    return filtered.sort((a, b) => {
        switch(currentSort) {
            case 'price-asc': return a.price - b.price;
            case 'price-desc': return b.price - a.price;
            case 'name-asc': return a.name.localeCompare(b.name);
            default: return 0;
        }
    });
}

// Render Products
function renderProducts() {
    const products = getFilteredProducts();

    resultCount.textContent = `Showing ${products.length} product${products.length !== 1 ? 's' : ''}`;

    productGrid.innerHTML = '';

    if (products.length === 0) {
        productGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    productGrid.style.display = 'grid';
    emptyState.style.display = 'none';

    products.forEach((product, index) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.animationDelay = `${index * 0.05}s`;

        // Badge Logic
        let badgeHtml = '';
        if (product.badge) {
            const badgeClass = product.badge.toLowerCase();
            badgeHtml = `<div class="badge ${badgeClass}">${product.badge}</div>`;
        }

        // Image Logic
        let imageHtml;
        if (product.image) {
            imageHtml = `<img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">`;
        } else {
            const initial = product.brand ? product.brand.charAt(0) : product.name.charAt(0);
            imageHtml = `
                <div class="image-placeholder">
                    <span class="placeholder-initial">${initial}</span>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="card-image-wrapper">
                ${badgeHtml}
                ${imageHtml}
            </div>
            <div class="card-content">
                ${product.brand ? `<div class="product-brand">${product.brand}</div>` : ''}
                <h3 class="product-name" title="${product.name}">${product.name}</h3>
                <div class="product-footer">
                    <div class="product-price">£${product.price}</div>
                    <button class="order-btn add-to-basket-btn" data-product-id="${product.id}" title="Add to Basket" onclick="event.stopPropagation(); addToBasket('${product.id}')">
                        <i data-lucide="plus" style="width: 20px; height: 20px;"></i>
                    </button>
                </div>
            </div>
        `;

        productGrid.appendChild(card);
    });

    lucide.createIcons();
    setupIntersectionObserver();
}

// Event Listeners
function setupEventListeners() {
    // Category Clicks
    categoryContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.category-pill');
        if (!pill) return;

        document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        currentCategory = pill.dataset.id;
        renderProducts();
    });

    // Search Input
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderProducts();
    });

    // Product Card Clicks (Open Modal)
    productGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.product-card');
        const addBtn = e.target.closest('.add-to-basket-btn');

        if (addBtn) return;

        if (card) {
            const productName = card.querySelector('.product-name').textContent;
            const product = productsData.products.find(p => p.name === productName);

            if (product) {
                openModal(product);
            }
        }
    });

    // Sort Select
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderProducts();
    });
}

// Reset Filters
window.resetFilters = function() {
    searchInput.value = '';
    searchQuery = '';

    sortSelect.value = 'default';
    currentSort = 'default';

    const allPill = document.querySelector('.category-pill[data-id="all"]');
    document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
    allPill.classList.add('active');
    currentCategory = 'all';

    renderProducts();
};

// Intersection Observer for Scroll Animations
function setupIntersectionObserver() {
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, options);

    document.querySelectorAll('.product-card').forEach(card => {
        observer.observe(card);
    });
}

// Run init when DOM is loaded
document.addEventListener('DOMContentLoaded', init);


// ============================================================
// MODAL
// ============================================================

const modalOverlay = document.getElementById('productModal');
const modalClose = document.getElementById('modalClose');
const modalImageContainer = document.getElementById('modalImageContainer');
const modalBrand = document.getElementById('modalBrand');
const modalTitle = document.getElementById('modalTitle');
const modalCategory = document.getElementById('modalCategory');
const modalType = document.getElementById('modalType');
const modalPrice = document.getElementById('modalPrice');
const modalDescription = document.getElementById('modalDescription');
const modalBenefits = document.getElementById('modalBenefits');
const modalOrderBtn = document.getElementById('modalOrderBtn');

function getProductDescriptionKey(product) {
    const name = product.name.toLowerCase();
    const category = product.category;

    if (name.includes('retatrutide')) return 'retatrutide';
    if (name.includes('tirzepatide')) return 'tirzepatide';
    if (name.includes('bpc') && name.includes('tb')) return 'bpc_tb_combo';
    if (name.includes('bpc') && !name.includes('tb')) return 'bpc157';
    if (name.includes('tb500') || name.includes('tb 500')) return 'tb500';
    if ((name.includes('ghk-cu') || name.includes('ghk')) && !name.includes('glow')) return 'ghk_cu';
    if (name.includes('glow')) return 'glow';
    if (name.includes('nad+')) return 'nad_plus';
    if (name.includes('klow')) return 'klow';
    if (name.includes('glutathione')) return 'glutathione';
    if (name.includes('tesamorelin')) return 'tesamorelin';
    if (name.includes('mots-c')) return 'mots_c';
    if (name.includes('bac water')) return 'bac_water';
    if (name.includes('semaglutide')) return 'semaglutide';

    if (name.includes('test prop')) return 'test_propionate';
    if (name.includes('test cyp')) return 'test_cypionate';
    if (name.includes('test enth') || name.includes('test enanthate')) return 'test_enanthate';
    if (name.includes('test 400')) return 'test_400';
    if (name.includes('test - deca') || name.includes('test-deca')) return 'test_deca_blend';
    if (name.includes('suspension') || name.includes('base')) return 'test_suspension';
    if (name.includes('sustanon')) return 'sustanon';
    if (name.includes('deca 300') || (name.includes('deca') && category === 'injectables')) return 'deca';
    if (name.includes('npp')) return 'npp';
    if (name.includes('mast')) return 'masteron';
    if (name.includes('tren ace')) return 'tren_ace';
    if (name.includes('tren enanthate') || name.includes('tren enth')) return 'tren_enanthate';
    if (name.includes('multi tren')) return 'multi_tren';
    if (name.includes('parabolan')) return 'parabolan';
    if (name.includes('trt')) return 'trt';
    if (name.includes('ment') && category === 'injectables') return 'ment';

    if (name.includes('l-carnitine') && category === 'injectables') return 'injectable_l_carnitine';
    if (name.includes('l-carnitine') && category === 'weight-loss') return 'l_carnitine_oral';

    if (name.includes('ignis') && name.includes('clen')) return 'clenbuterol';
    if (name.includes('clen')) return 'clenbuterol';
    if (name.includes('oxy 50') || name.includes('anadrol') || name.includes('nap 50')) return 'oxymetholone';
    if (name.includes('triple x')) return 'triple_x';
    if (name.includes('dianabol')) return 'dianabol';
    if (name.includes('methyl-test')) return 'methyl_test';
    if (name.includes('dhb')) return 'dhb';
    if (name.includes('yohimbine')) return 'yohimbine';
    if (name.includes('synephrine')) return 'synephrine';
    if (name.includes('4-burn')) return 'four_burn';
    if (name.includes('caber')) return 'cabergoline';

    if (name.includes('liquid oral fat')) return 'liquid_fat_burner';
    if (name.includes('dmaa')) return 'dmaa_preworkout';

    if (name.includes('cinnatropin')) return 'cinnatropin';
    if (name.includes('adelphi-tropin') || name.includes('somatropin')) return 'somatropin';

    if (name.includes('lantus')) return 'lantus';
    if (name.includes('nova rapid') || name.includes('novorapid')) return 'novorapid';

    if (name.includes('tamoxifen')) return 'tamoxifen';
    if (name.includes('hcg')) return 'hcg';
    if (name.includes('arimidex')) return 'arimidex';
    if (name.includes('clomid')) return 'clomid';
    if (name.includes('exemestane')) return 'exemestane';
    if (name.includes('letrozole')) return 'letrozole';
    if (name.includes('proviron')) return 'proviron';
    if (name.includes('metformin')) return 'metformin';
    if (name.includes('telmisartan')) return 'telmisartan';

    if (name.includes('t3') && !name.includes('t4') && !name.includes('t5')) return 't3';
    if (name.includes('t4') || name.includes('levothyroxine')) return 't4';
    if (name.includes('t5') || name.includes('eca')) return 't5_fatburner';

    if (name.includes('melanotan')) return 'melanotan';
    if (name.includes('pin pack')) return 'pin_pack';
    if (name.includes('insulin pins')) return 'insulin_pins';
    if (name.includes('pen pins')) return 'pen_pins';

    if (name.includes('sopharma')) return 'sopharma_clen';
    if (name.includes('melatonin')) return 'melatonin';
    if (name.includes('cocodamol')) return 'cocodamol';
    if (name.includes('dihydrocodeine')) return 'dihydrocodeine';
    if (name.includes('finasteride')) return 'finasteride';

    if (name.includes('viagra')) return 'viagra';
    if (name.includes('kamagra')) return 'kamagra_jelly';
    if (name.includes('cialis')) return 'cialis';

    if (name.includes('iranian')) return 'iranian_test';
    if (name.includes('omnadren')) return 'omnadren';

    return null;
}

function openModal(product) {
    currentModalProduct = product;

    let badgeHtml = '';
    if (product.badge) {
        const badgeClass = product.badge.toLowerCase();
        badgeHtml = `<div class="badge ${badgeClass}">${product.badge}</div>`;
    }

    let imageHtml;
    if (product.image) {
        imageHtml = `<img src="${product.image}" alt="${product.name}" class="product-image">`;
    } else {
        const initial = product.brand ? product.brand.charAt(0) : product.name.charAt(0);
        imageHtml = `
            <div class="image-placeholder">
                <span class="placeholder-initial" style="font-size: 6rem;">${initial}</span>
            </div>
        `;
    }
    modalImageContainer.innerHTML = badgeHtml + imageHtml;

    modalBrand.textContent = product.brand || 'Generic';
    modalTitle.textContent = product.name;
    modalPrice.textContent = `£${product.price}`;

    const categoryInfo = productsData.categories.find(c => c.id === product.category);
    modalCategory.textContent = categoryInfo ? categoryInfo.name : product.category;
    modalType.textContent = product.type;

    const descKey = getProductDescriptionKey(product);
    let descData = null;
    if (descKey && typeof PRODUCT_INFO !== 'undefined' && PRODUCT_INFO[descKey]) {
        descData = PRODUCT_INFO[descKey];
    }

    if (descData) {
        modalDescription.textContent = descData.whatIsIt;
        let benefitsHtml = '';
        descData.benefits.forEach(benefit => {
            benefitsHtml += `<li>${benefit}</li>`;
        });
        modalBenefits.innerHTML = benefitsHtml;
    } else {
        modalDescription.textContent = product.description || `Premium quality ${product.type} product from ${product.brand || 'our catalogue'}. Suitable for research purposes.`;
        modalBenefits.innerHTML = `
            <li>High quality formulation</li>
            <li>Premium ingredients</li>
            <li>Rigorous testing standards</li>
        `;
    }

    lucide.createIcons();

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    currentModalProduct = null;
}

// Global modal events
if (modalOverlay) {
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modalOverlay.classList.contains('active')) closeModal();
            if (document.getElementById('basketDrawer').classList.contains('open')) toggleBasket();
        }
    });
}


// ============================================================
// BASKET
// ============================================================

const SHIPPING_COST = 7;

function addToBasket(productId) {
    const product = productsData.products.find(p => p.id === productId);
    if (!product) return;

    const existing = basket.find(item => item.id === productId);
    if (existing) {
        existing.qty += 1;
    } else {
        basket.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
    }

    updateBasketUI();
    showAddedFeedback(productId);
}

function addToBasketFromModal() {
    if (!currentModalProduct) return;
    addToBasket(currentModalProduct.id);
    closeModal();
    toggleBasket();
}

function removeFromBasket(productId) {
    basket = basket.filter(item => item.id !== productId);
    updateBasketUI();
}

function updateQuantity(productId, delta) {
    const item = basket.find(i => i.id === productId);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
        removeFromBasket(productId);
        return;
    }
    updateBasketUI();
}

function getBasketSubtotal() {
    return basket.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

function updateBasketUI() {
    const totalItems = basket.reduce((sum, item) => sum + item.qty, 0);

    // Update floating count
    const floatingCount = document.getElementById('floatingBasketCount');
    floatingCount.textContent = totalItems;
    floatingCount.style.display = totalItems > 0 ? 'flex' : 'none';

    // Update basket items
    const basketItems = document.getElementById('basketItems');
    const basketEmpty = document.getElementById('basketEmpty');
    const basketFooter = document.getElementById('basketFooter');

    if (basket.length === 0) {
        basketEmpty.style.display = 'flex';
        basketItems.innerHTML = '';
        basketFooter.style.display = 'none';
        return;
    }

    basketEmpty.style.display = 'none';
    basketFooter.style.display = 'block';

    let html = '';
    basket.forEach(item => {
        html += `
            <div class="basket-item">
                <div class="basket-item-info">
                    <div class="basket-item-name">${item.name}</div>
                    <div class="basket-item-price">£${item.price}</div>
                </div>
                <div class="basket-item-controls">
                    <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">
                        <i data-lucide="minus" style="width:14px;height:14px;"></i>
                    </button>
                    <span class="qty-value">${item.qty}</span>
                    <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">
                        <i data-lucide="plus" style="width:14px;height:14px;"></i>
                    </button>
                    <button class="qty-btn remove-btn" onclick="removeFromBasket('${item.id}')">
                        <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
                    </button>
                </div>
            </div>
        `;
    });
    basketItems.innerHTML = html;

    // Update totals
    const subtotal = getBasketSubtotal();
    const total = subtotal + SHIPPING_COST;
    document.getElementById('basketSubtotal').textContent = `£${subtotal.toFixed(2)}`;
    document.getElementById('basketTotal').textContent = `£${total.toFixed(2)}`;

    lucide.createIcons();
}

function toggleBasket() {
    const drawer = document.getElementById('basketDrawer');
    const overlay = document.getElementById('basketOverlay');

    const isOpen = drawer.classList.contains('open');

    if (isOpen) {
        drawer.classList.remove('open');
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    } else {
        drawer.classList.add('open');
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
        updateBasketUI();
    }
}

function showAddedFeedback(productId) {
    const btn = document.querySelector(`.add-to-basket-btn[data-product-id="${productId}"]`);
    if (!btn) return;

    btn.classList.add('added');
    setTimeout(() => btn.classList.remove('added'), 800);
}

function placeOrder() {
    if (basket.length === 0) return;

    // Validate address fields
    const name = document.getElementById('custName').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const city = document.getElementById('custCity').value.trim();
    const postcode = document.getElementById('custPostcode').value.trim();
    const phone = document.getElementById('custPhone').value.trim();

    if (!name || !address || !city || !postcode || !phone) {
        // Highlight empty fields
        ['custName', 'custAddress', 'custCity', 'custPostcode', 'custPhone'].forEach(id => {
            const el = document.getElementById(id);
            if (!el.value.trim()) {
                el.classList.add('input-error');
                setTimeout(() => el.classList.remove('input-error'), 2000);
            }
        });
        return;
    }

    // Generate order number
    const orderNo = Math.floor(10000 + Math.random() * 90000);

    // Build product lines
    const productLines = basket.map(item => `• ${item.qty} x ${item.name}`).join('\n');

    const subtotal = getBasketSubtotal();
    const total = subtotal + SHIPPING_COST;

    // Build WhatsApp message matching the exact format
    const message = `*Order Details*
*Order no:* ${orderNo}

*Product Details*
${productLines}

*Subtotal:* £ ${subtotal.toFixed(2)}
*Shipping Total:* £ ${SHIPPING_COST.toFixed(2)}

*Total:* £ ${total.toFixed(2)}

*Customer Details:*
${name}
${address}

${city}
${postcode}
${phone}

*IMPORTANT:*
Please wait for payment information to be sent. We will not be responsible for incorrect address input.`;

    const waUrl = `https://wa.me/${productsData.store.whatsapp.replace('+', '')}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');

    // Clear basket after order
    basket = [];
    updateBasketUI();
    toggleBasket();

    // Clear form
    ['custName', 'custAddress', 'custCity', 'custPostcode', 'custPhone'].forEach(id => {
        document.getElementById(id).value = '';
    });
}
