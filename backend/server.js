const express = require("express");
const path = require("node:path");

const app = express();
app.disable("x-powered-by");
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

let stations = [
  { id: 1, name: "Chennai Central EV Hub", location: "Chennai", available: 4, total: 6 },
  { id: 2, name: "Airport EV Station", location: "Chennai Airport", available: 2, total: 4 },
  { id: 3, name: "City Mall Charging Point", location: "Chennai", available: 3, total: 5 }
];

let bookings = [];

app.get("/api/health", (req, res) => {
  res.json({ status: "UP", service: "EV Charging Station Management System" });
});

app.get("/api/stations", (req, res) => {
  res.json(stations);
});

app.get("/api/stations/:id", (req, res) => {
  const station = stations.find(item => item.id === Number(req.params.id));
  if (!station) {
    return res.status(404).json({ error: "Station not found" });
  }
  res.json(station);
});

app.post("/api/bookings", (req, res) => {
  const { user, stationId, slot } = req.body;

  if (!user || !stationId || !slot) {
    return res.status(400).json({ error: "user, stationId and slot are required" });
  }

  const station = stations.find(item => item.id === Number(stationId));
  if (!station) {
    return res.status(404).json({ error: "Station not found" });
  }

  if (station.available <= 0) {
    return res.status(409).json({ error: "No charger available" });
  }

  const booking = {
    id: bookings.length + 1,
    user,
    stationId: station.id,
    station: station.name,
    slot,
    status: "BOOKED"
  };

  bookings.push(booking);
  station.available -= 1;
  res.status(201).json(booking);
});

app.get("/api/bookings", (req, res) => {
  res.json(bookings);
});

app.patch("/api/bookings/:id/complete", (req, res) => {
  const booking = bookings.find(item => item.id === Number(req.params.id));
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }

  if (booking.status === "COMPLETED") {
    return res.status(409).json({ error: "Booking already completed" });
  }

  booking.status = "COMPLETED";
  const station = stations.find(item => item.id === booking.stationId);
  if (station && station.available < station.total) {
    station.available += 1;
  }

  res.json(booking);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`EV Charging System running at http://localhost:${PORT}`);
  });
}

module.exports = app;


