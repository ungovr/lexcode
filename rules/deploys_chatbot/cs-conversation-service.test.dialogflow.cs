// lexcode-expect: 5
// What a person typed sent to Dialogflow: a sessions client created, created asynchronously, built (also
// target-typed), and injected, and Dialogflow CX under an alias.
using Google.Cloud.Dialogflow.V2;
using Cx = Google.Cloud.Dialogflow.Cx.V3;

namespace App.Support;

public class DialogflowChat(SessionsClient injected)
{
    public async Task<string> AskAsync(string session, string text)
    {
        var client = SessionsClient.Create();
        var response = await client.DetectIntentAsync(new DetectIntentRequest { Session = session, QueryInput = new QueryInput { Text = new TextInput { Text = text, LanguageCode = "en" } } });
        return response.QueryResult.FulfillmentText;
    }

    public async Task CreatedAsync() => await SessionsClient.CreateAsync();

    public void Built()
    {
        SessionsClientBuilder builder = new() { Endpoint = "europe-west1-dialogflow.googleapis.com" };
        builder.Build();
    }

    public async Task InjectedAsync(DetectIntentRequest request) => await injected.DetectIntentAsync(request);

    public async Task CxAsync() => await Cx.SessionsClient.CreateAsync();
}
