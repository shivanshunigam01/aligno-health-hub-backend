const crypto = require('crypto');
const razor = require('../config/razorpay');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const api = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

exports.createRazorpayOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.body.orderId);
  if (!order) throw new AppError('Order not found', 404);
  if (String(order.user) !== String(req.user._id)) throw new AppError('Order not found', 404);
  if (order.paymentStatus === 'paid') throw new AppError('Order already paid', 400);

  const rz = await razor().orders.create({
    amount: Math.round(order.total * 100),
    currency: 'INR',
    receipt: order.orderNo,
  });
  const p = await Payment.create({
    user: req.user._id,
    order: order._id,
    razorpayOrderId: rz.id,
    amount: order.total,
    status: 'created',
    logs: [{ event: 'order_created', payload: rz }],
  });
  api({
    res,
    message: 'Razorpay order created',
    data: { payment: p, razorpayOrder: rz, key: process.env.RAZORPAY_KEY_ID },
  });
});

exports.createRazorpayFromCart = asyncHandler(async (req, res) => {
  const { items, customer, couponCode } = req.body;
  if (!items?.length) throw new AppError('No items provided', 400);

  let subtotal = 0;
  let tax = 0;
  const orderItems = [];

  for (const item of items) {
    const Product = require('../models/Product');
    const p = await Product.findById(item.productId);
    if (!p || p.isDeleted) throw new AppError(`Product unavailable: ${item.productId}`, 400);
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
  }

  const shippingCharge =
    subtotal >= Number(process.env.SHIPPING_FREE_ABOVE || 999) ? 0 : Number(process.env.SHIPPING_DEFAULT_CHARGE || 79);
  let discount = 0;
  if (couponCode?.toUpperCase() === 'ALIGNO10') discount = Math.round(subtotal * 0.1);
  const total = Math.max(0, subtotal + tax + shippingCharge - discount);

  const rz = await razor().orders.create({
    amount: Math.round(total * 100),
    currency: 'INR',
    receipt: 'ALN-' + Date.now(),
  });

  api({
    res,
    message: 'Razorpay order created',
    data: {
      razorpayOrderId: rz.id,
      amount: rz.amount,
      currency: rz.currency,
      key: process.env.RAZORPAY_KEY_ID,
      pricing: { subtotal, discount, shipping: shippingCharge, gst: tax, total },
      items: orderItems,
      customer,
      couponCode: couponCode?.toUpperCase(),
    },
  });
});

exports.verify = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');
  if (expected !== razorpay_signature) throw new AppError('Invalid payment signature', 400);

  let p = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
  if (!p && orderId) {
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);
    p = await Payment.create({
      user: req.user?._id || order.user,
      order: order._id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      amount: order.total,
      status: 'captured',
    });
  } else if (p) {
    p = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'captured',
        $push: { logs: { event: 'payment_verified', payload: req.body } },
      },
      { new: true }
    );
  } else {
    throw new AppError('Payment record not found', 404);
  }

  await Order.findByIdAndUpdate(p.order, {
    paymentStatus: 'paid',
    orderStatus: 'confirmed',
    $push: { timeline: { status: 'paid', note: 'Payment captured via Razorpay' } },
  });
  api({ res, message: 'Payment verified', data: p });
});

exports.webhook = asyncHandler(async (req, res) => {
  const sig = req.headers['x-razorpay-signature'];
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
  if (sig !== expected) throw new AppError('Invalid webhook signature', 400);

  const payload = JSON.parse(rawBody);
  const paymentEntity = payload.payload?.payment?.entity;
  if (paymentEntity?.id) {
    await Payment.updateOne(
      { razorpayPaymentId: paymentEntity.id },
      { $push: { logs: { event: payload.event, payload } } }
    );
    if (payload.event === 'payment.captured') {
      const p = await Payment.findOne({ razorpayPaymentId: paymentEntity.id });
      if (p) {
        await Payment.updateOne({ _id: p._id }, { status: 'captured' });
        await Order.findByIdAndUpdate(p.order, {
          paymentStatus: 'paid',
          orderStatus: 'confirmed',
          $push: { timeline: { status: 'paid', note: 'Webhook: payment captured' } },
        });
      }
    }
  }
  api({ res, message: 'Webhook processed' });
});

exports.refund = asyncHandler(async (req, res) => {
  const p = await Payment.findById(req.params.id);
  if (!p) throw new AppError('Payment not found', 404);
  const rf = await razor().payments.refund(p.razorpayPaymentId, {
    amount: Math.round(Number(req.body.amount || p.amount) * 100),
  });
  p.status = 'refunded';
  p.refunds.push({ refundId: rf.id, amount: rf.amount / 100, status: rf.status, createdAt: new Date() });
  await p.save();
  await Order.findByIdAndUpdate(p.order, { paymentStatus: 'refunded', orderStatus: 'refunded' });
  api({ res, message: 'Refund processed', data: p });
});

exports.history = asyncHandler(async (req, res) =>
  api({
    res,
    message: 'Payment history',
    data: await Payment.find({ user: req.user._id, isDeleted: false }).populate('order').sort('-createdAt'),
  })
);

exports.list = asyncHandler(async (req, res) =>
  api({
    res,
    message: 'Payments fetched',
    data: await Payment.find({ isDeleted: false }).populate('user order').sort('-createdAt').limit(200),
  })
);
