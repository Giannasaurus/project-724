using System.ComponentModel.DataAnnotations;

namespace BMIS.Models.Entities;

public class User {
    [Key]
    public int Id { get; set; }
    public string UserName { get; }
    public string Password { get; }
    public int ResidentId { get; set; }
    public bool IsActive { get; set; } 


    // TODO:
    //  move the user creation outside of the constructor
    //  put it on a separate class or service
    //
    public User(string username, string password, int residentId) {
        // TODO:
        //  check if resident exist in the residents
        this.ResidentId = residentId;
        
        // TODO: 
        //  check if username already exist
        this.UserName = username;
        
        // TODO: 
        //  use a hash function when saving the password
        this.Password = password;
    }
}
