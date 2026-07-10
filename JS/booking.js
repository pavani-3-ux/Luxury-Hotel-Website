const form = document.getElementById("bookingForm");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    console.log("Submit button clicked");

    const booking = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        checkin: document.getElementById("checkin").value,
        checkout: document.getElementById("checkout").value,
        room: document.getElementById("room").value,
        guests: document.getElementById("guests").value,
        message: document.getElementById("message").value
    };

    console.log(booking);

    try {
        const response = await fetch("http://localhost:5000/book-room", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(booking)
        });

        console.log(response.status);

        const data = await response.json();

        console.log(data);

        alert(data.message);

    } catch (err) {
        console.error(err);
        alert("Backend not connected");
    }
});