import jwt from "jsonwebtoken";

type TokenPayload = {
  userId: string;
  handle: string;
  role: string;
};

export async function verifySocketToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = process.env.JWT_SECRET!;
    return jwt.verify(token, secret) as TokenPayload;
  } catch {
    return null;
  }
}
