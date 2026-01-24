const express = require("express");
const cors = require("cors");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const seats = require("../data/seats");
const bookings = require("../data/bookings");
const predictConfirmation = require("../prediction/predictionLogic");

const app = express();

app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));

/* ------------------ APIs ------------------ */

// Get seats
app.get("/api/seats", (req, res) => {
  res.json(seats);
});

// Book seat
app.post("/api/book-seat", (req, res) => {
  const { seatNo, passengerName, meal } = req.body;

  const seat = seats.find(s => s.seatNo === seatNo);
  if (!seat || seat.booked) {
    return res.status(400).json({ message: "Seat not available" });
  }

  seat.booked = true;

  const booking = {
    bookingId: uuidv4(),
    seatNo,
    passengerName,
    meal: meal || "None"
  };

  bookings.push(booking);
  res.json({ booking });
});

// Cancel booking
app.post("/api/cancel-booking", (req, res) => {
  const { bookingId } = req.body;

  const index = bookings.findIndex(b => b.bookingId === bookingId);
  if (index === -1) {
    return res.status(404).json({ message: "Booking not found" });
  }

  const seat = seats.find(s => s.seatNo === bookings[index].seatNo);
  seat.booked = false;

  bookings.splice(index, 1);
  res.json({ message: "Booking cancelled" });
});

// Prediction
app.post("/api/predict", (req, res) => {
  const probability = predictConfirmation(req.body);
  res.json({ confirmationProbability: probability + "%" });
});

// Export for Vercel
module.exports = app;
