import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";
import { generateUniqueHandle } from "@/lib/auth/handle";
import { setAuthCookies } from "@/lib/auth/cookies";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { email, password, college } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const handle = await generateUniqueHandle();
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        handle,
        college: college ?? null,
      },
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        handle: user.handle,
        college: user.college,
        role: user.role,
      },
    });

    return setAuthCookies(response, {
      userId: user.id,
      handle: user.handle,
      role: user.role,
    });
  } catch {
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
