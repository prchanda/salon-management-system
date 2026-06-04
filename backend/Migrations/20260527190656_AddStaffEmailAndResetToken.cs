using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddStaffEmailAndResetToken : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "email",
                table: "staff",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "password_reset_expires_at",
                table: "staff",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "password_reset_token_hash",
                table: "staff",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_staff_email",
                table: "staff",
                column: "email",
                unique: true,
                filter: "email IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_staff_email",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "email",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "password_reset_expires_at",
                table: "staff");

            migrationBuilder.DropColumn(
                name: "password_reset_token_hash",
                table: "staff");
        }
    }
}
