// lexcode-expect: 11
// User accounts and sign-in with ASP.NET Core Identity: a user class and its database context,
// accounts created and signed in through the injected user and sign-in managers, and the
// Identity registration and endpoints.
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using AspId = Microsoft.AspNetCore.Identity;
using MemberSignIn = Microsoft.AspNetCore.Identity.SignInManager<Demo.Accounts.Member>;

namespace Demo.Accounts;

public class Member : IdentityUser<Guid>
{
    public string? DisplayName { get; set; }
}

public class Staff : AspId.IdentityUser
{
}

public class AccountsDb : IdentityDbContext<Member>
{
    public AccountsDb(DbContextOptions<AccountsDb> options) : base(options) { }
}

public class Registration(UserManager<Member> users)
{
    public Task<IdentityResult> Register(Member member, string password) => users.CreateAsync(member, password);
}

public class SignIn
{
    private readonly MemberSignIn _signIn;

    public SignIn(MemberSignIn signIn)
    {
        _signIn = signIn;
    }

    public Task<SignInResult> Login(string name, string password) => _signIn.PasswordSignInAsync(name, password, false, true);

    public Task<SignInResult> External(string provider, string key) => _signIn.ExternalLoginSignInAsync(provider, key, false);
}

public static class Setup
{
    public static void Configure(WebApplicationBuilder builder)
    {
        builder.Services.AddIdentity<Member, IdentityRole>().AddEntityFrameworkStores<AccountsDb>();
        builder.Services.AddDefaultIdentity<Member>();
        builder.Services.AddIdentityCore<Member>();
        builder.Services.AddIdentityApiEndpoints<Member>();
    }

    public static void Map(WebApplication app)
    {
        app.MapGroup("/account").MapIdentityApi<Member>();
    }
}
