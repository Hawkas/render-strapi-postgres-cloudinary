module.exports = ({ env }) => ({
  auth: {
    secret: env("ADMIN_JWT_SECRET"),
    salt: env("API_TOKEN_SALT"),
  },
});
