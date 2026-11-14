// lexcode-expect: 12
// Starting hosted training on the app's own data: OpenAI fine-tuning jobs created on an injected
// FineTuningClient, on one declared with its type, and chained on OpenAI's and Azure OpenAI's
// GetFineTuningClient(); Amazon SageMaker training jobs (imported, aliased and target-typed); Amazon
// Bedrock model customization jobs (an initializer and target-typed); and Vertex AI training
// pipelines, on an injected client (one match for the call, not two) and on a client from the
// factory, where the pipeline object (target-typed, or built inside the call) is the match.
using Amazon.Bedrock;
using Amazon.Bedrock.Model;
using Amazon.SageMaker;
using Amazon.SageMaker.Model;
using Azure.AI.OpenAI;
using Google.Cloud.AIPlatform.V1;
using OpenAI;
using OpenAI.FineTuning;
using Sm = Amazon.SageMaker.Model;

namespace Contoso.Support;

public sealed class ModelTraining(FineTuningClient fineTuning, IAmazonSageMaker sageMaker, IAmazonBedrock bedrock, PipelineServiceClient pipelines)
{
    public async Task TuneAsync(OpenAIClient openAI, AzureOpenAIClient azure, string trainingFileId, System.ClientModel.BinaryContent job)
    {
        await fineTuning.FineTuneAsync("gpt-4o-mini-2024-07-18", trainingFileId, waitUntilCompleted: false);

        FineTuningClient client = openAI.GetFineTuningClient();
        await client.FineTuneAsync("gpt-4o-mini-2024-07-18", trainingFileId, waitUntilCompleted: false);

        await openAI.GetFineTuningClient().CreateFineTuningJobAsync(job, waitUntilCompleted: false);
        azure.GetFineTuningClient().FineTune("gpt-4o-mini", trainingFileId, waitUntilCompleted: false);
    }

    public async Task TrainOnSageMakerAsync()
    {
        await sageMaker.CreateTrainingJobAsync(new CreateTrainingJobRequest { TrainingJobName = "tickets-2026-11" });
        await sageMaker.CreateTrainingJobAsync(new Sm.CreateTrainingJobRequest { TrainingJobName = "tickets-retry" });
        CreateTrainingJobRequest nightly = new() { TrainingJobName = "tickets-nightly" };
        await sageMaker.CreateTrainingJobAsync(nightly);
    }

    public async Task CustomizeAsync()
    {
        await bedrock.CreateModelCustomizationJobAsync(new CreateModelCustomizationJobRequest { JobName = "support-tone", CustomizationType = "FINE_TUNING" });
        CreateModelCustomizationJobRequest weekly = new() { JobName = "support-tone-weekly", CustomizationType = "CONTINUED_PRE_TRAINING" };
        await bedrock.CreateModelCustomizationJobAsync(weekly);
    }

    public async Task TrainOnVertexAsync(string parent)
    {
        await pipelines.CreateTrainingPipelineAsync(parent, new TrainingPipeline { DisplayName = "tickets" });

        var factoryClient = await PipelineServiceClient.CreateAsync();
        TrainingPipeline nightly = new() { DisplayName = "tickets-nightly" };
        await factoryClient.CreateTrainingPipelineAsync(parent, nightly);
        await factoryClient.CreateTrainingPipelineAsync(parent, new TrainingPipeline { DisplayName = "tickets-weekly" });
    }
}
