import { Migration, Schema } from "@providers/database/migration";

export default new (class extends Migration {
  public async up(schema: Schema) {
    schema.createTable("testing", (table) => {
      table.increments("id");
      table.string("name").notNullable();
      table.timestamps();
    });
  }

  public async down(schema: Schema) {
    schema.dropTable("testing");
  }
})();
