// lexcode-expect: 0
package main

import (
	"fmt"
	"io"
	"net/http"
)

type Tree struct{ children []*Tree }

// Visit walks an in-memory tree. It shares a method name with a crawler and nothing else.
func (t *Tree) Visit(fn func(*Tree)) {
	fn(t)
	for _, c := range t.children {
		c.Visit(fn)
	}
}

// Calls the project's own service on loopback, one request per id.
func loadItems(ids []int) ([][]byte, error) {
	var out [][]byte
	for _, id := range ids {
		resp, err := http.Get(fmt.Sprintf("http://localhost:8080/api/items/%d", id))
		if err != nil {
			return nil, err
		}
		body, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			return nil, err
		}
		out = append(out, body)
	}
	return out, nil
}

// One documented partner API call, not in a loop.
func latestRates() ([]byte, error) {
	resp, err := http.Get("https://api.exchangerate.host/latest?base=USD")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	return io.ReadAll(resp.Body)
}

func main() {
	root := &Tree{}
	root.Visit(func(t *Tree) { fmt.Println(len(t.children)) })
}
