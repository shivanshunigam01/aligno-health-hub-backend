const r = require('express').Router();
const c = require('../controllers/contentController');
const { protect, adminOnly } = require('../middlewares/auth');

function publicCrud(getCtrl, listPath = '/') {
  r.get(listPath, getCtrl.list);
  r.get('/:id', getCtrl.get);
}

// Public content routes
r.get('/body-parts', c.bodyParts.list);
r.get('/body-parts/:id', c.bodyParts.get);
r.get('/pain-areas', c.painAreas.list);
r.get('/pain-areas/:id', c.painAreas.get);
r.get('/activities', c.activities.list);
r.get('/activities/:id', c.activities.get);
r.get('/blogs', c.blogs.list);
r.get('/blogs/:id', c.blogs.get);
r.get('/posters', c.posters.list);
r.get('/posters/:id', c.posters.get);
r.get('/trust-strip', c.trustStrip.list);
r.get('/trust-strip/:id', c.trustStrip.get);
r.get('/cms', c.cms.get);
r.get('/footer', c.footer.get);
r.get('/contact-info', c.contact.get);
r.get('/policies', c.listPolicies);
r.get('/policies/:slug', c.getPolicy);
r.post('/leads', c.createLead);
r.post('/newsletter', c.newsletter);
r.post('/delivery/check', c.checkDelivery);

module.exports = r;
