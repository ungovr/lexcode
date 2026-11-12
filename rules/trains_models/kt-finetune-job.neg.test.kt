// lexcode-expect: 0
// Hosted AI services used without training anything: a chat completion, reading the list and status of
// existing fine-tuning jobs, describing and listing SageMaker training jobs, and invoking a model
// that was fine-tuned elsewhere.
package demo.assistant

import aws.sdk.kotlin.services.sagemaker.SageMakerClient
import aws.sdk.kotlin.services.sagemaker.model.DescribeTrainingJobRequest
import aws.sdk.kotlin.services.sagemaker.model.ListTrainingJobsRequest
import com.openai.client.OpenAIClient

class Assistant(private val openai: OpenAIClient, private val sage: SageMakerClient) {
    fun ask(params: Any) = openai.chat().completions().create(params as com.openai.models.chat.completions.ChatCompletionCreateParams)

    fun jobs() = openai.fineTuning().jobs().list()

    fun job(id: String) = openai.fineTuning().jobs().retrieve(id)

    suspend fun status(name: String) = sage.describeTrainingJob(DescribeTrainingJobRequest { trainingJobName = name })

    suspend fun all() = sage.listTrainingJobs(ListTrainingJobsRequest { maxResults = 10 })
}
