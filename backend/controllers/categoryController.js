const Category = require('../models/Category');

const getAll = async (req, res) => {
  try { res.json({ success: true, data: await Category.getAll() }); }
  catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
const create = async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name required' });
    res.status(201).json({ success: true, data: await Category.create({ name, description, color, icon }) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
const update = async (req, res) => {
  try { res.json({ success: true, data: await Category.update(req.params.id, req.body) }); }
  catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
const remove = async (req, res) => {
  try { await Category.delete(req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
module.exports = { getAll, create, update, remove };
