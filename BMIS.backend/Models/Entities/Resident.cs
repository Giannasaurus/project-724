using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;
using BMIS.Models.DTOs;

namespace BMIS.Models.Entities;

public class Resident {
    [Key]
    public int Id { get; set; }
    public required string FirstName { get; set; }
    public string? MiddleName { get; set; }
    public required string LastName { get; set; }
    public string? Suffix { get; set; }
    public DateOnly BirthDate { get; set; }
    public int Age { get => GetAge(); }
    public Sector Sector { get; set; }
    public required Sex Sex { get; set; }
    public CivilStatus CivilStatus { get; set; }
    public string Address { get; set; }
    public string Contact { get; set; }
    public int HouseHoldId { get; set; }

    [SetsRequiredMembers]
    public Resident(
        string firstName,
        string? middleName,
        string lastName,
        string? suffix,
        DateOnly birthDate,
        Sector sector,
        Sex sex,
        CivilStatus civilStatus,
        string address,
        string contact,
        int houseHoldId) {
    
        this.FirstName = firstName; 
        this.MiddleName = middleName;
        this.LastName = lastName;
        this.Suffix = suffix;
        this.BirthDate = birthDate;
        this.Sector = sector;
        this.Sex = sex;
        this.CivilStatus = civilStatus;
        this.Address = address;
        this.Contact = contact;
        this.HouseHoldId = houseHoldId;
    }

    [SetsRequiredMembers]
    public Resident(ResidentCreateDto details) {
        this.FirstName = details.firstName; 
        this.MiddleName = details.middleName;
        this.LastName = details.lastName;
        this.Suffix = details.suffix;
        this.BirthDate = details.birthDate;
        this.Sector = details.sector;
        this.Sex = details.sex;
        this.CivilStatus = details.civilStatus;
        this.Address = details.address;
        this.Contact = details.contact;
        this.HouseHoldId = details.houseHoldId;
    }

    protected int GetAge() {
        DateOnly now = DateOnly.FromDateTime(DateTime.Now);
        int _age = now.Year - BirthDate.Year;
        if(BirthDate > now) {
            _age--;
        }

        return _age;
    }

    public override string ToString(){
        string name = $"{LastName}, {FirstName}";
        
        if(!string.IsNullOrEmpty(MiddleName)) {
            name += $" {MiddleName[0]}.";
        }

        if(!string.IsNullOrEmpty(Suffix)) {
            name += $", {Suffix}";
        }


        return name;
    }
}
