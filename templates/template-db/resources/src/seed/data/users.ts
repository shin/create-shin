import { userTable } from "../../db/schema"

export const seed_users: (typeof userTable.$inferInsert)[] = [
  {
    username: "test1",
    passwordHash: "00001",
    email: "00001@gmail.com",
    firstName: "Tarou",
    lastName: "Sato",
    dateOfBirth: new Date("1990-01-01").toISOString().split("T")[0],
    phoneNumber: "080-1234-5678",
    status: "Active",
    role: "ADMIN",
    lastLoginDate: new Date(),
  },
]
