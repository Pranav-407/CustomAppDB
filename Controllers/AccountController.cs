
using Microsoft.AspNetCore.Mvc;
using CustomAppDB.DAL;
using CustomAppDB.Models;

namespace CustomAppDB.Controllers
{
    public class AccountController : Controller
    {
        private readonly AccountManager _accountManager;

        public AccountController(IConfiguration configuration)
        {
            _accountManager = new AccountManager(configuration);
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
            try
            {
                var loginResult = _accountManager.AuthenticateUser(email, password);

                if (loginResult.IsAuthenticated)
                {
                    // Set session variables
                    HttpContext.Session.SetString("FullName", loginResult.FullName);
                    HttpContext.Session.SetString("Email", loginResult.Email);
                    HttpContext.Session.SetString("Role", loginResult.Role);
                    HttpContext.Session.SetString("Features", loginResult.Features);
                    HttpContext.Session.SetString("UserManagement", loginResult.UserManagement.ToString());

                    // Update last login and set session
                    _accountManager.UpdateLastLogin(email);
                    string lastLogin = _accountManager.GetFormattedCurrentDateTime();
                    HttpContext.Session.SetString("LastLogin", lastLogin);

                    return RedirectToAction("Index", "Home");
                }
                else
                {
                    ViewBag.Error = "Invalid Email or Password";
                    return View();
                }
            }
            catch (Exception ex)
            {
                ViewBag.Error = "An error occurred during login. Please try again.";
                return View();
            }
        }
    }
}