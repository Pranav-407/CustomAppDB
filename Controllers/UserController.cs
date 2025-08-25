using CustomAppDB.DAL;
using CustomAppDB.Models;
using Microsoft.AspNetCore.Mvc;

namespace CustomAppDB.Controllers
{
    public class UserController : Controller
    {
        private readonly UserManager _userManager;

        public UserController(IConfiguration configuration)
        {
            _userManager = new UserManager(configuration);
        }

        // -------------------- Get All Users --------------------
        [HttpGet]
        public IActionResult GetUsers()
        {
            try
            {
                var users = _userManager.GetAllUsers();
                return Json(users);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error retrieving users.", error = ex.Message });
            }
        }

        // -------------------- Email check --------------------
        [HttpGet]
        public IActionResult CheckEmailExists(string email)
        {
            try
            {
                bool exists = _userManager.CheckEmailExists(email);
                return Json(exists);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error checking email.", error = ex.Message });
            }
        }

        // -------------------- Add user --------------------
        [HttpPost]
        public IActionResult AddUser([FromBody] User user)
        {
            if (user == null || string.IsNullOrWhiteSpace(user.Email))
            {
                return BadRequest("Invalid user data.");
            }

            try
            {
                bool success = _userManager.CreateUser(user);
                if (success)
                {
                    return Ok("User added successfully.");
                }
                else
                {
                    return StatusCode(500, "Failed to add user.");
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while adding user.", error = ex.Message });
            }
        }

        [HttpPut]
        public IActionResult UpdateUser([FromBody] UpdateUserRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.OriginalEmail))
            {
                return BadRequest(new { message = "Invalid user data." });
            }

            try
            {
                bool success = _userManager.UpdateUser(request);
                if (success)
                {
                    return Ok(new { message = "User updated successfully." });
                }
                else
                {
                    return NotFound(new { message = "User not found." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating user.", error = ex.Message });
            }
        }

        // -------------------- Delete User --------------------
        [HttpDelete]
        public IActionResult DeleteUser(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return BadRequest(new { message = "Email is required." });
            }

            try
            {
                bool success = _userManager.DeleteUser(email);
                if (success)
                {
                    return Ok(new { message = "User deleted successfully." });
                }
                else
                {
                    return NotFound(new { message = "User not found." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting user.", error = ex.Message });
            }
        }
    }
}