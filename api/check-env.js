export default function handler(req, res) {
  res.status(200).json({
    ADMIN_PASSWORD_set: !!process.env.ADMIN_PASSWORD,
    META_CAPI_TOKEN_set: !!process.env.META_CAPI_TOKEN,
  });
}
