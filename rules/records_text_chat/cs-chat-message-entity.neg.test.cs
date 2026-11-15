// lexcode-expect: 0
// A ChatMessage transfer object with no mapping stores nothing. A contact message and a chat room are mapped, but hold
// no chat text. The app's own DbContext (a cache in its own namespace) and its own Table attribute (for a report
// layout) are not Entity Framework Core's.
using App.Caching;
using App.Reporting;

namespace App.Data;

public record ChatMessage(string Author, string Text);

[System.ComponentModel.DataAnnotations.Schema.Table("contact_messages")]
public class ContactMessage
{
    public int Id { get; set; }
    public string Body { get; set; } = "";
}

public class SessionCache : DbContext
{
    public DbSet<ChatMessage> Recent { get; set; } = default!;
}

[Table("Weekly chat volume")]
public class ChatTranscript
{
    public int Rows { get; set; }
}

public class RoomsContext : Microsoft.EntityFrameworkCore.DbContext
{
    public Microsoft.EntityFrameworkCore.DbSet<ChatRoom> ChatRooms { get; set; } = default!;

    protected override void OnModelCreating(Microsoft.EntityFrameworkCore.ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ChatRoom>().HasIndex(r => r.Name);
    }
}
