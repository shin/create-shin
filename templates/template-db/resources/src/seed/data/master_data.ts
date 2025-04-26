import { masterDataTable } from "../../db/schema"

export const seed_master_data: (typeof masterDataTable.$inferInsert)[] = [
  {
    version: 1,
    name: "current_number",
    value: 0,
  },
]
