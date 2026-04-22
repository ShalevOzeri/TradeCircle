module.exports = (err, req, res, next) => {
  console.error("[ERROR]", err);
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation failed",
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  if (err.name === "CastError") return res.status(400).json({ message: "Invalid ID format" });
  if (err.code === 11000) return res.status(409).json({ message: "Duplicate value" });
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
};