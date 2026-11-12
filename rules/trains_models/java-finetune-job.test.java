// lexcode-expect: 5
// Starting a hosted training or fine-tuning job on data the app collected: OpenAI fine-tuning,
// the older community OpenAI client, SageMaker training, Bedrock model customization and a
// Vertex AI training pipeline.
package demo.tuner;

import com.google.cloud.aiplatform.v1.CreateTrainingPipelineRequest;
import com.google.cloud.aiplatform.v1.PipelineServiceClient;
import com.openai.client.OpenAIClient;
import com.openai.models.finetuning.jobs.FineTuningJob;
import com.openai.models.finetuning.jobs.JobCreateParams;
import com.theokanning.openai.finetune.FineTuneRequest;
import com.theokanning.openai.service.OpenAiService;
import software.amazon.awssdk.services.bedrock.BedrockClient;
import software.amazon.awssdk.services.bedrock.model.CreateModelCustomizationJobRequest;
import software.amazon.awssdk.services.sagemaker.SageMakerClient;
import software.amazon.awssdk.services.sagemaker.model.CreateTrainingJobRequest;

public class Tuner {
  private final OpenAIClient openai;
  private final OpenAiService legacy;
  private final SageMakerClient sagemaker;
  private final BedrockClient bedrock;
  private final PipelineServiceClient vertex;

  public Tuner(OpenAIClient openai, OpenAiService legacy, SageMakerClient sagemaker, BedrockClient bedrock, PipelineServiceClient vertex) {
    this.openai = openai;
    this.legacy = legacy;
    this.sagemaker = sagemaker;
    this.bedrock = bedrock;
    this.vertex = vertex;
  }

  public String fineTune(String trainingFileId) {
    JobCreateParams params = JobCreateParams.builder().model("gpt-4o-mini-2024-07-18").trainingFile(trainingFileId).build();
    FineTuningJob job = openai.fineTuning().jobs().create(params);
    return job.id();
  }

  public String fineTuneOld(FineTuneRequest request) {
    return legacy.createFineTuningJob(request).getId();
  }

  public void train(CreateTrainingJobRequest request) {
    sagemaker.createTrainingJob(request);
  }

  public void customize(CreateModelCustomizationJobRequest request) {
    bedrock.createModelCustomizationJob(request);
  }

  public void pipeline(CreateTrainingPipelineRequest request) {
    vertex.createTrainingPipeline(request);
  }
}
