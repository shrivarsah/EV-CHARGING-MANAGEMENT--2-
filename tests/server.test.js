const request = require("supertest");
const app = require("../backend/server");

describe("EV Charging Station API", () => {
  test("health endpoint is available", async () => {
    const response = await request(app).get("/api/health");
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("UP");
  });

  test("returns charging stations", async () => {
    const response = await request(app).get("/api/stations");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
  });

  test("returns 404 for an invalid station", async () => {
    const response = await request(app).get("/api/stations/9999");
    expect(response.statusCode).toBe(404);
  });

  test("creates a booking", async () => {
    const response = await request(app)
      .post("/api/bookings")
      .send({
        user: "Test User",
        stationId: 1,
        slot: "2026-10-08T10:00"
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.status).toBe("BOOKED");
  });

  test("rejects incomplete booking data", async () => {
    const response = await request(app)
      .post("/api/bookings")
      .send({ user: "Test User" });

    expect(response.statusCode).toBe(400);
  });
});
