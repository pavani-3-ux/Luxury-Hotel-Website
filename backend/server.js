require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "royal_crest_secret_key_123";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/royalcrest";

app.use(cors());
app.use(express.json());

const USERS_FILE = path.join(__dirname, "users.json");
const BOOKINGS_FILE = path.join(__dirname, "bookings.json");

// Define Mongoose Schemas & Models
const userSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    createdAt: { type: String, default: () => new Date().toISOString() }
});

const bookingSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    userId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    checkin: { type: String, required: true },
    checkout: { type: String, required: true },
    room: { type: String, required: true },
    guests: { type: String, required: true },
    message: { type: String, default: "" },
    status: { type: String, default: "Confirmed" },
    bookedAt: { type: String, default: () => new Date().toISOString() }
});

const User = mongoose.model("User", userSchema);
const Booking = mongoose.model("Booking", bookingSchema);

// Seeding / Migration Function
async function seedDatabase() {
    try {
        const userCount = await User.countDocuments();
        if (userCount === 0 && fs.existsSync(USERS_FILE)) {
            console.log("Seeding Users to MongoDB Atlas...");
            const rawUsers = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
            const usersToInsert = rawUsers.map(user => {
                // Securely hash plain-text passwords during migration
                let hashedPassword = user.password;
                if (user.password && !user.password.startsWith("$2b$")) {
                    hashedPassword = bcrypt.hashSync(user.password, 10);
                }
                return {
                    id: user.id || Date.now(),
                    name: user.name,
                    email: user.email.toLowerCase(),
                    phone: user.phone,
                    password: hashedPassword,
                    createdAt: user.createdAt || new Date().toISOString()
                };
            });
            if (usersToInsert.length > 0) {
                await User.insertMany(usersToInsert);
                console.log(`Successfully migrated ${usersToInsert.length} users.`);
            }
        }

        const bookingCount = await Booking.countDocuments();
        if (bookingCount === 0 && fs.existsSync(BOOKINGS_FILE)) {
            console.log("Seeding Bookings to MongoDB Atlas...");
            const bookingsToInsert = JSON.parse(fs.readFileSync(BOOKINGS_FILE, "utf-8"));
            if (bookingsToInsert.length > 0) {
                await Booking.insertMany(bookingsToInsert);
                console.log(`Successfully migrated ${bookingsToInsert.length} bookings.`);
            }
        }
    } catch (error) {
        console.error("❌ Error during database seeding/migration:", error);
    }
}

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log("✅ Connected to MongoDB Atlas");
        await seedDatabase();
    })
    .catch(err => {
        console.error("❌ MongoDB Atlas Connection Error:", err);
    });

// Test API
app.get("/", (req, res) => {
    res.send("Royal Crest Backend Running...");
});

// ================= REGISTER =================
app.post("/register", async (req, res) => {
    console.log("REGISTER API HIT");
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
        return res.json({
            success: false,
            message: "Please fill all fields"
        });
    }

    try {
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.json({
                success: false,
                message: "User already exists"
            });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const newUser = new User({
            id: Date.now(),
            name,
            email: email.toLowerCase(),
            phone,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        });

        await newUser.save();
        return res.json({
            success: true,
            message: "Registration Successful"
        });

    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ success: false, message: "Server Error during registration" });
    }
});

// ================= LOGIN =================
app.post("/login", async (req, res) => {
    console.log("LOGIN API HIT");
    const { email, password } = req.body;

    // Admin Credential check
    if (email === "admin@royalcrest.com" && password === "Royal@123") {
        const token = jwt.sign(
            { id: "admin", email: "admin@royalcrest.com", role: "admin" },
            JWT_SECRET,
            { expiresIn: "24h" }
        );
        return res.json({
            success: true,
            message: "Admin Login Successful",
            token,
            user: {
                id: "admin",
                name: "Administrator",
                email: "admin@royalcrest.com",
                role: "admin"
            }
        });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.json({
                success: false,
                message: "Invalid Email or Password"
            });
        }

        // Check password (supports both plain text and bcrypt hash)
        let validPassword = false;
        if (user.password && user.password.startsWith("$2b$")) {
            validPassword = bcrypt.compareSync(password, user.password);
        } else {
            validPassword = (user.password === password);
        }

        if (!validPassword) {
            return res.json({
                success: false,
                message: "Invalid Email or Password"
            });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: "user" },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        return res.json({
            success: true,
            message: "Login Successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: "user"
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ success: false, message: "Server Error during login" });
    }
});

// ================= BOOKINGS =================

// Create booking
app.post("/bookings", async (req, res) => {
    console.log("CREATE BOOKING API HIT");
    const { userId, name, email, phone, checkin, checkout, room, guests, message } = req.body;

    if (!name || !email || !phone || !checkin || !checkout || !room || !guests) {
        return res.json({
            success: false,
            message: "Please fill all required fields"
        });
    }

    try {
        const newBooking = new Booking({
            id: Date.now(),
            userId: userId || "guest",
            name,
            email,
            phone,
            checkin,
            checkout,
            room,
            guests: String(guests),
            message: message || "",
            status: "Confirmed",
            bookedAt: new Date().toISOString()
        });

        await newBooking.save();

        return res.json({
            success: true,
            message: "Booking Successful",
            booking: newBooking
        });

    } catch (error) {
        console.error("Create booking error:", error);
        return res.status(500).json({ success: false, message: "Server Error while booking" });
    }
});

// Get all bookings
app.get("/bookings", async (req, res) => {
    console.log("GET ALL BOOKINGS HIT");
    try {
        const bookings = await Booking.find({});
        return res.json(bookings);
    } catch (error) {
        console.error("Get bookings error:", error);
        return res.status(500).json({ message: "Server Error retrieving bookings" });
    }
});

// Update booking status
app.put("/bookings/:id/status", async (req, res) => {
    console.log(`UPDATE BOOKING STATUS HIT: ${req.params.id}`);
    const bookingId = parseInt(req.params.id);
    const { status } = req.body;

    if (!status) {
        return res.json({ success: false, message: "Status is required" });
    }

    try {
        const booking = await Booking.findOneAndUpdate(
            { id: bookingId },
            { status },
            { new: true }
        );

        if (!booking) {
            return res.json({ success: false, message: "Booking not found" });
        }

        return res.json({
            success: true,
            message: `Booking status updated to ${status}`,
            booking
        });
    } catch (error) {
        console.error("Update status error:", error);
        return res.status(500).json({ success: false, message: "Server Error updating status" });
    }
});

// Delete booking
app.delete("/bookings/:id", async (req, res) => {
    console.log(`DELETE BOOKING HIT: ${req.params.id}`);
    const bookingId = parseInt(req.params.id);

    try {
        const booking = await Booking.findOneAndDelete({ id: bookingId });
        if (!booking) {
            return res.json({ success: false, message: "Booking not found" });
        }

        return res.json({
            success: true,
            message: "Booking deleted successfully"
        });
    } catch (error) {
        console.error("Delete booking error:", error);
        return res.status(500).json({ success: false, message: "Server Error deleting booking" });
    }
});

// ================= USERS =================

// Get all users (for admin dashboard)
app.get("/users", async (req, res) => {
    console.log("GET ALL USERS HIT");
    try {
        const users = await User.find({});
        
        // Return safe data (exclude passwords)
        const safeUsers = users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            createdAt: u.createdAt || new Date(u.id).toISOString()
        }));

        return res.json(safeUsers);
    } catch (error) {
        console.error("Get users error:", error);
        return res.status(500).json({ message: "Server Error retrieving users" });
    }
});

// ================= CONTACT =================
app.post("/contact", (req, res) => {
    console.log("CONTACT API HIT");
    res.json({
        success: true,
        message: "Message Sent Successfully"
    });
});

app.listen(PORT, () => {
    console.log(`✅ Server Running On Port ${PORT}`);
});