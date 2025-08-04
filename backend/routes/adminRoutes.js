import express from 'express';
import { geocodificaSpazi } from '../controllers/geocodificaController.js';

const router = express.Router();

router.get('/geocodifica', geocodificaSpazi);

export default router;
