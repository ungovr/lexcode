// lexcode-expect: 9
// Starting hosted training on the app's own data: an OpenAI fine-tuning job from a client taken from
// OpenAIClient and from Azure OpenAI and on an injected FineTuningClient, an Amazon SageMaker training
// job (imported, aliased and target-typed), an Amazon Bedrock model customization job, and a Vertex AI
// training pipeline.
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
    public async Task TuneAsync(OpenAIClient openAI, AzureOpenAIClient azure, string trainingFileId)
    {
        var client = openAI.GetFineTuningClient();
        var azureClient = azure.GetFineTuningClient();
        await fineTuning.FineTuneAsync("gpt-4o-mini-2024-07-18", trainingFileId, waitUntilCompleted: false);
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
    }

    public async Task TrainOnVertexAsync(string parent)
    {
        await pipelines.CreateTrainingPipelineAsync(parent, new TrainingPipeline { DisplayName = "tickets" });
    }
}
