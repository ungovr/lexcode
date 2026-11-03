// lexcode-expect: 3
package main

import (
	"context"
	"fmt"

	"github.com/mmcdole/gofeed"
)

type store interface {
	Save(link, title, summary string)
}

func refresh(ctx context.Context, db store, sources []string) error {
	fp := gofeed.NewParser()
	for _, src := range sources {
		feed, err := fp.ParseURLWithContext(src, ctx)
		if err != nil {
			continue
		}
		for _, item := range feed.Items {
			db.Save(item.Link, item.Title, item.Description)
		}
	}
	return nil
}

func headlines() ([]string, error) {
	fp := gofeed.NewParser()
	feed, err := fp.ParseURL("https://www.example-times.com/rss/world.xml")
	if err != nil {
		return nil, err
	}
	var out []string
	for _, item := range feed.Items {
		out = append(out, item.Title)
	}
	return out, nil
}

func one(url string) {
	feed, _ := gofeed.NewParser().ParseURL(url)
	fmt.Println(len(feed.Items))
}
