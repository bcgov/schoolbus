using Microsoft.AspNetCore.Mvc;

namespace SchoolBusAPI.Authorization
{
    /// <summary>
    /// Protects migration endpoints: allow if X-Migration-Api-Key matches config, or JWT user has required permissions.
    /// </summary>
    public class MigrationAuthorizationAttribute : TypeFilterAttribute
    {
        public MigrationAuthorizationAttribute(params string[] permissions) : base(typeof(MigrationAuthorizationFilter))
        {
            Arguments = new object[] { new PermissionRequirement(permissions) };
        }
    }
}
