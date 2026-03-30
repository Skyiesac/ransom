const express = require("express");
const app = express();

app.use(express.json()); // middleware

// routes
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});