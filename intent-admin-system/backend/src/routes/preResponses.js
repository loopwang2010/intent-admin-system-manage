const express = require('express');
const router = express.Router();

// 简单的占位符处理器
const getList = (req, res) => {
  res.json({ success: true, data: { responses: [], total: 0 } });
};

const getById = (req, res) => {
  res.json({ success: true, data: {} });
};

const create = (req, res) => {
  res.status(201).json({ success: true, message: 'Response created' });
};

const update = (req, res) => {
  res.json({ success: true, message: 'Response updated' });
};

const deleteResponse = (req, res) => {
  res.json({ success: true, message: 'Response deleted' });
};

router.get('/', getList);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', deleteResponse);

module.exports = router; 