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
  if (!user) throw { message: "Email Not Found", statusCode: 401 };

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw { message: "Invalid Password", statusCode: 401 };

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
  if (!token) {
    const error = new Error("Missing refresh token");
    error.statusCode = 400;
    throw error;
  }

  // 1️⃣ Check token exists in DB
  const storedToken = await RefreshToken.findOne({ token, revoked: false });
  if (!storedToken) {
    const error = new Error("Invalid refresh token");
    error.statusCode = 401;
    throw error;
  }

  let decoded;
  try {
    // 2️⃣ Verify JWT
    decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    // 3️⃣ Handle expired token
    if (err.name === "TokenExpiredError") {
      storedToken.revoked = true;
      await storedToken.save();
      const error = new Error("Refresh token expired");
      error.statusCode = 401;
      throw error;
    }
    const error = new Error("Invalid refresh token");
    error.statusCode = 401;
    throw error;
  }

  // 4️⃣ Generate new tokens (rotation)
  const newAccessToken = generateAccessToken({ id: decoded.id });
  const newRefreshToken = generateRefreshToken({ id: decoded.id });

  // 5️⃣ Revoke old token
  storedToken.revoked = true;
  await storedToken.save();

  // 6️⃣ Save new refresh token with expiresAt
  const decodedNew = jwt.decode(newRefreshToken); // get exp in seconds
  await RefreshToken.create({
    token: newRefreshToken,
    user: decoded.id,
    revoked: false,
    expiresAt: new Date(decodedNew.exp * 1000),
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};


exports.logout = async (token) => {
  if (!token) throw new Error("Missing refresh token");

  const stored = await RefreshToken.findOne({ token });

  if (stored && !stored.revoked) {
    stored.revoked = true;
    await stored.save();
  }

  return { message: "Logged out successfully" };
};



