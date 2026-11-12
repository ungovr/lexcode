// lexcode-expect: 17
// A public sign-up page or endpoint: MVC and Razor route attributes on an action or a controller
// (each attribute through a using and through an alias), a Blazor component's route, minimal API
// routes, a conventional route with a culture prefix, and Identity's API endpoints, which include
// /register. The account controller requires sign-in but lets anyone reach its sign-up actions.
using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Comp = Microsoft.AspNetCore.Components;
using Mvc = Microsoft.AspNetCore.Mvc;

namespace Demo.Web;

[Authorize]
[Route("api/[controller]")]
public class AccountController : Controller
{
    [AllowAnonymous]
    [HttpPost("register")]
    public IActionResult Register(RegisterRequest request) => Ok();

    [AllowAnonymous]
    [Mvc.HttpPost("api/v2/register")]
    public IActionResult RegisterV2(RegisterRequest request) => Ok();

    [AllowAnonymous]
    [HttpGet("register")]
    public IActionResult RegisterForm() => View();

    [AllowAnonymous]
    [Mvc.HttpGet("Identity/Account/Register")]
    public IActionResult RegisterPage() { return View(); }

    [AllowAnonymous]
    [HttpPut("users/registration")]
    public IActionResult PutRegistration(RegisterRequest request) => Ok();

    [AllowAnonymous]
    [Mvc.HttpPut("accounts/registration")]
    public IActionResult PutAccountRegistration(RegisterRequest request) => Ok();

    [AllowAnonymous]
    [HttpGet, Route("sign-up")]
    public IActionResult SignUp() { return View(); }

    [AllowAnonymous]
    [HttpPost, Mvc.Route("auth/sign_up")]
    public IActionResult SignUpPost(RegisterRequest request) => Ok();
}

[Route("create-account")]
public class CreateAccountController : Controller
{
    public IActionResult Index() => View();
}

[Mvc.Route("signup")]
public class JoinController : Controller
{
    public IActionResult Index() => View();
}

[Comp.Route("/signup")]
public class SignUpForm : Comp.ComponentBase
{
}

public static class PublicEndpoints
{
    public static void Map(WebApplication app, IEndpointRouteBuilder routes, string lang)
    {
        app.MapPost("/api/auth/register", (RegisterRequest request) => Results.Ok());
        app.MapGet("/signup", () => Results.Ok());
        routes.MapControllerRoute(name: "Register", pattern: $"{lang}/register/", defaults: new { controller = "Customer", action = "Register" });
        routes.MapControllerRoute("SignUp", "account/sign-up", new { controller = "Account", action = "SignUp" });
        app.MapGroup("/api/users").MapIdentityApi<AppUser>();
        app.MapGroup("/api").MapPost("/v1/registration", (RegisterRequest request) => Results.Ok());
    }
}
