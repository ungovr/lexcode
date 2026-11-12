// lexcode-expect: 14
// A public sign-up screen: a Razor page model (through a using and through an alias), a Blazor
// component class, a .NET MAUI page, a WPF window, page and user control, a WinForms form and user
// control, a WinUI page, an MVC sign-up controller, and MVC sign-up actions that return their view
// to the browser.
using System;
using System.Windows;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Maui.Controls;
using Pages = Microsoft.AspNetCore.Mvc.RazorPages;
using WinForms = System.Windows.Forms;

namespace Demo.Accounts;

public class RegisterModel : PageModel
{
    public void OnGet() { }
}

public class SignUpModel : Pages.PageModel
{
    public IActionResult OnPost() => Page();
}

public class Register : ComponentBase
{
}

public partial class SignUpPage : ContentPage
{
}

public partial class RegistrationWindow : Window
{
}

public partial class CreateAccountForm : WinForms.Form
{
}

public partial class RegistrationPage : System.Windows.Controls.Page
{
}

public partial class SignUpControl : System.Windows.Controls.UserControl
{
}

public partial class SignupControl : System.Windows.Forms.UserControl
{
}

public sealed partial class CreateAccountPage : Microsoft.UI.Xaml.Controls.Page
{
}

public class SignupController : Controller
{
    public IActionResult Index() => View();
}

public class CustomerController : Controller
{
    public virtual async Task<IActionResult> Register(string returnUrl)
    {
        var model = await Task.FromResult(new RegisterViewModel());
        return View(model);
    }

    [HttpPost]
    public virtual async Task<IActionResult> Register(RegisterViewModel model, string returnUrl)
    {
        if (!ModelState.IsValid)
            return View(model);
        return await Task.FromResult(RedirectToAction("RegisterResult"));
    }
}

[Microsoft.AspNetCore.Authorization.Authorize]
public class AccountController : Controller
{
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public IActionResult SignUp() => View();
}
