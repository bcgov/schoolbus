using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;
using System.Linq;
using System.Threading.Tasks;

namespace SchoolBusAPI.Authorization
{
    /// <summary>
    /// Allows migration endpoints via API key (no user in legacy DB) or JWT user with required permissions.
    /// </summary>
    public class MigrationAuthorizationFilter : IAsyncAuthorizationFilter
    {
        public const string MigrationApiKeyHeaderName = "X-Migration-Api-Key";
        public const string ConfigKey = "Migration:ApiKey";

        private readonly IConfiguration _configuration;
        private readonly IAuthorizationService _authService;
        private readonly PermissionRequirement _requiredPermissions;

        public MigrationAuthorizationFilter(
            IConfiguration configuration,
            IAuthorizationService authService,
            PermissionRequirement requiredPermissions)
        {
            _configuration = configuration;
            _authService = authService;
            _requiredPermissions = requiredPermissions;
        }

        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            var apiKeyFromConfig = _configuration[ConfigKey]?.Trim();
            var apiKeyFromRequest = context.HttpContext.Request.Headers[MigrationApiKeyHeaderName].FirstOrDefault()?.Trim();

            if (!string.IsNullOrEmpty(apiKeyFromConfig) &&
                !string.IsNullOrEmpty(apiKeyFromRequest) &&
                apiKeyFromConfig.Equals(apiKeyFromRequest, System.StringComparison.Ordinal))
            {
                return;
            }

            var result = await _authService.AuthorizeAsync(
                context.HttpContext.User,
                context.ActionDescriptor.DisplayName,
                _requiredPermissions);

            if (!result.Succeeded)
            {
                var problem = new ValidationProblemDetails()
                {
                    Type = "https://sb.bc.gov.ca/exception",
                    Title = "Access denied",
                    Status = StatusCodes.Status401Unauthorized,
                    Detail = "Valid X-Migration-Api-Key header or JWT with permission required.",
                    Instance = context.HttpContext.Request.Path
                };
                problem.Extensions.Add("traceId", context.HttpContext.TraceIdentifier);
                context.Result = new UnauthorizedObjectResult(problem);
            }
        }
    }
}
