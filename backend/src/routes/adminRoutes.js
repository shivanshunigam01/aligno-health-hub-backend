const r = require('express').Router();
const c = require('../controllers/contentController');
const upload = require('../controllers/uploadController');
const admin = require('../controllers/adminController');
const uploadMw = require('../middlewares/upload');
const { protect, adminOnly } = require('../middlewares/auth');

r.use(protect, adminOnly);

// Dashboard & reports
r.get('/dashboard', admin.dashboard);
r.get('/analytics', admin.analytics);
r.get('/reports', admin.reports);

// Cloudinary upload
r.post('/upload', uploadMw.array('images', 10), upload.upload);
r.post('/upload/single', uploadMw.single('image'), upload.upload);
r.delete('/upload/:publicId', upload.remove);

// Taxonomy admin CRUD
r.get('/body-parts', (req, _res, next) => { req.query.admin = 'true'; next(); }, c.bodyParts.list);
r.post('/body-parts', c.bodyParts.create);
r.patch('/body-parts/:id', c.bodyParts.update);
r.delete('/body-parts/:id', c.bodyParts.remove);
r.get('/pain-areas', (req, _res, next) => { req.query.admin = 'true'; next(); }, c.painAreas.list);
r.post('/pain-areas', c.painAreas.create);
r.patch('/pain-areas/:id', c.painAreas.update);
r.delete('/pain-areas/:id', c.painAreas.remove);
r.get('/activities', (req, _res, next) => { req.query.admin = 'true'; next(); }, c.activities.list);
r.post('/activities', c.activities.create);
r.patch('/activities/:id', c.activities.update);
r.delete('/activities/:id', c.activities.remove);

// Content admin CRUD
r.get('/blogs', (req, _res, next) => { req.query.admin = 'true'; next(); }, c.blogs.list);
r.post('/blogs', c.blogs.create);
r.patch('/blogs/:id', c.blogs.update);
r.delete('/blogs/:id', c.blogs.remove);
r.get('/posters', (req, _res, next) => { req.query.admin = 'true'; next(); }, c.posters.list);
r.post('/posters', c.posters.create);
r.patch('/posters/:id', c.posters.update);
r.delete('/posters/:id', c.posters.remove);
r.get('/trust-strip', (req, _res, next) => { req.query.admin = 'true'; next(); }, c.trustStrip.list);
r.patch('/trust-strip/:id', c.trustStrip.update);
r.delete('/trust-strip/:id', c.trustStrip.remove);

// Singleton CMS settings
r.patch('/cms', c.cms.update);
r.patch('/footer', c.footer.update);
r.patch('/contact-info', c.contact.update);
r.patch('/policies/:slug', c.updatePolicy);

// Leads
r.get('/leads', c.listLeads);
r.patch('/leads/:id', c.updateLead);
r.delete('/leads/:id', c.deleteLead);

module.exports = r;
