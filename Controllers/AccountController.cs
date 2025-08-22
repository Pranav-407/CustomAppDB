using Microsoft.AspNetCore.Mvc;
using System.Data.SqlClient;

namespace CustomAppDB.Controllers
{
    public class AccountController : Controller
    {
        private readonly string _connectionString;

        public AccountController(Microsoft.Extensions.Configuration.IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        // -------------------- Logout --------------------
        [HttpPost]
        public IActionResult Logout()
        {
            HttpContext.Session.Clear();
            return RedirectToAction("Login");
        }

        // Login
        [HttpGet]
        public IActionResult Login() => View();


        [HttpPost]
        public IActionResult Login(string email, string password)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                string sql = "SELECT * FROM NewUsers WHERE Email = @Email AND Password = @Password";
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@Email", email ?? string.Empty);
                    cmd.Parameters.AddWithValue("@Password", password ?? string.Empty);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        if (reader.HasRows)
                        {
                            reader.Read();
                            var fullName = reader["FullName"]?.ToString();
                            HttpContext.Session.SetString("FullName", fullName ?? string.Empty);
                            HttpContext.Session.SetString("Email", reader["Email"]?.ToString() ?? string.Empty);
                            HttpContext.Session.SetString("Role", reader["Role"]?.ToString() ?? "");
                            HttpContext.Session.SetString("Features", reader["Features"]?.ToString() ?? "");
                            bool isUserManagement = false;
                            if (reader["UserManagement"] != DBNull.Value)
                                isUserManagement = Convert.ToBoolean(reader["UserManagement"]);
                            HttpContext.Session.SetString("UserManagement", isUserManagement.ToString());

                            reader.Close();

                            string updateSql = "UPDATE NewUsers SET LastLogin = @LastLogin WHERE Email = @Email";
                            using (SqlCommand updateCmd = new SqlCommand(updateSql, conn))
                            {
                                string formattedNow = DateTime.Now.ToString("M/d/yyyy h:mm:ss tt");
                                updateCmd.Parameters.AddWithValue("@LastLogin", formattedNow);
                                updateCmd.Parameters.AddWithValue("@Email", email);
                                updateCmd.ExecuteNonQuery();
                                HttpContext.Session.SetString("LastLogin", formattedNow);
                            }

                            conn.Close();
                            return RedirectToAction("Index", "Home");
                        }
                        else
                        {
                            ViewBag.Error = "Invalid Email or Password";
                        }
                    }
                }
                conn.Close();
            }
            return View();
        }

    }
}