const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const USERS_FILE = path.join(__dirname, "users.json");

// users.json create if not exists
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, "[]");
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

    let users = JSON.parse(fs.readFileSync(USERS_FILE));

    const existingUser = users.find(
        user => user.email.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
        return res.json({
            success: false,
            message: "User already exists"
        });
    }

    const newUser = {
        id: Date.now(),
        name,
        email,
        phone,
        password
    };

    users.push(newUser);

    fs.writeFileSync(
        USERS_FILE,
        JSON.stringify(users, null, 2)
    );

    return res.json({
        success: true,
        message: "Registration Successful"
    });

});

// ================= LOGIN =================

app.post("/login", (req, res) => {

    console.log("LOGIN API HIT");

    const { email, password } = req.body;

    let users = JSON.parse(fs.readFileSync(USERS_FILE));

    const user = users.find(
        u =>
            u.email === email &&
            u.password === password
    );

    if (!user) {

        return res.json({
            success: false,
            message: "Invalid Email or Password"
        });

    }

    return res.json({
        success: true,
        message: "Login Successful",
        user
    });

});

// ================= CONTACT =================

app.post("/contact", (req, res) => {

    res.json({
        success: true,
        message: "Message Sent Successfully"
    });

});

app.listen(PORT, () => {
    console.log(`✅ Server Running On Port ${PORT}`);
});