export type ReplyClassification = "positive" | "negative" | "ambiguous";

const positivePatterns = [
  /\bconfirm(ed)?\b/i,
  /\byes\b/i,
  /\bwe('ll| will) be there\b/i,
  /\bsee you\b/i,
  /\bsounds good\b/i
];

const negativePatterns = [
  /\bcancel\b/i,
  /\bcan't make it\b/i,
  /\bcannot make it\b/i,
  /\bno longer\b/i,
  /\bdecline\b/i,
  /\bnot coming\b/i
];

export function classifyReply(body: string): ReplyClassification {
  const positive = positivePatterns.some((pattern) => pattern.test(body));
  const negative = negativePatterns.some((pattern) => pattern.test(body));
  if (positive && !negative) return "positive";
  if (negative && !positive) return "negative";
  return "ambiguous";
}
