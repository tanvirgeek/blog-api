const service = require("./auth.service");

exports.register = async (req, res) => {
  const result = await service.register(req.body);
  res.status(201).json(result);
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const tokens = await service.login({ email, password });
    res.status(200).json(tokens);
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 500).json({
      error: err.message || "Something went wrong",
      statusCode: err.statusCode || 500,
    });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    const result = await service.refresh(refreshToken);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Refresh Error:", error);

    // Use statusCode from service if available
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    // JWT errors fallback
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Refresh token expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Unknown errors
    return res.status(500).json({ message: "Internal server error" });
  }
};


exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const result = await service.logout(refreshToken);

    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 400).json({
      message: err.message,
    });
  }
};

