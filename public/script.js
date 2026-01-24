// -------------------------------
// Sleeper Bus Booking Frontend
// This file connects frontend with backend APIs.
// -------------------------------

// Main UI references
const upperGrid = document.getElementById("upperGrid");
const lowerGrid = document.getElementById("lowerGrid");

const passengerNameInput = document.getElementById("passengerName");
const mealOption = document.getElementById("mealOption");

const summarySeat = document.getElementById("summarySeat");
const summaryName = document.getElementById("summaryName");
const summaryMeal = document.getElementById("summaryMeal");

const predictBtn = document.getElementById("predictBtn");
const predictionResult = document.getElementById("predictionResult");

const bookBtn = document.getElementById("bookBtn");
const bookingResult = document.getElementById("bookingResult");

const cancelId = document.getElementById("cancelId");
const cancelBtn = document.getElementById("cancelBtn");
const cancelResult = document.getElementById("cancelResult");

// Track currently selected seat
let selectedSeat = null;

// -------------------------------
// Small helper to update summary box
// -------------------------------
function updateSummary() {
  summarySeat.innerText = selectedSeat || "Not Selected";
  summaryName.innerText = passengerNameInput.value.trim() || "---";
  summaryMeal.innerText = mealOption.value || "None";
}

// Update summary live when typing/changing meal
passengerNameInput.addEventListener("input", updateSummary);
mealOption.addEventListener("change", updateSummary);

// -------------------------------
// Load seats from backend and render UI
// -------------------------------
async function loadSeats() {
  upperGrid.innerHTML = "";
  lowerGrid.innerHTML = "";

  const res = await fetch("/api/seats");
  const seats = await res.json();

  seats.forEach((seat) => {
    const seatDiv = document.createElement("div");
    seatDiv.classList.add("seat");

    // Decide seat style based on booking status
    if (seat.booked) {
      seatDiv.classList.add("bookedSeat");
    } else {
      seatDiv.classList.add("availableSeat");
    }

    seatDiv.innerText = seat.seatNo;

    // Seat click action
    seatDiv.addEventListener("click", () => {
      // If already booked, do nothing
      if (seat.booked) return;

      // Remove selected class from all seats
      document.querySelectorAll(".seat").forEach(s => s.classList.remove("selectedSeat"));

      // Mark as selected
      seatDiv.classList.add("selectedSeat");
      selectedSeat = seat.seatNo;

      updateSummary();
    });

    // Render in upper or lower container
    if (seat.type === "Upper") {
      upperGrid.appendChild(seatDiv);
    } else {
      lowerGrid.appendChild(seatDiv);
    }
  });
}

// -------------------------------
// Booking confirmation chance (prediction)
// -------------------------------
predictBtn.addEventListener("click", async () => {
  if (!selectedSeat) {
    predictionResult.innerText = "⚠ Please select a seat first.";
    return;
  }

  // Get seat data to calculate seats left %
  const seatsResponse = await fetch("/api/seats");
  const seatsData = await seatsResponse.json();

  const availableSeats = seatsData.filter(s => !s.booked).length;
  const seatsLeftPercent = (availableSeats / seatsData.length) * 100;

  // Simple booking time category
  const hour = new Date().getHours();
  let bookingTime = "medium";
  if (hour < 12) bookingTime = "early";
  if (hour > 18) bookingTime = "late";

  // Weekend check
  const isWeekend = [0, 6].includes(new Date().getDay());

  const body = {
    bookingTime,
    seatsLeft: seatsLeftPercent,
    mealSelected: mealOption.value !== "",
    isWeekend
  };

  const res = await fetch("/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  predictionResult.innerText = `📌 Confirmation Chance: ${data.confirmationProbability}`;
});

// -------------------------------
// Confirm booking
// -------------------------------
bookBtn.addEventListener("click", async () => {
  const passengerName = passengerNameInput.value.trim();
  const meal = mealOption.value;

  if (!selectedSeat) {
    bookingResult.style.display = "block";
    bookingResult.innerHTML = "⚠ Please select a seat first.";
    return;
  }

  if (!passengerName) {
    bookingResult.style.display = "block";
    bookingResult.innerHTML = "⚠ Please enter passenger name.";
    return;
  }

  const res = await fetch("/api/book-seat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seatNo: selectedSeat, passengerName, meal })
  });

  const data = await res.json();

  if (!res.ok) {
    bookingResult.style.display = "block";
    bookingResult.innerHTML = `❌ ${data.message}`;
    return;
  }

  // Show ticket-style output
  bookingResult.style.display = "block";
  bookingResult.innerHTML = `
    <h3>✅ Ticket Confirmed</h3>
    <p><b>Booking ID:</b> ${data.booking.bookingId}</p>
    <p><b>Seat No:</b> ${data.booking.seatNo}</p>
    <p><b>Passenger:</b> ${data.booking.passengerName}</p>
    <p><b>Meal:</b> ${data.booking.meal}</p>
    <p style="margin-top:8px; font-size:13px; color:#64748b;">
      Please save your Booking ID for cancellation.
    </p>
  `;

  // Reset selection & form
  selectedSeat = null;
  passengerNameInput.value = "";
  mealOption.value = "";

  updateSummary();
  predictionResult.innerText = "";

  // Reload seats after booking
  loadSeats();
});

// -------------------------------
// Cancel booking
// -------------------------------
cancelBtn.addEventListener("click", async () => {
  const bookingId = cancelId.value.trim();

  if (!bookingId) {
    cancelResult.innerText = "⚠ Please enter booking ID.";
    return;
  }

  const res = await fetch("/api/cancel-booking", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookingId })
  });

  const data = await res.json();

  if (!res.ok) {
    cancelResult.innerText = `❌ ${data.message}`;
    return;
  }

  cancelResult.innerText = `✅ ${data.message}`;
  cancelId.value = "";

  // Refresh seat layout after cancellation
  loadSeats();
});

// Initial load
loadSeats();
updateSummary();
