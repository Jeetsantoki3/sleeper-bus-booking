function predictConfirmation(data) {
  let score = 0;

  if (data.bookingTime === "early") score += 30;
  if (data.seatsLeft > 50) score += 30;
  if (data.mealSelected) score += 20;
  if (!data.isWeekend) score += 20;

  return Math.min(score, 100);
}

module.exports = predictConfirmation;
