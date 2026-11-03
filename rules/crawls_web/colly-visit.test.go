// lexcode-expect: 2
package main

import (
	"encoding/json"
	"os"

	"github.com/gocolly/colly/v2"
)

type product struct {
	Name  string `json:"name"`
	Price string `json:"price"`
}

func main() {
	c := colly.NewCollector(colly.AllowedDomains("shop.example.org"))
	var products []product

	c.OnHTML("div.product", func(e *colly.HTMLElement) {
		products = append(products, product{Name: e.ChildText("h2"), Price: e.ChildText(".price")})
	})
	c.OnHTML("a.next", func(e *colly.HTMLElement) {
		e.Request.Visit(e.Attr("href"))
	})

	c.Visit("https://shop.example.org/catalog")

	extra := colly.NewCollector()
	for _, section := range os.Args[1:] {
		extra.Visit(section)
	}

	json.NewEncoder(os.Stdout).Encode(products)
}
