// lexcode-expect: 6
// Chat messages mapped to a table by Entity Framework Core: a Table attribute under the import and under an alias,
// DbSet properties in a DbContext and in an Identity context, an entity configured in OnModelCreating, and an entity
// type configuration.
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System.ComponentModel.DataAnnotations.Schema;
using Schema = System.ComponentModel.DataAnnotations.Schema;

namespace App.Data;

[Table("chat_messages")]
public class ChatMessage
{
    public long Id { get; set; }
    public string Body { get; set; } = "";
}

[Schema.Table("conversation_turns")]
public class ConversationTurn
{
    public long Id { get; set; }
}

public class ChatDbContext(DbContextOptions<ChatDbContext> options) : DbContext(options)
{
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ChatTranscript>(b => b.HasKey(t => t.Id));
    }
}

public class AppDbContext : IdentityDbContext<AppUser>
{
    public DbSet<Data.ConversationTurn> Turns { get; set; } = null!;
}

public class ChatLogConfiguration : IEntityTypeConfiguration<ChatLog>
{
    public void Configure(EntityTypeBuilder<ChatLog> builder) => builder.ToTable("chat_logs");
}
