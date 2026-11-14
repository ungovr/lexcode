// lexcode-expect: 0
// Sign-in that does not ask for a fingerprint or face: Windows Hello's user-consent check (which accepts a
// PIN, and is identity, not biometric processing), iOS device-owner authentication that accepts the
// passcode, and an availability check that authenticates no one. Look-alikes: the app's own
// BiometricPrompt and LAContext in another namespace.
using Contoso.Security;
using Plugin.Fingerprint;
using Windows.Security.Credentials.UI;
using La = LocalAuthentication;

namespace Contoso.SignIn;

public sealed class UnlockService
{
    public async Task<bool> WindowsAsync()
    {
        var result = await UserConsentVerifier.RequestVerificationAsync("Confirm it's you");
        return result == UserConsentVerificationResult.Verified;
    }

    public void Ios(La.LAContext context)
    {
        context.EvaluatePolicy(La.LAPolicy.DeviceOwnerAuthentication, "Unlock your notes", (ok, error) => { });
    }

    public async Task<bool> AvailableAsync() => await CrossFingerprint.Current.IsAvailableAsync();

    public void Local()
    {
        var prompt = new BiometricPrompt("Unlock");
        var context = new LAContext();
        context.EvaluatePolicy(PolicyKind.DeviceOwnerAuthenticationWithBiometrics, "Unlock");
    }
}
