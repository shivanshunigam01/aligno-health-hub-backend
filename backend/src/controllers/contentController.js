const Lead = require('../models/Lead');
const PolicyPage = require('../models/PolicyPage');
const CmsContent = require('../models/CmsContent');
const FooterContent = require('../models/FooterContent');
const ContactInfo = require('../models/ContactInfo');
const { BodyPart, PainArea, Activity } = require('../models/Taxonomy');
const Blog = require('../models/Blog');
const Poster = require('../models/Poster');
const TrustStrip = require('../models/TrustStrip');
const api = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { makeCrud, makeSingleton } = require('./contentFactory');

const bodyPart = makeCrud(BodyPart, { publicFilter: () => ({ enabled: true }) });
const painArea = makeCrud(PainArea, { publicFilter: () => ({ enabled: true }) });
const activity = makeCrud(Activity, { publicFilter: () => ({ enabled: true }) });
const blog = makeCrud(Blog, { publicFilter: () => ({ published: true }) });
const poster = makeCrud(Poster, { publicFilter: () => ({ enabled: true }) });
const trustStrip = makeCrud(TrustStrip, { publicFilter: () => ({ enabled: true }) });
const cms = makeSingleton(CmsContent, 'homepage');
const footer = makeSingleton(FooterContent, 'main');
const contact = makeSingleton(ContactInfo, 'main');

exports.bodyParts = bodyPart;
exports.painAreas = painArea;
exports.activities = activity;
exports.blogs = blog;
exports.posters = poster;
exports.trustStrip = trustStrip;
exports.cms = cms;
exports.footer = footer;
exports.contact = contact;

exports.createLead = asyncHandler(async (req, res) => {
  const lead = await Lead.create(req.body);
  api({ res, statusCode: 201, message: 'Lead submitted', data: lead });
});

exports.listLeads = asyncHandler(async (req, res) => {
  const q = { isDeleted: false };
  if (req.query.status) q.status = req.query.status;
  if (req.query.source) q.source = req.query.source;
  api({ res, message: 'Leads fetched', data: await Lead.find(q).sort('-createdAt') });
});

exports.updateLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!lead) throw new AppError('Lead not found', 404);
  api({ res, message: 'Lead updated', data: lead });
});

exports.deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findByIdAndUpdate(req.params.id, { isDeleted: true, deletedAt: new Date() }, { new: true });
  if (!lead) throw new AppError('Lead not found', 404);
  api({ res, message: 'Lead deleted', data: lead });
});

exports.getPolicy = asyncHandler(async (req, res) => {
  const policy = await PolicyPage.findOne({ slug: req.params.slug });
  if (!policy) throw new AppError('Policy not found', 404);
  api({ res, message: 'Policy fetched', data: policy });
});

exports.listPolicies = asyncHandler(async (req, res) =>
  api({ res, message: 'Policies fetched', data: await PolicyPage.find().sort('slug') })
);

exports.updatePolicy = asyncHandler(async (req, res) => {
  const policy = await PolicyPage.findOneAndUpdate({ slug: req.params.slug }, req.body, { new: true, upsert: true, runValidators: true });
  api({ res, message: 'Policy updated', data: policy });
});

exports.checkDelivery = asyncHandler(async (req, res) => {
  const pincode = String(req.body.pincode || '');
  const available = /^\d{6}$/.test(pincode);
  const estimatedDays = available ? 3 + (parseInt(pincode.slice(-1), 10) % 4) : null;
  api({ res, message: 'Delivery check complete', data: { available, estimatedDays } });
});

exports.newsletter = asyncHandler(async (req, res) => {
  const lead = await Lead.create({ name: req.body.name || 'Newsletter', email: req.body.email, message: 'Newsletter subscription', source: 'newsletter' });
  api({ res, statusCode: 201, message: 'Subscribed successfully', data: lead });
});
