const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const generateOtp = () =>
  String(crypto.randomInt(100000, 999999));

const hashOtp = async (otp) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
};

const matchOtp = async (otp, hash) => bcrypt.compare(otp, hash);

const otpExpiresAt = () => new Date(Date.now() + 10 * 60 * 1000);

module.exports = { generateOtp, hashOtp, matchOtp, otpExpiresAt };
