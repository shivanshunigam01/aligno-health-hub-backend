const mongoose = require('mongoose');
const { v4: uuid } = require('uuid');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const api = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { getPagination } = require('../utils/pagination');

function assertOrderAccess(order, user, isAdmin) {
  if (!order) throw new AppError('Order not found', 404);
  if (isAdmin) return;
  if (!user || String(order.user) !== String(user._id)) throw new AppError('Order not found', 404);
}

async function restoreStock(order, session) {
  for (const item of order.items) {
    const p = await Product.findById(item.product).session(session);
    if (!p) continue;
    p.stock += item.quantity;
    p.soldCount = Math.max(0, (p.soldCount || 0) - item.quantity);
    await p.save({ session });
  }
}

exports.create = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  let order;
  await session.withTransaction(async () => {
    const cart = await Cart.findOne({ user: req.user._id, isDeleted: false })
      .populate('items.product')
      .session(session);
    if (!cart || !cart.items.length) throw new AppError('Cart is empty', 400);
    for (const i of cart.items) {
      const p = await Product.findById(i.product._id).session(session);
      if (p.stock < i.quantity) throw new AppError(`${p.name} has insufficient stock`, 400);
      p.stock -= i.quantity;
      p.soldCount += i.quantity;
      await p.save({ session });
    }
    order = await Order.create(
      [
        {
          orderNo: 'ALN-' + Date.now() + '-' + uuid().slice(0, 6).toUpperCase(),
          user: req.user._id,
          items: cart.items.map((i) => ({
            product: i.product._id,
            name: i.product.name,
            sku: i.product.sku,
            quantity: i.quantity,
            price: i.price,
            mrp: i.mrp,
            gst: i.gst,
            image: i.product.images?.[0]?.secure_url,
          })),
          shippingAddress: req.body.shippingAddress,
          billingAddress: req.body.billingAddress || req.body.shippingAddress,
          couponCode: cart.couponCode,
          subtotal: cart.subtotal,
          discount: cart.discount,
          tax: cart.tax,
          shippingCharge: cart.shippingCharge,
          total: cart.total,
          paymentMethod: req.body.paymentMethod || 'COD',
          timeline: [{ status: 'placed', note: 'Order placed', by: req.user._id }],
        },
      ],
      { session }
    ).then((r) => r[0]);
    cart.items = [];
    await cart.save({ session });
  });
  session.endSession();
  api({ res, statusCode: 201, message: 'Order created', data: order });
});

exports.guestCheckout = asyncHandler(async (req, res) => {
  const { items, customer, paymentMethod, couponCode } = req.body;
  if (!items?.length) throw new AppError('No items in order', 400);
  if (!customer?.email || !customer?.phone) throw new AppError('Customer email and phone required', 400);

  const session = await mongoose.startSession();
  let order;
  await session.withTransaction(async () => {
    let subtotal = 0;
    let tax = 0;
    const orderItems = [];

    for (const item of items) {
      const p = await Product.findById(item.productId).session(session);
      if (!p || p.isDeleted || p.visibility !== 'public') throw new AppError('Product unavailable', 400);
      const qty = Number(item.quantity || 1);
      if (p.stock < qty) throw new AppError(`${p.name} has insufficient stock`, 400);
      const line = p.sellingPrice * qty;
      subtotal += line;
      tax += (line * (p.gst || 0)) / 100;
      orderItems.push({
        product: p._id,
        name: p.name,
        sku: p.sku,
        quantity: qty,
        price: p.sellingPrice,
        mrp: p.mrp,
        gst: p.gst,
        image: p.images?.[0]?.secure_url,
      });
      p.stock -= qty;
      p.soldCount += qty;
      await p.save({ session });
    }

    const shippingCharge =
      subtotal >= Number(process.env.SHIPPING_FREE_ABOVE || 999)
        ? 0
        : Number(process.env.SHIPPING_DEFAULT_CHARGE || 79);
    let discount = 0;
    if (couponCode?.toUpperCase() === 'ALIGNO10') discount = Math.round(subtotal * 0.1);

    const total = Math.max(0, subtotal + tax + shippingCharge - discount);

    order = await Order.create(
      [
        {
          orderNo: 'ALN-' + Date.now() + '-' + uuid().slice(0, 6).toUpperCase(),
          user: req.user?._id || null,
          items: orderItems,
          shippingAddress: {
            name: customer.fullName || customer.name,
            phone: customer.phone,
            line1: customer.address,
            city: customer.city,
            state: customer.state,
            pincode: customer.pincode,
            country: 'India',
          },
          billingAddress: {
            name: customer.fullName || customer.name,
            phone: customer.phone,
            line1: customer.address,
            city: customer.city,
            state: customer.state,
            pincode: customer.pincode,
            country: 'India',
          },
          customerEmail: customer.email,
          couponCode: couponCode?.toUpperCase(),
          subtotal,
          discount,
          tax,
          shippingCharge,
          total,
          paymentMethod: paymentMethod || 'COD',
          paymentStatus: paymentMethod === 'Razorpay' ? 'pending' : 'pending',
          timeline: [{ status: 'placed', note: 'Guest order placed' }],
        },
      ],
      { session }
    ).then((r) => r[0]);
  });
  session.endSession();
  api({ res, statusCode: 201, message: 'Order created', data: order });
});

exports.my = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const [items, total] = await Promise.all([
    Order.find({ user: req.user._id, isDeleted: false }).sort('-createdAt').skip(skip).limit(limit),
    Order.countDocuments({ user: req.user._id, isDeleted: false }),
  ]);
  api({ res, message: 'Orders fetched', data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const q = { isDeleted: false };
  if (req.query.status) q.orderStatus = req.query.status;
  const [items, total] = await Promise.all([
    Order.find(q).populate('user', 'name email phone').sort('-createdAt').skip(skip).limit(limit),
    Order.countDocuments(q),
  ]);
  api({ res, message: 'Orders fetched', data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.get = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user items.product');
  assertOrderAccess(order, req.user, ['admin', 'super_admin'].includes(req.user.role));
  api({ res, message: 'Order fetched', data: order });
});

exports.track = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderNo: req.params.orderNo, isDeleted: false }).select('-__v');
  if (!order) throw new AppError('Order not found', 404);
  api({ res, message: 'Order tracked', data: order });
});

exports.status = asyncHandler(async (req, res) => {
  const o = await Order.findById(req.params.id);
  if (!o) throw new AppError('Order not found', 404);
  o.orderStatus = req.body.status;
  o.timeline.push({ status: req.body.status, note: req.body.note, by: req.user._id });
  await o.save();
  api({ res, message: 'Order status updated', data: o });
});

exports.cancel = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  let o;
  await session.withTransaction(async () => {
    o = await Order.findById(req.params.id).session(session);
    assertOrderAccess(o, req.user, ['admin', 'super_admin'].includes(req.user.role));
    if (!['placed', 'confirmed'].includes(o.orderStatus)) throw new AppError('Order cannot be cancelled', 400);
    await restoreStock(o, session);
    o.orderStatus = 'cancelled';
    o.cancelReason = req.body.reason;
    o.timeline.push({ status: 'cancelled', note: req.body.reason, by: req.user._id });
    await o.save({ session });
  });
  session.endSession();
  api({ res, message: 'Order cancelled', data: o });
});

exports.return = asyncHandler(async (req, res) => {
  const o = await Order.findById(req.params.id);
  assertOrderAccess(o, req.user, ['admin', 'super_admin'].includes(req.user.role));
  o.orderStatus = 'return_requested';
  o.returnReason = req.body.reason;
  o.timeline.push({ status: 'return_requested', note: req.body.reason, by: req.user._id });
  await o.save();
  api({ res, message: 'Return requested', data: o });
});
