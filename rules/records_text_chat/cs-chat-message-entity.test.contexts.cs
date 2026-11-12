// lexcode-expect: 2
// Chat messages in a DbContext with a classic constructor, and in an Identity context whose primary constructor passes
// its options to the base.
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace App.Data;

public class SupportDbContext : DbContext
{
    public SupportDbContext(DbContextOptions<SupportDbContext> options) : base(options)
    {
    }

    public DbSet<ChatMessage> ChatMessages { get; set; } = null!;
}

public class PortalDbContext(DbContextOptions<PortalDbContext> options) : IdentityDbContext<AppUser>(options)
{
    public DbSet<ConversationTurn> ConversationTurns => Set<ConversationTurn>();
}
