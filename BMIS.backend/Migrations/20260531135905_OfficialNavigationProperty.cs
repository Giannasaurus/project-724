using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BMIS.Migrations
{
    /// <inheritdoc />
    public partial class OfficialNavigationProperty : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Officials_OfficialInfoResidentId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_OfficialInfoResidentId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "OfficialInfoResidentId",
                table: "Users");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Officials_ResidentId",
                table: "Users",
                column: "ResidentId",
                principalTable: "Officials",
                principalColumn: "ResidentId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Officials_ResidentId",
                table: "Users");

            migrationBuilder.AddColumn<Guid>(
                name: "OfficialInfoResidentId",
                table: "Users",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_Users_OfficialInfoResidentId",
                table: "Users",
                column: "OfficialInfoResidentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Officials_OfficialInfoResidentId",
                table: "Users",
                column: "OfficialInfoResidentId",
                principalTable: "Officials",
                principalColumn: "ResidentId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
