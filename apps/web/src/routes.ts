import { index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("crm", "routes/crm.tsx"),
  route("document-preparation", "routes/document-preparation.tsx"),
  route("sign/:token", "routes/sign.tsx"),
  route("api/public-inquiry", "routes/api.public-inquiry.ts")
];
