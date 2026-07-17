console.log("REGISTER JS LOADED");

{
    const API_BASE_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:")
        ? "http://localhost:5000"
        : "https://luxury-hotel-website-9cwx.onrender.com";

    const registerForm = document.getElementById("registerForm");

    registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const name = document.getElementById("name").value;
        const email = document.getElementById("registerEmail").value;
        const phone = document.getElementById("phone").value;
        const password = document.getElementById("registerPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    password
                })
            });

            const data = await response.json();

            if (data.success) {
                alert("🎉 Registration Successful!");
                document.getElementById("email").value = email;
                document.getElementById("password").focus();
                registerForm.reset();
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert("Server Error");
            console.log(error);
        }
    });
}