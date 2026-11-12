// lexcode-expect: 0
// Authentication that is not a person's account, and lookalikes: an API that only accepts
// tokens from machine clients, a role (not a person) created through the Identity role manager,
// and the app's own UserManager and IdentityUser classes, which share the library's short names.
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace Demo.Auth;

public static class ApiSecurity
{
    // A machine client presenting a signed token: there is no sign-in and no user record.
    public static void Configure(WebApplicationBuilder builder)
    {
        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
        builder.Services.AddAuthorization();
        builder.Services.AddIdentity(builder.Configuration);
    }

    // The app's own extension of the same name, without the Identity user and role types.
    public static IServiceCollection AddIdentity(this IServiceCollection services, IConfiguration config)
    {
        return services;
    }
}

// A role is a named group of permissions, not a person.
public class RoleSeeder(Microsoft.AspNetCore.Identity.RoleManager<Microsoft.AspNetCore.Identity.IdentityRole> roles)
{
    public Task Seed() => roles.CreateAsync(new Microsoft.AspNetCore.Identity.IdentityRole("Admin"));
}

// The app's own classes with the library's short names: a service-account registry and a
// workload identity, neither of which is a person's account.
public class IdentityUser
{
    public string ServiceName { get; set; } = "";
}

public class WorkerIdentity : IdentityUser
{
    public string Queue { get; set; } = "";
}

public class UserManager<T>
{
    public Task CreateAsync(T item) => Task.CompletedTask;
}

public class Provisioner
{
    private readonly UserManager<WorkerIdentity> _workers;

    public Provisioner(UserManager<WorkerIdentity> workers)
    {
        _workers = workers;
    }

    public Task Add(WorkerIdentity w) => _workers.CreateAsync(w);
}
