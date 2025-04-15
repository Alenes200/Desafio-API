require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth.routes.js");
const protectedRoutes = require("./routes/protected.routes.js");
const activityRoutes = require("./routes/activities.routes.js");

const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use("/auth", authRoutes);
app.use("/protected", protectedRoutes);
app.use("/activities", activityRoutes);

// Main page route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
