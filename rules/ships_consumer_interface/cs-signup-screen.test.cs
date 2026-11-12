// lexcode-expect: 23
// A public sign-up screen: a Razor page model, a Blazor component class, an MVC sign-up
// controller, a .NET MAUI page, a WPF window, page and user control, a WinForms form and user
// control, and a WinUI page, each through a using or written fully qualified and again through an
// alias; and MVC sign-up actions that return their view to the browser, one match per action.
using System;
using System.Windows;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Maui.Controls;
using Comp = Microsoft.AspNetCore.Components;
using Maui = Microsoft.Maui.Controls;
using Mvc = Microsoft.AspNetCore.Mvc;
using Pages = Microsoft.AspNetCore.Mvc.RazorPages;
using WinForms = System.Windows.Forms;
using WinUi = Microsoft.UI.Xaml.Controls;
using Wpf = System.Windows;
using WpfControls = System.Windows.Controls;

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

public class NewRegisterComponent : Comp.ComponentBase
{
}

public class SignupController : Controller
{
    public IActionResult Index() => View();
}

public class RegistrationController : Mvc.Controller
{
    public IActionResult Index() => View();
}

public partial class SignUpPage : ContentPage
{
}

public partial class AccountSignUpPage : Maui.ContentPage
{
}

public partial class RegistrationWindow : Window
{
}

public partial class UserRegisterWindow : Wpf.Window
{
}

public partial class RegistrationPage : System.Windows.Controls.Page
{
}

public partial class MemberRegistrationPage : WpfControls.Page
{
}

public partial class SignUpControl : System.Windows.Controls.UserControl
{
}

public partial class UserSignupControl : WpfControls.UserControl
{
}

public partial class CreateAccountForm : System.Windows.Forms.Form
{
}

public partial class AccountRegisterForm : WinForms.Form
{
}

public partial class SignupControl : System.Windows.Forms.UserControl
{
}

public partial class CustomerSignUpControl : WinForms.UserControl
{
}

public sealed partial class CreateAccountPage : Microsoft.UI.Xaml.Controls.Page
{
}

public sealed partial class SelfRegistrationPage : WinUi.Page
{
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
        if (string.IsNullOrEmpty(model.Email))
        {
            return View(model);
        }
        return await Task.FromResult(RedirectToAction("RegisterResult"));
    }
}

[Microsoft.AspNetCore.Authorization.Authorize]
public class AccountController : Controller
{
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public IActionResult SignUp() => View();
}
