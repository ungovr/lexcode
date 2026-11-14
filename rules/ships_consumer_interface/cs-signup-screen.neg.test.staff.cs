// lexcode-expect: 0
// Not a public sign-up screen: a back-office desktop app's sign-up window and its MVC companion,
// declared in a block-scoped staff namespace with nothing else marking them as staff-only.
using System;
using System.Windows;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Desk.Staff
{
    public partial class SignUpWindow : Window
    {
    }

    public class AccountController : Controller
    {
        public IActionResult SignUp() => View();
    }
}
