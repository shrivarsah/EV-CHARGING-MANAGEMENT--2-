const {
  loadStations,
  loadBookings,
  handleBookingSubmit
} = require("../public/app.js");

describe("app.js", () => {
  let elements;

  beforeEach(() => {
    elements = {
      stations: {
        innerHTML: "",
        textContent: ""
      },
      stationId: {
        innerHTML: "",
        value: "1"
      },
      bookings: {
        innerHTML: "",
        textContent: ""
      },
      user: {
        value: "John"
      },
      slot: {
        value: "10:00"
      },
      message: {
        textContent: ""
      }
    };

    global.document = {
      getElementById: jest.fn(id => elements[id])
    };

    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete global.document;
    delete global.fetch;
  });

  test("loads and displays charging stations", async () => {
    fetch.mockResolvedValue({
      json: async () => [
        {
          id: 1,
          name: "Station A",
          location: "Madurai",
          available: 2,
          total: 4
        }
      ]
    });

    await loadStations();

    expect(elements.stations.innerHTML).toContain("Station A");
    expect(elements.stations.innerHTML).toContain("Madurai");
    expect(elements.stationId.innerHTML).toContain("Station A");
  });

  test("displays bookings when bookings exist", async () => {
    fetch.mockResolvedValue({
      json: async () => [
        {
          station: "Station A",
          user: "John",
          slot: "10:00",
          status: "Confirmed"
        }
      ]
    });

    await loadBookings();

    expect(elements.bookings.innerHTML).toContain("John");
    expect(elements.bookings.innerHTML).toContain("Confirmed");
  });

  test("displays message when there are no bookings", async () => {
    fetch.mockResolvedValue({
      json: async () => []
    });

    await loadBookings();

    expect(elements.bookings.textContent).toBe("No bookings yet.");
  });

  test("successfully submits a booking", async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 123 })
      })
      .mockResolvedValue({
        json: async () => []
      });

    const event = {
      preventDefault: jest.fn(),
      target: {
        reset: jest.fn()
      }
    };

    await handleBookingSubmit(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.target.reset).toHaveBeenCalled();

    expect(elements.message.textContent)
      .toBe("Booking #123 created successfully.");
  });

  test("displays error when booking fails", async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({
        error: "Booking failed"
      })
    });

    const event = {
      preventDefault: jest.fn(),
      target: {
        reset: jest.fn()
      }
    };

    await handleBookingSubmit(event);

    expect(event.preventDefault).toHaveBeenCalled();

    expect(elements.message.textContent)
      .toBe("Booking failed");

    expect(event.target.reset).not.toHaveBeenCalled();
  });
});
