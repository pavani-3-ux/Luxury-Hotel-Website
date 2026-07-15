const form = document.getElementById("loginForm");

form.addEventListener("submit", async function (e) {

    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {

        const response = await fetch("http://localhost:5000/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email,
                password
            })

        });

        const data = await response.json();

        if (data.success) {

            localStorage.setItem("token", data.token);

            localStorage.setItem("user", JSON.stringify(data.user));

            alert("✅ Login Successful!");

          window.location.href = "home.html";

        } else {

            alert(data.message);

        }

    } catch (error) {

        alert("Server Error");

        console.log(error);

    }

});