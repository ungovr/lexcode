// lexcode-expect: 0
package main

import (
	"os"
	"time"

	"github.com/gorilla/feeds"
	"github.com/mmcdole/gofeed"
)

// Generates the project's OWN feed from its own posts: a writer, not a reader.
func buildFeed(posts []Post) (string, error) {
	feed := &feeds.Feed{
		Title: "Our blog",
		Link:  &feeds.Link{Href: "https://blog.example.org/"},
		Created: time.Now(),
	}
	for _, p := range posts {
		feed.Items = append(feed.Items, &feeds.Item{
			Title: p.Title,
			Link:  &feeds.Link{Href: "https://blog.example.org/" + p.Slug},
		})
	}
	return feed.ToRss()
}

type Post struct {
	Title string
	Slug  string
}

// Parses a local file of the project's own posts. No URL is fetched.
func readLocal() ([]string, error) {
	f, err := os.Open("content/posts.xml")
	if err != nil {
		return nil, err
	}
	defer f.Close()
	feed, err := gofeed.NewParser().Parse(f)
	if err != nil {
		return nil, err
	}
	var titles []string
	for _, item := range feed.Items {
		titles = append(titles, item.Title)
	}
	return titles, nil
}

// The dev server's copy of the project's own feed.
func selfCheck() (int, error) {
	feed, err := gofeed.NewParser().ParseURL("http://localhost:8080/rss.xml")
	if err != nil {
		return 0, err
	}
	return len(feed.Items), nil
}
