using CustomAppDB.Models;
using System.Data;
using System.Data.SqlClient;

namespace CustomAppDB.DAL
{
    public class CustomAppsManager
    {
        private readonly IConfiguration _configuration;

        public CustomAppsManager(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public int CreateCustomApp(CustomAppModel model)
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
                 @Restart, @InstallTimeout, @RunAs, @LoginId, @Password, @Domain, @Extract);
                 
                SELECT SCOPE_IDENTITY();";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    AddParameters(cmd, model);
                    var insertedId = cmd.ExecuteScalar();
                    return Convert.ToInt32(insertedId);
                }
            }
        }

        public List<CustomAppModel> GetAllCustomApps()
        {
            string connStr = _configuration.GetConnectionString("DefaultConnection");
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string query = "SELECT * FROM CustomApps ORDER BY ID";
                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    using (SqlDataAdapter adapter = new SqlDataAdapter(cmd))
                    {
                        DataTable dt = new DataTable();
                        adapter.Fill(dt);

                        var apps = new List<CustomAppModel>();
                        foreach (DataRow row in dt.Rows)
                        {
                            apps.Add(MapDataRowToModel(row));
                        }
                        return apps;
                    }
                }
            }
        }

        public bool UpdateCustomApp(int id, CustomAppModel model)
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
                    AddParameters(cmd, model);
                    int rowsAffected = cmd.ExecuteNonQuery();
                    return rowsAffected > 0;
                }
            }
        }

        public bool DeleteCustomApp(int id)
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
                    return rowsAffected > 0;
                }
            }
        }

        private void AddParameters(SqlCommand cmd, CustomAppModel model)
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
        }

        private CustomAppModel MapDataRowToModel(DataRow row)
        {
            return new CustomAppModel
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
            };
        }
    }
}