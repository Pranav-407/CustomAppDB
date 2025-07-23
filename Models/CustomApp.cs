namespace CustomAppDB.Models
{
    public class CustomApp
    {
        public int ID { get; set; }
        public string PackageName { get; set; }
        public string URL { get; set; }
        public string Architecture { get; set; }
        public string InstallCommandLine { get; set; }
        public string UninstallCommand { get; set; }
        public string Restart { get; set; }
        public int InstallTimeout { get; set; }
        public string RunAs { get; set; }
        public string LoginId { get; set; }
        public string Password { get; set; }
        public string Domain { get; set; }
        public bool Extract { get; set; }
    }
}
