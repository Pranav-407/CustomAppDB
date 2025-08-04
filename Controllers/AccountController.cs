using Microsoft.AspNetCore.Mvc;
using CustomAppDB.DAL;

namespace CustomAppDB.Controllers
{
    public class AccountController : Controller
    {
        private readonly LoginManager _loginManager;

        public AccountController(IConfiguration configuration)
        {
            _loginManager = new LoginManager(configuration);
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
            if (_loginManager.ValidateUser(Username, Password))
            {
                // Store login info in session
                HttpContext.Session.SetString("Username", Username);
                return RedirectToAction("Index", "Homepage");
            }
            else
            {
                ViewBag.Message = "Invalid username or password.";
                return View();
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
            if (_loginManager.CreateUser(Username, Email, Password))
            {
                return RedirectToAction("Login");
            }
            else
            {
                ViewBag.Message = "Username or Email already exists.";
                return View();
            }
        }
    }
}