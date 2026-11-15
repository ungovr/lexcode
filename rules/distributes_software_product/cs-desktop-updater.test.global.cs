// lexcode-expect: 2
// A desktop app's entry point with no `using` lines: Velopack and Squirrel come from a `global using`
// in another file (GlobalUsings.cs), so only the product-named short forms see them.
namespace Contoso.Ledger;

public static class Program
{
    [STAThread]
    public static void Main(string[] args)
    {
        VelopackApp.Build().Run();
        SquirrelAwareApp.HandleEvents(onFirstRun: () => Console.WriteLine("installed"));
    }
}
