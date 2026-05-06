# ReceiptOCR

AI-assisted receipt extraction with human verification workflows.

The product is intentionally designed around:

> “AI assists first, human verifies second.”

Instead of optimizing for perfect OCR accuracy, the system focuses on:
- fast correction workflows
- visible uncertainty
- defensive parsing
- trust-aware UX

---

# Features

- Receipt image upload (JPG/PNG)
- AI-powered extraction using Gemini Flash
- Editable review workflow
- Inline correction for extracted fields
- “Needs Review” highlighting
- SQLite persistence
- Saved receipts view
- Zod-based validation

---

# Architecture Overview

```txt
React + TypeScript Frontend
            ↓
Express + TypeScript API
            ↓
Gemini Flash Extraction
            ↓
Zod Validation + Normalization
            ↓
SQLite Persistence
```

---

# Extraction Workflow

1. User uploads a receipt image  
2. Backend sends image to Gemini Flash  
3. LLM returns structured receipt data  
4. Response is validated + normalized using Zod  
5. User reviews highlighted fields  
6. Corrected receipt is saved to SQLite  

---

# Confidence & Review Heuristics

The app intentionally avoids pretending extraction is perfectly reliable.

Instead of fake precision percentages, fields are marked using:
- High Confidence
- Medium Confidence
- Needs Review

Fields are flagged when:
- totals don’t match arithmetic
- values are missing
- dates appear malformed
- line items look suspicious

The UI is designed to guide human attention toward likely extraction mistakes.

---

# Defensive Parsing Strategy

LLM output is treated as untrusted input.

All responses are:
- schema validated using Zod
- normalized before persistence
- rejected gracefully if malformed

Possible failures handled:
- blurry receipts
- malformed JSON
- incomplete extraction
- unusual receipt layouts

Users remain in control through inline correction.

---

# Line Item Semantics

Line items are treated as:

> actual purchased products/services.

The following are intentionally modeled separately:
- subtotal
- taxes
- discounts
- tips
- service fees

This keeps transactional items separate from payment adjustments.

---

# Model Choice

Gemini Flash was chosen because it balanced:
- low latency
- low cost
- multimodal support
- fast iteration speed

The project prioritizes:
- responsiveness
- correction UX
- trust

over maximizing raw OCR precision.

---

# Tradeoffs

### SQLite over PostgreSQL

Chosen for simplicity and local setup speed.

### Single-stage extraction

Current flow:

```txt
image → Gemini → structured JSON
```

instead of:

```txt
OCR → preprocessing → extraction pipeline
```

This keeps the MVP lightweight and focused.

### Heuristic confidence

Confidence states are intentionally heuristic rather than probabilistic.

---

# Production Considerations

If scaled further, the system would evolve toward:
- PostgreSQL
- object storage for images
- async extraction queues
- background workers
- Redis caching/rate limiting
- OCR + LLM hybrid extraction
- observability/logging

---

# Known Limitations

- Confidence scoring is heuristic
- Multi-language receipts are not deeply optimized
- Highly distorted receipts may require manual correction
- SQLite is intentionally scoped for local persistence

---

# What I Would Improve With Another Week

- OCR + LLM hybrid pipeline
- image preprocessing
- extraction benchmarking
- better confidence heuristics
- async extraction workers
- duplicate receipt detection

Priority would remain:

> improving extraction reliability and correction UX.

---

# PM Pushback / Product Observations

One major ambiguity is:

> what exactly counts as a “line item.”

Receipts frequently mix:
- purchased items
- taxes
- discounts
- service fees

Another important observation:

> confidence UX matters more than perfect extraction.

Users are willing to correct AI output if:
- suspicious fields are surfaced clearly
- editing is fast
- the workflow feels trustworthy

---

# AI Usage Disclosure

LLMs were used for:
- scaffolding
- prompt iteration
- UI refinement
- implementation acceleration

However:
- validation logic
- correction workflow decisions
- confidence heuristics
- defensive parsing strategy
- tradeoff reasoning

were intentionally designed manually.

---

# Tech Stack

Frontend:
- React
- TypeScript
- Vite

Backend:
- Node.js
- Express
- TypeScript

AI:
- Gemini Flash

Validation:
- Zod

Database:
- SQLite

---

# Setup Instructions

## Install

```bash
npm run install:all
```

## Configure Environment

Create `.env`

```env
GEMINI_API_KEY=your_api_key
```

## Run

```bash
npm run dev
```
