using Microsoft.AspNetCore.Mvc;

namespace CustomAppTask.Controllers
{
    public class HomepageController : Controller
    {
        public IActionResult Index(string section)
        {
            if (string.IsNullOrEmpty(section))
                ViewData["PageTitle"] = "Dashboard";
            else
                ViewData["PageTitle"] = section;

            return View("Index");
        }

        public IActionResult Applications()
        {
            ViewData["PageTitle"] = "Applications";
            return View();
        }

    }
}
