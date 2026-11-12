// lexcode-expect: 0
// Not a public sign-up flow: demo users seeded at start-up, the administrator an initialiser
// creates, a generic identity service that any caller may use, staff creating accounts in an admin
// area, Identity configured for an API with no pages, an app's own AddDefaultUI on another
// builder, and the app's own UserManager in another namespace, which shares Identity's short name.
using System;
using Demo.Accounts;
using Microsoft.Extensions.DependencyInjection;

namespace Demo.Infrastructure;

public class UsersSeed(Microsoft.AspNetCore.Identity.UserManager<AppUser> userManager)
{
    public async Task SeedAsync()
    {
        await userManager.CreateAsync(new AppUser { UserName = "alice" }, "Pass123$");
    }
}

public class ApplicationDbContextInitialiser(Microsoft.AspNetCore.Identity.UserManager<AppUser> users)
{
    public async Task RegisterUserAsync()
    {
        await users.CreateAsync(new AppUser { UserName = "administrator" }, "Administrator1!");
    }
}

public class IdentityService(Microsoft.AspNetCore.Identity.UserManager<AppUser> users)
{
    public Task<Microsoft.AspNetCore.Identity.IdentityResult> CreateUserAsync(string userName, string password) =>
        users.CreateAsync(new AppUser { UserName = userName }, password);
}

[Microsoft.AspNetCore.Mvc.Area("Admin")]
public class UsersController(Microsoft.AspNetCore.Identity.UserManager<AppUser> users) : Microsoft.AspNetCore.Mvc.Controller
{
    public async Task<Microsoft.AspNetCore.Mvc.IActionResult> Register(string email)
    {
        await users.CreateAsync(new AppUser { Email = email });
        return RedirectToAction("Index");
    }
}

public class LegacyAccounts
{
    private readonly UserManager _users = new();

    public Task Register(string email) => _users.CreateAsync(email);
}

public static class Startup
{
    public static void Configure(IServiceCollection services, SwaggerBuilder swagger)
    {
        services.AddIdentityCore<AppUser>();
        swagger.AddDefaultUI();
    }
}
