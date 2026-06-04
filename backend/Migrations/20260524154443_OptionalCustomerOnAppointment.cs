using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class OptionalCustomerOnAppointment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_appointments_customers_customer_id",
                table: "appointments");

            migrationBuilder.AlterColumn<string>(
                name: "phone_number",
                table: "customers",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<long>(
                name: "customer_id",
                table: "appointments",
                type: "bigint",
                nullable: true,
                oldClrType: typeof(long),
                oldType: "bigint");

            migrationBuilder.AddColumn<string>(
                name: "guest_name",
                table: "appointments",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_customers_phone_number",
                table: "customers",
                column: "phone_number",
                unique: true,
                filter: "phone_number IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_appointments_customers_customer_id",
                table: "appointments",
                column: "customer_id",
                principalTable: "customers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_appointments_customers_customer_id",
                table: "appointments");

            migrationBuilder.DropIndex(
                name: "IX_customers_phone_number",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "guest_name",
                table: "appointments");

            migrationBuilder.AlterColumn<string>(
                name: "phone_number",
                table: "customers",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<long>(
                name: "customer_id",
                table: "appointments",
                type: "bigint",
                nullable: false,
                defaultValue: 0L,
                oldClrType: typeof(long),
                oldType: "bigint",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_appointments_customers_customer_id",
                table: "appointments",
                column: "customer_id",
                principalTable: "customers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
