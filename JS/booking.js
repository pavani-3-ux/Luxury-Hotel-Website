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

    localStorage.setItem(
        "bookingReceipt",
        JSON.stringify({
            bookingId: "RC" + Date.now(),
            guestName: name,
            email: email,
            phone: phone,
            roomType: room,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            totalGuests: guests,
            specialRequest: message,
            status: "Confirmed"
        })
    );

    window.location.href = "receipt.html";

});