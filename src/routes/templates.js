const express = require('express');
const protect = require('../middlewares/auth');
const TemplateService = require('../services/templateService');
const logger = require('../utils/logger');

const router = express.Router();
router.use(protect);

router.post('/', async (req, res) => {
  const { name, inputData } = req.body;
  if (!name || !inputData) {
    return res.status(400).json({ error: 'Le nom et les données du modèle sont requis.' });
  }
  try {
    const template = await TemplateService.createTemplate(req.user.id, name, inputData);
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const templates = await TemplateService.getTemplates(req.user.id);
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await TemplateService.deleteTemplate(req.user.id, id);
    if (result.count === 0) {
      return res.status(404).json({ error: 'Modèle non trouvé ou non autorisé.' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;