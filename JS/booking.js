// ===== Auto Select Room =====
{
    const params = new URLSearchParams(window.location.search);
    const selectedRoom = params.get("room");

    if (selectedRoom) {
        const roomSelect = document.getElementById("room");
        if (roomSelect) {
            roomSelect.value = selectedRoom;
        }
    }

    const API_BASE_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:")
        ? "http://localhost:5000"
        : "/api";

    const bookingForm = document.getElementById("bookingForm");

    bookingForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const phone = document.getElementById("phone").value;
        const checkin = document.getElementById("checkin").value;
        const checkout = document.getElementById("checkout").value;
        const room = document.getElementById("room").value;
        const guests = document.getElementById("guests").value;
        const message = document.getElementById("message").value;

        // Retrieve logged in user's ID
        let userId = "guest";
        try {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const userObj = JSON.parse(userStr);
                if (userObj && userObj.id) {
                    userId = userObj.id;
                }
            }
        } catch (err) {
            console.error("Error parsing user from localStorage:", err);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/bookings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userId,
                    name,
                    email,
                    phone,
                    checkin,
                    checkout,
                    room,
                    guests,
                    message
                })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem(
                    "bookingReceipt",
                    JSON.stringify({
                        bookingId: data.booking.id,
                        guestName: data.booking.name,
                        email: data.booking.email,
                        phone: data.booking.phone,
                        roomType: data.booking.room,
                        checkInDate: data.booking.checkin,
                        checkOutDate: data.booking.checkout,
                        totalGuests: data.booking.guests,
                        specialRequest: data.booking.message,
                        status: data.booking.status
                    })
                );

                window.location.href = "receipt.html";
            } else {
                alert(data.message || "Booking failed");
            }
        } catch (error) {
            alert("Server connection failed");
            console.log(error);
        }
    });
}