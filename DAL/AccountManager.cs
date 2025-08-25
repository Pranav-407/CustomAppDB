using CustomAppDB.Models;
using System.Data;
using System.Data.SqlClient;

namespace CustomAppDB.DAL
{
    public class AccountManager
    {
        private readonly IConfiguration _configuration;

        public AccountManager(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public UserLoginResult AuthenticateUser(string email, string password)
        {
            string connStr = _configuration.GetConnectionString("DefaultConnection");
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string query = "SELECT * FROM NewUsers WHERE Email = @Email AND Password = @Password";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Email", email ?? string.Empty);
                    cmd.Parameters.AddWithValue("@Password", password ?? string.Empty);

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        if (reader.HasRows)
                        {
                            reader.Read();
                            var result = new UserLoginResult
                            {
                                IsAuthenticated = true,
                                FullName = reader["FullName"]?.ToString() ?? string.Empty,
                                Email = reader["Email"]?.ToString() ?? string.Empty,
                                Role = reader["Role"]?.ToString() ?? "",
                                Features = reader["Features"]?.ToString() ?? "",
                                UserManagement = reader["UserManagement"] != DBNull.Value ? Convert.ToBoolean(reader["UserManagement"]) : false
                            };
                            return result;
                        }
                        else
                        {
                            return new UserLoginResult { IsAuthenticated = false };
                        }
                    }
                }
            }
        }

        public bool UpdateLastLogin(string email)
        {
            string connStr = _configuration.GetConnectionString("DefaultConnection");
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string query = "UPDATE NewUsers SET LastLogin = @LastLogin WHERE Email = @Email";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    string formattedNow = DateTime.Now.ToString("M/d/yyyy h:mm:ss tt");
                    cmd.Parameters.AddWithValue("@LastLogin", formattedNow);
                    cmd.Parameters.AddWithValue("@Email", email);

                    int rowsAffected = cmd.ExecuteNonQuery();
                    return rowsAffected > 0;
                }
            }
        }

        public string GetFormattedCurrentDateTime()
        {
            return DateTime.Now.ToString("M/d/yyyy h:mm:ss tt");
        }
    }
}