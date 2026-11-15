// lexcode-expect: 0
// Not a public sign-up flow: a back-office tool creating accounts, in a block-scoped staff
// namespace with nothing else marking it as staff-only.
using System;
using Microsoft.AspNetCore.Identity;

namespace Demo.Backoffice.Staff
{
    public class AccountsService(UserManager<AppUser> users)
    {
        public Task<IdentityResult> SignUp(string email) => users.CreateAsync(new AppUser { Email = email });
    }
}
