# Receipt Parser

## What did you build?

I built a full-stack web application designed for fast, human-in-the-loop receipt parsing. It consists of a React frontend and a Node.js/Express backend that utilizes OpenAI's GPT-4o-mini to extract structured data from uploaded receipt images. The philosophy is "AI assists first, human verifies second." The backend uses SQLite to persistently store the receipts and line items. The core product experience focuses on the correction UX—surfacing heuristic uncertainty, flagging suspicious fields with subtle UI warnings, and ensuring that any incorrect extraction can be frictionlessly edited inline by a human before saving.

## Biggest tradeoffs?

- **GPT-4o-mini over a dedicated OCR solution**: This choice prioritizes latency, iteration speed, and cost. Since perfect extraction isn't expected and human review is required, GPT-4o-mini provides a good enough baseline at a fraction of the cost and complexity of a multi-stage OCR pipeline.
- **SQLite over PostgreSQL**: SQLite is intentionally simple, lightweight, and requires no external orchestration (like Docker). It perfectly handles the scoped requirement of saving corrected receipts locally.
- **Heuristic Confidence**: The model's confidence is heuristic. The UI honestly reflects this uncertainty to guide human attention rather than pretending to provide mathematical precision.
- **Intentionally Scoped Backend**: The backend serves specific, clear endpoints without overengineering (no microservices, Kafka, or auth layers).

## Where did you use LLMs?

- Used AI for generating the underlying component boilerplate and layout scaffolding.
- Wrote the validation rules (Zod) and backend normalization logic manually to strictly enforce the schema and defensive behavior.
- Iterated heavily on the OpenAI prompt using AI to handle complex cases and guide the model towards outputting the precise JSON required.

## What would you do with another week?

- Implement a hybrid pipeline utilizing dedicated OCR (e.g., Tesseract or a specialized cloud service) paired with the LLM to improve baseline accuracy.
- Improve confidence scoring mechanics, potentially by calculating bounding box alignments or cross-referencing values explicitly.
- Add background processing for batch receipt uploads.
- Build benchmarking datasets to continuously evaluate extraction quality against edge cases (blurry, faded, or handwritten receipts).
- Implement image preprocessing (contrast enhancement, deskewing) on the frontend or backend to feed better images to the LLM.

## What would you push back on as PM?

- **Single-pass LLM extraction reliability**: I would push back against relying solely on an LLM for final truth without a mandatory human review step. Receipts are inherently ambiguous, and extraction will fail gracefully but frequently on poor-quality images.
- **Line item semantics**: I would push back to clarify exactly what constitutes a line item versus an adjustment. Many receipts embed taxes or service fees within line items; keeping them separate is a crucial but complex constraint.
- **Perfect automation**: I would advocate strongly that "AI assists first, human verifies second" is the core feature and resist pressure to make the app "zero-touch" too early in the product lifecycle.

## Setup Instructions

1. Clone the repository.
2. Ensure you have Node.js installed.
3. Add your OpenAI API Key:
   ```bash
   cp .env.example .env
   # Add your OPENAI_API_KEY to .env
   ```
4. Install dependencies:
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   ```
5. Start the application:
   ```bash
   # From the root directory (assuming concurrent scripts are set up, or run in two terminals):
   # Terminal 1: Backend
   cd server
   npm run dev
   
   # Terminal 2: Frontend
   cd client
   npm run dev
   ```
