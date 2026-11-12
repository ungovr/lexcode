// lexcode-expect: 3
// The same calls with wildcard imports, and the Java v2 SageMaker client used from Kotlin.
package org.example.fieldnotes.train.hosted.wild

import aws.sdk.kotlin.services.sagemaker.*
import com.aallam.openai.api.finetuning.*
import software.amazon.awssdk.services.bedrock.BedrockClient

class WildTraining(
    private val sage: SageMakerClient,
    private val bedrock: BedrockClient,
    private val community: com.aallam.openai.client.OpenAI,
) {
    suspend fun sageMaker(name: String) = sage.createTrainingJob {
        trainingJobName = name
    }

    fun customize(request: software.amazon.awssdk.services.bedrock.model.CreateModelCustomizationJobRequest) =
        bedrock.createModelCustomizationJob(request)

    suspend fun communityJob(request: FineTuningRequest) = community.fineTuning(request)
}
