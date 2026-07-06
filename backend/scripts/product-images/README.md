# Product image folders for bulk upload

Place your product images here — one folder per product (folder name = slug):

```
product-images/
  abdominal-support/          ← 2–4 images (jpg/png)
  ankle-support/
  cervical-collar/
  contoured-ls-support-belt/
  elbow-support/
  functional-knee-support/
  knee-support/
  ls-belt-eco/
  lumbar-sacral-support-belt/
  pouch-arm-sling/
  tennis-elbow-support/
  wrist-wrap/
  wrist-wrap-with-thumb/
```

Then run from backend folder:

```bash
node scripts/seed-aligno-products.js
```

This uploads all images to **Cloudinary** and creates/updates all **13 products** in MongoDB with titles & descriptions.
