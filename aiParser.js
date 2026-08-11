import Anthropic from '@anthropic-ai/sdk';

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
const MAX_INPUT_CHARS = 100000;

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

export function isAIAvailable() {
  return !!process.env.ANTHROPIC_API_KEY;
}

export function getAIModel() {
  return DEFAULT_MODEL;
}

const EXTRACT_TOOL = {
  name: 'extract_society_records',
  description: 'Return every member recovery-receipt record found in the supplied document content.',
  input_schema: {
    type: 'object',
    properties: {
      records: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            staffno: { type: 'string', description: 'Member staff/account number, as printed' },
            name: { type: 'string', description: 'Member full name' },
            year: { type: 'string', description: 'Four digit year, e.g. 2026' },
            month: { type: 'string', description: 'Two digit month, e.g. 07' },
            savingsdeposit: { type: 'number', description: 'Savings deposit amount, 0 if not present' },
            loanrecovery: { type: 'number', description: 'Loan recovery amount, 0 if not present' },
            interestrecovery: { type: 'number', description: 'Interest recovery amount, 0 if not present' }
          },
          required: ['staffno', 'name', 'year', 'month']
        }
      }
    },
    required: ['records']
  }
};

// Uses Claude to extract structured member records from messy/irregular
// PDF text or spreadsheet content that the fixed-format parsers can't
// reliably handle (inconsistent headers, merged cells, free-form layout).
export async function aiExtractRecords(rawText, sourceLabel = 'document') {
  const client = getClient();
  if (!client) {
    throw new Error('ANTHROPIC_API_KEY is not configured on the server.');
  }
  if (!rawText || !rawText.trim()) {
    throw new Error('No extractable text found in the file.');
  }

  const truncated = rawText.length > MAX_INPUT_CHARS ? rawText.slice(0, MAX_INPUT_CHARS) : rawText;

  const message = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 4096,
    system: `You extract member recovery-receipt records from ${sourceLabel} content for a co-operative credit society. Rows may use inconsistent column names, merged headers, or irregular spacing. Map every row you can confidently identify to the schema. Skip rows that are clearly headers, section titles, or totals. Do not invent data that isn't present in the content.`,
    messages: [
      { role: 'user', content: `Extract every member record from this content:\n\n${truncated}` }
    ],
    tools: [EXTRACT_TOOL],
    tool_choice: { type: 'tool', name: 'extract_society_records' }
  });

  const toolUse = message.content.find((c) => c.type === 'tool_use');
  if (!toolUse) {
    throw new Error('AI did not return structured data.');
  }
  return toolUse.input.records || [];
}

// Lightweight round-trip call so the admin can confirm the configured key
// and model actually work, without running a real parsing job.
export async function testAIConnection() {
  const client = getClient();
  if (!client) {
    return { ok: false, error: 'ANTHROPIC_API_KEY is not configured on the server.' };
  }
  try {
    const message = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 16,
      messages: [{ role: 'user', content: 'Reply with only the single word: OK' }]
    });
    const text = message.content.find((c) => c.type === 'text')?.text || '';
    return { ok: true, model: DEFAULT_MODEL, reply: text.trim() };
  } catch (err) {
    return { ok: false, model: DEFAULT_MODEL, error: err.message };
  }
}
