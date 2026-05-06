import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './db';
import { ReceiptSchema, Receipt } from './types';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { parseReceiptImage } from './services/gemini';
import fs from 'fs';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// POST /api/parse-receipt - Accept image and return structured JSON
app.post('/api/parse-receipt', upload.single('receipt'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

  try {
    let result;
    try {
      result = await parseReceiptImage(req.file.path, req.file.mimetype);
    } catch (parseError) {
      console.warn("Initial parse failed, retrying once...", parseError);
      // Simple retry logic
      result = await parseReceiptImage(req.file.path, req.file.mimetype);
    }

    // Map LLM output to our internal Receipt format
    const receipt: Receipt = {
      id: uuidv4(),
      merchant: result.merchant,
      date: result.date,
      subtotal: result.subtotal,
      tax: result.tax,
      tip: result.tip,
      discount: result.discount,
      total: result.total,
      confidence: result.confidence,
      lineItems: result.lineItems.map(item => ({
        ...item,
        id: uuidv4(),
        confidence: result.confidence // Simplified: apply global confidence if item-level not present
      })),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    res.json(receipt);
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ 
      error: 'Failed to parse receipt. Please try a clearer image or enter data manually.',
      details: error instanceof Error ? error.message : String(error)
    });
  } finally {
    // Cleanup uploaded file
    if (req.file) fs.unlinkSync(req.file.path);
  }
});

// GET /api/receipts - Fetch all saved receipts
app.get('/api/receipts', async (req, res) => {
  try {
    const db = await getDb();
    const receipts = await db.all('SELECT * FROM receipts ORDER BY createdAt DESC');
    res.json(receipts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
});

// GET /api/receipts/:id - Fetch single receipt with line items
app.get('/api/receipts/:id', async (req, res) => {
  try {
    const db = await getDb();
    const receipt = await db.get('SELECT * FROM receipts WHERE id = ?', req.params.id);
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });

    const lineItems = await db.all('SELECT * FROM line_items WHERE receiptId = ?', req.params.id);
    res.json({ ...receipt, lineItems });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
});

// POST /api/receipts - Save corrected receipt
app.post('/api/receipts', async (req, res) => {
  try {
    const validated = ReceiptSchema.parse(req.body);
    const db = await getDb();
    const id = validated.id || uuidv4();
    const now = new Date().toISOString();

    await db.run('BEGIN TRANSACTION');

    await db.run(`
      INSERT OR REPLACE INTO receipts (id, merchant, date, subtotal, tax, discount, tip, total, confidence, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, validated.merchant, validated.date, validated.subtotal, validated.tax, validated.discount, validated.tip,
      validated.total, validated.confidence, 'saved', validated.createdAt || now, now
    ]);

    // Clear old line items and insert new ones
    await db.run('DELETE FROM line_items WHERE receiptId = ?', id);
    for (const item of validated.lineItems || []) {
      await db.run(`
        INSERT INTO line_items (id, receiptId, name, amount, confidence)
        VALUES (?, ?, ?, ?, ?)
      `, [uuidv4(), id, item.name, item.amount, item.confidence]);
    }

    await db.run('COMMIT');
    res.json({ id, message: 'Receipt saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Invalid receipt data' });
  }
});

// PUT /api/receipts/:id - Update receipt
app.put('/api/receipts/:id', async (req, res) => {
  try {
    const validated = ReceiptSchema.parse(req.body);
    const db = await getDb();
    const id = req.params.id;
    const now = new Date().toISOString();

    await db.run('BEGIN TRANSACTION');

    await db.run(`
      INSERT OR REPLACE INTO receipts (id, merchant, date, subtotal, tax, discount, tip, total, confidence, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, validated.merchant, validated.date, validated.subtotal, validated.tax, validated.discount, validated.tip,
      validated.total, validated.confidence, 'saved', validated.createdAt || now, now
    ]);

    await db.run('DELETE FROM line_items WHERE receiptId = ?', id);
    for (const item of validated.lineItems || []) {
      await db.run(`
        INSERT INTO line_items (id, receiptId, name, amount, confidence)
        VALUES (?, ?, ?, ?, ?)
      `, [uuidv4(), id, item.name, item.amount, item.confidence]);
    }

    await db.run('COMMIT');
    res.json({ id, message: 'Receipt updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Invalid receipt data' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
