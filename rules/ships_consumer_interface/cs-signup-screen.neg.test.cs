// lexcode-expect: 0
// Not a public sign-up screen: a point-of-sale cash register window for staff, a course
// registration page, a sign-in page, sign-up pages for staff (in an admin area, behind a staff
// policy, an admin policy given by position or a manager role, under an admin attribute, in a
// staff-named controller), an action that requires sign-in, the page that reports a sign-up's
// result, an API action with no view, a view model with no screen base, and the app's own
// PageModel in another namespace, which shares Razor Pages' short name. Staff namespaces are in
// the .admin (file-scoped) and .staff (block) negatives.
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

[AuthorizeAdmin]
public class PartnersController : Microsoft.AspNetCore.Mvc.Controller
{
    public Microsoft.AspNetCore.Mvc.IActionResult Register() => View();
}

public class StaffAccountsController : Microsoft.AspNetCore.Mvc.Controller
{
    public Microsoft.AspNetCore.Mvc.IActionResult Register() => View();
}

[Microsoft.AspNetCore.Authorization.Authorize("AdminOnly")]
public class ResellersController : Microsoft.AspNetCore.Mvc.Controller
{
    public Microsoft.AspNetCore.Mvc.IActionResult SignUp() => View();
}

[Microsoft.AspNetCore.Authorization.Authorize(Roles = "Manager")]
public class VendorsController : Microsoft.AspNetCore.Mvc.Controller
{
    public Microsoft.AspNetCore.Mvc.IActionResult Registration() => View();
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
