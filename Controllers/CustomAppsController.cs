using CustomAppDB.DAL;
using CustomAppDB.Models;
using Microsoft.AspNetCore.Mvc;

namespace CustomAppDB.Controllers
{
    [Route("custom-apps")]
    public class CustomAppsController : Controller
    {
        private readonly CustomAppsManager _customAppsManager;

        public CustomAppsController(IConfiguration configuration)
        {
            _customAppsManager = new CustomAppsManager(configuration);
        }

        [HttpPost("CreateCustomApp")]
        public IActionResult Create([FromBody] CustomAppModel model)
        {
            try
            {
                int insertedId = _customAppsManager.CreateCustomApp(model);
                return Ok(new { success = true, message = "App saved successfully.", id = insertedId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error saving app.", error = ex.Message });
            }
        }

        [HttpGet("GetCustomApps")]
        public IActionResult GetCustomApps()
        {
            try
            {
                var apps = _customAppsManager.GetAllCustomApps();
                return Ok(new { success = true, data = apps });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error retrieving apps.", error = ex.Message });
            }
        }

        [HttpPut("UpdateCustomApp/{id}")]
        public IActionResult Update(int id, [FromBody] CustomAppModel model)
        {
            try
            {
                bool isUpdated = _customAppsManager.UpdateCustomApp(id, model);

                if (isUpdated)
                {
                    return Ok(new { success = true, message = "App updated successfully." });
                }
                else
                {
                    return NotFound(new { success = false, message = "App not found." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error updating app.", error = ex.Message });
            }
        }

        [HttpDelete("DeleteCustomApp/{id}")]
        public IActionResult Delete(int id)
        {
            try
            {
                bool isDeleted = _customAppsManager.DeleteCustomApp(id);

                if (isDeleted)
                {
                    return Ok(new { success = true, message = "App deleted successfully." });
                }
                else
                {
                    return NotFound(new { success = false, message = "App not found." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error deleting app.", error = ex.Message });
            }
        }
    }
}