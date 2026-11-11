// lexcode-expect: 0
// Calling somebody else's model, and listing or reading the training jobs that already exist,
// is not training. The look-alikes are an app's own Job service and a SageMaker endpoint call.
package demo.assistant;

import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.models.chat.completions.ChatCompletion;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import software.amazon.awssdk.services.sagemaker.SageMakerClient;
import software.amazon.awssdk.services.sagemaker.model.DescribeTrainingJobRequest;
import software.amazon.awssdk.services.sagemaker.model.ListTrainingJobsRequest;
import software.amazon.awssdk.services.sagemakerruntime.SageMakerRuntimeClient;

public class Assistant {
  private final OpenAIClient client = OpenAIOkHttpClient.fromEnv();
  private final SageMakerClient sagemaker = SageMakerClient.create();
  private final SageMakerRuntimeClient runtime = SageMakerRuntimeClient.create();

  public String ask(String question) {
    ChatCompletionCreateParams params =
        ChatCompletionCreateParams.builder().model("gpt-4o-mini").addUserMessage(question).build();
    ChatCompletion reply = client.chat().completions().create(params);
    return reply.choices().get(0).message().content().orElse("");
  }

  public int existingFineTunes() {
    return client.fineTuning().jobs().list().data().size();
  }

  public String status(String jobName) {
    return sagemaker
        .describeTrainingJob(DescribeTrainingJobRequest.builder().trainingJobName(jobName).build())
        .trainingJobStatusAsString();
  }

  public int jobCount() {
    return sagemaker.listTrainingJobs(ListTrainingJobsRequest.builder().build()).trainingJobSummaries().size();
  }
}

class JobService {
  String create(String name) {
    return "job-" + name;
  }

  String createTrainingJob(String athlete) {
    return "plan-" + athlete;
  }
}

class Scheduler {
  String run(JobService jobs) {
    return jobs.createTrainingJob("Ada");
  }
}
