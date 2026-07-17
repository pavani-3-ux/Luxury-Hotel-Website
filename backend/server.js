const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const USERS_FILE = path.join(__dirname, "users.json");
const BOOKINGS_FILE = path.join(__dirname, "bookings.json");

// Create files if they don't exist
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, "[]");
}
if (!fs.existsSync(BOOKINGS_FILE)) {
    fs.writeFileSync(BOOKINGS_FILE, "[]");
}

// Test API
app.get("/", (req, res) => {
    res.send("Royal Crest Backend Running...");
});

// ================= REGISTER =================

app.post("/register", (req, res) => {
    console.log("REGISTER API HIT");
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
        return res.json({
            success: false,
            message: "Please fill all fields"
        });
    }

    let users = [];
    try {
        users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8") || "[]");
    } catch (e) {
        users = [];
    }

    const existingUser = users.find(
        user => user.email.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
        return res.json({
            success: false,
            message: "User already exists"
        });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = {
        id: Date.now(),
        name,
        email,
        phone,
        password: hashedPassword,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

    return res.json({
        success: true,
        message: "Registration Successful"
    });
});

// ================= LOGIN =================

app.post("/login", (req, res) => {
    console.log("LOGIN API HIT");
    const { email, password } = req.body;

    // Admin Credential check
    if (email === "admin@royalcrest.com" && password === "Royal@123") {
        const token = jwt.sign(
            { id: "admin", email: "admin@royalcrest.com", role: "admin" },
            "royal_crest_secret_key_123",
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

    let users = [];
    try {
        users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8") || "[]");
    } catch (e) {
        users = [];
    }
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
        return res.json({
            success: false,
            message: "Invalid Email or Password"
        });
    }

    // Check password (supports both plain text and bcrypt hash)
    let validPassword = false;
    if (user.password && user.password.startsWith("$2b$")) {
        try {
            validPassword = bcrypt.compareSync(password, user.password);
        } catch (e) {
            validPassword = false;
        }
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
        "royal_crest_secret_key_123",
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
            phone: user.phone
        }
    });
});

// ================= BOOKINGS =================

// Create booking
app.post("/bookings", (req, res) => {
    console.log("CREATE BOOKING API HIT");
    const { userId, name, email, phone, checkin, checkout, room, guests, message } = req.body;

    if (!name || !email || !phone || !checkin || !checkout || !room || !guests) {
        return res.json({
            success: false,
            message: "Please fill all required fields"
        });
    }

    let bookings = [];
    try {
        bookings = JSON.parse(fs.readFileSync(BOOKINGS_FILE, "utf8") || "[]");
    } catch (e) {
        bookings = [];
    }

    const newBooking = {
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
    };

    bookings.push(newBooking);
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));

    return res.json({
        success: true,
        message: "Booking Successful",
        booking: newBooking
    });
});

// Get all bookings
app.get("/bookings", (req, res) => {
    console.log("GET ALL BOOKINGS HIT");
    let bookings = [];
    try {
        bookings = JSON.parse(fs.readFileSync(BOOKINGS_FILE, "utf8") || "[]");
    } catch (e) {
        bookings = [];
    }
    return res.json(bookings);
});

// Update booking status
app.put("/bookings/:id/status", (req, res) => {
    console.log(`UPDATE BOOKING STATUS HIT: ${req.params.id}`);
    const bookingId = parseInt(req.params.id);
    const { status } = req.body;

    if (!status) {
        return res.json({ success: false, message: "Status is required" });
    }

    let bookings = [];
    try {
        bookings = JSON.parse(fs.readFileSync(BOOKINGS_FILE, "utf8") || "[]");
    } catch (e) {
        bookings = [];
    }
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);

    if (bookingIndex === -1) {
        return res.json({ success: false, message: "Booking not found" });
    }

    bookings[bookingIndex].status = status;
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));

    return res.json({
        success: true,
        message: `Booking status updated to ${status}`,
        booking: bookings[bookingIndex]
    });
});

// Delete booking
app.delete("/bookings/:id", (req, res) => {
    console.log(`DELETE BOOKING HIT: ${req.params.id}`);
    const bookingId = parseInt(req.params.id);

    let bookings = [];
    try {
        bookings = JSON.parse(fs.readFileSync(BOOKINGS_FILE, "utf8") || "[]");
    } catch (e) {
        bookings = [];
    }
    const bookingExists = bookings.some(b => b.id === bookingId);

    if (!bookingExists) {
        return res.json({ success: false, message: "Booking not found" });
    }

    const filteredBookings = bookings.filter(b => b.id !== bookingId);
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(filteredBookings, null, 2));

    return res.json({
        success: true,
        message: "Booking deleted successfully"
    });
});

// ================= USERS =================

// Get all users (for admin dashboard)
app.get("/users", (req, res) => {
    console.log("GET ALL USERS HIT");
    let users = [];
    try {
        users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8") || "[]");
    } catch (e) {
        users = [];
    }
    
    // Return safe data (exclude passwords)
    const safeUsers = users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        createdAt: u.createdAt || new Date(u.id).toISOString()
    }));

    return res.json(safeUsers);
});

// Delete user
app.delete("/users/:id", (req, res) => {
    console.log(`DELETE USER HIT: ${req.params.id}`);
    const userId = parseInt(req.params.id);

    let users = [];
    try {
        users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8") || "[]");
    } catch (e) {
        users = [];
    }

    const user = users.find(u => u.id === userId || String(u.id) === req.params.id);
    if (!user) {
        return res.json({ success: false, message: "User not found" });
    }

    // Protect admin user
    if (req.params.id === "admin" || (user.email && user.email.toLowerCase() === "admin@royalcrest.com")) {
        return res.json({ success: false, message: "Cannot delete Administrator" });
    }

    const filteredUsers = users.filter(u => u.id !== userId && String(u.id) !== req.params.id);
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(filteredUsers, null, 2));
    } catch (e) {
        return res.json({ success: false, message: "Failed to write user data" });
    }

    return res.json({
        success: true,
        message: "User deleted successfully"
    });
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