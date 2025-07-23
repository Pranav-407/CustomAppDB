using CustomAppDB.Models;
using Microsoft.AspNetCore.Mvc;
using System.Data.SqlClient;

namespace CustomAppDB.Controllers
{
    public class DeviceController : Controller
    {
        private readonly IConfiguration _configuration;

        public DeviceController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpGet]
        public JsonResult GetDevices()
        {
            List<Device> devices = new List<Device>();
            string connStr = _configuration.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                string query = @"SELECT Id, Computer, InstalledApps, OutdatedApps, Policy,
                                        DeviceGroup AS [Group], Tags, Configuration,
                                        WingetStatus, LastSeen, WingetApps, Browsers,
                                        Messaging, Media, Runtimes, Image
                                 FROM Devices";

                SqlCommand cmd = new SqlCommand(query, conn);
                conn.Open();

                SqlDataReader reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    devices.Add(new Device
                    {
                        Id = reader.GetInt32(0),
                        Computer = reader.GetString(1),
                        InstalledApps = reader.GetInt32(2),
                        OutdatedApps = reader.GetInt32(3),
                        Policy = reader.GetString(4),
                        Group = reader.GetString(5),
                        Tags = reader.GetString(6),
                        Configuration = reader.GetString(7),
                        WingetStatus = reader.GetString(8),
                        LastSeen = reader.GetString(9),
                        WingetApps = reader.GetString(10),
                        Browsers = reader.GetString(11),
                        Messaging = reader.GetString(12),
                        Media = reader.GetString(13),
                        Runtimes = reader.GetString(14),
                        Image = reader.GetString(15)
                    });
                }
            }

            return Json(devices);
        }

        [HttpGet]
        public JsonResult GetRecentApps()
        {
            var apps = new List<object>();

            string connStr = _configuration.GetConnectionString("DefaultConnection");
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string query = "SELECT Name, ReleaseDate, Version, Installed, Outdated FROM RecentApps";
                using (SqlCommand cmd = new SqlCommand(query, conn))
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        apps.Add(new
                        {
                            name = reader["Name"].ToString(),
                            releaseDate = Convert.ToDateTime(reader["ReleaseDate"]).ToString("MM/dd/yyyy"),
                            version = reader["Version"].ToString(),
                            installed = Convert.ToInt32(reader["Installed"]),
                            outdated = Convert.ToInt32(reader["Outdated"])
                        });
                    }
                }
            }

            return Json(apps);

        }
        
        public IActionResult Index()
        {
            return View();
        }
    }
}
