// lexcode-expect: 0
// The model libraries' method names on the app's own types, in a file that imports no model
// library: a database client's chat table, a form service, a game's characters, a chat inbox.
use axum::extract::State;
use axum::Json;

pub struct AppState {
    pub db: PrismaClient,
    pub forms: FormService,
    pub rooms: RoomService,
    pub inbox: Inbox,
    pub support: SupportDesk,
}

// prisma-client-rust style: a row in the app's own `chat` table.
pub async fn new_room(State(state): State<AppState>, Json(name): Json<String>) -> Json<Chat> {
    let chat = state.db.chat().create(name, vec![]).exec().await.unwrap();
    Json(chat)
}

// The chat table's change stream, read with while let: a room's messages people wrote.
pub async fn room_history(State(state): State<AppState>, room: String) -> Json<String> {
    let mut stream = state.db.chat().create_stream(room).await.unwrap();
    let mut history = String::new();
    while let Some(line) = stream.next().await {
        history.push_str(&line);
    }
    Json(history)
}

pub async fn autocomplete_city(State(state): State<AppState>, prefix: String) -> Json<Vec<String>> {
    let cities = state.db.completions().create(prefix).exec().await.unwrap();
    Json(cities)
}

pub async fn submit_form(State(state): State<AppState>, Json(answers): Json<Answers>) -> Json<Receipt> {
    let receipt = state.forms.responses().create(answers).await.unwrap();
    Json(receipt)
}

pub async fn run_room(State(state): State<AppState>, room: String) -> Json<RoomLog> {
    let log = state.rooms.exec_chat(&room, Vec::new(), None).await.unwrap();
    Json(log)
}

pub async fn deliver(State(state): State<AppState>, batch: Vec<ChatMessage>) -> Json<usize> {
    let sent = state.inbox.send_chat_messages(batch).await.unwrap();
    Json(sent)
}

pub async fn queue_reply(State(state): State<AppState>, request: ChatRequest) -> Json<Ticket> {
    let ticket = state.inbox.send_chat_request(request).await.unwrap();
    Json(ticket)
}

pub async fn npc_line(State(state): State<AppState>, npc: Npc) -> Json<String> {
    let line = npc.converse().greeting();
    Json(line)
}

pub async fn autocomplete_tag(State(state): State<AppState>, prefix: String) -> Json<Vec<String>> {
    let tags = state.db.completion_request(prefix).send().await.unwrap();
    Json(tags)
}

pub async fn route_question(State(state): State<AppState>, question: String) -> Json<String> {
    let desk = state.support.agent("tier-1");
    let answer = desk.prompt(&question);
    Json(answer)
}
