# Aligno Health Hub Backend

Production-ready Node.js + Express + MongoDB API for the Aligno Health Hub e-commerce platform (orthopedic & wellness).

## Quick Start

```bash
cd aligno-health-hub-backend/backend
cp .env.example .env
# Edit .env with your MongoDB, Cloudinary, and Razorpay credentials
npm install
npm run seed
npm run dev
```

- **API base:** `http://localhost:5000/api/v1`
- **Health check:** `GET /api/v1/health`
- **Swagger:** `http://localhost:5000/api-docs`

## Default Seed Logins

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@alignohealthhub.com` | `Admin@12345` |
| Customer | `customer@alignohealthhub.com` | `Customer@123` |

## Environment Variables You Must Set

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | JWT signing secret (64+ chars) |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `RAZORPAY_KEY_ID` | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook secret |

## API Modules

### User Panel (Public)
- Products, categories, body-parts, pain-areas, activities
- Blogs, posters, trust-strip, banners
- CMS, footer, contact-info, policies
- Cart validate, guest checkout, order tracking
- Razorpay payment create + verify
- Leads, newsletter, delivery check

### Admin Panel (JWT + admin role)
- Dashboard, analytics, reports (matches frontend `/admin/reports`)
- Product/category CRUD + image upload
- Cloudinary upload: `POST /api/v1/admin/upload`
- CMS, footer, contact, policies, leads
- Body-parts, pain-areas, activities, blogs, posters, trust-strip
- Orders, customers, coupons, settings

## Key Endpoints

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/products
GET    /api/v1/products/:slug
POST   /api/v1/cart/validate
POST   /api/v1/orders/guest
GET    /api/v1/orders/track/:orderNo
POST   /api/v1/payments/razorpay/create-order
POST   /api/v1/payments/verify
POST   /api/v1/admin/upload          (multipart, field: image or images)
GET    /api/v1/admin/reports
GET    /api/v1/admin/dashboard
```

## Frontend Integration

Set in your React frontend `.env`:
```
VITE_API_URL=http://localhost:5000/api/v1
```

Send auth token as:
```
Authorization: Bearer <accessToken>
```

Guest cart header:
```
x-guest-id: <uuid>
```

## Business Rules (matches frontend)

- Coupon `ALIGNO10` → 10% discount
- Free shipping when subtotal ≥ ₹999, else ₹79
- GST 5% on subtotal minus discount
- Product images stored as Cloudinary URLs

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon |
| `npm start` | Production start |
| `npm run seed` | Seed demo data (wipes existing!) |
| `npm test` | Run health check test |
