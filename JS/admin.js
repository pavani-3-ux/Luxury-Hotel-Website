// Authentication Guard for Admin Page
{
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    
    let isAdmin = false;
    if (token && userStr) {
        try {
            const user = JSON.parse(userStr);
            if (user && user.role === "admin") {
                isAdmin = true;
                const adminNameEl = document.getElementById("admin-name");
                if (adminNameEl) {
                    adminNameEl.innerText = user.name || "Administrator";
                }
            }
        } catch (e) {
            console.error("Error parsing admin profile:", e);
        }
    }
    
    if (!isAdmin) {
        alert("Access Denied. Admin authentication required.");
        window.location.href = "index.html";
    }

    const API_BASE_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:")
        ? "http://localhost:5000"
        : "https://luxury-hotel-website-9cwx.onrender.com";

    // Fetch and Load Dashboard Data
    async function loadDashboard() {
        await Promise.all([
            fetchBookings(),
            fetchUsers()
        ]);
    }

    // Load Bookings
    async function fetchBookings() {
        const tableBody = document.getElementById("bookings-table-body");
        try {
            const response = await fetch(`${API_BASE_URL}/bookings`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const bookings = await response.json();
            
            if (response.ok) {
                renderBookings(bookings);
                calculateBookingStats(bookings);
            } else {
                tableBody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: red;">Failed to load bookings</td></tr>`;
            }
        } catch (err) {
            console.error("Error loading bookings:", err);
            tableBody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: red;">Server connection error</td></tr>`;
        }
    }

    // Load Users
    async function fetchUsers() {
        const tableBody = document.getElementById("users-table-body");
        try {
            const response = await fetch(`${API_BASE_URL}/users`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const users = await response.json();
            
            if (response.ok) {
                renderUsers(users);
                document.getElementById("stat-users").innerText = users.length;
            } else {
                tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Failed to load users</td></tr>`;
            }
        } catch (err) {
            console.error("Error loading users:", err);
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Server connection error</td></tr>`;
        }
    }

    // Render Bookings Log Table
    function renderBookings(bookings) {
        const tableBody = document.getElementById("bookings-table-body");
        if (bookings.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="9" style="text-align: center;">No bookings logged.</td></tr>`;
            return;
        }

        // Sort bookings by date / ID descending
        bookings.sort((a, b) => b.id - a.id);

        tableBody.innerHTML = bookings.map(booking => {
            const statusClass = booking.status ? `status-${booking.status.toLowerCase()}` : 'status-pending';
            const statusText = booking.status || 'Pending';
            
            return `
                <tr id="booking-row-${booking.id}">
                    <td><strong>${booking.name}</strong></td>
                    <td>${booking.email}</td>
                    <td>${booking.phone}</td>
                    <td>${booking.room}</td>
                    <td>${booking.checkin}</td>
                    <td>${booking.checkout}</td>
                    <td style="text-align: center;">${booking.guests}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <button onclick="toggleBookingStatus(${booking.id}, '${statusText}')" class="btn-action btn-status-toggle" title="Change Status">
                            <i class="fas fa-sync-alt"></i> Status
                        </button>
                        <button onclick="deleteBooking(${booking.id})" class="btn-action btn-delete" title="Delete Booking">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Render Registered Users Table
    function renderUsers(users) {
        const tableBody = document.getElementById("users-table-body");
        if (users.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">No registered users.</td></tr>`;
            return;
        }

        // Sort users descending
        users.sort((a, b) => b.id - a.id);

        tableBody.innerHTML = users.map(u => {
            const registeredDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A';
            return `
                <tr id="user-row-${u.id}">
                    <td><code>${u.id}</code></td>
                    <td><strong>${u.name}</strong></td>
                    <td>${u.email}</td>
                    <td>${u.phone || 'N/A'}</td>
                    <td>${registeredDate}</td>
                    <td>
                        <button onclick="deleteUser(${u.id})" class="btn-action btn-delete" title="Delete User">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Calculate Statistics
    function calculateBookingStats(bookings) {
        document.getElementById("stat-bookings").innerText = bookings.length;
        
        const totalGuests = bookings.reduce((sum, booking) => {
            // Count guest bookings that aren't cancelled
            if (booking.status !== "Cancelled") {
                return sum + parseInt(booking.guests || 0);
            }
            return sum;
        }, 0);
        
        document.getElementById("stat-guests").innerText = totalGuests;
    }

    // Global action: Delete Booking
    window.deleteBooking = async function(id) {
        if (!confirm("Are you sure you want to cancel and delete this booking?")) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (data.success) {
                alert("Booking deleted successfully!");
                // Fade out row in UI
                const row = document.getElementById(`booking-row-${id}`);
                if (row) {
                    row.style.transition = "opacity 0.5s";
                    row.style.opacity = "0";
                    setTimeout(() => {
                        fetchBookings(); // Reload to refresh stats & rows
                    }, 500);
                }
            } else {
                alert(data.message || "Failed to delete booking");
            }
        } catch (err) {
            console.error("Error deleting booking:", err);
            alert("Network connection error");
        }
    };

    // Global action: Delete User
    window.deleteUser = async function(id) {
        if (!confirm("Are you sure you want to permanently delete this user account?")) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/users/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (data.success) {
                alert("User deleted successfully!");
                const row = document.getElementById(`user-row-${id}`);
                if (row) {
                    row.style.transition = "opacity 0.5s";
                    row.style.opacity = "0";
                    setTimeout(() => {
                        fetchUsers();
                    }, 500);
                }
            } else {
                alert(data.message || "Failed to delete user");
            }
        } catch (err) {
            console.error("Error deleting user:", err);
            alert("Network connection error");
        }
    };

    // Global action: Toggle Booking Status (Confirmed -> Pending -> Cancelled)
    window.toggleBookingStatus = async function(id, currentStatus) {
        let newStatus = "Confirmed";
        if (currentStatus === "Confirmed") {
            newStatus = "Pending";
        } else if (currentStatus === "Pending") {
            newStatus = "Cancelled";
        } else {
            newStatus = "Confirmed";
        }

        try {
            const response = await fetch(`${API_BASE_URL}/bookings/${id}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await response.json();

            if (data.success) {
                fetchBookings(); // Reload
            } else {
                alert(data.message || "Failed to update status");
            }
        } catch (err) {
            console.error("Error updating status:", err);
            alert("Network connection error");
        }
    };

    // Admin Logout
    window.adminLogout = function() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "index.html";
    };

    // Initial Load
    document.addEventListener("DOMContentLoaded", loadDashboard);
}
