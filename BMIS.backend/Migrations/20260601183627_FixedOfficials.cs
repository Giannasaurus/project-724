using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BMIS.Migrations
{
    /// <inheritdoc />
    public partial class FixedOfficials : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "AssignDate",
                table: "Officials",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));

            migrationBuilder.AddColumn<DateOnly>(
                name: "EndDate",
                table: "Officials",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Officials",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AssignDate",
                table: "Officials");

            migrationBuilder.DropColumn(
                name: "EndDate",
                table: "Officials");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Officials");
        }
    }
}
