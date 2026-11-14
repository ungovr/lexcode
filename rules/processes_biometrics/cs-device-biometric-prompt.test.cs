// lexcode-expect: 8
// Asking the phone to confirm the user with a fingerprint or face: Plugin.Fingerprint through its default
// instance and injected, AndroidX's BiometricPrompt (imported and target-typed), the Android platform
// prompt's builder (aliased, and target-typed), and iOS LocalAuthentication with a biometrics-only policy,
// with a callback and awaited.
using AndroidX.Biometric;
using LocalAuthentication;
using Plugin.Fingerprint;
using Plugin.Fingerprint.Abstractions;
using Platform = Android.Hardware.Biometrics;

namespace Contoso.Wallet;

public sealed class UnlockService(IFingerprint fingerprint)
{
    public async Task<bool> PluginAsync()
    {
        var request = new AuthenticationRequestConfiguration("Unlock", "Confirm it's you to open your wallet");
        var result = await CrossFingerprint.Current.AuthenticateAsync(request);
        var again = await fingerprint.AuthenticateAsync(request);
        return result.Authenticated && again.Authenticated;
    }

    public void Android(AndroidX.Fragment.App.FragmentActivity activity, Java.Util.Concurrent.IExecutor executor, BiometricPrompt.AuthenticationCallback callback, Android.Content.Context context)
    {
        var prompt = new BiometricPrompt(activity, executor, callback);
        BiometricPrompt typed = new(activity, callback);
        var platform = new Platform.BiometricPrompt.Builder(context).SetTitle("Unlock").Build();
        Platform.BiometricPrompt.Builder builder = new(context);
    }

    public void Ios()
    {
        var context = new LAContext();
        context.EvaluatePolicy(LAPolicy.DeviceOwnerAuthenticationWithBiometrics, "Unlock your wallet", (ok, error) => { });
    }

    public async Task<bool> IosAsync()
    {
        using var context = new LAContext();
        var (ok, error) = await context.EvaluatePolicyAsync(LAPolicy.DeviceOwnerAuthenticationWithBiometrics, "Unlock your wallet");
        return ok;
    }
}
