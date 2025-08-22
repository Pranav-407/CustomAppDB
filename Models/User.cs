namespace CustomAppDB.Models
{
    public class User
    {
        // Primary key
        public string Email { get; set; }

        public string FullName { get; set; }

        // Optional (may be empty when creating from admin UI)
        public string Password { get; set; }

        public string Role { get; set; }

        // Default "Deploy user"
        public string UserType { get; set; } = "Deploy user";

        // Features as a list (will be converted to comma-separated string in DB)
        public List<string> Features { get; set; } = new List<string>();

        // Sites as a list (will be converted to comma-separated string in DB)
        public List<string> Sites { get; set; } = new List<string>();

        // Groups as a list (will be converted to comma-separated string in DB)
        public List<string> Groups { get; set; } = new List<string>();

        // Administrator-only checkbox: Allow User Management
        public bool AllowUserManagement { get; set; } = false;

        public int SiteCount { get; set; } = 0;

        public int GroupCount { get; set; } = 0;

        // Stored server-side; default is assigned in controller
        public DateTime AccountCreatedAt { get; set; } = DateTime.Now;

        public string LastLogin { get; set; } = "Never logged in";
    }
}
