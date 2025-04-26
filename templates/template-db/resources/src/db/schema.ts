import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  date,
  integer,
} from "drizzle-orm/pg-core"

// MasterData table
export const masterDataTable = pgTable("master_data", {
  id: uuid("id").defaultRandom().primaryKey(),
  version: integer("version").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  value: jsonb("value").notNull(), // jsonb for any type
  createAt: timestamp("create_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})

// Users table
export const userTable = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  lastLoginDate: timestamp("last_login_date", { withTimezone: true }).notNull(),
  createAt: timestamp("create_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})
