import { prisma } from "@/lib/prisma";

const ADJECTIVES = [
  "Quiet",
  "Swift",
  "Bold",
  "Calm",
  "Bright",
  "Wild",
  "Clever",
  "Lucky",
  "Brave",
  "Cosmic",
  "Neon",
  "Silent",
  "Golden",
  "Silver",
  "Mystic",
];

const ANIMALS = [
  "Falcon",
  "Tiger",
  "Panda",
  "Otter",
  "Eagle",
  "Wolf",
  "Fox",
  "Hawk",
  "Lynx",
  "Crane",
  "Raven",
  "Dolphin",
  "Phoenix",
  "Dragon",
  "Koala",
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDigits(): string {
  return String(Math.floor(100 + Math.random() * 900));
}

export async function generateUniqueHandle(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const handle = `${randomItem(ADJECTIVES)}${randomItem(ANIMALS)}${randomDigits()}`;
    const existing = await prisma.user.findUnique({ where: { handle } });
    if (!existing) return handle;
  }
  throw new Error("Failed to generate unique handle");
}
