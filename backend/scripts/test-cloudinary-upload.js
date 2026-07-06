require('dotenv').config();
const fs = require('fs');
const path = require('path');

const IMG = process.argv[2] || path.join(
  __dirname,
  '../../../.cursor/projects/c-Users-Admin-Downloads-aligno/assets/c__Users_Admin_AppData_Roaming_Cursor_User_workspaceStorage_0bad385dfbfc6d73f7c923f1b8567091_images_WhatsApp_Image_2026-06-15_at_16.49.50-911ae789-e86d-4ee5-82d5-735580d11816.png',
);

async function login() {
  const r = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@alignohealthhub.com', password: 'Admin@12345' }),
  });
  const j = await r.json();
  if (!j.success) throw new Error(j.message || 'Login failed');
  return j.data.accessToken;
}

async function uploadViaApi(token) {
  const boundary = '----FormBoundary' + Date.now();
  const fileBuf = fs.readFileSync(IMG);
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="aligno-test.png"\r\nContent-Type: image/png\r\n\r\n`,
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([head, fileBuf, tail]);

  const r = await fetch('http://localhost:5000/api/v1/admin/upload/single?folder=aligno/products', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });
  return r.json();
}

(async () => {
  console.log('Image:', IMG);
  if (!fs.existsSync(IMG)) throw new Error('Image file not found');

  const { uploadFile } = require('../src/utils/cloudinary');
  const direct = await uploadFile(IMG, 'aligno/products/test');
  console.log('\n1) Direct Cloudinary upload: OK');
  console.log('   URL:', direct.secure_url);

  const token = await login();
  const api = await uploadViaApi(token);
  console.log('\n2) Admin API upload:', api.success ? 'OK' : 'FAILED');
  console.log('   Message:', api.message);
  if (api.data?.url) console.log('   URL:', api.data.url);
  if (!api.success) process.exit(1);
})().catch((e) => {
  console.error('TEST FAILED:', e.message);
  process.exit(1);
});
