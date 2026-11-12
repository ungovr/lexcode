// lexcode-expect: 0
// Not a public sign-up route: staff account tools (a staff namespace, an admin area, an admin-only
// controller, an admin attribute, a back-office controller, an admin route group, an endpoint
// that requires sign-in), sign-in, a device or webhook registration, a route whose name (not its
// path) is Register, and the app's own Route and HttpPost attributes in another namespace, which
// share ASP.NET Core's short names.
using System;
using Demo.Routing;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;

namespace Demo.Web.Staff
{
    public class InviteController : Microsoft.AspNetCore.Mvc.Controller
    {
        [Microsoft.AspNetCore.Mvc.HttpPost("register")]
        public Microsoft.AspNetCore.Mvc.IActionResult Invite(string email) => Ok();
    }
}

namespace Demo.Web
{
    [Microsoft.AspNetCore.Mvc.Area("Admin")]
    public class UsersController : Microsoft.AspNetCore.Mvc.Controller
    {
        [Microsoft.AspNetCore.Mvc.HttpPost("register")]
        public Microsoft.AspNetCore.Mvc.IActionResult Create(string email) => Ok();
    }

    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
    public class OnboardingController : Microsoft.AspNetCore.Mvc.Controller
    {
        [Microsoft.AspNetCore.Mvc.HttpGet("signup")]
        public Microsoft.AspNetCore.Mvc.IActionResult Start() { return View(); }
    }

    [AuthorizeAdmin]
    public class TeamAccountsController : Microsoft.AspNetCore.Mvc.Controller
    {
        [Microsoft.AspNetCore.Mvc.Route("create-account")]
        public Microsoft.AspNetCore.Mvc.IActionResult New() => View();
    }

    public class BackofficeUsersController : Microsoft.AspNetCore.Mvc.Controller
    {
        [Microsoft.AspNetCore.Mvc.HttpPost("users/register")]
        public Microsoft.AspNetCore.Mvc.IActionResult Add(string email) => Ok();
    }

    public class AccountController : Microsoft.AspNetCore.Mvc.Controller
    {
        [Microsoft.AspNetCore.Authorization.Authorize]
        [Microsoft.AspNetCore.Mvc.HttpPost("register")]
        public Microsoft.AspNetCore.Mvc.IActionResult AddSecondProfile() => Ok();

        [Microsoft.AspNetCore.Mvc.HttpPost("login")]
        public Microsoft.AspNetCore.Mvc.IActionResult Login() => Ok();

        [Microsoft.AspNetCore.Mvc.HttpPost("devices/register")]
        public Microsoft.AspNetCore.Mvc.IActionResult RegisterDevice() => Ok();
    }

    [Route("/register")]
    public class LegacyRegisterPage
    {
        [HttpPost("signup")]
        public void Submit() { }
    }

    public static class Endpoints
    {
        public static void Map(WebApplication app, IEndpointRouteBuilder routes)
        {
            app.MapGroup("/admin").MapPost("/register", (string email) => email);
            var adminUsers = app.MapGroup("/internal/users");
            adminUsers.MapPost("/signup", (string email) => email);
            app.MapPost("/register", (string email) => email).RequireAuthorization("Admin");
            app.MapPost("/webhooks/register", (string url) => url);
            app.MapPost("/login", (string email) => email);
            routes.MapControllerRoute("Register", "customer/info", new { controller = "Customer" });
            app.MapGroup("/admin/users").MapIdentityApi<StaffUser>();
        }
    }
}
