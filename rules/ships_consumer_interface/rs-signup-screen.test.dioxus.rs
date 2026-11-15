// lexcode-expect: 2
use dioxus::prelude::*;

// Dioxus: the sign-up screen as a component, and in the older form that takes a scope.
#[component]
pub fn CreateAccount() -> Element {
    rsx! { form { input { r#type: "email" } } }
}

#[allow(non_snake_case)]
pub fn SignUp(cx: Scope) -> Element {
    cx.render(rsx! { form {} })
}
