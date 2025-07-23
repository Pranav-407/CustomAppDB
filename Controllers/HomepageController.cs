using Microsoft.AspNetCore.Mvc;

namespace CustomAppTask.Controllers
{
    public class HomepageController : Controller
    {
        public IActionResult Index(string section)
        {
            // If no section OR refreshing, default to Dashboard
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


        // public IActionResult ViewCustomApps()
        // {
        //     return View();
        // }

    }
}
