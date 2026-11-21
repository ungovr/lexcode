// lexcode-expect: 4
// A person's address in forms that are not a plain literal: an interpolated raw string, an
// interpolated string, and a plus-address built from a literal and the address; and a Gravatar
// address built in an interpolated raw string.
using Stripe;
using Stripe.Checkout;

namespace Demo.Billing;

public class Checkout(CustomerService customers, SessionService sessions)
{
    public Task<Customer> CreateAsync(User user) =>
        customers.CreateAsync(new CustomerCreateOptions { Email = $"""{user.Email}""" });

    public Task<Session> SessionAsync(User user) =>
        sessions.CreateAsync(new SessionCreateOptions { CustomerEmail = "buyer+" + user.Email });

    public Task<Customer> UpdateAsync(User user, string id) =>
        customers.UpdateAsync(id, new CustomerUpdateOptions { Email = $"{user.Email}" });

    public string Avatar(string hash) => $"""https://www.gravatar.com/avatar/{hash}""";
}
