// lexcode-expect: 0
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;

namespace MyShop.Security;

// Access-control data is authentication, not confidentiality (15 C.F.R. 772.1): a protector whose
// purpose, sub-purpose or application name holds a token, cookie, session, two-factor, API key,
// password, credential, confirmation or ticket word, in any of its forms, and the framework's cookie
// and bearer-token sign-in setup, which encrypts its own tickets. A session word counts inside a
// compound (TherapySessions): the purpose cannot say which kind of session it is.
public class SignInProtection(IDataProtectionProvider provider)
{
    public IDataProtector Tokens() => provider.CreateProtector("MyShop.Tokens.v1");

    public IDataProtector SecondPurpose() => provider.CreateProtector("MyShop.v1", "Tokens");

    public IDataProtector Pin() => provider.CreateProtector("MyShop.Notes", "Pin");

    public IDataProtector Cookie() => provider.CreateProtector("auth.cookie", "v2");

    public IDataProtector TwoFactor() => provider.CreateProtector("MyShop.TwoFactorTokens");

    public IDataProtector Session(string id) => provider.CreateProtector($"Session.{id}");

    public IDataProtector Interpolated() => provider.CreateProtector(@$"MyShop.{1}.Tokens");

    public IDataProtector Keys() => provider.CreateProtector("MyShop.APIKeys");

    public IDataProtector Reset() => provider.CreateProtector("PasswordReset");

    public IDataProtector Otp() => provider.CreateProtector("MyShop.OTP.Seeds");

    public IDataProtector Credentials() => provider.CreateProtector("MyShop.Credentials");

    public IDataProtector Confirmation() => provider.CreateProtector("MyShop.EmailConfirmation");

    public IDataProtector Passphrase() => provider.CreateProtector("MyShop.Passphrase");

    public IDataProtector Ticket() => provider.CreateProtector("MyShop.LoginTicket");

    public IDataProtector Therapy() => provider.CreateProtector("MyShop.TherapySessions");

    public static IDataProtectionProvider Standalone() => DataProtectionProvider.Create("MyShop.Auth");

    public static void Configure(IServiceCollection services)
    {
        services.AddAuthentication().AddCookie(CookieAuthenticationDefaults.AuthenticationScheme);
        services.AddAuthentication().AddIdentityCookies();
        services.AddAuthentication().AddBearerToken();
    }
}
