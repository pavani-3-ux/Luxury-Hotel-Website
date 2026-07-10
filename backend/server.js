const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

const filePath = path.join(__dirname, "bookings.json");

app.get("/", (req, res) => {
    res.send("Luxury Hotel Backend Running");
});

app.post("/book-room", (req, res) => {

    let bookings = [];

    if (fs.existsSync(filePath)) {
        bookings = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }

    const booking = {
        id: Date.now(),
        ...req.body
    };

    bookings.push(booking);

    fs.writeFileSync(filePath, JSON.stringify(bookings, null, 2));

    res.json({
        success: true,
        message: "Booking Successful!"
    });

});

app.get("/bookings", (req, res) => {

    if (!fs.existsSync(filePath)) {
        return res.json([]);
    }

    const bookings = JSON.parse(fs.readFileSync(filePath, "utf8"));

    res.json(bookings);

});

app.listen(5000, () => {
    console.log("Server Running On Port 5000");
});