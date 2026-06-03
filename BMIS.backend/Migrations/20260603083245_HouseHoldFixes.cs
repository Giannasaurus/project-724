using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BMIS.Migrations
{
    /// <inheritdoc />
    public partial class HouseHoldFixes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "HeadId",
                table: "HouseHolds",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_Residents_HouseHoldId",
                table: "Residents",
                column: "HouseHoldId");

            migrationBuilder.AddForeignKey(
                name: "FK_Residents_HouseHolds_HouseHoldId",
                table: "Residents",
                column: "HouseHoldId",
                principalTable: "HouseHolds",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Residents_HouseHolds_HouseHoldId",
                table: "Residents");

            migrationBuilder.DropIndex(
                name: "IX_Residents_HouseHoldId",
                table: "Residents");

            migrationBuilder.DropColumn(
                name: "HeadId",
                table: "HouseHolds");
        }
    }
}
