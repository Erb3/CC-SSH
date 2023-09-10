import { Prisma } from "@prisma/client";

type ComputerWithUser = Prisma.ComputerGetPayload<{
  include: {
    user: true;
  };
}>;

export { ComputerWithUser };
