// lexcode-expect: 6
// A public sign-up flow on ASP.NET Core Identity: an account created in a sign-up action, page
// model, service or handler (the user manager injected as a field through a using, as a field
// through an alias, and as a primary-constructor parameter written short and fully qualified), and
// Identity's default UI, whose pages include Register, switched on.
using System;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.DependencyInjection;
using Users = Microsoft.AspNetCore.Identity.UserManager<AppUser>;

namespace Demo.Accounts;

public class AccountController : Controller
{
    private readonly UserManager<AppUser> _userManager;

    public AccountController(UserManager<AppUser> userManager) => _userManager = userManager;

    [HttpPost]
    public async Task<IActionResult> Register(RegisterViewModel model)
    {
        var result = await _userManager.CreateAsync(new AppUser { Email = model.Email }, model.Password);
        return result.Succeeded ? RedirectToAction("Index", "Home") : View(model);
    }
}

public class RegisterModel : PageModel
{
    private readonly Users _users;

    public RegisterModel(Users users) => _users = users;

    public async Task<IActionResult> OnPostAsync(string email, string password)
    {
        await _users.CreateAsync(new AppUser { Email = email }, password);
        return LocalRedirect("/");
    }
}

public class SignupService(UserManager<AppUser> users)
{
    public Task<IdentityResult> SignUpAsync(string email, string password) =>
        users.CreateAsync(new AppUser { Email = email }, password);
}

public class AccountHandler(Microsoft.AspNetCore.Identity.UserManager<AppUser> users)
{
    public Task<IdentityResult> CreateAccount(string email) => users.CreateAsync(new AppUser { Email = email });
}

public static class Startup
{
    public static void Configure(IServiceCollection services)
    {
        services.AddDefaultIdentity<AppUser>(options => options.SignIn.RequireConfirmedAccount = true);
        services.AddIdentity<AppUser, IdentityRole>().AddEntityFrameworkStores<AppDbContext>().AddDefaultUI();
    }
}
