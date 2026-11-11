// lexcode-expect: 6
// Code that starts a hosted training or fine-tuning job on the caller's data: OpenAI's Java SDK, the
// community Kotlin client, Amazon SageMaker (Kotlin SDK, with a request lambda and with a request
// object), Amazon Bedrock model customization, and a Vertex AI training pipeline.
package org.example.fieldnotes.train.hosted

import aws.sdk.kotlin.services.bedrock.BedrockClient
import aws.sdk.kotlin.services.sagemaker.SageMakerClient
import aws.sdk.kotlin.services.sagemaker.model.CreateTrainingJobRequest
import com.aallam.openai.api.finetuning.FineTuningRequest
import com.aallam.openai.client.OpenAI
import com.google.cloud.aiplatform.v1.PipelineServiceClient
import com.openai.client.OpenAIClient

class HostedTraining(
    private val openai: OpenAIClient,
    private val community: OpenAI,
    private val sage: SageMakerClient,
    private val bedrock: BedrockClient,
    private val vertex: PipelineServiceClient,
) {
    fun openaiJob(params: com.openai.models.finetuning.jobs.JobCreateParams) = openai.fineTuning().jobs().create(params)

    suspend fun communityJob(request: FineTuningRequest) = community.fineTuning(request)

    suspend fun sageMaker(request: CreateTrainingJobRequest) = sage.createTrainingJob(request)

    suspend fun sageMakerLambda(name: String) = sage.createTrainingJob {
        trainingJobName = name
    }

    suspend fun customize(name: String) = bedrock.createModelCustomizationJob {
        jobName = name
    }

    fun pipeline(parent: String, pipeline: Any) = vertex.createTrainingPipeline(parent, pipeline as com.google.cloud.aiplatform.v1.TrainingPipeline)
}
