const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [80, "Name cannot exceed 80 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default: "",
    },
    morningMotivation: {
      type: Boolean,
      default: false,
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    weeklyReportEmail: {
      type: Boolean,
      default: false,
    },
    streakReminders: {
      type: Boolean,
      default: true,
    },
    compactView: {
      type: Boolean,
      default: false,
    },
    timezone: {
      type: String,
      default: "UTC",
      trim: true,
    },
  },
  { timestamps: true }
);

userSchema.pre("validate", function (next) {
  if (this.authProvider === "local" && !this.googleId && !this.password) {
    this.invalidate("password", "Password is required for email accounts");
  }
  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.pre("save", function (next) {
  const hasExternalAvatar = this.avatar?.startsWith("http");
  if (!hasExternalAvatar && (this.isModified("name") || !this.avatar)) {
    this.avatar = this.name.charAt(0).toUpperCase();
  }
  next();
});

userSchema.methods.matchPassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    authProvider: this.authProvider,
    emailVerified: this.emailVerified,
    morningMotivation: this.morningMotivation,
    emailNotifications: this.emailNotifications,
    weeklyReportEmail: this.weeklyReportEmail,
    streakReminders: this.streakReminders,
    compactView: this.compactView,
    timezone: this.timezone,
  };
};

module.exports = mongoose.model("User", userSchema);
