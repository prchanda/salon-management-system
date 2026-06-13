using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddProductOrderPayment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "amount_paid",
                table: "product_orders",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "payment_method",
                table: "product_orders",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "amount_paid",
                table: "product_orders");

            migrationBuilder.DropColumn(
                name: "payment_method",
                table: "product_orders");
        }
    }
}
