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
  const result = await service.refresh(req.body.refreshToken);
  res.json(result);
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Missing refresh token" });
    }

    const result = await service.logout(refreshToken);

    res.json(result); // { message: "Logged out successfully" }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
