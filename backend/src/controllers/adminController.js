const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Lead = require('../models/Lead');
const { Activity } = require('../models/Taxonomy');
const api = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

exports.dashboard = asyncHandler(async (req, res) => {
  const [users, products, orders, revenue, lowStock, pendingOrders, completedOrders, recentOrders, categoryStats, statusStats] =
    await Promise.all([
      User.countDocuments({ isDeleted: false, role: 'customer' }),
      Product.countDocuments({ isDeleted: false }),
      Order.countDocuments({ isDeleted: false }),
      Order.aggregate([{ $match: { paymentStatus: 'paid', isDeleted: false } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Product.find({ stock: { $lte: 10 }, isDeleted: false }).select('name sku stock sellingPrice').limit(20),
      Order.countDocuments({ orderStatus: { $in: ['placed', 'confirmed'] }, isDeleted: false }),
      Order.countDocuments({ orderStatus: 'delivered', isDeleted: false }),
      Order.find({ isDeleted: false }).sort('-createdAt').limit(5).select('orderNo total orderStatus createdAt customerEmail'),
      Product.aggregate([
        { $match: { isDeleted: false } },
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'cat' } },
        { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$cat.name', count: { $sum: 1 } } },
      ]),
      Order.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
    ]);

  api({
    res,
    message: 'Dashboard fetched',
    data: {
      users,
      products,
      orders,
      revenue: revenue[0]?.total || 0,
      lowStock,
      pendingOrders,
      completedOrders,
      recentOrders,
      productsPerCategory: categoryStats.map((c) => ({ category: c._id || 'Uncategorized', count: c.count })),
      orderStatusDistribution: statusStats.map((s) => ({ status: s._id, count: s.count })),
    },
  });
});

exports.analytics = asyncHandler(async (req, res) => {
  const match = { isDeleted: false };
  if (req.query.from || req.query.to) {
    match.createdAt = {};
    if (req.query.from) match.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) match.createdAt.$lte = new Date(req.query.to);
  }
  const sales = await Order.aggregate([
    { $match: match },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
    { $sort: { _id: 1 } },
  ]);
  api({ res, message: 'Analytics fetched', data: { sales } });
});

exports.reports = asyncHandler(async (req, res) => {
  const match = { isDeleted: false };
  if (req.query.from || req.query.to) {
    match.createdAt = {};
    if (req.query.from) match.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) match.createdAt.$lte = new Date(req.query.to);
  }

  const [orders, products, leads, categories, activities] = await Promise.all([
    Order.find(match),
    Product.find({ isDeleted: false }),
    Lead.find({ isDeleted: false }),
    Category.find({ isDeleted: false }),
    Activity.find({ isDeleted: false }),
  ]);

  const salesTotal = orders.reduce((s, o) => s + (o.total || 0), 0);
  const lowStockProducts = products.filter((p) => p.stock <= 10);
  const uniqueEmails = new Set(orders.map((o) => o.customerEmail || o.shippingAddress?.phone).filter(Boolean));

  const byStatus = (items, field) =>
    items.reduce((acc, item) => {
      const key = item[field] || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

  const summary = {
    salesReport: { totalRevenue: salesTotal, currency: 'INR' },
    orderReport: { totalOrders: orders.length, byStatus: byStatus(orders, 'orderStatus') },
    productReport: {
      totalProducts: products.length,
      enabledProducts: products.filter((p) => p.enabled !== false).length,
      disabledProducts: products.filter((p) => p.enabled === false).length,
    },
    customerReport: {
      registeredCustomers: await User.countDocuments({ role: 'customer', isDeleted: false }),
      uniqueOrderEmails: uniqueEmails.size,
    },
    leadReport: { totalLeads: leads.length, byStatus: byStatus(leads, 'status'), bySource: byStatus(leads, 'source') },
    inventoryReport: {
      lowStockCount: lowStockProducts.length,
      outOfStockCount: products.filter((p) => p.stock <= 0).length,
      lowStockProducts: lowStockProducts.map((p) => ({ name: p.name, sku: p.sku, stock: p.stock })),
    },
    categoryReport: { totalCategories: categories.length, enabledCategories: categories.filter((c) => c.isActive).length },
    activityReport: { totalActivities: activities.length },
  };

  if (req.query.type === 'sales') {
    const sales = await Order.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    return api({ res, message: 'Sales report fetched', data: { sales } });
  }

  if (req.query.type === 'inventory') {
    const inventory = await Product.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$category', stock: { $sum: '$stock' }, value: { $sum: { $multiply: ['$stock', '$sellingPrice'] } } } },
    ]);
    return api({ res, message: 'Inventory report fetched', data: { inventory, lowStockProducts: summary.inventoryReport.lowStockProducts } });
  }

  api({ res, message: 'Reports fetched', data: summary });
});
