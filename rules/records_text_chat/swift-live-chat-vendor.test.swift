// lexcode-expect: 9
import UIKit
import Intercom
import ZendeskSDK
import ZendeskSDKMessaging
import FreshchatSDK
import SendbirdChatSDK
import SendbirdUIKit
import StreamChat
import Crisp
import TwilioConversationsClient

// A vendor's chat SDK started inside the app, so the vendor receives what people type to support or
// to each other.
final class SupportChat {
    var conversations: TwilioConversationsClient?

    func start() {
        Intercom.setApiKey("ios_sdk-key", forAppId: "app-id")
        Zendesk.initialize(withChannelKey: "channel-key", messagingFactory: DefaultMessagingFactory()) { _ in }
        Freshchat.sharedInstance().initWith(FreshchatConfig(appID: "app-id", andAppKey: "app-key"))
        SendbirdChat.initialize(params: InitParams(applicationId: "app-id"), completionHandler: { _ in })
        SendbirdUI.initialize(applicationId: "app-id") { _ in }
        let stream = ChatClient(config: ChatClientConfig(apiKey: .init("api-key")))
        _ = stream
        CrispSDK.configure(websiteID: "website-id")
        TwilioConversationsClient.conversationsClient(withToken: "token", properties: nil, delegate: nil) { _, client in
            self.conversations = client
        }
    }

    func open(from controller: UIViewController) {
        Intercom.presentMessenger()
        controller.present(ChatViewController(), animated: true)
    }
}
