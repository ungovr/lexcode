// lexcode-expect: 5
// The visitor's IP address written into a log line, a logging scope, or a database row: the
// connection's remote address and a forwarded-for header, read in a controller and in a
// minimal-API handler.
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SLog = Serilog.Log;

namespace Demo.Web;

public class LoginController(ILogger<LoginController> logger, AuditDb db) : Controller
{
    [HttpPost]
    public async Task<IActionResult> Login(string user)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        logger.LogInformation("Sign-in for {User} from {Ip}", user, ip);
        using var scope = logger.BeginScope(new Dictionary<string, object?> { ["ClientIp"] = ip });
        db.Logins.Add(new LoginEvent { UserName = user, IpAddress = ip });
        await db.SaveChangesAsync();
        return Ok();
    }
}

public static class Endpoints
{
    public static void Map(WebApplication app)
    {
        app.MapPost("/visit", async (HttpContext ctx, AuditDb db) =>
        {
            var forwarded = ctx.Request.Headers["X-Forwarded-For"].ToString();
            SLog.Information("Visit from {Forwarded}", forwarded);
            var visit = new LoginEvent();
            visit.ClientIp = forwarded;
            db.Logins.Add(visit);
            await db.SaveChangesAsync();
        });
    }
}

public class AuditDb(DbContextOptions<AuditDb> options) : DbContext(options)
{
    public DbSet<LoginEvent> Logins => Set<LoginEvent>();
}

public class LoginEvent
{
    public int Id { get; set; }
    public string? UserName { get; set; }
    public string? IpAddress { get; set; }
    public string? ClientIp { get; set; }
}
