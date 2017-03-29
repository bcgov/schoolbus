/*
 * REST API Documentation for Schoolbus
 *
 * API Sample
 *
 * OpenAPI spec version: v1
 * 
 * 
 */

using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using SchoolBusAPI.Models;
using SchoolBusAPI.ViewModels;
using SchoolBusAPI.Mappings;
using SchoolBusAPI.Services;

namespace SchoolBusAPI.Services.Impl
{
    /// <summary>
    /// 
    /// </summary>
    public class UserService : IUserService
    {
        private readonly DbAppContext _context;

        /// <summary>
        /// Create a service and set the database context
        /// </summary>
        public UserService(DbAppContext context)
        {
            _context = context;
        }

        private void AdjustUser(SchoolBusAPI.Models.User item)
        {
            if (item.District != null)
            {
                bool district_exists = _context.Districts.Any(x => x.Id == item.District.Id);
                if (district_exists)
                {
                    District district = _context.Districts.First(x => x.Id == item.District.Id);
                    item.District = district;
                }
            }
        }        

        /// <summary>
        /// 
        /// </summary>
        /// <remarks>Adds a number of user groups</remarks>
        /// <param name="items"></param>
        /// <response code="200">OK</response>
        public virtual IActionResult UsergroupsBulkPostAsync(GroupMembership[] items)
        {
            if (items == null)
            {
                return new BadRequestResult();
            }
            foreach (GroupMembership item in items)
            {
                // adjust the user
                if (item.User != null)
                {
                    int user_id = item.User.Id;
                    bool user_exists = _context.Users.Any(a => a.Id == user_id);
                    if (user_exists)
                    {
                        User user = _context.Users.First(a => a.Id == user_id);
                        item.User = user;
                    }
                    else
                    {
                        item.User = null;
                    }
                }
                // adjust the group
                if (item.Group != null)
                {
                    int group_id = item.Group.Id;
                    bool group_exists = _context.Groups.Any(a => a.Id == group_id);
                    if (group_exists)
                    {
                        Group group = _context.Groups.First(a => a.Id == group_id);
                        item.Group = group;
                    }
                    else
                    {
                        item.Group = null;
                    }
                }

                var exists = _context.GroupMemberships.Any(a => a.Id == item.Id);
                if (exists)
                {
                    _context.GroupMemberships.Update(item);
                }
                else
                {
                    _context.GroupMemberships.Add(item);
                }
            }

            // Save the changes
            _context.SaveChanges();
            return new NoContentResult();
        }

        /// <summary>
        /// 
        /// </summary>
        /// <remarks>Adds a number of user roles</remarks>
        /// <param name="items"></param>
        /// <response code="200">OK</response>
        public virtual IActionResult UserrolesBulkPostAsync(UserRole[] items)
        {
            if (items == null)
            {
                return new BadRequestResult();
            }
            foreach (UserRole item in items)
            {
                // adjust the role
                if (item.Role != null)
                {
                    int role_id = item.Role.Id;
                    bool user_exists = _context.Roles.Any(a => a.Id == role_id);
                    if (user_exists)
                    {
                        Role role = _context.Roles.First(a => a.Id == role_id);
                        item.Role = role;
                    }
                }

                var exists = _context.UserRoles.Any(a => a.Id == item.Id);
                if (exists)
                {
                    _context.UserRoles.Update(item);
                }
                else
                {
                    _context.UserRoles.Add(item);
                }
            }

            // Save the changes
            _context.SaveChanges();
            return new NoContentResult();
        }
            

        /// <summary>
        /// 
        /// </summary>
        /// <remarks>Adds a number of users</remarks>
        /// <param name="items"></param>
        /// <response code="200">OK</response>
        public virtual IActionResult UsersBulkPostAsync(User[] items)
        {
            if (items == null)
            {
                return new BadRequestResult();
            }
            
            foreach (User item in items)
            {
                AdjustUser(item);
                var exists = _context.Users.Any(a => a.Id == item.Id);
                if (exists)
                {
                    _context.Users.Update(item);
                }
                else
                {
                    _context.Users.Add(item);
                }                
            }

            // Save the changes
            _context.SaveChanges();
            return new NoContentResult();
        }

        /// <summary>
        /// 
        /// </summary>
        /// <remarks>Returns all users</remarks>
        /// <response code="200">OK</response>
        /// <response code="404">User not found</response>
        public virtual IActionResult UsersGetAsync()
        {
            var result = _context.Users
                .Include(x => x.District)
                .Include(x => x.GroupMemberships)
                .ThenInclude(y => y.Group)
                .Include(x => x.UserRoles)
                .ThenInclude(y => y.Role)
                .ThenInclude(z => z.RolePermissions)
                .ThenInclude(z => z.Permission)
                .Select(x => x.ToViewModel()).ToList();
            return new ObjectResult(result);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <remarks>Deletes a user</remarks>
        /// <param name="id">id of User to delete</param>
        /// <response code="200">OK</response>
        /// <response code="404">User not found</response>
        public virtual IActionResult UsersIdDeletePostAsync(int id)
        {
            var user = _context.Users
                .Include(x => x.UserRoles)
                .Include(x => x.GroupMemberships)
                .FirstOrDefault(x => x.Id == id);
            if (user == null)
            {
                // Not Found
                return new StatusCodeResult(404);
            }
            if (user.UserRoles != null)
            {
                foreach (var item in user.UserRoles)
                {
                    _context.UserRoles.Remove(item);
                }
            }

            if (user.GroupMemberships != null)
            {
                foreach (var item in user.GroupMemberships)
                {
                    _context.GroupMemberships.Remove(item);
                }
            }

            _context.Users.Remove(user);
            _context.SaveChanges();
            return new ObjectResult(user.ToViewModel());
        }

        /// <summary>
        /// 
        /// </summary>
        /// <remarks>Returns a user&#39;s favourites of a given context type</remarks>
        /// <param name="id">id of User to fetch favorites for</param>
        /// <response code="200">OK</response>
        /// <response code="404">User not found</response>
        public virtual IActionResult UsersIdFavouritesGetAsync(int id)
        {
            var user = _context.Users.FirstOrDefault(x => x.Id == id);
            if (user == null)
            {
                // Not Found
                return new StatusCodeResult(404);
            }
            // TODO adjust UserFavourites model such that we can query to find a user's favourites.

            var data = _context.UserFavourites
                .Where(x => x.User.Id == user.Id)                
                .ToList();
            return new ObjectResult(data);
        }


        /// <summary>
        /// 
        /// </summary>
        /// <remarks>Updates the active set of groups for a user</remarks>
        /// <param name="id">id of User to update</param>
        /// <param name="items"></param>
        /// <response code="200">OK</response>
        /// <response code="404">User not found</response>
        public virtual IActionResult UsersIdFavouritesPutAsync(int id, UserFavourite[] items)
        {
            bool exists = _context.Users.Any(a => a.Id == id);
            if (exists)
            {
                // update the given user's group membership.

                User user = _context.Users.First(a => a.Id == id);
                var data = _context.UserFavourites
                    .Where(x => x.User.Id == user.Id);
                foreach (UserFavourite item in data)
                {
                    bool found = false;
                    foreach (UserFavourite parameterItem in items)
                    {
                        if (parameterItem == item)
                        {
                            found = true;
                        }
                    }
                    if (found == false)
                    {
                        _context.UserFavourites.Remove(item);
                    }
                }

                // add new items.
                foreach (UserFavourite parameterItem in items)
                {
                    bool found = false;
                    foreach (UserFavourite item in data)
                    {
                        if (parameterItem == item)
                        {
                            found = true;
                        }
                    }
                    if (found == false)
                    {
                        // adjust user  
                        parameterItem.User = user;                        
                        _context.UserFavourites.Add(parameterItem);
                    }
                }

                _context.SaveChanges();
                return new NoContentResult();
            }
            else
            {
                // record not found
                return new StatusCodeResult(404);
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <remarks>Adds a user to groups</remarks>
        /// <param name="id">id of User to update</param>
        /// <param name="items"></param>
        /// <response code="200">OK</response>
        /// <response code="404">User not found</response>
        public virtual IActionResult UsersIdFavouritesPostAsync(int id, UserFavourite[] items)
        {
            bool exists = _context.Users.Any(a => a.Id == id);
            if (exists)
            {
                // update the given user's group membership.

                User user = _context.Users.First(a => a.Id == id);
                var data = _context.UserFavourites
                    .Where(x => x.User.Id == user.Id);
                foreach (UserFavourite item in data)
                {
                    bool found = false;
                    foreach (UserFavourite parameterItem in items)
                    {
                        if (parameterItem == item)
                        {
                            found = true;
                        }
                    }
                    if (found == false)
                    {
                        _context.UserFavourites.Remove(item);
                    }
                }

                // add new items.
                foreach (UserFavourite parameterItem in items)
                {
                    bool found = false;
                    foreach (UserFavourite item in data)
                    {
                        if (parameterItem == item)
                        {
                            found = true;
                        }
                    }
                    if (found == false)
                    {
                        // adjust user and group. 
                        parameterItem.User = user;                        

                        _context.UserFavourites.Add(parameterItem);
                    }
                }

                _context.SaveChanges();
                return new NoContentResult();
            }
            else
            {
                // record not found
                return new StatusCodeResult(404);
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <remarks>Returns data for a particular user</remarks>
        /// <param name="id">id of User to fetch</param>
        /// <response code="200">OK</response>
        /// <response code="404">User not found</response>
        public virtual IActionResult UsersIdGetAsync(int id)
        {
            var user = _context.Users
                .Include(x => x.District)
                .Include(x => x.GroupMemberships)
                .ThenInclude(y => y.Group)
                .Include(x => x.UserRoles)
                .ThenInclude(y => y.Role)
                .ThenInclude(z => z.RolePermissions)
                .ThenInclude(z => z.Permission)
                .FirstOrDefault(x => x.Id == id);
            if (user == null)
            {
                // Not Found
                return new StatusCodeResult(404);
            }
            return new ObjectResult(user.ToViewModel());
        }

        /// <summary>
        /// 
        /// </summary>
        /// <remarks>Returns all groups that a user is a member of</remarks>
        /// <param name="id">id of User to fetch</param>
        /// <response code="200">OK</response>
        /// <response code="404">User not found</response>
        public virtual IActionResult UsersIdGroupsGetAsync(int id)
        {
            var user = _context.Users
                .Include(x => x.GroupMemberships)
                .ThenInclude(y => y.Group)
                .First(x => x.Id == id);
            if (user == null)
            {
                // Not Found
                return new StatusCodeResult(404);
            }
            var result = new List<GroupMembershipViewModel>();
            var data = user.GroupMemberships;
            foreach (var item in data)
            {
                if (item != null)
                {                    
                    GroupMembershipViewModel record = item.ToViewModel();                        
                    result.Add(record);                    
                }
            }
            return new ObjectResult(result);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <remarks>Updates the active set of groups for a user</remarks>
        /// <param name="id">id of User to update</param>
        /// <param name="items"></param>
        /// <response code="200">OK</response>
        /// <response code="404">User not found</response>
        public virtual IActionResult UsersIdGroupsPutAsync(int id, GroupMembershipViewModel[] items)
        {
            bool exists = _context.Users.Any(x => x.Id == id);
            if (exists)
            {
                User user = _context.Users
                    .Include(x => x.District)
                    .Include(x => x.GroupMemberships)
                    .ThenInclude(y => y.Group)
                    .Include(x => x.UserRoles)
                    .ThenInclude(y => y.Role)
                    .ThenInclude(z => z.RolePermissions)
                    .ThenInclude(z => z.Permission)
                    .First(x => x.Id == id);
                if (user.GroupMemberships == null)
                {
                    user.GroupMemberships = new List<GroupMembership>();
                }
                else
                {
                    // existing data, clear it.
                    foreach (var groupMembership in user.GroupMemberships)
                    {
                        if (_context.GroupMemberships.Any(x => x.Id == groupMembership.Id))
                        {
                            GroupMembership delete = _context.GroupMemberships.First(x => x.Id == groupMembership.Id);
                            _context.Remove(delete);
                        }
                    }
                    user.GroupMemberships.Clear();
                }

                foreach (var item in items)
                {
                    if (item != null)
                    {
                        // check the role id
                        bool group_exists = _context.Groups.Any(x => x.Id == item.GroupId);
                        if (group_exists)
                        {
                            // create a new UserRole based on the view model.
                            GroupMembership groupMembership = new GroupMembership();
                            Group group = _context.Groups.First(x => x.Id == item.GroupId);
                            groupMembership.Group = group;
                            groupMembership.User = user;

                            _context.Add(groupMembership);

                            if (!user.GroupMemberships.Contains(groupMembership))
                            {
                                user.GroupMemberships.Add(groupMembership);
                            }
                        }
                    }                    
                }
                _context.Update(user);
                _context.SaveChanges();
                return new StatusCodeResult(201);                
            }
            else
            {
                return new StatusCodeResult(400);
            }
        }
               

        /// <summary>
        /// 
        /// </summary>
        /// <remarks>Adds a user to groups</remarks>
        /// <param name="id">id of User to update</param>
        /// <param name="items"></param>
        /// <response code="200">OK</response>
        /// <response code="404">User not found</response>
        public virtual IActionResult UsersIdGroupsPostAsync(int id, GroupMembershipViewModel item)
        {
            bool exists = _context.Users.Any(a => a.Id == id);
            if (exists && item != null)
            {
                // update the given user's group membership.

                User user = _context.Users
                    .Include(x => x.District)
                    .Include(x => x.GroupMemberships)
                    .ThenInclude(y => y.Group)
                    .Include(x => x.UserRoles)
                    .ThenInclude(y => y.Role)
                    .ThenInclude(z => z.RolePermissions)
                    .ThenInclude(z => z.Permission)
                    .First(a => a.Id == id);                                

                // add new item
                bool found = false;
                foreach (GroupMembership parameterItem in user.GroupMemberships)
                {
                    if (parameterItem.Group != null && parameterItem.Group.Id == item.GroupId)
                    {
                        found = true;
                    }
                }
                if (found == false && item.GroupId != null)
                {
                    GroupMembership groupMembership = new GroupMembership();
                    // set user and group. 
                    groupMembership.User = user;
                    bool group_exists = _context.Groups.Any(a => a.Id == item.GroupId);
                    if (group_exists)
                    {
                        Group group = _context.Groups.First(a => a.Id == item.GroupId);
                        groupMembership.Group = group;                            
                    }

                    user.GroupMemberships.Add(groupMembership);

                    _context.Update(user);
                    _context.SaveChanges();

                }

                
                return new NoContentResult();
            }
            else
            {
                // record not found
                return new StatusCodeResult(404);
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <remarks>Returns a user&#39;s notifications</remarks>
        /// <param name="id">id of User to fetch notifications for</param>
        /// <response code="200">OK</response>
        public virtual IActionResult UsersIdNotificationsGetAsync(int id)
        {
            var user = _context.Users.FirstOrDefault(x => x.Id == id);
            if (user == null)
            {
                // Not Found
                return new StatusCodeResult(404);
            }

            var data = _context.Notifications
                .Where(x => x.User.Id == user.Id)
                .ToList();

            return new ObjectResult(data);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <remarks>Returns the set of permissions for a user</remarks>
        /// <param name="id">id of User to fetch</param>
        /// <response code="200">OK</response>
        /// <response code="404">User not found</response>
        public virtual IActionResult UsersIdPermissionsGetAsync(int id)
        {
            var user = _context.Users
                .Include(x => x.District)
                .Include(x => x.GroupMemberships)
                .ThenInclude(y => y.Group)
                .Include(x => x.UserRoles)
                .ThenInclude(y => y.Role)
                .ThenInclude(z => z.RolePermissions)
                .ThenInclude(z => z.Permission)
                .FirstOrDefault(x => x.Id == id);
            if (user == null)
            {
                // Not Found
                return new StatusCodeResult(404);
            }

            List<PermissionViewModel> permissions = new List<PermissionViewModel>();

            if (user.UserRoles != null)
            {
                foreach (var item in user.UserRoles)
                {
                    if (item.Role != null && item.Role.RolePermissions != null)
                    {
                        foreach (var permission in item.Role.RolePermissions)
                        {
                            permissions.Add(permission.Permission.ToViewModel());
                        }
                    }
                }
            }
            return new ObjectResult(permissions);

        }

        /// <summary>
        /// 
        /// </summary>
        /// <remarks>Updates a user</remarks>
        /// <param name="id">id of User to update</param>
        /// <param name="item"></param>
        /// <response code="200">OK</response>
        /// <response code="404">User not found</response>
        public virtual IActionResult UsersIdPutAsync(int id, UserViewModel item)
        {
            var user = _context.Users                
                .Include(x => x.District)
                .Include(x => x.GroupMemberships)
                .ThenInclude(y => y.Group)
                .Include(x => x.UserRoles)
                .ThenInclude(y => y.Role)
                .ThenInclude(z => z.RolePermissions)
                .ThenInclude(z => z.Permission)
                .FirstOrDefault(x => x.Id == id);
            if (user == null)
            {
                // Not Found
                return new StatusCodeResult(404);
            }

            user.Active = item.Active;
            user.Email = item.Email;
            user.GivenName = item.GivenName;            
            user.Surname = item.Surname;
            user.SmUserId = item.SmUserId;

            if (item.District != null)
            {
                bool district_exists = _context.Districts.Any(x => x.Id == item.District.Id);
                if (district_exists)
                {
                    District district = _context.Districts
                        .Include(x => x.Region)
                        .First(x => x.Id == item.District.Id);
                    user.District = district;
                }
            }

            // Save changes
            _context.Users.Update(user);
            _context.SaveChanges();
            return new ObjectResult(user.ToViewModel());
        }

        /// <summary>
        /// 
        /// </summary>
        /// <remarks>Returns the roles for a user</remarks>
        /// <param name="id">id of User to fetch</param>
        /// <response code="200">OK</response>
        /// <response code="404">User not found</response>
        public virtual IActionResult UsersIdRolesGetAsync(int id)
        {
            
            var user = _context.Users
                .Include(x => x.UserRoles)
                .ThenInclude( y => y.Role)
                .First(x => x.Id == id);
            if (user == null)
            {
                // Not Found
                return new StatusCodeResult(404);
            }
            var result = new List<UserRoleViewModel>();
            var data = user.UserRoles;   
            foreach (var item in data)
            {
                if (item != null)
                {
                    int userRoleId = item.Id;
                    bool exists = _context.UserRoles.Any(x => x.Id == userRoleId);
                    if (exists)
                    {
                        UserRole userRole = _context.UserRoles
                            .Include (x => x.Role)
                            .First(x => x.Id == userRoleId);
                        UserRoleViewModel record = userRole.ToViewModel();
                        record.UserId = user.Id;
                        result.Add(record);
                    }                    
                }
            }
            return new ObjectResult(result);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <remarks>Adds a role to a user</remarks>
        /// <param name="id">id of User to update</param>
        /// <param name="item"></param>
        /// <response code="201">Role created for user</response>
        public virtual IActionResult UsersIdRolesPostAsync(int id, UserRoleViewModel item)
        {
            bool exists = _context.Users.Any(x => x.Id == id);
            bool success = false;
            if (exists)
            {
                // check the role id
                bool role_exists = _context.Roles.Any(x => x.Id == item.RoleId);
                if (role_exists)
                {
                    User user = _context.Users
                        .Include(x => x.District)
                        .Include(x => x.GroupMemberships)
                        .ThenInclude(y => y.Group)
                        .Include(x => x.UserRoles)
                        .ThenInclude(y => y.Role)
                        .ThenInclude(z => z.RolePermissions)
                        .ThenInclude(z => z.Permission)
                        .First(x => x.Id == id);
                    if (user.UserRoles == null)
                    {
                        user.UserRoles = new List<UserRole>();
                    }
                    // create a new UserRole based on the view model.
                    UserRole userRole = new UserRole();
                    Role role = _context.Roles.First(x => x.Id == item.RoleId);
                    userRole.Role = role;
                    userRole.EffectiveDate = item.EffectiveDate;
                    userRole.ExpiryDate = item.ExpiryDate;

                    if (! user.UserRoles.Contains (userRole))
                    {
                        user.UserRoles.Add(userRole);
                    }
                    _context.Update(user);
                    _context.SaveChanges();
                    success = true;
                }
            }
            
            if (success)
            {
                return new StatusCodeResult(201);
            }
            else
            {
                return new StatusCodeResult(400);
            }

        }

        /// <summary>
        /// 
        /// </summary>
        /// <remarks>Updates the roles for a user</remarks>
        /// <param name="id">id of User to update</param>
        /// <param name="items"></param>
        /// <response code="200">OK</response>
        /// <response code="404">User not found</response>
        public virtual IActionResult UsersIdRolesPutAsync(int id, UserRoleViewModel[] items)
        {
            bool exists = _context.Users.Any(x => x.Id == id);            
            if (exists && items != null)
            {
                User user = _context.Users
                    .Include(x => x.District)
                    .Include(x => x.GroupMemberships)
                    .ThenInclude(y => y.Group)
                    .Include(x => x.UserRoles)
                    .ThenInclude(y => y.Role)
                    .ThenInclude(z => z.RolePermissions)
                    .ThenInclude(z => z.Permission)                    
                    .First(x => x.Id == id);
                if (user.UserRoles == null)
                {
                    user.UserRoles = new List<UserRole>();
                }
                else
                {
                    // existing data, clear it.
                    foreach (var userRole in user.UserRoles)
                    {
                        if (_context.UserRoles.Any ( x => x.Id == userRole.Id))
                        {
                            UserRole delete = _context.UserRoles.First(x => x.Id == userRole.Id);
                            _context.Remove(delete);
                        }                        
                    }
                    user.UserRoles.Clear();
                }
                
                
                foreach (var item in items)
                {
                    // check the role id
                    bool role_exists = _context.Roles.Any(x => x.Id == item.RoleId);
                    if (role_exists)
                    {                        
                        // create a new UserRole based on the view model.
                        UserRole userRole = new UserRole();
                        Role role = _context.Roles.First(x => x.Id == item.RoleId);
                        userRole.Role = role;
                        userRole.EffectiveDate = item.EffectiveDate;
                        userRole.ExpiryDate = item.ExpiryDate;

                        _context.Add(userRole);

                        if (!user.UserRoles.Contains(userRole))
                        {                            
                            user.UserRoles.Add(userRole);
                        }                        
                    }
                }
                _context.Update(user);
                _context.SaveChanges();
                return new StatusCodeResult(201);                
            }            
            else
            {
                return new StatusCodeResult(400);
            }
        }

        /// <summary>
        ///  Added by Simon Di to delete a role from a user by administrator
        /// </summary>
        /// <remarks>Delete a role to a user</remarks>
        /// <param name="id">id of User to update</param>
        /// <param name="item"></param>
        /// <response code="201">Role created for user</response>
        public virtual IActionResult UsersIdDeleteRolePostAsync(int id, UserRoleViewModel item)
        {
            bool success = false;
            bool exists = _context.Users.Any(x => x.Id == id);
            if (exists && item != null)
            {
                 // check the role id
                bool role_exists = _context.Roles.Any(x => x.Id == item.RoleId);
                if (role_exists)
                {
                    User user = _context.Users
                        .Include(x => x.District)
                        .Include(x => x.GroupMemberships)
                        .ThenInclude(y => y.Group)
                        .Include(x => x.UserRoles)
                        .ThenInclude(y => y.Role)
                        .ThenInclude(z => z.RolePermissions)
                        .ThenInclude(z => z.Permission)
                        .First(x => x.Id == id);

                    if (user.UserRoles != null)
                    {
                        // existing data, clear it.
                        foreach (var userRole in user.UserRoles)
                        {
                            if (userRole.RoleId == item.RoleId)
                            {
                                user.UserRoles.Remove(userRole);
                                break;
                            }
                        }
                        _context.Update(user);
                        _context.SaveChanges();
                        success = true;
                    }
                }
            }

            if (success)
            {
                return new StatusCodeResult(201);
            }
            else
            {
                return new StatusCodeResult(400);
            }

        }

        /// <summary>
        /// 
        /// </summary>
        /// <remarks>Create new user</remarks>
        /// <param name="item"></param>
        /// <response code="201">User created</response>
        public virtual IActionResult UsersPostAsync(User item)
        {
            AdjustUser(item);
            bool exists = _context.Users.Any(x => x.Id == item.Id);          
            if (exists)
            {
                
                _context.Users.Update(item);
            }
            else
            {
                _context.Users.Add(item);
            }
    
            _context.SaveChanges();
            return new ObjectResult(item);
        }

        /// <summary>
        /// Searches Users
        /// </summary>
        /// <remarks>Used for the search users.</remarks>
        /// <param name="districts">Districts (array of id numbers)</param>
        /// <param name="surname"></param>
        /// <param name="includeInactive">True if Inactive users will be returned</param>
        /// <response code="200">OK</response>
        public virtual IActionResult UsersSearchGetAsync(int?[] districts, string surname, bool? includeInactive)
        {
            // Eager loading of related data
            var data = _context.Users
                .Include(x => x.District)
                .Include(x => x.GroupMemberships)
                .ThenInclude(y => y.Group)
                .Include(x => x.UserRoles)
                .ThenInclude(y => y.Role)
                .ThenInclude(z => z.RolePermissions)
                .ThenInclude(z => z.Permission)
                .Select(x => x);

            // Note that Districts searches SchoolBus Districts, not SchoolBusOwner Districts
            if (districts != null)
            {
                               
                foreach (int? district in districts)
                {
                    if (district != null)
                    {
                        data = data.Where(x => x.District.Id == district);
                    }
                }                
            }            
            
            if (surname != null)
            {
                data = data.Where(x => x.Surname.ToLower().Contains (surname.ToLower()));
            }

            if (includeInactive == null || includeInactive == false)
            {
                data = data.Where(x => x.Active == true);
            }

            // now convert the results to the view model.
            var result = new List<UserViewModel>();
            foreach (User item in data)
            {
                UserViewModel record = item.ToViewModel();
                result.Add(record);
            }
            
            return new ObjectResult(result);
        }
    }    
}
