'use strict';

const express = require('express');
const router = express.Router();

const { loadState, saveState } = require('../database');

router.get('/state', async (req, res, next) => {
  try {
    const state = await loadState();
    res.json({ state });
  } catch (error) {
    next(error);
  }
});

router.put('/state', async (req, res, next) => {
  try {
    const payload = req.body && (req.body.state || req.body.data || req.body);
    if (!payload || typeof payload !== 'object') {
      res.status(400).json({ error: 'Invalid state payload.' });
      return;
    }
    await saveState(payload);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
