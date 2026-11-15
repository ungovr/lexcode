// lexcode-expect: 0
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;

namespace MyShop.Security;

// Access-control data is authentication, not confidentiality (15 C.F.R. 772.1): a protector whose
// purpose names a token, a cookie, a session, a two-factor secret, an API key or a password reset,
// and the framework's cookie and bearer-token sign-in setup, which encrypts its own tickets.
public class SignInProtection(IDataProtectionProvider provider)
{
    public IDataProtector Tokens() => provider.CreateProtector("MyShop.Tokens.v1");

    public IDataProtector Cookie() => provider.CreateProtector("Auth.Cookie", "v2");

    public IDataProtector TwoFactor() => provider.CreateProtector("MyShop.TwoFactor.Secrets");

    public IDataProtector Session(string id) => provider.CreateProtector($"Session.{id}");

    public IDataProtector Keys() => provider.CreateProtector("MyShop.ApiKeys");

    public IDataProtector Reset() => provider.CreateProtector("PasswordReset");

    public IDataProtector Otp() => provider.CreateProtector("OTP.Seeds");

    public static void Configure(IServiceCollection services)
    {
        services.AddAuthentication().AddCookie(CookieAuthenticationDefaults.AuthenticationScheme);
        services.AddAuthentication().AddIdentityCookies();
        services.AddAuthentication().AddBearerToken();
    }
}
