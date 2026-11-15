// lexcode-expect: 0
// What is not a message between accounts: an email with a sender and a recipient, a contact-form
// message to staff, a plain class named Message with sender and recipient fields (a mail
// transport's envelope), a chatbot's chat message with a role and no recipient, a notice with only
// a recipient, a SignalR push of an order status to one user, and the app's own Hub class in
// another namespace, which shares SignalR's short name.
using System;
using System.Collections.Generic;
using Demo.Realtime;

namespace Demo.Mail;

public class EmailMessage
{
    public string Sender { get; set; }
    public string Recipient { get; set; }
    public string Subject { get; set; }
}

public class ContactMessage
{
    public string FromUserId { get; set; }
    public string ToUserId { get; set; }
    public string Body { get; set; }
}

public class Message
{
    public string Sender;
    public string Recipient;
}

public record ChatMessage(string Role, string Text);

public class SystemNoticeMessage
{
    public string RecipientId { get; set; }
    public string Text { get; set; }
}

public class OrderStatusHub : Microsoft.AspNetCore.SignalR.Hub
{
    public Task Notify(string userId) => Clients.User(userId).SendAsync("OrderStatusChanged", "shipped");
}

public class SupportRelay : Hub
{
    public Task Relay(string userId, string text) => Clients.User(userId).SendAsync("ReceiveMessage", text);
}
