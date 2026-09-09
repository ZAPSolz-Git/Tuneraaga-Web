const axios = require("axios");

const SPOTIFY_ACCOUNTS_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1";

let cachedToken = null;
let tokenExpiresAt = 0;

// Spotify's Client Credentials flow gives an app-only token (no user login),
// which is all artist profile/search data needs. Cached in memory and
// refreshed a minute before it actually expires so concurrent requests
// don't all trigger their own token fetch.
async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const basicAuth = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
  ).toString("base64");

  const { data } = await axios.post(
    SPOTIFY_ACCOUNTS_URL,
    new URLSearchParams({ grant_type: "client_credentials" }),
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

const spotifyApi = axios.create({ baseURL: SPOTIFY_API_BASE_URL });

spotifyApi.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

module.exports = { spotifyApi };
