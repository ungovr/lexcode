// lexcode-expect: 0
use leptos::prelude::*;
use yew::prelude::*;

// Front-end components named Record (a row in a records table), and an XML export of DNS records:
// none is TwiML, and no file here writes a TwiML response.
#[function_component(RecordList)]
pub fn record_list() -> Html {
    html! {
        <ul>
            <Record id={1} />
            <Record />
        </ul>
    }
}

#[component]
pub fn RecordTable(name: String) -> impl IntoView {
    view! { <Record name=name.clone() /> }
}

pub fn zone_xml(host: &str) -> String {
    format!(r#"<Zone><Record Type="A" Name="{host}">203.0.113.7</Record></Zone>"#)
}
