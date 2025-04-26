import { db } from "../db/db"
import { masterDataTable, userTable } from "../db/schema"
import { seed_master_data, seed_users } from "./data"

async function main() {
  // Delete all data
  await db.delete(masterDataTable)
  console.log("Deleted all master data successfully")

  await db.delete(userTable)
  console.log("Deleted all users successfully")

  // Insert new data
  await db.insert(masterDataTable).values(seed_master_data)
  console.log("Seeded master data successfully")

  await db.insert(userTable).values(seed_users)
  console.log("Seeded users successfully")
}

main()
