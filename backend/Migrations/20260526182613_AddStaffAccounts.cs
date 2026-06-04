using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddStaffAccounts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "password_hash",
                table: "staff",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "password_salt",
                table: "staff",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "registered_at",
                table: "staff",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "username",
                table: "staff",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_staff_username",
                table: "staff",
                column: "username",
                unique: true,
                filter: "username IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_staff_username",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "password_hash",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "password_salt",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "registered_at",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "username",
                table: "staff");
        }
    }
}
