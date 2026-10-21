const API_URL = "https://eatscape-backend.onrender.com/api/foods";
const ORDERS_URL = "http://localhost:8080/api/orders";
const USERS_URL = "https://eatscape-backend.onrender.com/api/users";
const RECOMMENDATIONS_URL = "http://localhost:8080/api/recommendations";

let foodItems = [];
let recommendedFoods = [];

const cart = {};

const foodImages = {
    "Chicken Biryani": "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=800&q=80",
    "Veg Biryani": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80",
    "Paneer Tikka": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80",
    "Crispy Chicken": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80",
    "Veg Fried Rice": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80",
    "Grilled Chicken": "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80",
    "Chocolate Cake": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
    "Ice Cream": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80",
    "Veg Burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80"
};

const fallbackImage = "https://placehold.co/800x500?text=Food+Image";

const foodList = document.getElementById("food-list");
const recommendationList = document.getElementById("recommendation-list");
const recommendationMessage = document.getElementById("recommendation-message");

let cartSummary = document.getElementById("cart-summary");

if (foodList && !cartSummary) {
    cartSummary = document.createElement("div");
    cartSummary.id = "cart-summary";
    cartSummary.className = "cart-summary";
    foodList.parentNode.insertBefore(cartSummary, foodList);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Update navigation according to login status.
function updateAuthNavigation() {
    const token = sessionStorage.getItem("jwtToken");
    const userName = sessionStorage.getItem("userName");
    const userRole = sessionStorage.getItem("userRole");

    const loginNavLink = document.getElementById("login-nav-link");
    const currentUserLabel = document.getElementById("current-user-label");
    const logoutButton = document.getElementById("logout-button");

    if (token) {
        if (loginNavLink) {
            loginNavLink.hidden = true;
        }

        if (currentUserLabel) {
            currentUserLabel.hidden = false;
            currentUserLabel.textContent =
                `Hi, ${userName || "User"}${userRole === "ADMIN" ? " (Admin)" : ""}`;
        }

        if (logoutButton) {
            logoutButton.hidden = false;
        }
    } else {
        if (loginNavLink) {
            loginNavLink.hidden = false;
        }

        if (currentUserLabel) {
            currentUserLabel.hidden = true;
            currentUserLabel.textContent = "";
        }

        if (logoutButton) {
            logoutButton.hidden = true;
        }
    }
}

// Logout the current user.
const logoutButton = document.getElementById("logout-button");

if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        sessionStorage.removeItem("jwtToken");
        sessionStorage.removeItem("userName");
        sessionStorage.removeItem("userRole");
        sessionStorage.removeItem("userEmail");

        updateAuthNavigation();
        loadMyOrders();

        const checkoutSection = document.getElementById("checkout-section");
        const checkoutMessage = document.getElementById("checkout-message");

        if (checkoutSection) {
            checkoutSection.hidden = true;
        }

        if (checkoutMessage) {
            checkoutMessage.textContent = "";
        }

        const loginMessage = document.getElementById("login-message");

        if (loginMessage) {
            loginMessage.textContent = "You have logged out successfully.";
        }

        document.getElementById("login-section")
            ?.scrollIntoView({ behavior: "smooth" });
    });
}

// Load food items from the backend.
async function loadFoods() {
    if (!foodList) return;

    foodList.innerHTML =
        '<p class="loading-message">Loading our delicious menu...</p>';

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to load food items.");
        }

        foodItems = await response.json();

        displayFoods();
        updateCartSummary();
    } catch (error) {
        console.error("Error loading food items:", error);

        foodList.innerHTML =
            '<p class="error-message">Unable to load the menu. Please make sure the backend is running.</p>';
    }
}


/* Load recommendations from the Spring Boot API. */
async function loadRecommendations() {
    if (!recommendationList) return;

    recommendationList.innerHTML =
        '<p class="loading-message">Finding delicious picks for you...</p>';

    if (recommendationMessage) {
        recommendationMessage.textContent = "";
    }

    try {
        // Use personalized recommendations when a JWT token exists.
        const token =
            sessionStorage.getItem("token") ||
            localStorage.getItem("token");

        const recommendationsUrl = token
            ? `${RECOMMENDATIONS_URL}/personalized`
            : RECOMMENDATIONS_URL;

        const headers = {};

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(recommendationsUrl, {
            method: "GET",
            headers: headers
        });

        if (!response.ok) {
            throw new Error(
                `Unable to load recommendations (HTTP ${response.status}).`
            );
        }

        recommendedFoods = await response.json();

        displayRecommendations();
    } catch (error) {
        console.error("Error loading recommendations:", error);

        recommendationList.innerHTML =
            '<p class="error-message">Recommendations are temporarily unavailable. Please try again later.</p>';
    }
}


/* Display food items according to the selected category. */

function displayFoods(category = "All") {
    if (!foodList) return;

    const uniqueFoods = new Map();

    foodItems.forEach(food => {
        const key = String(food.name || "").trim().toLowerCase();

        if (!key) return;

        const existing = uniqueFoods.get(key);
        const isAvailable = food.available === true &&
            Number(food.stockQuantity ?? 0) > 0;
        const existingAvailable = existing &&
            existing.available === true &&
            Number(existing.stockQuantity ?? 0) > 0;

        if (!existing || (isAvailable && !existingAvailable)) {
            uniqueFoods.set(key, food);
        }
    });

    const filteredFoods = [...uniqueFoods.values()].filter(food =>
        category === "All" ||
        String(food.category || "").toLowerCase() ===
            String(category).toLowerCase()
    );

    // Keep the rest of your existing function unchanged.


    if (filteredFoods.length === 0) {
        foodList.innerHTML =
            '<p class="empty-message">No food items found in this category.</p>';
        return;
    }

    foodList.innerHTML = filteredFoods.map(food => {
        const stock = Number(food.stockQuantity ?? 0);
        const isAvailable = food.available === true && stock > 0;
        const image = foodImages[food.name] || fallbackImage;

        return `
            <article class="food-card">
                <img
                    class="food-image"
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(food.name)}"
                    loading="lazy"
                    onerror="this.onerror=null;this.src='${fallbackImage}'"
                >

                <div class="food-card-content">
                    <h3>${escapeHTML(food.name)}</h3>
                    <p>${escapeHTML(food.description || "")}</p>
                    <p class="food-category">
                        ${escapeHTML(food.category || "")}
                    </p>

                    <div class="food-card-footer">
                        <strong>₹${Number(food.price).toFixed(2)}</strong>

                        <button
                            type="button"
                            data-food-action="add"
                            data-id="${Number(food.id)}"
                            ${isAvailable ? "" : "disabled"}>
                            ${isAvailable ? "Add to Cart" : "Out of Stock"}
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}


/* Display the recommended food cards. */
function displayRecommendations() {
    if (!recommendationList) return;

    if (!Array.isArray(recommendedFoods) || recommendedFoods.length === 0) {
        recommendationList.innerHTML =
            '<p class="empty-message">No recommendations available right now.</p>';
        return;
    }

    const uniqueRecommendations = new Map();

recommendedFoods.forEach(food => {
    const key = String(food.name || "").trim().toLowerCase();

    if (!key) return;

    const existing = uniqueRecommendations.get(key);
    const isAvailable = food.available === true &&
        Number(food.stockQuantity ?? 0) > 0;
    const existingAvailable = existing &&
        existing.available === true &&
        Number(existing.stockQuantity ?? 0) > 0;

    if (!existing || (isAvailable && !existingAvailable)) {
        uniqueRecommendations.set(key, food);
    }
});

recommendationList.innerHTML = [...uniqueRecommendations.values()].map(food => {
        const stock = Number(food.stockQuantity ?? 0);
        const isAvailable = food.available === true && stock > 0;
        const image = foodImages[food.name] || fallbackImage;

        return `
            <article class="food-card recommendation-card">
                <img
                    class="food-image"
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(food.name)}"
                    loading="lazy"
                    onerror="this.onerror=null;this.src='${fallbackImage}'"
                >

                <div class="food-card-content">
                    <h3>${escapeHTML(food.name)}</h3>
                    <p>${escapeHTML(food.description || "")}</p>
                    <p class="food-category">
                        ${escapeHTML(food.category || "")}
                    </p>

                    <div class="food-card-footer">
                        <strong>₹${Number(food.price).toFixed(2)}</strong>

                        <button
                            type="button"
                            data-food-action="add"
                            data-id="${Number(food.id)}"
                            ${isAvailable ? "" : "disabled"}>
                            ${isAvailable ? "Add to Cart" : "Out of Stock"}
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}


/* Add a food item to the cart from either section. */
function addFoodToCart(foodId) {
    const food = foodItems.find(
        item => Number(item.id) === Number(foodId)
    );

    if (!food) {
        alert("This food item could not be found. Please refresh the menu.");
        return;
    }

    const stock = Number(food.stockQuantity ?? 0);

    if (food.available !== true || stock <= 0) {
        alert("Sorry, this food item is currently unavailable.");
        return;
    }

    if (cart[foodId]) {
        if (cart[foodId].quantity >= stock) {
            alert("You have reached the available stock quantity.");
            return;
        }

        cart[foodId].quantity++;
    } else {
        cart[foodId] = {
            id: Number(food.id),
            name: food.name,
            price: Number(food.price),
            quantity: 1
        };
    }

    updateCartSummary();

    const activeButton = document.querySelector(
        "button[data-category].active"
    );

    displayFoods(activeButton?.dataset.category || "All");
    displayRecommendations();
}


/* Handle Add to Cart clicks in both sections. */
[foodList, recommendationList].forEach(list => {
    if (!list) return;

    list.addEventListener("click", event => {
        const button = event.target.closest(
            'button[data-food-action="add"]'
        );

        if (!button || button.disabled) return;

        addFoodToCart(Number(button.dataset.id));
    });
});


/* Handle menu category filters. */
document.querySelectorAll("button[data-category]").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll("button[data-category]").forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");
        displayFoods(button.dataset.category || "All");
    });
});

// Cart controls and checkout.
if (cartSummary) {
    cartSummary.addEventListener("click", event => {
        const button = event.target.closest("[data-cart-action]");

        if (button) {
            const foodId = Number(button.dataset.id);
            const action = button.dataset.cartAction;
            const item = cart[foodId];

            if (!item) return;

            if (action === "increase") {
                const availableFood = foodItems.find(
                    food => Number(food.id) === foodId
                );

                const stock = Number(availableFood?.stockQuantity ?? 0);

                if (item.quantity >= stock) {
                    alert("You have reached the available stock quantity.");
                    return;
                }

                item.quantity++;
            } else if (action === "decrease") {
                item.quantity--;

                if (item.quantity <= 0) {
                    delete cart[foodId];
                }
            } else if (action === "remove") {
                delete cart[foodId];
            }

            updateCartSummary();

            const activeButton = document.querySelector(
                "button[data-category].active"
            );

            displayFoods(activeButton?.dataset.category || "All");
            displayRecommendations();

            return;
        }

        if (event.target.closest("#checkout-button")) {
            if (Object.keys(cart).length === 0) {
                alert("Please add food items to your cart first.");
                return;
            }

            const token = sessionStorage.getItem("jwtToken");

            if (!token) {
                alert("Please log in before proceeding to checkout.");

                document.getElementById("login-section")
                    ?.scrollIntoView({ behavior: "smooth" });

                return;
            }

            const checkoutSection =
                document.getElementById("checkout-section");

            if (checkoutSection) {
                checkoutSection.hidden = false;

                checkoutSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        }
    });
}

// Display cart items and calculate total price.
function updateCartSummary() {
    if (!cartSummary) return;

    let totalItems = 0;
    let totalPrice = 0;

    const cartItems = Object.values(cart);

    cartItems.forEach(item => {
        totalItems += item.quantity;
        totalPrice += Number(item.price) * item.quantity;
    });

    cartSummary.innerHTML = `
        <h3>Your Shopping Cart</h3>

        <p class="cart-total-items">
            Total Items: ${totalItems}
        </p>

        <div class="cart-items">
            ${
                cartItems.length === 0
                    ? '<p>Your cart is empty.</p>'
                    : cartItems.map(item => `
                        <div class="cart-line">
                            <div class="cart-item-details">
                                <strong>${escapeHTML(item.name)}</strong>
                                <span>₹${Number(item.price).toFixed(2)} each</span>
                            </div>

                            <div class="cart-item-controls">
                                <button
                                    type="button"
                                    data-cart-action="decrease"
                                    data-id="${item.id}"
                                    aria-label="Decrease quantity">−</button>

                                <span>${item.quantity}</span>

                                <button
                                    type="button"
                                    data-cart-action="increase"
                                    data-id="${item.id}"
                                    aria-label="Increase quantity">+</button>

                                <button
                                    type="button"
                                    data-cart-action="remove"
                                    data-id="${item.id}"
                                    class="remove-cart-item">Remove</button>
                            </div>
                        </div>
                    `).join("")
            }
        </div>

        <div class="cart-grand-total">
            Total: ₹${totalPrice.toFixed(2)}
        </div>

        <button
            type="button"
            id="checkout-button"
            ${cartItems.length === 0 ? "disabled" : ""}>
            Proceed to Checkout
        </button>
    `;
}

// Checkout form elements.
const checkoutForm = document.getElementById("checkout-form");
const checkoutMessage = document.getElementById("checkout-message");
const placeOrderButton = document.getElementById("place-order-button");
const cancelCheckoutButton = document.getElementById("cancel-checkout");

// Cancel checkout.
if (cancelCheckoutButton) {
    cancelCheckoutButton.addEventListener("click", () => {
        const checkoutSection = document.getElementById("checkout-section");

        if (checkoutSection) {
            checkoutSection.hidden = true;
        }

        if (checkoutMessage) {
            checkoutMessage.textContent = "";
        }

        if (placeOrderButton) {
            placeOrderButton.disabled = false;
            placeOrderButton.textContent = "Place Order";
        }
    });
}

// Place an order.
if (checkoutForm) {
    checkoutForm.addEventListener("submit", async event => {
        event.preventDefault();

        if (Object.keys(cart).length === 0) {
            checkoutMessage.textContent =
                "Your cart is empty. Please add food items first.";
            return;
        }

        const token = sessionStorage.getItem("jwtToken");

        if (!token) {
            checkoutMessage.textContent =
                "Please log in before placing an order.";
            return;
        }

        const orderData = {
            customerName: document.getElementById("customer-name").value.trim(),
            phone: document.getElementById("customer-phone").value.trim(),
            deliveryAddress: document.getElementById("delivery-address").value.trim(),
            paymentMethod: document.getElementById("payment-method").value,
            items: Object.values(cart).map(item => ({
                foodId: item.id,
                quantity: item.quantity
            }))
        };

        placeOrderButton.disabled = true;
        placeOrderButton.textContent = "Placing Order...";
        checkoutMessage.textContent = "Submitting your order...";

        try {
            const response = await fetch(ORDERS_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify(orderData)
            });

            const result = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(
                    result?.detail ||
                    result?.message ||
                    `Unable to place your order. HTTP status: ${response.status}`
                );
            }

            const orderId = result.id;
            const total = Number(result.totalAmount).toFixed(2);

            Object.keys(cart).forEach(id => delete cart[id]);

            updateCartSummary();

            const activeButton = document.querySelector(
                "button[data-category].active"
            );

            displayFoods(activeButton?.dataset.category || "All");
            displayRecommendations();
            checkoutForm.reset();

            checkoutMessage.textContent =
                `Order placed successfully! Order ID: ${orderId}. ` +
                `Total: ₹${total}. Payment: Cash on Delivery.`;

            placeOrderButton.textContent = "Order Placed!";

            await loadMyOrders();
            await loadRecommendations();
        } catch (error) {
            console.error("Checkout error:", error);

            checkoutMessage.textContent =
                error.message || "Could not connect to the server. Please try again.";

            placeOrderButton.disabled = false;
            placeOrderButton.textContent = "Place Order";
        }
    });
}

// User registration.
const registerForm = document.getElementById("register-form");

if (registerForm) {
    registerForm.addEventListener("submit", async event => {
        event.preventDefault();

        const name = document.getElementById("register-name").value.trim();
        const email = document.getElementById("register-email").value.trim();
        const password = document.getElementById("register-password").value;
        const message = document.getElementById("register-message");
        const registerButton = document.getElementById("register-button");

        registerButton.disabled = true;
        message.textContent = "Creating your account...";

        try {
            const response = await fetch(`${USERS_URL}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name, email, password })
            });

            const result = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(result?.message || "Registration failed.");
            }

            message.textContent =
                "Registration successful! Please log in.";

            registerForm.reset();
        } catch (error) {
            console.error("Registration error:", error);

            message.textContent =
                error.message || "Unable to connect to the server.";
        } finally {
            registerButton.disabled = false;
        }
    });
}

// User login.
const loginForm = document.getElementById("login-form");

if (loginForm) {
    loginForm.addEventListener("submit", async event => {
        event.preventDefault();

        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;
        const message = document.getElementById("login-message");
        const loginButton = document.getElementById("login-button");

        loginButton.disabled = true;
        message.textContent = "Logging in...";

        try {
            const response = await fetch(`${USERS_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(result?.message || "Login failed.");
            }

            if (!result?.token) {
                throw new Error(
                    "Login succeeded, but no token was received."
                );}sessionStorage.setItem("jwtToken", result.token);
sessionStorage.setItem("userName", result.name || email);
sessionStorage.setItem("userRole", result.role || "CUSTOMER");
sessionStorage.setItem("userEmail", email);

            updateAuthNavigation();

            message.textContent =
                "Login successful! Welcome to Eatscape.";

            loginForm.reset();

            await loadMyOrders();
        } catch (error) {
            console.error("Login error:", error);

            message.textContent =
                error.message || "Unable to connect to the server.";
        } finally {
            loginButton.disabled = false;
        }
    });
}

// My Orders and order tracking.
const myOrdersList = document.getElementById("my-orders-list");
const myOrdersMessage = document.getElementById("my-orders-message");
const refreshOrdersButton =
    document.getElementById("refresh-orders-button");

async function loadMyOrders() {
    if (!myOrdersList || !myOrdersMessage) return;

    const token = sessionStorage.getItem("jwtToken");

    if (!token) {
        myOrdersMessage.textContent =
            "Please log in to view your orders.";

        myOrdersList.innerHTML = "";
        return;
    }

    myOrdersMessage.textContent = "Loading your orders...";
    myOrdersList.innerHTML = "";

    try {
        const response = await fetch(`${ORDERS_URL}/my-orders`, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error(
                    "Your session may have expired. Please log in again."
                );
            }

            throw new Error("Unable to load your orders.");
        }

        const orders = await response.json();

        if (!Array.isArray(orders) || orders.length === 0) {
            myOrdersMessage.textContent =
                "You haven't placed any orders yet. Explore our menu!";
            return;
        }

        myOrdersMessage.textContent =
            "Here are your previous and current orders.";

        const stages = ["PLACED", "PREPARING", "READY", "DELIVERED"];

        myOrdersList.innerHTML = orders.map(order => {
            const status = String(order.status || "PLACED").toUpperCase();

            const items = (order.items || []).map(item => `
                <div class="order-item">
                    <span>${escapeHTML(item.foodName)}</span>
                    <span>
                        ${Number(item.quantity)} × ₹${Number(item.price).toFixed(2)}
                    </span>
                </div>
            `).join("");

            const orderDate = order.orderDate
                ? new Date(order.orderDate).toLocaleString()
                : "Date unavailable";

            const currentIndex = stages.indexOf(status);

            const progress = stages.map((stage, index) => `
                <span class="${
                    status !== "CANCELLED" && currentIndex >= index
                        ? "completed"
                        : ""
                }">
                    ${stage}
                </span>
            `).join("");

            return `
                <article class="order-card">
                    <div class="order-card-header">
                        <div>
                            <h3>Order #${escapeHTML(order.id)}</h3>
                            <p>${escapeHTML(orderDate)}</p>
                        </div>

                        <span class="order-status status-${escapeHTML(status.toLowerCase())}">
                            ${escapeHTML(status)}
                        </span>
                    </div>

                    <div class="order-items">
                        ${items || "<p>No item details available.</p>"}
                    </div>

                    <div class="order-card-footer">
                        <strong>
                            Total: ₹${Number(order.totalAmount).toFixed(2)}
                        </strong>

                        <span>${escapeHTML(order.paymentMethod || "COD")}</span>
                    </div>

                    <div class="order-progress">
                        <p>Order progress</p>

                        <div class="order-progress-steps">
                            ${progress}
                        </div>

                        ${
                            status === "CANCELLED"
                                ? "<p class='cancelled-message'>This order was cancelled.</p>"
                                : ""
                        }
                    </div>
                </article>
            `;
        }).join("");
    } catch (error) {
        console.error("My Orders error:", error);
        myOrdersMessage.textContent = error.message;
    }
}

if (refreshOrdersButton) {
    refreshOrdersButton.addEventListener("click", loadMyOrders);
}

// Initialize the website.
updateAuthNavigation();
loadFoods();
loadRecommendations();
loadMyOrders();
