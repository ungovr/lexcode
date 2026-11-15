// lexcode-expect: 7
// More Dialogflow sessions clients: the V2 builder constructed plainly and with an initializer, and Dialogflow CX
// created, built (constructed with an initializer and target-typed) and injected.
using Google.Cloud.Dialogflow.V2;
using Cx = Google.Cloud.Dialogflow.Cx.V3;

namespace App.Support;

public class Sessions(Cx.SessionsClient cx)
{
    public SessionsClient V2Plain() => new SessionsClientBuilder().Build();

    public SessionsClient V2Initializer() => new SessionsClientBuilder { Endpoint = "europe-west1-dialogflow.googleapis.com" }.Build();

    public Cx.SessionsClient CxCreate() => Cx.SessionsClient.Create();

    public Cx.SessionsClient CxBuilt() => new Cx.SessionsClientBuilder { Endpoint = "europe-west1-dialogflow.googleapis.com" }.Build();

    public Cx.SessionsClient CxTargetTyped()
    {
        Cx.SessionsClientBuilder builder = new() { Endpoint = "europe-west1-dialogflow.googleapis.com" };
        return builder.Build();
    }

    public async Task<string> AskAsync(Cx.DetectIntentRequest request) =>
        (await cx.DetectIntentAsync(request)).QueryResult.Text;

    public async Task<string> AskSyncAsync(Cx.DetectIntentRequest request) =>
        await Task.FromResult(cx.DetectIntent(request).QueryResult.Text);
}
