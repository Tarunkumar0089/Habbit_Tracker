const { OAuth2Client } = require("google-auth-library");

const getClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured on the server");
  }
  return new OAuth2Client(clientId);
};

const verifyGoogleToken = async (credential) => {
  const client = getClient();
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw new Error("Google account email is required");
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name || payload.email.split("@")[0],
    avatar: payload.picture || "",
    emailVerified: payload.email_verified === true,
  };
};

module.exports = { verifyGoogleToken };
