
import express from "express";
import bcrypt from "bcryptjs";
import cors from "cors";
import pool from "./database/db.js";
const app = express();
const PORT = 4142;

app.use(express.json());
app.use(cors());

// 1. Foydalanuvchini ro'yxatdan o'tkazish
app.post("/users/register", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Username va password kiriting"
            });
        }

        const existingUser = await pool.query(
            "SELECT id FROM users WHERE username = $1",
            [username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                message: "Bu username band"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (username, password_hash)
             VALUES ($1, $2)
             RETURNING id, username`,
            [username, passwordHash]
        );

        return res.status(201).json({
            message: "Foydalanuvchi yaratildi",
            user: result.rows[0]
        });
    } catch (error) {
        console.error(error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "Bu username band"
            });
        }

        return res.status(500).json({
            message: "Server xatosi"
        });
    }
});

// 2. Barcha foydalanuvchilarni olish
app.get("/users", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, username FROM users ORDER BY id"
        );

        return res.json(result.rows);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Foydalanuvchilarni olishda xato"
        });
    }
});

// 3. Barcha ovqatlarni olish
app.get("/foods", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name, image FROM foods ORDER BY id"
        );

        return res.json(result.rows);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Ovqatlarni olishda xato"
        });
    }
});

// 4. Buyurtma yaratish
app.post("/orders", async (req, res) => {
    try {
        const { userId, foodId, count } = req.body;

        const userID = Number(userId);
        const foodID = Number(foodId);
        const quantity = Number(count);

        if (
            !Number.isInteger(userID) || userID < 1 ||
            !Number.isInteger(foodID) || foodID < 1 ||
            !Number.isInteger(quantity) || quantity < 1
        ) {
            return res.status(400).json({
                message: "userId, foodId va count to'g'ri kiritilishi kerak"
            });
        }

        const user = await pool.query(
            "SELECT id FROM users WHERE id = $1",
            [userID]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({
                message: "Foydalanuvchi topilmadi"
            });
        }

        const food = await pool.query(
            "SELECT id FROM foods WHERE id = $1",
            [foodID]
        );

        if (food.rows.length === 0) {
            return res.status(404).json({
                message: "Ovqat topilmadi"
            });
        }

        const result = await pool.query(
            `INSERT INTO orders (user_id, food_id, count)
             VALUES ($1, $2, $3)
             RETURNING id, user_id AS "userId",
                       food_id AS "foodId", count`,
            [userID, foodID, quantity]
        );

        return res.status(201).json({
            message: "Buyurtma saqlandi",
            order: result.rows[0]
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Buyurtma saqlashda xato"
        });
    }
});

// 5. Muayyan foydalanuvchining buyurtmalarini olish
app.get("/orders/:userId", async (req, res) => {
    try {
        const userId = Number(req.params.userId);

        if (!Number.isInteger(userId) || userId < 1) {
            return res.status(400).json({
                message: "Foydalanuvchi ID noto'g'ri"
            });
        }

        const user = await pool.query(
            "SELECT id FROM users WHERE id = $1",
            [userId]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({
                message: "Foydalanuvchi topilmadi"
            });
        }

        const result = await pool.query(
            `SELECT id, user_id AS "userId",
                    food_id AS "foodId", count
             FROM orders
             WHERE user_id = $1
             ORDER BY id`,
            [userId]
        );

        return res.json(result.rows);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Buyurtmalarni olishda xato"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server http://localhost:${PORT} da ishlayapti`);
});

