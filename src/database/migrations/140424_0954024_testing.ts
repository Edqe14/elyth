import { Migration, Schema } from "@providers/database/migration";

export default new (class extends Migration {
  public async up(schema: Schema) {
    await schema.createTable("testing", (table) => {
      table.increments("id");
      table.string("name").notNullable();
      table.timestamps(true, true);
    });
  }

  public async down(schema: Schema) {
    await schema.dropTable("testing");
  }
})();
