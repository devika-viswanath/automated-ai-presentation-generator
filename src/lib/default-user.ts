"use server";

import { db } from "@/server/db";

const DEFAULT_USER_EMAIL = "local@local.dev";

export async function getDefaultUser() {
  let user = await db.user.findUnique({
    where: { email: DEFAULT_USER_EMAIL },
  });

  if (!user) {
    user = await db.user.create({
      data: {
        email: DEFAULT_USER_EMAIL,
        name: "Local User",
        hasAccess: true,
        role: "ADMIN",
      },
    });
  }

  return user;
}
