using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BMIS.Migrations
{
    /// <inheritdoc />
    public partial class HouseHoldRemoveHeadId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HeadId",
                table: "HouseHolds");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "HeadId",
                table: "HouseHolds",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));
        }
    }
}
