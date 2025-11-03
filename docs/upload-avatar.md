# Upload avatar (example)

This document shows how to update the authenticated user's profile and upload an avatar image. The server endpoint is `PATCH /auth/me` and expects a multipart/form-data request with the file field named `avatar`.

Environment
- Make sure the server env contains Cloudinary credentials (your `.env` already has `CLOUDINARY_URL`).
- Include an Authorization header `Bearer <TOKEN>` where `<TOKEN>` is the user's JWT.

cURL example

```bash
curl -X PATCH "http://localhost:5000/auth/me" \
  -H "Authorization: Bearer <TOKEN>" \
  -F "avatar=@/path/to/avatar.jpg" \
  -F "full_name=New Name"
```

What the server does
- The multipart file `avatar` is uploaded to Cloudinary.
- The middleware adds `avatar_url` and `avatar_url_public_id` to `req.body`.
- The route deletes the previous avatar from Cloudinary (if `avatar_public_id` existed on the user), then saves the new `avatar_url` and `avatar_public_id` to the user document.

Postman raw request snippet (you can import using the "Raw Text" option in Postman) — set method to PATCH and the body to form-data with the file field `avatar`:

```
PATCH /auth/me HTTP/1.1
Host: localhost:5000
Authorization: Bearer <TOKEN>
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

----WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="avatar"; filename="avatar.jpg"
Content-Type: image/jpeg

<binary data>
----WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="full_name"

New Name
----WebKitFormBoundary7MA4YWxkTrZu0gW--
```

Notes
- If you want the server to also return a smaller thumbnail or transformations, we can add Cloudinary upload options for `width`, `height`, `crop`, etc.
- If deletion of old avatars fails for any reason, the update still proceeds and the error is logged to the server console.
