{
    const API_BASE_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:")
        ? "http://localhost:5000"
        : "https://luxury-hotel-website-9cwx.onrender.com";

    const form = document.getElementById("loginForm");

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
                alert("✅ Login Successful!");

                if (data.user && data.user.role === "admin") {
                    window.location.href = "admin.html";
                } else {
                    window.location.href = "home.html";
                }
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert("Server Error");
            console.log(error);
        }
    });
}