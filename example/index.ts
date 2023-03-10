import { Generated, Kysely } from "kysely";
import { WebSQLDialect } from "kysely-websql";

interface PetTable {
  id: Generated<number>;
  name: string;
  owner_id: number;
  species: "dog" | "cat";
}

interface Database {
  pet: PetTable;
}

const db = new Kysely<Database>({
  dialect: new WebSQLDialect(
    // open database and migrate
    window.openDatabase(
      "documents",
      "",
      "Offline document storage",
      5 * 1024 * 1024,
      function creationCallback(db) {
        db.transaction((tx) => {
          tx.executeSql(
            "CREATE TABLE IF NOT EXISTS pet (name, species, owner_id);"
          );
        });
      }
    )
  ),
});

async function demo() {
  // wait for create table
  await new Promise((r) => setTimeout(r, 500));

  await db
    .insertInto("pet")
    .values({ name: "Catto", species: "cat", owner_id: 1 })
    .execute();

  const pets = await db.selectFrom("pet").selectAll().executeTakeFirst();
  console.log("pets : ", { pets });
}

demo();
