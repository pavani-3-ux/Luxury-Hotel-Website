{
    const API_BASE_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:")
        ? "http://localhost:5000"
        : "https://luxury-hotel-website-9cwx.onrender.com";

    document.getElementById("contactForm").addEventListener("submit", async function(e) {
        e.preventDefault();

        const data = {
            name: document.getElementById("name").value,
            email: document.getElementById("email").value,
            phone: document.getElementById("phone").value,
            message: document.getElementById("message").value
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
        }
    });
}