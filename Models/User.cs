//namespace CustomAppDB.Models
//{
//    public class User
//    {
//        // Primary key
//        public string Email { get; set; }

//        public string FullName { get; set; }

//        // Optional (may be empty when creating from admin UI)
//        public string Password { get; set; }

//        public string Role { get; set; }

//        // Default "Deploy user"
//        public string UserType { get; set; } = "Deploy user";

//        // Features as a list (will be converted to comma-separated string in DB)
//        public List<string> Features { get; set; } = new List<string>();

//        // Sites as a list (will be converted to comma-separated string in DB)
//        public List<string> Sites { get; set; } = new List<string>();

//        // Groups as a list (will be converted to comma-separated string in DB)
//        public List<string> Groups { get; set; } = new List<string>();

//        // Administrator-only checkbox: Allow User Management
//        public bool AllowUserManagement { get; set; } = false;

//        public int SiteCount { get; set; } = 0;

//        public int GroupCount { get; set; } = 0;

//        // Stored server-side; default is assigned in controller
//        public DateTime AccountCreatedAt { get; set; } = DateTime.Now;

//        public string LastLogin { get; set; } = "Never logged in";
//    }
//}







namespace CustomAppDB.Models
{
    public class User
    {
        public string Email { get; set; }
        public string FullName { get; set; }
        public string Password { get; set; }
        public string Role { get; set; }
        public string UserType { get; set; }
        public List<string> Features { get; set; }
        public List<string> Sites { get; set; }
        public List<string> Groups { get; set; }
        public bool AllowUserManagement { get; set; }
    }

    public class UserViewModel
    {
        public string Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string UserType { get; set; }
        public string Role { get; set; }
        public int SiteCount { get; set; }
        public string Sites { get; set; }
        public string Features { get; set; }
        public string Groups { get; set; }
        public int GroupCount { get; set; }
        public string CreatedOn { get; set; }
        public string LastLogin { get; set; }
        public bool UserManagement { get; set; }
    }

    public class UserLoginResult
    {
        public bool IsAuthenticated { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }
        public string Features { get; set; }
        public bool UserManagement { get; set; }
    }

    public class UpdateUserRequest
    {
        public string OriginalEmail { get; set; }
        public string FullName { get; set; }
        public string Role { get; set; }
        public string UserType { get; set; }
        public List<string> Features { get; set; }
        public List<string> Sites { get; set; }
        public List<string> Groups { get; set; }
        public bool AllowUserManagement { get; set; }
        public int SiteCount { get; set; }
        public int GroupCount { get; set; }
    }
}