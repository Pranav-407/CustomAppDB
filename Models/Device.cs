namespace CustomAppDB.Models
{
    public class Device
    {
        public int Id { get; set; }
        public string Computer { get; set; }
        public int InstalledApps { get; set; }
        public int OutdatedApps { get; set; }
        public string Policy { get; set; }
        public string Group { get; set; }
        public string Tags { get; set; }
        public string Configuration { get; set; }
        public string WingetStatus { get; set; }
        public string LastSeen { get; set; }
        public string WingetApps { get; set; }
        public string Browsers { get; set; }
        public string Messaging { get; set; }
        public string Media { get; set; }
        public string Runtimes { get; set; }
        public string Image { get; set; }
    }
}
