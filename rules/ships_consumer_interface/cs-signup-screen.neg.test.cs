// lexcode-expect: 0
// Not a public sign-up screen: a point-of-sale cash register window for staff, a course
// registration page, a sign-in page, a sign-up page in an admin area and one behind an admin role,
// an action that requires sign-in, the page that reports a sign-up's result, an API action with no
// view, a view model with no screen base, and the app's own PageModel in another namespace, which
// shares Razor Pages' short name.
using System;
using System.Windows;
using Demo.Ui;
using Microsoft.Maui.Controls;

namespace Demo.Shop;

public partial class CashRegisterWindow : Window
{
}

public partial class CourseRegistrationPage : ContentPage
{
}

public partial class LoginPage : ContentPage
{
}

public class RegisterModel : PageModel
{
    public void OnGet() { }
}

public class RegisterViewModel
{
    public string Email { get; set; }
}

[Microsoft.AspNetCore.Mvc.Area("Admin")]
public class CustomersController : Microsoft.AspNetCore.Mvc.Controller
{
    public Microsoft.AspNetCore.Mvc.IActionResult Register() => View(new RegisterViewModel());
}

[Microsoft.AspNetCore.Authorization.Authorize(Policy = "StaffOnly")]
public class InvitationsController : Microsoft.AspNetCore.Mvc.Controller
{
    public Microsoft.AspNetCore.Mvc.IActionResult SignUp() => View();
}

public class AccountController : Microsoft.AspNetCore.Mvc.Controller
{
    [Microsoft.AspNetCore.Authorization.Authorize]
    public Microsoft.AspNetCore.Mvc.IActionResult CreateAccount() => View();

    public Microsoft.AspNetCore.Mvc.IActionResult RegisterResult(int resultId) => View(resultId);
}

public class AuthController : Microsoft.AspNetCore.Mvc.ControllerBase
{
    public Microsoft.AspNetCore.Mvc.IActionResult Register(RegisterViewModel model) => Ok();
}
