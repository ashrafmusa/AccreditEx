# Server-Side Security Headers Configuration
# 
# These headers should be implemented at the server/hosting level for maximum security.
# Meta tags cannot implement frame-ancestors or X-Frame-Options properly.

## For Firebase Hosting (firebase.json)
Add to your firebase.json:

```json
{
  "hosting": {
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-XSS-Protection",
            "value": "1; mode=block"
          },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          },
          {
            "key": "Permissions-Policy",
            "value": "geolocation=(), microphone=(), camera=()"
          },
          {
            "key": "Content-Security-Policy",
            "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://aistudiocdn.com https://*.googleapis.com https://apis.google.com https://*.firebaseio.com https://*.cloudfunctions.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https: https://*.cloudinary.com https://*.googleapis.com; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.cloudfunctions.net wss://*.firebaseio.com https://aistudiocdn.com https://*.openai.com; frame-src 'self' https://*.google.com https://accounts.google.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;"
          }
        ]
      }
    ]
  }
}
```

## For Nginx

```nginx
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://aistudiocdn.com https://*.googleapis.com https://apis.google.com https://*.firebaseio.com https://*.cloudfunctions.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https: https://*.cloudinary.com https://*.googleapis.com; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.cloudfunctions.net wss://*.firebaseio.com https://aistudiocdn.com https://*.openai.com; frame-src 'self' https://*.google.com https://accounts.google.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;" always;
```

## For Apache (.htaccess)

```apache
<IfModule mod_headers.c>
    Header always set X-Frame-Options "DENY"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://aistudiocdn.com https://*.googleapis.com https://apis.google.com https://*.firebaseio.com https://*.cloudfunctions.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https: https://*.cloudinary.com https://*.googleapis.com; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.cloudfunctions.net wss://*.firebaseio.com https://aistudiocdn.com https://*.openai.com; frame-src 'self' https://*.google.com https://accounts.google.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;"
</IfModule>
```

## Key Changes Made to CSP:

1. ✅ **Added `https://apis.google.com`** to `script-src` for Google Auth API
2. ✅ **Added `https://accounts.google.com`** to `frame-src` for Google login iframe
3. ✅ **Removed `frame-ancestors 'none'`** from meta tag (only works server-side)
4. ✅ **Removed `X-Frame-Options` meta tag** (only works as HTTP header)

## Testing CSP:

1. Open browser DevTools → Console
2. Look for CSP violation errors (should be none now)
3. Test Google Sign-In (should work without CSP blocks)

## Verification:

Check security headers with:
```bash
curl -I https://your-domain.com
```

Expected headers:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy: [full policy]
