using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Data.SqlClient;

namespace CustomAppDB.Controllers
{
    [Route("custom-apps")]
    public class CustomAppsController : Controller
    {
        private readonly IConfiguration _configuration;

        public CustomAppsController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpGet("test")]
        public IActionResult Test()
        {
            return Ok("Controller is working!");
        }

        [HttpPost("create")]
        public IActionResult Create([FromBody] CustomAppModel model)
        {
            try
            {
                string connStr = _configuration.GetConnectionString("DefaultConnection");

                using (SqlConnection conn = new SqlConnection(connStr))
                {
                    conn.Open();

                    string query = @"INSERT INTO CustomApps
                        (PackageName, URL, Architecture, InstallCommandLine, UninstallCommand,
                         Restart, InstallTimeout, RunAs, LoginId, Password, Domain, Extract)
                        VALUES
                        (@PackageName, @URL, @Architecture, @InstallCommandLine, @UninstallCommand,
                         @Restart, @InstallTimeout, @RunAs, @LoginId, @Password, @Domain, @Extract)";

                    using (SqlCommand cmd = new SqlCommand(query, conn))
                    {
                        cmd.Parameters.AddWithValue("@PackageName", model.PackageName ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@URL", model.URL ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Architecture", model.Architecture ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@InstallCommandLine", model.InstallCommandLine ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@UninstallCommand", model.UninstallCommand ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Restart", model.Restart ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@InstallTimeout", model.InstallTimeout);
                        cmd.Parameters.AddWithValue("@RunAs", model.RunAs ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@LoginId", model.LoginId ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Password", model.Password ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Domain", model.Domain ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Extract", model.Extract);

                        cmd.ExecuteNonQuery();
                    }
                }

                return Ok(new { success = true, message = "App saved successfully." });
            }
            catch
            {
                return StatusCode(500, new { success = false, message = "Error saving app." });
            }
        }

        [HttpGet("list")]
        public IActionResult GetAll()
        {
            try
            {
                string connStr = _configuration.GetConnectionString("DefaultConnection");
                using (SqlConnection conn = new SqlConnection(connStr))
                {
                    conn.Open();
                    string query = "SELECT * FROM CustomApps ORDER BY PackageName";
                    using (SqlCommand cmd = new SqlCommand(query, conn))
                    {
                        using (SqlDataAdapter adapter = new SqlDataAdapter(cmd))
                        {
                            DataTable dt = new DataTable();
                            adapter.Fill(dt);

                            var apps = new List<CustomAppModel>();
                            foreach (DataRow row in dt.Rows)
                            {
                                apps.Add(new CustomAppModel
                                {
                                    ID = Convert.ToInt32(row["ID"]),
                                    PackageName = row["PackageName"]?.ToString(),
                                    URL = row["URL"]?.ToString(),
                                    Architecture = row["Architecture"]?.ToString(),
                                    InstallCommandLine = row["InstallCommandLine"]?.ToString(),
                                    UninstallCommand = row["UninstallCommand"]?.ToString(),
                                    Restart = row["Restart"]?.ToString(),
                                    InstallTimeout = row["InstallTimeout"] != DBNull.Value ? Convert.ToInt32(row["InstallTimeout"]) : 0,
                                    RunAs = row["RunAs"]?.ToString(),
                                    LoginId = row["LoginId"]?.ToString(),
                                    Password = row["Password"]?.ToString(),
                                    Domain = row["Domain"]?.ToString(),
                                    Extract = row["Extract"] != DBNull.Value ? Convert.ToBoolean(row["Extract"]) : false
                                });
                            }

                            return Ok(new { success = true, data = apps });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error retrieving apps.", error = ex.Message });
            }
        }

        [HttpPut("update/{id}")]
        public IActionResult Update(int id, [FromBody] CustomAppModel model)
        {
            try
            {
                string connStr = _configuration.GetConnectionString("DefaultConnection");

                using (SqlConnection conn = new SqlConnection(connStr))
                {
                    conn.Open();

                    string query = @"UPDATE CustomApps SET
                        PackageName = @PackageName,
                        URL = @URL,
                        Architecture = @Architecture,
                        InstallCommandLine = @InstallCommandLine,
                        UninstallCommand = @UninstallCommand,
                        Restart = @Restart,
                        InstallTimeout = @InstallTimeout,
                        RunAs = @RunAs,
                        LoginId = @LoginId,
                        Password = @Password,
                        Domain = @Domain,
                        Extract = @Extract
                        WHERE ID = @ID";

                    using (SqlCommand cmd = new SqlCommand(query, conn))
                    {
                        cmd.Parameters.AddWithValue("@ID", id);
                        cmd.Parameters.AddWithValue("@PackageName", model.PackageName ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@URL", model.URL ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Architecture", model.Architecture ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@InstallCommandLine", model.InstallCommandLine ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@UninstallCommand", model.UninstallCommand ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Restart", model.Restart ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@InstallTimeout", model.InstallTimeout);
                        cmd.Parameters.AddWithValue("@RunAs", model.RunAs ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@LoginId", model.LoginId ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Password", model.Password ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Domain", model.Domain ?? (object)DBNull.Value);
                        cmd.Parameters.AddWithValue("@Extract", model.Extract);

                        int rowsAffected = cmd.ExecuteNonQuery();

                        if (rowsAffected > 0)
                        {
                            return Ok(new { success = true, message = "App updated successfully." });
                        }
                        else
                        {
                            return NotFound(new { success = false, message = "App not found." });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error updating app.", error = ex.Message });
            }
        }

        [HttpDelete("delete/{id}")]
        public IActionResult Delete(int id)
        {
            try
            {
                string connStr = _configuration.GetConnectionString("DefaultConnection");

                using (SqlConnection conn = new SqlConnection(connStr))
                {
                    conn.Open();

                    string query = "DELETE FROM CustomApps WHERE ID = @ID";

                    using (SqlCommand cmd = new SqlCommand(query, conn))
                    {
                        cmd.Parameters.AddWithValue("@ID", id);

                        int rowsAffected = cmd.ExecuteNonQuery();

                        if (rowsAffected > 0)
                        {
                            return Ok(new { success = true, message = "App deleted successfully." });
                        }
                        else
                        {
                            return NotFound(new { success = false, message = "App not found." });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error deleting app.", error = ex.Message });
            }
        }
    }

    public class CustomAppModel
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