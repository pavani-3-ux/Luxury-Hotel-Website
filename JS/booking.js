const API_BASE_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:")
    ? "http://localhost:5000"
    : "/api";

// ===== Auto Select Room =====

const params = new URLSearchParams(window.location.search);

const selectedRoom = params.get("room");

if (selectedRoom) {

    const roomSelect = document.getElementById("room");

    if (roomSelect) {

        roomSelect.value = selectedRoom;

    }

}
const bookingForm = document.getElementById("bookingForm");

bookingForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;

    const checkIn = document.getElementById("checkin").value;
    const checkOut = document.getElementById("checkout").value;

    const room = document.getElementById("room").value;
    const guests = document.getElementById("guests").value;
    const message = document.getElementById("message").value;

    const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = loggedInUser.id || "guest";

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
                checkin: checkIn,
                checkout: checkOut,
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
                    bookingId: "RC" + data.booking.id,
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
            alert("Booking failed: " + data.message);
        }
    } catch (error) {
        alert("Server Error. Please make sure the backend is running.");
        console.error(error);
    }

});