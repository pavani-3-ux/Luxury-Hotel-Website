const compression = require("compression");
const validator = require("validator");
const helmet = require("helmet");
require("dotenv").config();
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const rateLimit = require("express-rate-limit");

const app = express();

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(requestLogger);

const bookingsPath = path.join(__dirname, "bookings.json");
const messagesPath = path.join(__dirname, "messages.json");
const adminPath = path.join(__dirname, "admin.json");
const JWT_SECRET = process.env.JWT_SECRET;

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: "Too many login attempts. Try again after 15 minutes."
    }
});

function requestLogger(req, res, next) {

    const log = `${new Date().toISOString()} | ${req.method} | ${req.url}\n`;

    fs.appendFileSync("logs.txt", log);

    next();
}

function verifyToken(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: "Access denied. No token provided."
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid token"
        });

    }
}

app.get("/", (req, res) => {
    res.send("Luxury Hotel Backend Running");
});

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        serverTime: new Date(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development"
    });
});

/* ===========================
   ROOM BOOKING API
=========================== */

function validateBooking(req, res, next) {

    const {
        name,
        email,
        phone
    } = req.body;

    if (!name || name.trim().length < 3) {
        return res.status(400).json({
            success: false,
            message: "Name must contain at least 3 characters"
        });
    }

    if (!email || !validator.isEmail(email)) {
        return res.status(400).json({
            success: false,
            message: "Invalid email address"
        });
    }

    if (!phone || !validator.isMobilePhone(phone, "en-IN")) {
        return res.status(400).json({
            success: false,
            message: "Invalid phone number"
        });
    }

    next();
}

app.post("/book-room", validateBooking, (req, res) => {

    let bookings = [];

    if (fs.existsSync(bookingsPath)) {
        bookings = JSON.parse(
            fs.readFileSync(bookingsPath, "utf8")
        );
    }

   const {
    room,
    checkIn,
    checkOut
} = req.body;

const roomAlreadyBooked = bookings.some(existingBooking => {

    if (
        existingBooking.room !== room ||
        existingBooking.status === "Cancelled"
    ) {
        return false;
    }

    const existingCheckIn = new Date(existingBooking.checkIn);
    const existingCheckOut = new Date(existingBooking.checkOut);

    const newCheckIn = new Date(checkIn);
    const newCheckOut = new Date(checkOut);

    return (
        newCheckIn < existingCheckOut &&
        newCheckOut > existingCheckIn
    );
});

if (roomAlreadyBooked) {
    return res.status(400).json({
        success: false,
        message: "Room not available for selected dates"
    });
}

const booking = {
    id: Date.now(),
    status: "Pending",
    createdAt: new Date(),
    ...req.body
};

bookings.push(booking);

fs.writeFileSync(
    bookingsPath,
    JSON.stringify(bookings, null, 2)
);

res.json({
    success: true,
    message: "Booking Successful!",
    booking
});

    res.json({
        success: true,
        message: "Booking Successful!",
        booking
    });

});


/* ===========================
   GET ALL BOOKINGS
=========================== */

app.get("/bookings", verifyToken, (req, res) => {

    if (!fs.existsSync(bookingsPath)) {
        return res.json([]);
    }

    const bookings = JSON.parse(
        fs.readFileSync(bookingsPath, "utf8")
    );

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedBookings = bookings.slice(
        startIndex,
        endIndex
    );

    res.json({
        totalBookings: bookings.length,
        currentPage: page,
        totalPages: Math.ceil(bookings.length / limit),
        bookings: paginatedBookings
    });

});

app.get("/bookings/search", verifyToken, (req, res) => {

    if (!fs.existsSync(bookingsPath)) {
        return res.json([]);
    }

    let bookings = JSON.parse(
        fs.readFileSync(bookingsPath, "utf8")
    );

    const { name, status, room } = req.query;

    if (name) {
        bookings = bookings.filter(booking =>
            booking.name &&
            booking.name.toLowerCase().includes(name.toLowerCase())
        );
    }

    if (status) {
        bookings = bookings.filter(booking =>
            booking.status &&
            booking.status.toLowerCase() === status.toLowerCase()
        );
    }

    if (room) {
        bookings = bookings.filter(booking =>
            booking.room &&
            booking.room.toLowerCase().includes(room.toLowerCase())
        );
    }

    res.json(bookings);

});


/* ===========================
   CONTACT FORM API
=========================== */

app.post("/contact", validateBooking, (req, res) => {

    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    let messages = [];

    if (fs.existsSync(messagesPath)) {
        messages = JSON.parse(
            fs.readFileSync(messagesPath, "utf8")
        );
    }

    const newMessage = {
        id: Date.now(),
        name,
        email,
        phone,
        message,
        createdAt: new Date()
    };

    messages.push(newMessage);

    fs.writeFileSync(
        messagesPath,
        JSON.stringify(messages, null, 2)
    );

    res.json({
        success: true,
        message: "Message sent successfully"
    });

});


/* ===========================
   GET ALL CONTACT MESSAGES
=========================== */

app.get("/messages", verifyToken, (req, res) =>  {

    if (!fs.existsSync(messagesPath)) {
        return res.json([]);
    }

    const messages = JSON.parse(
        fs.readFileSync(messagesPath, "utf8")
    );

    res.json(messages);

});


/* ===========================
   UPDATE BOOKING STATUS
=========================== */

app.put("/booking/:id/status", (req, res) => {

    const { status } = req.body;

    if (!fs.existsSync(bookingsPath)) {
        return res.status(404).json({
            success: false,
            message: "No bookings found"
        });
    }

    const bookings = JSON.parse(
        fs.readFileSync(bookingsPath, "utf8")
    );

    const booking = bookings.find(
        b => b.id == req.params.id
    );

    if (!booking) {
        return res.status(404).json({
            success: false,
            message: "Booking not found"
        });
    }

    booking.status = status;

    fs.writeFileSync(
        bookingsPath,
        JSON.stringify(bookings, null, 2)
    );

    res.json({
        success: true,
        message: "Booking status updated",
        booking
    });

});


/* ===========================
   DELETE BOOKING
=========================== */

app.delete("/booking/:id", (req, res) => {

    if (!fs.existsSync(bookingsPath)) {
        return res.status(404).json({
            success: false,
            message: "No bookings found"
        });
    }

    let bookings = JSON.parse(
        fs.readFileSync(bookingsPath, "utf8")
    );

    const bookingExists = bookings.some(
        booking => booking.id == req.params.id
    );

    if (!bookingExists) {
        return res.status(404).json({
            success: false,
            message: "Booking not found"
        });
    }

    bookings = bookings.filter(
        booking => booking.id != req.params.id
    );

    fs.writeFileSync(
        bookingsPath,
        JSON.stringify(bookings, null, 2)
    );

    res.json({
        success: true,
        message: "Booking cancelled successfully"
    });

});


/* ===========================
   PROJECT STATISTICS API
=========================== */

app.get("/stats", verifyToken, (req, res) =>  {

    if (!fs.existsSync(bookingsPath)) {
        return res.json({
            totalBookings: 0,
            totalGuests: 0,
            pendingBookings: 0,
            confirmedBookings: 0,
            cancelledBookings: 0
        });
    }

    const bookings = JSON.parse(
        fs.readFileSync(bookingsPath, "utf8")
    );

    const totalGuests = bookings.reduce(
        (sum, booking) =>
            sum + Number(booking.guests || 0),
        0
    );

    const pendingBookings = bookings.filter(
        booking => booking.status === "Pending"
    ).length;

    const confirmedBookings = bookings.filter(
        booking => booking.status === "Confirmed"
    ).length;

    const cancelledBookings = bookings.filter(
        booking => booking.status === "Cancelled"
    ).length;

    res.json({
        totalBookings: bookings.length,
        totalGuests,
        pendingBookings,
        confirmedBookings,
        cancelledBookings
    });

});



const PORT = process.env.PORT || 5000;

app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(500).json({
        success: false,
        message: "Something went wrong on the server."
    });
});

const usersPath = path.join(__dirname, "users.json");

app.post("/register", async (req, res) => {

    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    let users = [];

    if (fs.existsSync(usersPath)) {
        users = JSON.parse(
            fs.readFileSync(usersPath, "utf8")
        );
    }

    const existingUser = users.find(
        user => user.email === email
    );

    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: "User already exists"
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
        id: Date.now(),
        name,
        email,
        phone,
        password: hashedPassword,
        createdAt: new Date()
    };

    users.push(newUser);

    fs.writeFileSync(
        usersPath,
        JSON.stringify(users, null, 2)
    );

    res.json({
        success: true,
        message: "Registration successful"
    });

});

app.post("/login", async (req, res) => {

    const { email, password } = req.body;

    let users = [];

    if (fs.existsSync(usersPath)) {
        users = JSON.parse(
            fs.readFileSync(usersPath, "utf8")
        );
    }

    const user = users.find(
        user => user.email === email
    );

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Invalid Email or Password"
        });
    }

    const validPassword = await bcrypt.compare(
        password,
        user.password
    );

    if (!validPassword) {
        return res.status(401).json({
            success: false,
            message: "Invalid Email or Password"
        });
    }

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "24h"
        }
    );

    res.json({
        success: true,
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        }
    });

});

app.listen(PORT, () => {
    console.log(`Server Running On Port ${PORT}`);
});