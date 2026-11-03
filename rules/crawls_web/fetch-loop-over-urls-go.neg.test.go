// lexcode-expect: 0
package main

import (
	"fmt"
	"io"
	"net/http"
)

// The project's own service on loopback: the loop variable is an id, the URL is built.
func ownItems(ids []int) ([][]byte, error) {
	var out [][]byte
	for _, id := range ids {
		resp, err := http.Get(fmt.Sprintf("http://localhost:8080/api/items/%d", id))
		if err != nil {
			return nil, err
		}
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		out = append(out, body)
	}
	return out, nil
}

// A single documented partner API call, not in a loop.
func repoInfo() ([]byte, error) {
	resp, err := http.Get("https://api.github.com/repos/golang/go")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	return io.ReadAll(resp.Body)
}

// A map lookup with the range value is not a fetch.
func lookup(cache map[string]string, urls []string) []string {
	var out []string
	for _, u := range urls {
		out = append(out, cache[u])
	}
	return out
}

func main() {
	fmt.Println(lookup(map[string]string{}, nil))
}
