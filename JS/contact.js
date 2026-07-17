const API_BASE_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:")
    ? "http://localhost:5000"
    : "/api";

document.getElementById("contactForm").addEventListener("submit", async function(e) {

    e.preventDefault();

    const data = {
        name: document.getElementById("contactName").value,
        email: document.getElementById("contactEmail").value,
        phone: document.getElementById("contactPhone").value,
        message: document.getElementById("contactMessage").value
    };

    try {

        const response = await fetch(`${API_BASE_URL}/contact`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        alert(result.message);

        document.getElementById("contactForm").reset();

    }
    catch(error){
        alert("Server connection failed");
        console.error(error);
    }

});