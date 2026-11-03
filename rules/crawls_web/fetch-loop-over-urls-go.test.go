// lexcode-expect: 3
package main

import (
	"io"
	"net/http"
	"time"
)

func pullPages(urls []string) ([][]byte, error) {
	client := &http.Client{Timeout: 10 * time.Second}
	var pages [][]byte
	for _, u := range urls {
		resp, err := client.Get(u)
		if err != nil {
			continue
		}
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		pages = append(pages, body)
	}
	return pages, nil
}

func probe(targets []string) {
	for _, target := range targets {
		resp, err := http.Get(target)
		if err == nil {
			resp.Body.Close()
		}
		req, _ := http.NewRequest("HEAD", target, nil)
		_ = req
	}
}
