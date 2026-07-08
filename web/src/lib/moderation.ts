export type ModerationResult =
  | { action: "block"; reason: string }
  | { action: "allow"; isFlagged: boolean };

const HARD_BLOCK_PATTERNS: { pattern: RegExp; reason: string }[] = [
  {
    pattern:
      /\b(kill\s+yourself|kys|suicide\s+method|how\s+to\s+hang|end\s+my\s+life)\b/i,
    reason: "Self-harm content is not allowed",
  },
];

const SOFT_FLAG_PATTERNS: RegExp[] = [
  /\b(buy\s+now|click\s+here|free\s+money|crypto\s+giveaway)\b/i,
  /(https?:\/\/[^\s]+)/i,
  /(.)\1{10,}/,
  /\b(follow\s+me\s+on\s+instagram|dm\s+for\s+price)\b/i,
];

export function moderateContent(content: string): ModerationResult {
  const normalized = content.trim();

  for (const { pattern, reason } of HARD_BLOCK_PATTERNS) {
    if (pattern.test(normalized)) {
      return { action: "block", reason };
    }
  }

  const isFlagged = SOFT_FLAG_PATTERNS.some((p) => p.test(normalized));
  return { action: "allow", isFlagged };
}
