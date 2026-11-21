// lexcode-expect: 6
// Telemetry initializers and processors that set a user or device id, each listed after other bases
// in a form the main fixture does not hold: an initializer after a plain base class, and after a
// primary-constructor base and an interface; a processor after a primary-constructor base, after a
// base class and an interface, and after a primary-constructor base and an interface; and a processor
// listed alone. The item is reached through a helper the engine has no type for, so only the
// class's base list admits it.
using Microsoft.ApplicationInsights.Channel;
using Microsoft.ApplicationInsights.DataContracts;
using Microsoft.ApplicationInsights.Extensibility;

namespace Demo.Telemetry;

public class PlainBaseInitializer : InitializerBase, ITelemetryInitializer
{
    public void Initialize(ITelemetry telemetry) => Unwrap(telemetry).Context.User.Id = "visitor";
}

public class CtorBaseInitializer(Settings settings) : InitializerBase(settings), IDisposable, ITelemetryInitializer
{
    public void Initialize(ITelemetry telemetry) => Unwrap(telemetry).Context.Device.Id = "device";

    public void Dispose() { }
}

public class CtorBaseProcessor(ITelemetryProcessor next) : ProcessorBase(next), ITelemetryProcessor
{
    public void Process(ITelemetry item) { Unwrap(item).Context.User.AuthenticatedUserId = "signed-in"; next.Process(item); }
}

public class PlainBaseTwoProcessor : ProcessorBase, IDisposable, ITelemetryProcessor
{
    public void Process(ITelemetry item) => Unwrap(item).Context.User.Id = "visitor";

    public void Dispose() { }
}

public class CtorBaseTwoProcessor(ITelemetryProcessor next) : ProcessorBase(next), IDisposable, ITelemetryProcessor
{
    public void Process(ITelemetry item) => Unwrap(item).Context.User.AccountId = "account";

    public void Dispose() { }
}

public class AloneProcessor(ITelemetryProcessor next) : ITelemetryProcessor
{
    public void Process(ITelemetry item) { Unwrap(item).Context.Device.Id = "device"; next.Process(item); }
}
