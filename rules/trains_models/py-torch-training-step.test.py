# lexcode-expect: 3
import torch
from torch import nn
from torch.utils.data import DataLoader


def train(model: nn.Module, loader: DataLoader, epochs: int = 5):
    # The usual loop: forward, loss, backward, step.
    optimizer = torch.optim.AdamW(model.parameters(), lr=3e-4)
    loss_fn = nn.CrossEntropyLoss()
    model.train()
    for epoch in range(epochs):
        for xb, yb in loader:
            optimizer.zero_grad()
            loss = loss_fn(model(xb), yb)
            loss.backward()
            optimizer.step()
    return model


def train_with_accumulation(model, loader, steps=4):
    opt = torch.optim.SGD(model.parameters(), lr=0.01)
    for i, (xb, yb) in enumerate(loader):
        loss = nn.functional.mse_loss(model(xb), yb) / steps
        loss.backward()
        if (i + 1) % steps == 0:
            opt.step()
            opt.zero_grad()


def train_on_user_ratings(model, ratings, opt):
    for batch in ratings:
        opt.zero_grad(set_to_none=True)
        out = model(batch["x"])
        err = ((out - batch["y"]) ** 2).mean()
        err.backward()
        opt.step()
