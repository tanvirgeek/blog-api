const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./user.model");
const RefreshToken = require("./refreshToken.model");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../utils/token");

exports.register = async ({ name, email, password }) => {
  if (await User.findOne({ email })) {
    throw new Error("User exists");
  }

  const hashed = await bcrypt.hash(password, 10);
  await User.create({ name, email, password: hashed });

  return { message: "Registered successfully" };
};

exports.login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid credentials");

  if (!(await bcrypt.compare(password, user.password))) {
    throw new Error("Invalid credentials");
  }

  const payload = { id: user._id };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await RefreshToken.create({
    user: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return { accessToken, refreshToken };
};

exports.refresh = async (token) => {
  if (!token) throw new Error("Missing refresh token");

  const stored = await RefreshToken.findOne({
    token,
    revoked: false,
  });

  if (!stored) throw new Error("Invalid refresh token");

  const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

  return {
    accessToken: generateAccessToken({ id: decoded.id }),
  };
};

exports.logout = async (token) => {
  if (!token) throw new Error("Missing refresh token");

  const stored = await RefreshToken.findOne({ token });
  if (!stored) return { message: "Token already invalidated" };

  stored.revoked = true;
  await stored.save();

  return { message: "Logged out successfully" };
};

