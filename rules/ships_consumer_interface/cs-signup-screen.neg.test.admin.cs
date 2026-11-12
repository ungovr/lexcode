// lexcode-expect: 0
// Not a public sign-up screen: the sign-up screens of a staff console, declared in a file-scoped
// admin namespace with nothing else marking them as staff-only.
using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Demo.Web.Admin;

public class RegisterModel : PageModel
{
    public void OnGet() { }
}

public class CustomerController : Controller
{
    public IActionResult Register() { return View(); }
}
