// lexcode-expect: 0
// Calling models somebody else trained, which is not training: OpenAI chat completions, a SageMaker
// endpoint invoked for a prediction, Bedrock's model list, and a Vertex AI prediction. Beside them,
// a staffing app's own FineTuningClient and CreateTrainingJobRequest in another namespace book
// people onto courses.
using Amazon.Bedrock;
using Amazon.Bedrock.Model;
using Amazon.SageMakerRuntime;
using Amazon.SageMakerRuntime.Model;
using Google.Cloud.AIPlatform.V1;
using OpenAI;
using OpenAI.Chat;
using Staff = Contoso.Staffing.Courses;

namespace Contoso.Assist;

public sealed class Advisor(OpenAIClient openAI, IAmazonSageMakerRuntime runtime, IAmazonBedrock bedrock, PredictionServiceClient vertex)
{
    public async Task<string> AskAsync(string question, MemoryStream features)
    {
        ChatClient chat = openAI.GetChatClient("gpt-4o-mini");
        var answer = await chat.CompleteChatAsync(question);

        await runtime.InvokeEndpointAsync(new InvokeEndpointRequest { EndpointName = "churn", Body = features });
        await bedrock.ListFoundationModelsAsync(new ListFoundationModelsRequest());
        await vertex.PredictAsync(new PredictRequest { Endpoint = "projects/p/locations/l/endpoints/e" });
        return answer.Value.Content[0].Text;
    }

    public async Task BookAsync(Staff.FineTuningClient courses)
    {
        await courses.FineTuneAsync("forklift", "warehouse-2");
        var request = new Staff.CreateTrainingJobRequest { TrainingJobName = "forklift-refresher" };
        await courses.CreateFineTuningJobAsync(request);
    }
}
