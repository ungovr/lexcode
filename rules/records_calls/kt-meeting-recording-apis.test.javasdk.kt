// lexcode-expect: 3
// The AWS SDK for Java clients from Kotlin: Chime and Amazon Connect (named and wildcard
// imports, version 2 and version 1 of the SDK), and a Vonage record action under an alias.
package demo.meetings

import com.amazonaws.services.connect.*
import com.vonage.client.voice.ncco.RecordAction as VonageRecord
import software.amazon.awssdk.services.chimesdkmediapipelines.ChimeSdkMediaPipelinesClient
import software.amazon.awssdk.services.connect.ConnectClient

class JavaClients(
    private val pipelines: ChimeSdkMediaPipelinesClient,
    private val connect: ConnectClient,
    private val legacy: AmazonConnect,
) {
    fun capture(request: Any): Any = pipelines.createMediaCapturePipeline(request as software.amazon.awssdk.services.chimesdkmediapipelines.model.CreateMediaCapturePipelineRequest)

    fun record(request: Any): Any = legacy.startContactRecording(request as com.amazonaws.services.connect.model.StartContactRecordingRequest)

    fun prompt(): VonageRecord = VonageRecord.builder().beepStart(true).build()
}
