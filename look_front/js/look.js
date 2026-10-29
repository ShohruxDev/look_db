
const API = "http://localhost:4142";

const userAdd = document.querySelector("#userAdd");
const usernameInput = document.querySelector("#usernameInput");
const passwordInput = document.querySelector("#passwordInput");

const customersList = document.querySelector(".customers-list");
const ordersList = document.querySelector(".orders-list");
const foodsSelect = document.querySelector("#foodsSelect");
const foodsCount = document.querySelector("#foodsCount");
const foodsForm = document.querySelector("#foodsForm");

const clientId = document.querySelector("#clientId");
const userHeader = document.querySelector("#userHeader");

let users = [];
let foods = [];
let selectedUserId = null;

async function request(url, options = {}) {
    const response = await fetch(`${API}${url}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Xatolik yuz berdi");
    }

    return data;
}

async function loadFoods() {
    foods = await request("/foods");

    foodsSelect.innerHTML = "";

    foods.forEach((food) => {
        const option = document.createElement("option");
        option.value = food.id;
        option.textContent = food.name;
        foodsSelect.append(option);
    });
}

async function loadUsers() {
    users = await request("/users");
    customersList.innerHTML = "";

    users.forEach((user) => {
        const li = document.createElement("li");
        li.className = "customer-item";

        const name = document.createElement("span");
        name.className = "customer-name";
        name.textContent = user.username;

        li.append(name);

        li.addEventListener("click", () => {
            selectUser(user);
        });

        customersList.append(li);
    });

    if (users.length > 0) {
        const user = users.find(
            (item) => item.id === selectedUserId
        ) || users[0];

        await selectUser(user);
    } else {
        selectedUserId = null;
        clientId.textContent = "-";
        userHeader.textContent = "Foydalanuvchi tanlanmagan";
        ordersList.innerHTML = "";
    }
}

async function selectUser(user) {
    selectedUserId = user.id;

    clientId.textContent = user.id;
    userHeader.textContent = user.username;

    await loadOrders(user.id);
}

async function loadOrders(userId) {
    const orders = await request(`/orders/${userId}`);

    ordersList.innerHTML = "";

    orders.forEach((order) => {
        const food = foods.find(
            (item) => item.id === order.foodId
        );

        if (!food) return;

        const li = document.createElement("li");
        li.className = "order-item";

        const img = document.createElement("img");
        img.src = `./img/${food.image}`;
        img.alt = food.name;

        const details = document.createElement("div");

        const name = document.createElement("span");
        name.className = "order-name";
        name.textContent = food.name;

        const count = document.createElement("span");
        count.className = "order-count";
        count.textContent = order.count;

        details.append(name, count);
        li.append(img, details);
        ordersList.append(li);
    });
}

userAdd.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        await request("/users/register", {
            method: "POST",
            body: JSON.stringify({
                username: usernameInput.value.trim(),
                password: passwordInput.value
            })
        });

        userAdd.reset();
        await loadUsers();

        alert("Foydalanuvchi qo'shildi!");
    } catch (error) {
        alert(error.message);
    }
});

foodsForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!selectedUserId) {
        alert("Avval foydalanuvchini tanlang!");
        return;
    }

    const foodId = Number(foodsSelect.value);
    const count = Number(foodsCount.value);

    if (!Number.isInteger(count) || count < 1) {
        alert("Ovqat soni kamida 1 bo'lishi kerak");
        return;
    }

    try {
        await request("/orders", {
            method: "POST",
            body: JSON.stringify({
                userId: selectedUserId,
                foodId,
                count
            })
        });

        foodsCount.value = "";
        await loadOrders(selectedUserId);

        alert("Buyurtma saqlandi!");
    } catch (error) {
        alert(error.message);
    }
});

async function init() {
    try {
        await loadFoods();
        await loadUsers();
    } catch (error) {
        console.error(error);
        alert("Backendga ulanishda xato: " + error.message);
    }
}

init();
