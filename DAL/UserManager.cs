using CustomAppDB.Models;
using System.Data;
using System.Data.SqlClient;

namespace CustomAppDB.DAL
{
    public class UserManager
    {
        private readonly IConfiguration _configuration;

        public UserManager(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public List<UserViewModel> GetAllUsers()
        {
            var users = new List<UserViewModel>();
            string connStr = _configuration.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string query = @"SELECT Email, FullName, Role, UserType, Features, Sites, SiteCount, Groups, GroupCount, 
                               AccountCreatedAt, LastLogin, UserManagement FROM NewUsers ORDER BY AccountCreatedAt ASC";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            users.Add(new UserViewModel
                            {
                                Id = reader["Email"].ToString(),
                                FullName = reader["FullName"]?.ToString(),
                                Email = reader["Email"].ToString(),
                                UserType = reader["UserType"]?.ToString(),
                                Role = reader["Role"]?.ToString(),
                                SiteCount = reader["SiteCount"] != DBNull.Value ? Convert.ToInt32(reader["SiteCount"]) : 0,
                                Sites = reader["Sites"]?.ToString(),
                                Features = reader["Features"]?.ToString(),
                                Groups = reader["Groups"]?.ToString(),
                                GroupCount = reader["GroupCount"] != DBNull.Value ? Convert.ToInt32(reader["GroupCount"]) : 0,
                                CreatedOn = reader["AccountCreatedAt"]?.ToString() ?? "",
                                LastLogin = reader["LastLogin"]?.ToString(),
                                UserManagement = reader["UserManagement"] != DBNull.Value ? Convert.ToBoolean(reader["UserManagement"]) : false
                            });
                        }
                    }
                }
            }

            return users;
        }

        public bool CheckEmailExists(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            string connStr = _configuration.GetConnectionString("DefaultConnection");
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string query = "SELECT COUNT(*) FROM NewUsers WHERE Email = @Email";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Email", email);
                    int count = (int)cmd.ExecuteScalar();
                    return count > 0;
                }
            }
        }

        public bool CreateUser(User user)
        {
            string connStr = _configuration.GetConnectionString("DefaultConnection");
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                if (string.IsNullOrWhiteSpace(user.UserType))
                    user.UserType = "Deploy user";

                var processedUser = ProcessUserPermissions(user);
                string formattedDateTime = DateTime.Now.ToString("yyyy-MM-dd hh:mm:ss tt");

                string query = @"INSERT INTO NewUsers 
                    (Email, FullName, Password, Role, UserType, Features, Sites, SiteCount, Groups, GroupCount, 
                     AccountCreatedAt, LastLogin, UserManagement) 
                    VALUES 
                    (@Email, @FullName, @Password, @Role, @UserType, @Features, @Sites, @SiteCount, @Groups, 
                     @GroupCount, @AccountCreatedAt, @LastLogin, @UserManagement)";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    AddUserParameters(cmd, processedUser, formattedDateTime);
                    int rowsAffected = cmd.ExecuteNonQuery();
                    return rowsAffected > 0;
                }
            }
        }

        public bool UpdateUser(UpdateUserRequest request)
        {
            string connStr = _configuration.GetConnectionString("DefaultConnection");
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                // Check if user exists
                if (!CheckUserExistsByEmail(conn, request.OriginalEmail))
                    return false;

                var processedUser = ProcessUserPermissions(request);

                string query = @"UPDATE NewUsers SET 
                    FullName = @FullName, Role = @Role, Features = @Features, Sites = @Sites, 
                    SiteCount = @SiteCount, Groups = @Groups, GroupCount = @GroupCount, 
                    UserManagement = @UserManagement 
                    WHERE Email = @OriginalEmail";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    AddUpdateUserParameters(cmd, processedUser);
                    int rowsAffected = cmd.ExecuteNonQuery();
                    return rowsAffected > 0;
                }
            }
        }

        public bool DeleteUser(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            string connStr = _configuration.GetConnectionString("DefaultConnection");
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                // Check if user exists
                if (!CheckUserExistsByEmail(conn, email))
                    return false;

                string query = "DELETE FROM NewUsers WHERE Email = @Email";
                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Email", email);
                    int rowsAffected = cmd.ExecuteNonQuery();
                    return rowsAffected > 0;
                }
            }
        }

        private bool CheckUserExistsByEmail(SqlConnection conn, string email)
        {
            string query = "SELECT COUNT(*) FROM NewUsers WHERE Email = @Email";
            using (SqlCommand cmd = new SqlCommand(query, conn))
            {
                cmd.Parameters.AddWithValue("@Email", email);
                int userExists = (int)cmd.ExecuteScalar();
                return userExists > 0;
            }
        }

        private ProcessedUserData ProcessUserPermissions(User user)
        {
            var processed = new ProcessedUserData();

            // Process Features
            if (user.Role == "Super Administrator" || user.Role == "Administrator")
            {
                processed.FeaturesString = "All";
            }
            else
            {
                processed.FeaturesString = user.Features != null && user.Features.Count > 0
                    ? string.Join(",", user.Features)
                    : "";
            }

            // Process Sites
            if (user.Role == "Super Administrator")
            {
                processed.SitesString = "All";
                processed.SiteCount = 3;
            }
            else if (user.Sites != null && user.Sites.Count > 0)
            {
                int totalSites = 3;
                if (user.Sites.Count == totalSites)
                {
                    processed.SitesString = "All";
                }
                else
                {
                    processed.SitesString = string.Join(",", user.Sites);
                }
                processed.SiteCount = user.Sites.Count;
            }
            else
            {
                processed.SitesString = "No Access to sites";
                processed.SiteCount = 0;
            }

            // Process Groups
            if (user.Role == "Super Administrator")
            {
                processed.GroupsString = "All";
                processed.GroupCount = 3;
            }
            else if (user.Groups != null && user.Groups.Count > 0)
            {
                int totalGroups = 3;
                if (user.Groups.Count == totalGroups)
                {
                    processed.GroupsString = "All";
                }
                else
                {
                    processed.GroupsString = string.Join(",", user.Groups);
                }
                processed.GroupCount = user.Groups.Count;
            }
            else
            {
                processed.GroupsString = "No Access to groups";
                processed.GroupCount = 0;
            }

            // Process User Management
            if (user.Role == "Super Administrator")
            {
                processed.UserManagement = true;
            }
            else if (user.Role == "Administrator")
            {
                processed.UserManagement = user.AllowUserManagement;
            }
            else
            {
                processed.UserManagement = false;
            }

            processed.User = user;
            return processed;
        }

        private ProcessedUserData ProcessUserPermissions(UpdateUserRequest request)
        {
            var processed = new ProcessedUserData();

            // Process Features
            if (request.Role == "Super Administrator" || request.Role == "Administrator")
            {
                processed.FeaturesString = "All";
            }
            else
            {
                processed.FeaturesString = request.Features != null && request.Features.Count > 0
                    ? string.Join(",", request.Features)
                    : "";
            }

            // Process Sites
            if (request.Role == "Super Administrator")
            {
                processed.SitesString = "All";
                processed.SiteCount = 3;
            }
            else if (request.Sites != null && request.Sites.Count > 0)
            {
                int totalSites = 3;
                if (request.Sites.Count == totalSites)
                {
                    processed.SitesString = "All";
                }
                else
                {
                    processed.SitesString = string.Join(",", request.Sites);
                }
                processed.SiteCount = request.Sites.Count;
            }
            else
            {
                processed.SitesString = "No Access to sites";
                processed.SiteCount = 0;
            }

            // Process Groups
            if (request.Role == "Super Administrator")
            {
                processed.GroupsString = "All";
                processed.GroupCount = 3;
            }
            else if (request.Groups != null && request.Groups.Count > 0)
            {
                int totalGroups = 3;
                if (request.Groups.Count == totalGroups)
                {
                    processed.GroupsString = "All";
                }
                else
                {
                    processed.GroupsString = string.Join(",", request.Groups);
                }
                processed.GroupCount = request.Groups.Count;
            }
            else
            {
                processed.GroupsString = "No Access to groups";
                processed.GroupCount = 0;
            }

            // Process User Management
            if (request.Role == "Super Administrator")
            {
                processed.UserManagement = true;
            }
            else if (request.Role == "Administrator")
            {
                processed.UserManagement = request.AllowUserManagement;
            }
            else
            {
                processed.UserManagement = false;
            }

            processed.UpdateRequest = request;
            return processed;
        }

        private void AddUserParameters(SqlCommand cmd, ProcessedUserData processedUser, string formattedDateTime)
        {
            cmd.Parameters.AddWithValue("@Email", processedUser.User.Email);
            cmd.Parameters.AddWithValue("@FullName", (object)processedUser.User.FullName ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Password", (object)processedUser.User.Password ?? "1234");
            cmd.Parameters.AddWithValue("@Role", (object)processedUser.User.Role ?? "Limited Administrator");
            cmd.Parameters.AddWithValue("@UserType", processedUser.User.UserType);
            cmd.Parameters.AddWithValue("@Features", processedUser.FeaturesString);
            cmd.Parameters.AddWithValue("@Sites", processedUser.SitesString);
            cmd.Parameters.AddWithValue("@SiteCount", processedUser.SiteCount);
            cmd.Parameters.AddWithValue("@Groups", processedUser.GroupsString);
            cmd.Parameters.AddWithValue("@GroupCount", processedUser.GroupCount);
            cmd.Parameters.AddWithValue("@AccountCreatedAt", formattedDateTime);
            cmd.Parameters.AddWithValue("@LastLogin", "Never logged in");
            cmd.Parameters.AddWithValue("@UserManagement", processedUser.UserManagement);
        }

        private void AddUpdateUserParameters(SqlCommand cmd, ProcessedUserData processedUser)
        {
            cmd.Parameters.AddWithValue("@FullName", (object)processedUser.UpdateRequest.FullName ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Role", (object)processedUser.UpdateRequest.Role ?? "Limited Administrator");
            cmd.Parameters.AddWithValue("@Features", processedUser.FeaturesString);
            cmd.Parameters.AddWithValue("@Sites", processedUser.SitesString);
            cmd.Parameters.AddWithValue("@SiteCount", processedUser.SiteCount);
            cmd.Parameters.AddWithValue("@Groups", processedUser.GroupsString);
            cmd.Parameters.AddWithValue("@GroupCount", processedUser.GroupCount);
            cmd.Parameters.AddWithValue("@UserManagement", processedUser.UserManagement);
            cmd.Parameters.AddWithValue("@OriginalEmail", processedUser.UpdateRequest.OriginalEmail);
        }

        private class ProcessedUserData
        {
            public string FeaturesString { get; set; } = "";
            public string SitesString { get; set; } = "";
            public int SiteCount { get; set; }
            public string GroupsString { get; set; } = "";
            public int GroupCount { get; set; }
            public bool UserManagement { get; set; }
            public User User { get; set; }
            public UpdateUserRequest UpdateRequest { get; set; }
        }
    }
}