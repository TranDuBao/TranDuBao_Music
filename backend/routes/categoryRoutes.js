const router = require('express').Router();
const c = require('../controllers/categoryController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', c.getAll);
router.post('/', requireAuth, requireAdmin, c.create);
router.put('/:id', requireAuth, requireAdmin, c.update);
router.delete('/:id', requireAuth, requireAdmin, c.remove);
module.exports = router;
