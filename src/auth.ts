import { PrismaClient, User } from "@prisma/client";
import { AuthContext } from "ssh2";

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

  async onAuth(ctx: AuthContext) {
    if (ctx.method !== "password") return ctx.reject(["password"]);

    const computer = await this.prisma.computer.findUnique({
      where: {
        id: ctx.username,
      },
      include: {
        user: true,
      },
    });

    if (!computer) {
      return ctx.reject(["password"]);
    }

    console.log("Checking password");
    if (await this.checkAuth(computer.user, ctx.password)) {
      console.log("Password OK");
      return ctx.accept();
    }

    console.log("Password bad.");
    return ctx.reject(["password"]);
  }
}

export { Authenticator };
