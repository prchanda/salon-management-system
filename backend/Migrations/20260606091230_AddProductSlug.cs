using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddProductSlug : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Add the column nullable so existing rows can be backfilled
            //    before the NOT NULL + UNIQUE constraints are applied.
            migrationBuilder.AddColumn<string>(
                name: "Slug",
                table: "products",
                type: "text",
                nullable: true);

            // 2. Backfill slugs from the product name. Lowercase, strip non
            //    alphanumerics to dashes, trim leading/trailing dashes.
            migrationBuilder.Sql(@"
                UPDATE products
                SET ""Slug"" = NULLIF(
                    REGEXP_REPLACE(
                        REGEXP_REPLACE(LOWER(""Name""), '[^a-z0-9]+', '-', 'g'),
                        '^-+|-+$', '', 'g'
                    ),
                    ''
                )
                WHERE ""Slug"" IS NULL;
            ");

            // 3. Anything that ended up empty (e.g. name was only punctuation)
            //    gets a deterministic fallback derived from the row id.
            migrationBuilder.Sql(@"
                UPDATE products
                SET ""Slug"" = 'product-' || ""Id""
                WHERE ""Slug"" IS NULL OR ""Slug"" = '';
            ");

            // 4. Deduplicate: append -2, -3, … to subsequent rows that share
            //    a slug, in id order (the first row keeps the bare slug).
            migrationBuilder.Sql(@"
                WITH dupes AS (
                    SELECT ""Id"", ""Slug"",
                           ROW_NUMBER() OVER (PARTITION BY ""Slug"" ORDER BY ""Id"") AS rn
                    FROM products
                )
                UPDATE products p
                SET ""Slug"" = d.""Slug"" || '-' || d.rn
                FROM dupes d
                WHERE p.""Id"" = d.""Id"" AND d.rn > 1;
            ");

            // 5. Promote the column to NOT NULL now that every row has a value.
            migrationBuilder.AlterColumn<string>(
                name: "Slug",
                table: "products",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_products_Slug",
                table: "products",
                column: "Slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_products_Slug",
                table: "products");

            migrationBuilder.DropColumn(
                name: "Slug",
                table: "products");
        }
    }
}
