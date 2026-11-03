# lexcode-expect: 0
class EventBus:
    """An in-process bus with methods that happen to be named like batch senders."""

    def __init__(self):
        self.handlers = []

    def send_each(self, events):
        for event in events:
            for handler in self.handlers:
                handler(event)

    def send_multicast(self, event):
        for handler in self.handlers:
            handler(event)


bus = EventBus()
bus.handlers.append(print)
bus.send_each(["a", "b"])
bus.send_multicast("c")


def build_datatuple(users):
    # Builds the tuple a mass mail would take but sends nothing.
    return [("Hello", "Body", "hi@example.org", [u.email]) for u in users]
