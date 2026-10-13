async function loadStations() {
  const response = await fetch("/api/stations");
  const stations = await response.json();

  document.getElementById("stations").innerHTML = stations.map(station => `
    <div class="station">
      <strong>${station.name}</strong><br>
      Location: ${station.location}<br>
      <span class="available">${station.available}/${station.total} chargers available</span>
    </div>
  `).join("");

  const select = document.getElementById("stationId");
  select.innerHTML = stations.map(station =>
    `<option value="${station.id}">${station.name}</option>`
  ).join("");
}

async function loadBookings() {
  const response = await fetch("/api/bookings");
  const bookings = await response.json();
  const target = document.getElementById("bookings");

  if (!bookings.length) {
    target.textContent = "No bookings yet.";
    return;
  }

  target.innerHTML = bookings.map(booking => `
    <div class="station">
      <strong>${booking.station}</strong><br>
      User: ${booking.user}<br>
      Slot: ${booking.slot}<br>
      Status: ${booking.status}
    </div>
  `).join("");
}

async function handleBookingSubmit(event) {
  event.preventDefault();

  const payload = {
    user: document.getElementById("user").value,
    stationId: document.getElementById("stationId").value,
    slot: document.getElementById("slot").value
  };

  const response = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  document.getElementById("message").textContent =
    response.ok ? `Booking #${data.id} created successfully.` : data.error;

  if (response.ok) {
    event.target.reset();
    await loadStations();
    await loadBookings();
  }
}

if (typeof module !== "undefined") {
  module.exports = {
    loadStations,
    loadBookings,
    handleBookingSubmit
  };
}
