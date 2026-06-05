using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class StaffEmailUniqueAmongActive : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_staff_email",
                table: "staff");

            migrationBuilder.CreateIndex(
                name: "IX_staff_email",
                table: "staff",
                column: "email",
                unique: true,
                filter: "email IS NOT NULL AND \"IsActive\"");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_staff_email",
                table: "staff");

            migrationBuilder.CreateIndex(
                name: "IX_staff_email",
                table: "staff",
                column: "email",
                unique: true,
                filter: "email IS NOT NULL");
        }
    }
}
