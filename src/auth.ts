import { Prisma, PrismaClient, User } from "@prisma/client";
import { AuthContext } from "ssh2";
import { Computer } from "./computer";
import { ComputerWithUser } from "./types";

class Authenticator {
  prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async checkAuth(user: User, password: string): Promise<boolean> {
    if (!user?.password) {
      return false;
    }

    if (user.password !== password) {
      return false;
    }

    return true;
  }

  async onAuth(ctx: AuthContext): Promise<null | ComputerWithUser> {
    if (ctx.method !== "password") {
      ctx.reject(["password"]);
      return null;
    }

    const computer = await this.prisma.computer.findUnique({
      where: {
        id: ctx.username,
      },
      include: {
        user: true,
      },
    });

    if (!computer) {
      ctx.reject(["password"]);
      return null;
    }

    console.log("Checking password");
    if (await this.checkAuth(computer.user, ctx.password)) {
      console.log("Password OK");
      ctx.accept();
      return computer;
    }

    console.log("Password bad.");
    ctx.reject(["password"]);
    return null;
  }
}

export { Authenticator };
