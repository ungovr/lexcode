// lexcode-expect: 0
// Not a public sign-up route: the sign-up routes of a staff console, declared in a file-scoped
// admin namespace with nothing else marking them as staff-only.
using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Web.Admin;

public class UsersController : Controller
{
    [HttpPost("register")]
    public IActionResult Create(string email) => Ok();
}

public static class Endpoints
{
    public static void Map(WebApplication app) => app.MapPost("/signup", (string email) => email);
}
