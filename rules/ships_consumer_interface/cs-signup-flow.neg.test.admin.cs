// lexcode-expect: 0
// Not a public sign-up flow: a staff console creating accounts, in a file-scoped admin namespace
// with nothing else marking it as staff-only.
using System;
using Microsoft.AspNetCore.Identity;

namespace Demo.Web.Admin;

public class AccountsService(UserManager<AppUser> users)
{
    public Task<IdentityResult> Register(string email) => users.CreateAsync(new AppUser { Email = email });
}
