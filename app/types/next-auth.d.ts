import type { DefaultSession } from "next-auth";

export type AppRole = "PEGAWAI" | "ADMIN";

declare module "next-auth" {
  interface User {
    role: AppRole;
    mustChangePassword: boolean;
  }
  interface Session {
    user: {
      id: string;
      role: AppRole;
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: AppRole;
    mustChangePassword: boolean;
  }
}
