
const API_URL = "http://localhost:8080/api/orders";

const tableBody = document.getElementById("orders-table-body");
const ordersMessage = document.getElementById("orders-message");

async function loadOrders() {
    ordersMessage.textContent = "Loading orders...";
    tableBody.replaceChildren();

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Unable to retrieve orders.");
        }

        const orders = await response.json();

        document.getElementById("total-orders").textContent =
            orders.length;

        document.getElementById("placed-orders").textContent =
            orders.filter(order => order.status === "PLACED").length;

        document.getElementById("delivered-orders").textContent =
            orders.filter(order => order.status === "DELIVERED").length;

        const revenue = orders.reduce(
            (sum, order) => sum + Number(order.totalAmount || 0),
            0
        );

        document.getElementById("total-revenue").textContent =
            `₹${revenue.toFixed(2)}`;

        if (orders.length === 0) {
            ordersMessage.textContent = "No customer orders found.";
            return;
        }

        ordersMessage.textContent = `${orders.length} order(s) found.`;

        orders.sort((a, b) => b.id - a.id);

        orders.forEach(order => {
            const row = document.createElement("tr");

            const values = [
                `#${order.id}`,
                order.customerName,
                order.phone,
                order.deliveryAddress,
                (order.items || []).map(item =>
                    `${item.foodName} × ${item.quantity}`
                ).join(", "),
                `₹${Number(order.totalAmount).toFixed(2)}`,
                order.paymentMethod,
                order.status
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "";
                row.appendChild(cell);
            });

            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading orders:", error);
        ordersMessage.textContent =
            "Could not load orders. Check that the backend is running.";
    }
}

document.getElementById("refresh-orders").addEventListener(
    "click",
    loadOrders
);

loadOrders();
