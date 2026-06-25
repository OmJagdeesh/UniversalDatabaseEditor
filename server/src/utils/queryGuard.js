/**
 * Detects dangerous SQL patterns that could cause data loss.
 * Returns an object indicating whether the query is dangerous and which patterns matched.
 */

const DANGEROUS_PATTERNS = [
  { regex: /\bDROP\s+DATABASE\b/i, label: 'DROP DATABASE' },
  { regex: /\bDROP\s+TABLE\b/i, label: 'DROP TABLE' },
  { regex: /\bDROP\s+INDEX\b/i, label: 'DROP INDEX' },
  { regex: /\bTRUNCATE\b/i, label: 'TRUNCATE' },
  { regex: /\bALTER\s+TABLE\s+\S+\s+DROP\b/i, label: 'ALTER TABLE ... DROP' },
  { regex: /\bDELETE\s+FROM\s+\S+\s*;?\s*$/i, label: 'DELETE without WHERE (deletes all rows)' },
  { regex: /\bDELETE\s+\*\b/i, label: 'DELETE *' }
];

export function analyzeQuery(queryText) {
  const matched = [];

  for (const { regex, label } of DANGEROUS_PATTERNS) {
    if (regex.test(queryText)) {
      matched.push(label);
    }
  }

  return {
    dangerous: matched.length > 0,
    patterns: matched
  };
}
