document.addEventListener('DOMContentLoaded', () => {
    let products = [];
    let cart = [];
    let userBalance = parseFloat(localStorage.getItem('userBalance')) || 2000;

    const productList = document.getElementById('product-list');
    const loadingSpinner = document.getElementById('loading-spinner');
    const categoryFilters = document.getElementById('category-filters');
    const searchInput = document.getElementById('search-input');
    
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartEmptyMsg = document.getElementById('cart-empty-msg');
    const subtotalEl = document.getElementById('subtotal');
    const deliveryChargeEl = document.getElementById('delivery-charge');
    const shippingCostEl = document.getElementById('shipping-cost');
    const discountEl = document.getElementById('discount');
    const totalCostEl = document.getElementById('total-cost');
    const checkoutBtn = document.getElementById('checkout-btn');
    const balanceWarning = document.getElementById('balance-warning');
    const couponInput = document.getElementById('coupon-input');
    const couponFeedback = document.getElementById('coupon-feedback');

    const userBalanceEl = document.getElementById('user-balance');
    const addMoneyBtn = document.getElementById('add-money-btn');

    const navLinks = document.querySelectorAll('.nav-link');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const contactForm = document.getElementById('contactForm');
    const formFeedback = document.getElementById('formFeedback');
    const backToTopBtn = document.getElementById('back-to-top');
    const carousel = document.getElementById('carousel');
    const slides = carousel.children;
    const dots = document.querySelectorAll('.dot');
    
    // TARGET ELEMENTS FOR REVIEWS
    const reviewContainer = document.getElementById('reviews-container');
    const prevReviewBtn = document.getElementById('prev-review-btn');
    const nextReviewBtn = document.getElementById('next-review-btn');
    const reviewDotsContainer = document.getElementById('review-dots');


    const API_URL = 'https://fakestoreapi.com/products';

    const reviews = [
        { name: 'Alice', rating: 5, comment: 'Amazing products and fast delivery! Will definitely shop here again.', date: '2024-05-20' },
        { name: 'Bob', rating: 4, comment: 'Good quality items, but the packaging could be better. Overall, a positive experience.', date: '2024-05-18' },
        { name: 'Charlie', rating: 5, comment: 'I love the watch I bought. It looks even better in person. Highly recommended!', date: '2024-05-15' },
        { name: 'Diana', rating: 3, comment: 'The product was okay, but it took a long time to arrive.', date: '2024-05-12' },
        { name: 'Eve', rating: 5, comment: 'Customer service was excellent! They helped me with my order immediately.', date: '2024-05-10' }
    ];

    // --- Banner Carousel Logic (unchanged) ---
    let index = 0;
    const total = slides.length;
    function updateCarousel() {
        carousel.style.transform = `translateX(-${index * 100}%)`;
        dots.forEach((dot, i) => {
            dot.classList.toggle('bg-yellow-400', i === index);
            dot.classList.toggle('bg-white/70', i !== index);
        });
    }

    document.getElementById('nextBtn').addEventListener('click', () => {
        index = (index + 1) % total;
        updateCarousel();
    });
    document.getElementById('prevBtn').addEventListener('click', () => {
        index = (index - 1 + total) % total;
        updateCarousel();
    });
    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            index = i;
            updateCarousel();
        });
    });
    setInterval(() => {
        index = (index + 1) % total;
        updateCarousel();
    }, 4000);
    updateCarousel();
    // --- End Banner Carousel Logic ---

    const init = () => {
        fetchProducts();
        updateBalanceDisplay();
        setupEventListeners();
        renderReviews();
        setupReviewCarousel(); // NEW: Setup the sliding reviews
        setupIntersectionObserver();
    };


    function setupEventListeners() {
        searchInput.addEventListener('input', () => filterAndRenderProducts());
        
        document.getElementById('cart-toggle-btn').addEventListener('click', toggleCart);
        document.getElementById('close-cart-btn').addEventListener('click', toggleCart);
        cartOverlay.addEventListener('click', toggleCart);

        addMoneyBtn.addEventListener('click', addMoney);

        document.getElementById('apply-coupon-btn').addEventListener('click', applyCoupon);
        cartItemsContainer.addEventListener('click', handleCartActions);

        mobileMenuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));

        window.addEventListener('scroll', handleScroll);
        backToTopBtn.addEventListener('click', scrollToTop);
    }
    
    // ... (fetchProducts and renderProducts functions remain the same) ...

    async function fetchProducts() {
        try {
            loadingSpinner.style.display = 'flex';
            productList.innerHTML = '';
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Network response was not ok');
            products = await response.json();
            renderProducts(products);
            populateCategoryFilters();
        } catch (error) {
            productList.innerHTML = `<p class="text-red-500 col-span-full text-center">Failed to load products. Please try again later.</p>`;
            console.error('Error fetching products:', error);
        } finally {
            loadingSpinner.style.display = 'none';
        }
    }

    function renderProducts(productsToRender) {
        productList.innerHTML = '';
        if(productsToRender.length === 0) {
            productList.innerHTML = `<p class="text-gray-500 col-span-full text-center">No products found.</p>`;
            return;
        }
        
        productsToRender.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = `
            bg-gradient-to-br from-yellow-50 via-amber-100 to-yellow-200 
            text-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col group 
            hover:shadow-lg hover:scale-[1.02] transition duration-300
        `;

        productCard.innerHTML = `
            <div class="h-64 overflow-hidden bg-white/60">
            <img src="${product.image}" alt="${product.title}" 
                class="w-full h-56 sm:h-64 object-contain p-4">
            </div>
            <div class="p-4 flex flex-col flex-grow">
            <h3 class="text-lg font-semibold truncate" title="${product.title}">
                ${product.title}
            </h3>
            <div class="flex items-center my-2">
                <div class="text-yellow-500">
                ${'★'.repeat(Math.round(product.rating.rate))}${'☆'.repeat(5 - Math.round(product.rating.rate))}
                </div>
                <span class="text-sm text-gray-600 ml-2">(${product.rating.count})</span>
            </div>
            <p class="text-2xl font-bold mt-auto">${product.price.toFixed(2)} BDT</p>
            <button 
                data-product-id="${product.id}" 
                class="add-to-cart-btn w-full mt-4 
                    bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500
                    text-white font-bold py-2 px-4 rounded-lg 
                    hover:opacity-90 hover:scale-105 transition-transform duration-300">
                Add to Cart
            </button>
            </div>
        `;
        productList.appendChild(productCard);
        });


        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = parseInt(e.target.dataset.productId);
                addToCart(productId);
            });
        });
    }

    function populateCategoryFilters() {
        const categories = ['All', ...new Set(products.map(p => p.category))];
        categoryFilters.innerHTML = '';
        
        const activeClasses = ['active-category', 'bg-gradient-to-r', 'from-yellow-400', 'via-amber-500', 'to-orange-500', 'text-white'];
        const inactiveClasses = ['bg-gray-200', 'text-gray-700', 'hover:bg-gray-300'];

        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = `category-btn px-4 py-2 rounded-full text-sm font-semibold transition-colors capitalize`;
            button.textContent = category;
            
            if (category === 'All') {
                button.classList.add(...activeClasses);
            } else {
                button.classList.add(...inactiveClasses);
            }

            button.addEventListener('click', () => {
                document.querySelectorAll('.category-btn').forEach(btn => {
                    btn.classList.remove(...activeClasses);
                    btn.classList.add(...inactiveClasses);
                });
                button.classList.remove(...inactiveClasses);
                button.classList.add(...activeClasses);
                
                filterAndRenderProducts();
            });
            categoryFilters.appendChild(button);
        });
    }

    function filterAndRenderProducts() {
        const searchTerm = searchInput.value.toLowerCase();
        
        const activeCategoryBtn = document.querySelector('.category-btn.active-category');
        const activeCategory = activeCategoryBtn ? activeCategoryBtn.textContent : 'All';
        
        let filteredProducts = products;

        if (activeCategory !== 'All') {
            filteredProducts = filteredProducts.filter(p => p.category === activeCategory);
        }

        if (searchTerm) {
            filteredProducts = filteredProducts.filter(p => p.title.toLowerCase().includes(searchTerm));
        }

        renderProducts(filteredProducts);
    }

    /**
     * Renders the customer reviews, each wrapped for full-width sliding.
     */
    function renderReviews() {
        if (!reviewContainer) return;
        
        reviewContainer.innerHTML = reviews.map((r, index) => {
            // Generates star icons using Font Awesome classes
            const generateStars = (rating) => {
                let stars = '';
                for (let i = 1; i <= 5; i++) {
                    const starClass = i <= rating ? 'fas fa-star' : 'far fa-star';
                    stars += `<i class="${starClass} text-yellow-400 text-sm"></i>`;
                }
                return stars;
            };

            // Each item is now w-full and flex-shrink-0 for sliding
            return `
                <div class="w-full flex-shrink-0 p-4 sm:p-0"> 
                    <div class="bg-white p-6 rounded-xl shadow-lg border-t-4 border-yellow-400">
                        <div class="flex items-center mb-4">
                            <img class="w-12 h-12 rounded-full object-cover mr-4" src="https://picsum.photos/100/100?random=${100 + index}" alt="${r.name} Avatar">
                            <div>
                                <p class="font-semibold text-lg text-gray-800">${r.name}</p>
                                <div class="flex items-center">
                                    ${generateStars(r.rating)}
                                </div>
                            </div>
                        </div>
                        <p class="italic text-gray-700">
                            "${r.comment}"
                        </p>
                        <p class="text-xs text-gray-400 mt-2 text-right">${r.date}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Controls the sliding functionality for the reviews section.
     */
    function setupReviewCarousel() {
        if (!reviewContainer) return;

        const reviewItems = reviewContainer.children;
        const totalReviews = reviewItems.length;
        let currentReviewIndex = 0;
        
        // 1. Render Navigation Dots
        reviewDotsContainer.innerHTML = Array.from({ length: totalReviews }).map((_, i) =>
            `<span class="review-dot w-3 h-3 rounded-full bg-gray-300 cursor-pointer transition-colors duration-300" data-index="${i}"></span>`
        ).join('');
        const reviewDots = reviewDotsContainer.querySelectorAll('.review-dot');

        const updateReviewCarousel = () => {
            // Calculate the transform position (each item is 100% wide)
            const offset = -currentReviewIndex * 100;
            reviewContainer.style.transform = `translateX(${offset}%)`;

            // Update dots state
            reviewDots.forEach((dot, i) => {
                dot.classList.toggle('bg-yellow-400', i === currentReviewIndex);
                dot.classList.toggle('bg-gray-300', i !== currentReviewIndex);
            });
        };

        const nextReview = () => {
            currentReviewIndex = (currentReviewIndex + 1) % totalReviews;
            updateReviewCarousel();
        };

        const prevReview = () => {
            currentReviewIndex = (currentReviewIndex - 1 + totalReviews) % totalReviews;
            updateReviewCarousel();
        };

        // 2. Attach Event Listeners
        prevReviewBtn.addEventListener('click', prevReview);
        nextReviewBtn.addEventListener('click', nextReview);

        reviewDots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                currentReviewIndex = parseInt(e.target.dataset.index);
                updateReviewCarousel();
            });
        });

        // 3. Auto-slide (Optional)
        setInterval(nextReview, 5000);

        // Initial setup
        updateReviewCarousel();
    }
    
    // ... (rest of the functions remain the same) ...

    function toggleCart() {
        cartSidebar.classList.toggle('translate-x-full');
        cartOverlay.classList.toggle('hidden');
    }
    
    function addToCart(productId) {
        const product = products.find(p => p.id === productId);
        const cartItem = cart.find(item => item.id === productId);

        if (cartItem) {
            cartItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        updateCart();
    }
    
    function handleCartActions(e) {
        const target = e.target;
        const productId = parseInt(target.closest('.cart-item')?.dataset.productId);
        if (!productId) return;

        if (target.matches('.increase-qty')) {
            const item = cart.find(i => i.id === productId);
            if (item) item.quantity++;
        }
        if (target.matches('.decrease-qty')) {
             const item = cart.find(i => i.id === productId);
             if (item && item.quantity > 1) {
                item.quantity--;
             } else {
                cart = cart.filter(i => i.id !== productId);
             }
        }
        if (target.matches('.remove-item')) {          
            cart = cart.filter(i => i.id !== productId);
        }
        updateCart();
    }
    
    let couponApplied = false;
    function applyCoupon() {
        if(couponInput.value.trim().toUpperCase() === 'SMART10') {
            couponApplied = true;
            couponFeedback.textContent = "Coupon 'SMART10' applied!";
            couponFeedback.className = "text-sm text-center mb-2 h-4 text-green-600";
            updateCart();
        } else {
            couponApplied = false;
            couponFeedback.textContent = "Invalid coupon code.";
            couponFeedback.className = "text-sm text-center mb-2 h-4 text-red-500";
            updateCart();
        }
    }

    function updateCart() {
        cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '';
            cartEmptyMsg.style.display = 'block';
        } else {
            cartEmptyMsg.style.display = 'none';
            cartItemsContainer.innerHTML = cart.map(item => `
                <div class="flex items-center justify-between p-2 border-b cart-item" data-product-id="${item.id}">
                    <img src="${item.image}" alt="${item.title}" class="w-16 h-16 object-contain mr-4">
                    <div class="flex-grow">
                        <p class="font-semibold text-sm text-wrap truncate">${item.title}</p>
                        <p class="text-gray-500 text-xs">${item.price.toFixed(2)} BDT</p>
                         <div class="flex items-center mt-1">
                            <button class="decrease-qty w-6 h-6 bg-gray-200 rounded">-</button>
                            <span class="px-2">${item.quantity}</span>
                            <button class="increase-qty w-6 h-6 bg-gray-200 rounded">+</button>
                        </div>
                    </div>
                    <button class="remove-item text-red-500 hover:text-red-700 ml-4 fas fa-trash"></button>
                </div>
            `).join('');
        }
        
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryCharge = cart.length > 0 ? 50 : 0;
        const shippingCost = cart.length > 0 ? 10 : 0;
        const discount = couponApplied ? subtotal * 0.10 : 0;
        const total = subtotal + deliveryCharge + shippingCost - discount;

        subtotalEl.textContent = `${subtotal.toFixed(2)} BDT`;
        deliveryChargeEl.textContent = `${deliveryCharge.toFixed(2)} BDT`;
        shippingCostEl.textContent = `${shippingCost.toFixed(2)} BDT`;
        discountEl.textContent = `-${discount.toFixed(2)} BDT`;
        totalCostEl.textContent = `${total.toFixed(2)} BDT`;
        
        if (total > userBalance) {
            balanceWarning.style.display = 'block';
            checkoutBtn.disabled = true;
        } else {
            balanceWarning.style.display = 'none';
            checkoutBtn.disabled = cart.length === 0;
        }
    }

    function updateBalanceDisplay() {
        userBalanceEl.textContent = `${userBalance.toFixed(2)} BDT`;
    }

    function addMoney() {
        userBalance += 1000;
        localStorage.setItem('userBalance', userBalance);
        updateBalanceDisplay();
        updateCart();
    }
    
    function setupIntersectionObserver() {
        const sections = document.querySelectorAll('main section');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    navLinks.forEach(link => {
                        link.classList.remove('text-green-600', 'font-bold', 'border-b-2', 'border-green-600'); 
                        
                        if (link.getAttribute('href').substring(1) === entry.target.id) {
                            link.classList.add('text-green-600', 'font-bold', 'border-b-2', 'border-green-600');
                        }
                    });
                }
            });
        }, { threshold: 0.5 });

        sections.forEach(section => observer.observe(section));
    }
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('text-green-600', 'font-semibold', 'border-b-2', 'border-green-700'));
            link.classList.add('text-green-600', 'font-semibold', 'border-b-2', 'border-green-700');
        });
    });

    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const name = contactForm.name.value.trim();
        const email = contactForm.email.value.trim();
        const message = contactForm.message.value.trim();

        if(name && email && message) {
            formFeedback.textContent = `Thank you, ${name}! Your message has been sent.`;
            formFeedback.className = "text-center mt-4 font-semibold text-green-600 animate-fade-in";
            contactForm.reset();
        } else {
            formFeedback.textContent = "Please fill out all fields.";
            formFeedback.className = "text-center mt-4 font-semibold text-red-500 animate-fade-in";
        }

        setTimeout(() => {
            formFeedback.textContent = "";
        }, 4000);
    });


    function handleScroll() {
        if (window.scrollY > 300) {
            backToTopBtn.classList.remove('hidden', 'opacity-0');
        } else {
            backToTopBtn.classList.add('hidden', 'opacity-0');
        }
    }

    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    init();
    
});