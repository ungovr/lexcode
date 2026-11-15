// lexcode-expect: 3
use yew::prelude::*;

// Yew: a function component named in its attribute, one named by its function, and a struct
// component.
#[function_component(Register)]
pub fn register() -> Html {
    html! { <form></form> }
}

#[function_component]
fn SignUpForm() -> Html {
    html! { <form></form> }
}

pub struct Registration;

impl Component for Registration {
    type Message = ();
    type Properties = ();

    fn create(_ctx: &Context<Self>) -> Self {
        Self
    }

    fn view(&self, _ctx: &Context<Self>) -> Html {
        html! { <form></form> }
    }
}
