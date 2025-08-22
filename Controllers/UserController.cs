using CustomAppDB.Models;
using Microsoft.AspNetCore.Mvc;
using System.Data.SqlClient;

namespace CustomAppDB.Controllers
{
    public class UserController : Controller
    {
        private readonly string _connectionString;

        public UserController(Microsoft.Extensions.Configuration.IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        // -------------------- Get All Users --------------------
        [HttpGet]
        public IActionResult GetUsers()
        {
            var users = new List<object>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                string sql = @"SELECT Email, FullName, Role, UserType, Features, Sites, SiteCount, Groups, GroupCount, AccountCreatedAt, LastLogin, UserManagement FROM NewUsers ORDER BY AccountCreatedAt ASC";

                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            users.Add(new
                            {
                                id = reader["Email"].ToString(),
                                fullName = reader["FullName"],
                                email = reader["Email"].ToString(),
                                userType = reader["UserType"],
                                role = reader["Role"],
                                siteCount = reader["SiteCount"],
                                sites = reader["Sites"],
                                features = reader["Features"],
                                groups = reader["Groups"],
                                groupCount = reader["GroupCount"],
                                createdOn = reader["AccountCreatedAt"]?.ToString() ?? "",
                                lastLogin = reader["LastLogin"].ToString(),
                                userManagement = reader["UserManagement"]
                            });
                        }
                    }
                }
            }

            return Json(users);
        }

        // -------------------- Email check --------------------
        [HttpGet]
        public IActionResult CheckEmailExists(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return Json(false);

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                string sql = "SELECT COUNT(*) FROM NewUsers WHERE Email = @Email";
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@Email", email);
                    int count = (int)cmd.ExecuteScalar();
                    return Json(count > 0);
                }
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

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();

                if (string.IsNullOrWhiteSpace(user.UserType))
                    user.UserType = "Deploy user";

                string featuresString = "";
                if (user.Role == "Super Administrator" || user.Role == "Administrator")
                {
                    featuresString = "All";
                }
                else
                {
                    featuresString = user.Features != null && user.Features.Count > 0
                        ? string.Join(",", user.Features)
                        : "";
                }

                string sitesString = "";
                int siteCount = 0;
                if (user.Role == "Super Administrator")
                {
                    sitesString = "All";
                    siteCount = 3;
                }
                else if (user.Sites != null && user.Sites.Count > 0)
                {
                    int totalSites = 3;
                    if (user.Sites.Count == totalSites)
                    {
                        sitesString = "All";
                    }
                    else
                    {
                        sitesString = string.Join(",", user.Sites);
                    }
                    siteCount = user.Sites.Count;
                }
                else
                {
                    sitesString = "No Access to sites";
                    siteCount = 0;
                }

                string groupsString = "";
                int groupCount = 0;
                if (user.Role == "Super Administrator")
                {
                    groupsString = "All";
                    groupCount = 3;
                }
                else if (user.Groups != null && user.Groups.Count > 0)
                {
                    int totalGroups = 3;
                    if (user.Groups.Count == totalGroups)
                    {
                        groupsString = "All";
                    }
                    else
                    {
                        groupsString = string.Join(",", user.Groups);
                    }
                    groupCount = user.Groups.Count;
                }
                else
                {
                    groupsString = "No Access to groups";
                    groupCount = 0;
                }

                bool userManagement = false;
                if (user.Role == "Super Administrator")
                {
                    userManagement = true;
                }
                else if (user.Role == "Administrator")
                {
                    userManagement = user.AllowUserManagement;
                }

                string formattedDateTime = DateTime.Now.ToString("yyyy-MM-dd hh:mm:ss tt");

                string insertSql = @" INSERT INTO NewUsers (Email, FullName, Password, Role, UserType, Features, Sites, SiteCount, Groups, GroupCount, AccountCreatedAt, LastLogin, UserManagement) VALUES (@Email, @FullName, @Password, @Role, @UserType, @Features, @Sites, @SiteCount, @Groups, @GroupCount, @AccountCreatedAt, @LastLogin, @UserManagement)";

                using (SqlCommand cmd = new SqlCommand(insertSql, conn))
                {
                    cmd.Parameters.AddWithValue("@Email", user.Email);
                    cmd.Parameters.AddWithValue("@FullName", (object)user.FullName ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@Password", (object)user.Password ?? "1234");
                    cmd.Parameters.AddWithValue("@Role", (object)user.Role ?? "Limited Administrator");
                    cmd.Parameters.AddWithValue("@UserType", user.UserType);
                    cmd.Parameters.AddWithValue("@Features", featuresString);
                    cmd.Parameters.AddWithValue("@Sites", sitesString);
                    cmd.Parameters.AddWithValue("@SiteCount", siteCount);
                    cmd.Parameters.AddWithValue("@Groups", groupsString);
                    cmd.Parameters.AddWithValue("@GroupCount", groupCount);
                    cmd.Parameters.AddWithValue("@AccountCreatedAt", formattedDateTime);
                    cmd.Parameters.AddWithValue("@LastLogin", "Never logged in");
                    cmd.Parameters.AddWithValue("@UserManagement", userManagement);

                    cmd.ExecuteNonQuery();
                }

                conn.Close();
            }

            return Ok("User added successfully.");
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
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    conn.Open();

                    string checkSql = "SELECT COUNT(*) FROM NewUsers WHERE Email = @OriginalEmail";
                    using (SqlCommand checkCmd = new SqlCommand(checkSql, conn))
                    {
                        checkCmd.Parameters.AddWithValue("@OriginalEmail", request.OriginalEmail);
                        int userExists = (int)checkCmd.ExecuteScalar();

                        if (userExists == 0)
                        {
                            return NotFound(new { message = "User not found." });
                        }
                    }

                    string featuresString = "";
                    if (request.Role == "Super Administrator" || request.Role == "Administrator")
                    {
                        featuresString = "All";
                    }
                    else
                    {
                        featuresString = request.Features != null && request.Features.Count > 0
                            ? string.Join(",", request.Features)
                            : "";
                    }

                    string sitesString = "";
                    int siteCount = 0;
                    if (request.Role == "Super Administrator")
                    {
                        sitesString = "All";
                        siteCount = 3;
                    }
                    else if (request.Sites != null && request.Sites.Count > 0)
                    {
                        int totalSites = 3;
                        if (request.Sites.Count == totalSites)
                        {
                            sitesString = "All";
                        }
                        else
                        {
                            sitesString = string.Join(",", request.Sites);
                        }
                        siteCount = request.Sites.Count;
                    }
                    else
                    {
                        sitesString = "No Access to sites";
                        siteCount = 0;
                    }

                    string groupsString = "";
                    int groupCount = 0;
                    if (request.Role == "Super Administrator")
                    {
                        groupsString = "All";
                        groupCount = 3;
                    }
                    else if (request.Groups != null && request.Groups.Count > 0)
                    {
                        int totalGroups = 3;
                        if (request.Groups.Count == totalGroups)
                        {
                            groupsString = "All";
                        }
                        else
                        {
                            groupsString = string.Join(",", request.Groups);
                        }
                        groupCount = request.Groups.Count;
                    }
                    else
                    {
                        groupsString = "No Access to groups";
                        groupCount = 0;
                    }

                    bool userManagement = false;
                    if (request.Role == "Super Administrator")
                    {
                        userManagement = true;
                    }
                    else if (request.Role == "Administrator")
                    {
                        userManagement = request.AllowUserManagement;
                    }

                    string updateSql = @" UPDATE NewUsers SET FullName = @FullName, Role = @Role, Features = @Features, Sites = @Sites, SiteCount = @SiteCount, Groups = @Groups, GroupCount = @GroupCount, UserManagement = @UserManagement WHERE Email = @OriginalEmail";

                    using (SqlCommand cmd = new SqlCommand(updateSql, conn))
                    {
                        cmd.Parameters.AddWithValue("@FullName", (object)request.FullName ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@Role", (object)request.Role ?? "Limited Administrator");
                        cmd.Parameters.AddWithValue("@Features", featuresString);
                        cmd.Parameters.AddWithValue("@Sites", sitesString);
                        cmd.Parameters.AddWithValue("@SiteCount", siteCount);
                        cmd.Parameters.AddWithValue("@Groups", groupsString);
                        cmd.Parameters.AddWithValue("@GroupCount", groupCount);
                        cmd.Parameters.AddWithValue("@UserManagement", userManagement);
                        cmd.Parameters.AddWithValue("@OriginalEmail", request.OriginalEmail);

                        int rowsAffected = cmd.ExecuteNonQuery();

                        if (rowsAffected > 0)
                        {
                            return Ok(new { message = "User updated successfully." });
                        }
                        else
                        {
                            return BadRequest(new { message = "Failed to update user." });
                        }
                    }
                }
            }
            catch (SqlException sqlEx)
            {
                Console.WriteLine($"SQL Error updating user {request.OriginalEmail}: {sqlEx.Message}");
                return StatusCode(500, new { message = "Database error occurred while updating user." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating user {request.OriginalEmail}: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred while updating user." });
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
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    conn.Open();

                    string checkSql = "SELECT COUNT(*) FROM NewUsers WHERE Email = @Email";
                    using (SqlCommand checkCmd = new SqlCommand(checkSql, conn))
                    {
                        checkCmd.Parameters.AddWithValue("@Email", email);
                        int userExists = (int)checkCmd.ExecuteScalar();

                        if (userExists == 0)
                        {
                            return NotFound(new { message = "User not found." });
                        }
                    }

                    string deleteSql = "DELETE FROM NewUsers WHERE Email = @Email";
                    using (SqlCommand deleteCmd = new SqlCommand(deleteSql, conn))
                    {
                        deleteCmd.Parameters.AddWithValue("@Email", email);
                        int rowsAffected = deleteCmd.ExecuteNonQuery();

                        if (rowsAffected > 0)
                        {
                            return Ok(new { message = "User deleted successfully." });
                        }
                        else
                        {
                            return BadRequest(new { message = "Failed to delete user." });
                        }
                    }
                }
            }
            catch (SqlException sqlEx)
            {
                Console.WriteLine($"SQL Error deleting user {email}: {sqlEx.Message}");
                return StatusCode(500, new { message = "Database error occurred while deleting user." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting user {email}: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred while deleting user." });
            }
        }
    }
}


public class UpdateUserRequest
{
    public string OriginalEmail { get; set; }
    public string FullName { get; set; }
    public string Role { get; set; }
    public string UserType { get; set; }
    public List<string> Features { get; set; }
    public List<string> Sites { get; set; }
    public List<string> Groups { get; set; }
    public bool AllowUserManagement { get; set; }
    public int SiteCount { get; set; }
    public int GroupCount { get; set; }
}