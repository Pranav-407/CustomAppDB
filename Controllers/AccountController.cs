using Microsoft.AspNetCore.Mvc;
using System.Data.SqlClient;

namespace CustomAppDB.Controllers
{
    public class AccountController : Controller
    {
        private readonly IConfiguration _configuration;

        public AccountController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        // GET: /Account/Login
        public IActionResult Login()
        {
            return View();
        }

        // POST: /Account/Login
        [HttpPost]
        public IActionResult Login(string Username, string Password)
        {
            string connectionString = _configuration.GetConnectionString("DefaultConnection");

            using (SqlConnection con = new SqlConnection(connectionString))
            {
                string query = "SELECT COUNT(*) FROM Users WHERE Username = @Username AND Password = @Password";
                SqlCommand cmd = new SqlCommand(query, con);
                cmd.Parameters.AddWithValue("@Username", Username);
                cmd.Parameters.AddWithValue("@Password", Password);

                con.Open();
                int userExists = (int)cmd.ExecuteScalar();

                if (userExists > 0)
                {
                    // Store login info in session
                    HttpContext.Session.SetString("Username", Username);
                    return RedirectToAction("Index", "Homepage"); // Replace with your homepage controller/action if different
                }
                else
                {
                    ViewBag.Message = "Invalid username or password.";
                    return View();
                }
            }
        }

        // GET: /Account/Signup
        public IActionResult Signup()
        {
            return View();
        }

        // POST: /Account/Signup
        [HttpPost]
        public IActionResult Signup(string Username, string Email, string Password)
        {
            string connectionString = _configuration.GetConnectionString("DefaultConnection");

            using (SqlConnection con = new SqlConnection(connectionString))
            {
                string query = "INSERT INTO Users (Username, Email, Password) VALUES (@Username, @Email, @Password)";
                SqlCommand cmd = new SqlCommand(query, con);
                cmd.Parameters.AddWithValue("@Username", Username);
                cmd.Parameters.AddWithValue("@Email", Email);
                cmd.Parameters.AddWithValue("@Password", Password); // No hash

                try
                {
                    con.Open();
                    cmd.ExecuteNonQuery();
                    return RedirectToAction("Login");
                }
                catch (SqlException)
                {
                    ViewBag.Message = "Username or Email already exists.";
                    return View();
                }
            }
        }
    }
}
