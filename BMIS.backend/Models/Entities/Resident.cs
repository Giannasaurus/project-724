namespace BMIS.Models.Entities;

public class Resident {
    public Guid Id { get; private set; }

    public string FirstName { get; private set; }
    public string? MiddleName { get; private set; }
    public string LastName { get; private set; }
    public string? Suffix { get; private set; }
    
    public DateOnly BirthDate { get; private set; }
    public string BirthPlace { get; private set; }
    public Sex Sex { get; private set; }
    public string Citizenship { get; private set; }

    public bool IsSenior { get; private set; }
    public bool IsPWD { get; private set; }
    public CivilStatus CivilStatus { get; private set; }
    public string? Religion { get; private set; } 

    public string Address { get; private set; }
    public string? Phone { get; private set; }
    public string? Email { get; private set; }
    
    public bool IsHead { get; private set; }
    public int HouseHoldId { get; private set; }

    private Resident() { }

    public class Builder  {
        private readonly Resident _resident = new Resident();
        
        public Builder WithName(string firstName, string? middleName, string lastName, string suffix) {
            if(!string.IsNullOrEmpty(firstName)) {
                _resident.FirstName = firstName; 
            }
            
            if(!string.IsNullOrEmpty(middleName)) {
                _resident.MiddleName = middleName; 
            }
            
            if(!string.IsNullOrEmpty(lastName)) {
                _resident.LastName = lastName; 
            }

            return this;
        }

        public Builder BornOn(DateOnly birthDate, string birthPlace, Sex sex, string citizenship) {
            if(birthDate < DateOnly.FromDateTime(DateTime.Now)) {
                _resident.BirthDate = birthDate;
            }

            if(!string.IsNullOrEmpty(birthPlace)) {
                _resident.BirthPlace = birthPlace;
            }

            if(!string.IsNullOrEmpty(citizenship)) {
                _resident.Citizenship = citizenship;
            }

            _resident.Sex = sex;

            return this;
        }

        public Builder AsPWD() {
            _resident.IsPWD = true;

            return this;
        }
        
        public Builder AsSenior() {
            _resident.IsSenior = true;

            return this;
        }
        
        public Builder AsHouseHoldHead() {
            _resident.IsHead = true;

            return this;
        }
        
        public Builder InHouseHold(int houseHoldId) {
            _resident.HouseHoldId = houseHoldId;

            return this;
        }
        
        public Builder WithCivilStatus(CivilStatus civilStatus) {
            _resident.CivilStatus = civilStatus;

            return this;
        }
    
        public Builder InBeliefOf(string religion) {
            if(!string.IsNullOrEmpty(religion)) {
                _resident.Religion = religion;
            }

            return this;
        }


        public Builder ResidingAt(string address) {
            _resident.Address = address;

            return this;
        }
    
        public Builder WithContactInfo(string? phone, string? email) {
            _resident.Phone = phone;
            _resident.Email = email;

            return this;
        }

        // check if values are empty
        public Resident? Build() {
            // TODO:
            //  implement data validation
            //

            /*
            if(string.IsNullOrEmpty(_resident.FirstName)) {
                Console.WriteLine("[!] error: create resident missing first name");
                return null; 
            }
            
            if(string.IsNullOrEmpty(_resident.LastName)) {
                Console.WriteLine("[!] error: create resident missing last name");
                return null; 
            }
            
            if(_resident.BirthDate == null) {
                Console.WriteLine("[!] error: create resident missing birth date");
                return null; 
            }
            
            if(_resident.Sex == null) {
                Console.WriteLine("[!] error: create resident missing sex");
                return null; 
            }
            
            if(_resident.HouseHoldId == null) {
                Console.WriteLine("[!] error: create resident missing householdId");
                return null; 
            }
            */

            return _resident;
        }
    }

    public void UpdateName(string? firstName, string? middleName, string? lastName, string? suffix) {
        if(!string.IsNullOrEmpty(firstName)) {
            this.FirstName = firstName;
        }
        
        if(!string.IsNullOrEmpty(middleName)) {
            this.MiddleName = middleName;
        }
        
        if(!string.IsNullOrEmpty(lastName)) {
            this.LastName = lastName;
        }

        if(!string.IsNullOrEmpty(suffix)) {
            this.Suffix = suffix;
        }
    }

    public void UpdateBirth(DateOnly? birthDate, string? birthPlace, Sex? sex, string? citizenship) {
        if(birthDate != null && birthDate < DateOnly.FromDateTime(DateTime.Now)) {
            this.BirthDate = (DateOnly)birthDate;
        }

        if(!string.IsNullOrEmpty(birthPlace)) {
            this.BirthPlace = birthPlace;
        }

        if(sex != null) {
            this.Sex = (Sex)sex;
        }
        
        if(!string.IsNullOrEmpty(citizenship)) {
            this.Citizenship = citizenship;
        }
    }

    public void UpdateSeniorStatus(bool? isSenior) {
        if(isSenior != null) {
            this.IsSenior = (bool)isSenior; 
        }
    }
    
    public void UpdatePWDStatus(bool? isPWD) {
        if(isPWD != null) {
            this.IsPWD = (bool)isPWD; 
        }
    }

    public void UpdateCivilStatus(CivilStatus? civilStatus) {
        if(civilStatus != null) {
            this.CivilStatus = (CivilStatus)civilStatus;
        }
    }

    public void UpdateReligion(string? religion){
        if(!string.IsNullOrEmpty(religion)) {
            this.Religion = religion;
        }
    }

    public void UpdateContactInfo(string? phone, string? email) {
        if(!string.IsNullOrEmpty(phone)) {
            this.Phone = phone;
        }

        if(!string.IsNullOrEmpty(email)) {
            this.Email = email;
        }
    }
    
    public void UpdateHouseHold(int? houseHoldId, bool? isHead = false) {
        if(houseHoldId != null) {
            this.HouseHoldId = (int)houseHoldId;
        }

        if(isHead != null) {
            this.IsHead = (bool)isHead;
        }
    }

    public override string ToString() {
        string name = $"{this.LastName}, {this.FirstName}";
        
        if(!string.IsNullOrEmpty(this.MiddleName)) {
            name += $" {this.MiddleName[0]}.";
        }

        if(!string.IsNullOrEmpty(this.Suffix)) {
            name += $", {this.Suffix}";
        }

        return name;
    }
}
