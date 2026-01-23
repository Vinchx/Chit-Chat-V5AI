import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: null,
  },
  bio: {
    type: String,
    default: '',
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
    default: null,
  },
  verifiedAt: {
    type: Date,
    default: null,
  },
  resetPasswordOtp: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  // Passkey credentials for WebAuthn
  passkeys: [{
    credentialID: {
      type: String, // Changed from Buffer to String (base64url) to avoid encoding issues
      required: true,
    },
    publicKey: {
      type: String, // Changed from Buffer to String (base64) to avoid encoding issues
      required: true,
    },
    counter: {
      type: Number,
      required: true,
    },
    deviceType: {
      type: String,
      default: 'unknown',
    },
    backedUp: {
      type: Boolean,
      default: false,
    },
    transports: {
      type: [String],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
});

// Prevent model overwrite upon initial compilation
export default mongoose.models.User || mongoose.model("User", UserSchema);
