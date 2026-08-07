const axios = require("axios");

const JAMENDO_BASE_URL = "https://api.jamendo.com/v3.0";

const jamendoApi = axios.create({
  baseURL: JAMENDO_BASE_URL,
  params: {
    client_id: process.env.JAMENDO_CLIENT_ID,
    format: "json",
  },
});

module.exports = { jamendoApi };