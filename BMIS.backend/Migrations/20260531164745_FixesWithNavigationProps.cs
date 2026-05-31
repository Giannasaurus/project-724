using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BMIS.Migrations
{
    /// <inheritdoc />
    public partial class FixesWithNavigationProps : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Residents_ResidentId",
                table: "Users");

            migrationBuilder.CreateIndex(
                name: "IX_BlotterParticipants_ResidentId",
                table: "BlotterParticipants",
                column: "ResidentId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_BlotterParticipants_Residents_ResidentId",
                table: "BlotterParticipants",
                column: "ResidentId",
                principalTable: "Residents",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Officials_Residents_ResidentId",
                table: "Officials",
                column: "ResidentId",
                principalTable: "Residents",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BlotterParticipants_Residents_ResidentId",
                table: "BlotterParticipants");

            migrationBuilder.DropForeignKey(
                name: "FK_Officials_Residents_ResidentId",
                table: "Officials");

            migrationBuilder.DropIndex(
                name: "IX_BlotterParticipants_ResidentId",
                table: "BlotterParticipants");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Residents_ResidentId",
                table: "Users",
                column: "ResidentId",
                principalTable: "Residents",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
