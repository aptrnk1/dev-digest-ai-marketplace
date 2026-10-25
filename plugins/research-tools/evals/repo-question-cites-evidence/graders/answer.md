---
type: llm
focus: last_message
---

PASS if the answer says `orderTotal` does not include tax, that tax is applied in `invoiceAmount` in `src/tax/invoice.ts`, that the rate is 0.2 (20%, `VAT_RATE`), and backs these claims with file:line references.
FAIL if it claims `orderTotal` includes tax, gives a different rate, cites files or lines that do not exist, or gives no evidence.
