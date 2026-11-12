// lexcode-expect: 0
// A project's own job service with the vendors' method names, in a file with no vendor import. The
// receivers are qualified names, so only the vendor import can tell these from a fine-tuning job.
package demo.hr

class Roster(private val service: demo.hr.JobService, private val openAI: demo.hr.Desk) {
    fun run() {
        service.createTrainingJob("forklift safety")
        service.createModelCustomizationJob("onboarding")
        service.createTrainingPipeline("apprentices")
        service.createFineTuningJob("coaching")
        service.createFineTune("coaching")
        openAI.fineTuning("desk")
        openAI.fineTune("desk")
        openAI.fineTuning().jobs().create("desk")
    }
}
