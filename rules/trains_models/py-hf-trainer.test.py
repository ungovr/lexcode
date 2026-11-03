# lexcode-expect: 3
import lightning as L
from datasets import load_dataset
from peft import LoraConfig
from transformers import AutoModelForCausalLM, AutoModelForSequenceClassification, AutoTokenizer, Trainer, TrainingArguments
from trl import SFTConfig, SFTTrainer


def fine_tune_classifier(train_ds, eval_ds):
    model = AutoModelForSequenceClassification.from_pretrained("distilbert-base-uncased", num_labels=3)
    args = TrainingArguments(output_dir="out", num_train_epochs=3, per_device_train_batch_size=16)
    trainer = Trainer(model=model, args=args, train_dataset=train_ds, eval_dataset=eval_ds)
    trainer.train()
    trainer.save_model("out/final")


def fine_tune_chat_model(path: str):
    # Supervised fine-tuning on the conversations this app collected.
    data = load_dataset("json", data_files=path, split="train")
    tok = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-0.5B")
    model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-0.5B")
    sft = SFTTrainer(
        model=model,
        train_dataset=data,
        processing_class=tok,
        args=SFTConfig(output_dir="sft-out"),
        peft_config=LoraConfig(r=8, lora_alpha=16),
    )
    sft.train()


def lightning_fit(module, loader):
    trainer = L.Trainer(max_epochs=10, accelerator="auto")
    trainer.fit(module, train_dataloaders=loader)
