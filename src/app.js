const express = require("express");
const cors = require("cors");

const authRoutes = require("./modules/auth/auth.routes");
const blogRoutes = require("./modules/blog/blog.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/auth", authRoutes);
app.use("/blogs", blogRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

module.exports = app;
